import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, hashPassword } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getAuthenticatedUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const roleFilter = searchParams.get("role") || "";
    const statusFilter = searchParams.get("status") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }
    if (roleFilter && (roleFilter === "USER" || roleFilter === "ADMIN")) {
      where.role = roleFilter;
    }
    if (statusFilter && (statusFilter === "ACTIVE" || statusFilter === "SUSPENDED")) {
      where.status = statusFilter;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        balance: true,
        status: true,
        totalTokens: true,
        totalSpent: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { transactions: true },
        },
      },
    });

    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { status: "ACTIVE" } });
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    const balances = await prisma.user.aggregate({
      _sum: { balance: true, totalTokens: true, totalSpent: true },
    });

    return NextResponse.json({
      users,
      aggregates: {
        totalUsers,
        activeUsers,
        adminCount,
        totalCreditsInCirculation: balances._sum.balance || 0,
        totalTokensBurned: balances._sum.totalTokens || 0,
        totalPlatformSpent: balances._sum.totalSpent || 0,
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
    const { email, name, password, role = "USER", initialBalance = 25.0 } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        password: hashPassword(password),
        role: role === "ADMIN" ? "ADMIN" : "USER",
        balance: parseFloat(initialBalance) || 25.0,
        status: "ACTIVE",
      },
    });

    // Record initial welcome credit transaction if balance > 0
    if (newUser.balance > 0) {
      await prisma.transaction.create({
        data: {
          userId: newUser.id,
          amount: newUser.balance,
          currency: "USD",
          type: "BONUS",
          status: "COMPLETED",
          provider: "System Bonus",
          description: "Initial account creation starter credit",
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        balance: newUser.balance,
        status: newUser.status,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
