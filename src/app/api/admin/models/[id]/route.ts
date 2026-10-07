import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const model = await prisma.model.findUnique({
      where: { id: params.id },
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
    });

    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    return NextResponse.json(model);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const existing = await prisma.model.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    const updateData: {
      isVisible?: boolean;
      displayName?: string;
      originalInputPricePerM?: number;
      originalOutputPricePerM?: number;
      inputPricePerM?: number;
      outputPricePerM?: number;
    } = {};

    if (body.is_visible !== undefined) {
      updateData.isVisible = Boolean(body.is_visible);
    } else if (body.isVisible !== undefined) {
      updateData.isVisible = Boolean(body.isVisible);
    }

    if (body.display_name !== undefined) {
      updateData.displayName = String(body.display_name).trim();
    } else if (body.displayName !== undefined) {
      updateData.displayName = String(body.displayName).trim();
    }

    if (body.input_price_per_m !== undefined || body.inputPricePerM !== undefined) {
      const parsed = parseFloat(body.input_price_per_m ?? body.inputPricePerM);
      if (!isNaN(parsed) && parsed >= 0) {
        updateData.inputPricePerM = parsed;
      }
    }

    if (body.output_price_per_m !== undefined || body.outputPricePerM !== undefined) {
      const parsed = parseFloat(body.output_price_per_m ?? body.outputPricePerM);
      if (!isNaN(parsed) && parsed >= 0) {
        updateData.outputPricePerM = parsed;
      }
    }

    if (body.original_input_price_per_m !== undefined || body.originalInputPricePerM !== undefined) {
      const parsed = parseFloat(body.original_input_price_per_m ?? body.originalInputPricePerM);
      if (!isNaN(parsed) && parsed >= 0) {
        updateData.originalInputPricePerM = parsed;
      }
    }

    if (body.original_output_price_per_m !== undefined || body.originalOutputPricePerM !== undefined) {
      const parsed = parseFloat(body.original_output_price_per_m ?? body.originalOutputPricePerM);
      if (!isNaN(parsed) && parsed >= 0) {
        updateData.originalOutputPricePerM = parsed;
      }
    }

    const updated = await prisma.model.update({
      where: { id: params.id },
      data: updateData,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error("Failed to patch model:", err);
    const errorMsg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.model.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, message: "Model deleted" });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
