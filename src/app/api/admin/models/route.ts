import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get("providerId");

    const where: any = {};
    if (providerId) {
      where.providerId = providerId;
    }

    const models = await prisma.model.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            baseUrl: true,
            isActive: true,
          },
        },
      },
      orderBy: [
        { isVisible: "desc" },
        { displayName: "asc" },
      ],
    });

    return NextResponse.json(models);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
