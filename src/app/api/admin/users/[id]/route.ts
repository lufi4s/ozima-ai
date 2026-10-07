import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthenticatedUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { role, status, name, balanceAdjustment, adjustmentReason } = body;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (role && (role === "USER" || role === "ADMIN")) {
      updateData.role = role;
    }
    if (status && (status === "ACTIVE" || status === "SUSPENDED")) {
      updateData.status = status;
    }
    if (typeof name === "string") {
      updateData.name = name;
    }

    // Balance adjustment (credit or deduct)
    if (typeof balanceAdjustment === "number" && balanceAdjustment !== 0) {
      const newBalance = Math.max(0, targetUser.balance + balanceAdjustment);
      updateData.balance = newBalance;

      // Create an audit transaction record
      await prisma.transaction.create({
        data: {
          userId: id,
          amount: Math.abs(balanceAdjustment),
          currency: "USD",
          type: balanceAdjustment > 0 ? "MANUAL_CREDIT" : "USAGE_ADJUSTMENT",
          status: "COMPLETED",
          provider: "Manual Admin",
          description:
            adjustmentReason ||
            `Admin ${session.name || session.email} ${balanceAdjustment > 0 ? "credited" : "deducted"} $${Math.abs(balanceAdjustment).toFixed(2)}`,
        },
      });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        balance: true,
        status: true,
        totalTokens: true,
        totalSpent: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthenticatedUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = params;

    // Prevent deleting own admin account
    if (id === session.id) {
      return NextResponse.json(
        { error: "Cannot delete currently logged-in administrator account" },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
