import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const models = await prisma.model.findMany({
      where: {
        isVisible: true,
        provider: {
          isActive: true,
        },
      },
      select: {
        id: true,
        displayName: true,
      },
      orderBy: {
        displayName: "asc",
      },
    });

    // Return strictly sanitized public fields: ONLY id and clean displayName.
    // Zero provider information, vendor URLs, or gateway details are exposed.
    const safeModels = models.map((m) => ({
      id: m.id,
      display_name: m.displayName,
      displayName: m.displayName,
    }));

    return NextResponse.json(safeModels);
  } catch (err: unknown) {
    console.error("Failed to fetch playground models:", err);
    const errorMsg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
