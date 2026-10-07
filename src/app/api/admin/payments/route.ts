import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getAuthenticatedUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get("type") || "";
    const statusFilter = searchParams.get("status") || "";

    const where: any = {};
    if (typeFilter) {
      where.type = typeFilter;
    }
    if (statusFilter) {
      where.status = statusFilter;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Aggregate statistics
    const totalDeposits = await prisma.transaction.aggregate({
      where: {
        type: { in: ["DEPOSIT", "MANUAL_CREDIT", "BONUS"] },
        status: "COMPLETED",
      },
      _sum: { amount: true },
      _count: true,
    });

    const totalUsageBurns = await prisma.transaction.aggregate({
      where: {
        type: { in: ["USAGE_BURN", "USAGE_ADJUSTMENT"] },
        status: "COMPLETED",
      },
      _sum: { amount: true },
    });

    const userBalances = await prisma.user.aggregate({
      _sum: { balance: true, totalSpent: true },
    });

    return NextResponse.json({
      transactions,
      metrics: {
        totalRevenueCollected: totalDeposits._sum.amount || 0,
        totalTransactionsCount: totalDeposits._count,
        totalUsageBurned: totalUsageBurns._sum.amount || 0,
        totalActiveUserBalances: userBalances._sum.balance || 0,
        totalPlatformSpent: userBalances._sum.totalSpent || 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthenticatedUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, amount, type = "DEPOSIT", provider = "Stripe", referenceId, description } = body;

    if (!userId || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Valid userId and positive amount are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        currency: "USD",
        type,
        status: "COMPLETED",
        provider,
        referenceId: referenceId || `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        description: description || `Payment credit processed via ${provider}`,
      },
    });

    // Update user balance
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        balance: { increment: amount },
      },
      select: {
        id: true,
        email: true,
        name: true,
        balance: true,
      },
    });

    return NextResponse.json({
      success: true,
      transaction,
      user: updatedUser,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
