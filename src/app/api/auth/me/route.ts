import { NextResponse } from "next/server";
import { getAuthenticatedUser, ensureDefaultAccounts } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    await ensureDefaultAccounts();
    const session = await getAuthenticatedUser(req);

    if (!session) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        balance: true,
        status: true,
        totalTokens: true,
        totalSpent: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: dbUser,
    });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, error: err.message });
  }
}
