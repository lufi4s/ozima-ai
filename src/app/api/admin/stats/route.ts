import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getAuthenticatedUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const [
      totalUsers,
      activeUsers,
      totalProviders,
      totalModels,
      visibleModels,
      totalTransactions,
      financials,
      userAggregates,
      recentUsers,
      recentTransactions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.provider.count(),
      prisma.model.count(),
      prisma.model.count({ where: { isVisible: true } }),
      prisma.transaction.count(),
      prisma.transaction.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.user.aggregate({
        _sum: { balance: true, totalTokens: true, totalSpent: true },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          balance: true,
          createdAt: true,
        },
      }),
      prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        totalProviders,
        totalModels,
        visibleModels,
        totalTransactions,
        totalRevenue: financials._sum.amount || 0,
        totalCreditsInCirculation: userAggregates._sum.balance || 0,
        totalTokensBurned: userAggregates._sum.totalTokens || 0,
        totalSpent: userAggregates._sum.totalSpent || 0,
      },
      recentUsers,
      recentTransactions,
      dbStatus: "Connected (Neon PostgreSQL Cloud Pooler)",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
