import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptApiKey, maskApiKey } from "@/lib/encryption";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const provider = await prisma.provider.findUnique({
      where: { id: params.id },
      include: {
        models: true,
      },
    });

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: provider.id,
      name: provider.name,
      baseUrl: provider.baseUrl,
      isActive: provider.isActive,
      createdAt: provider.createdAt,
      apiKeyMasked: maskApiKey(decryptApiKey(provider.apiKey)),
      models: provider.models,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.provider.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, message: "Provider deleted" });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
