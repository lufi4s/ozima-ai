import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptApiKey, maskApiKey, decryptApiKey } from "@/lib/encryption";

export const dynamic = "force-dynamic";

// GET /api/admin/providers - List all providers with model counts and masked keys
export async function GET() {
  try {
    const providers = await prisma.provider.findMany({
      include: {
        _count: {
          select: { models: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const sanitized = providers.map((p) => {
      let rawKey = "";
      try {
        rawKey = decryptApiKey(p.apiKey);
      } catch {
        rawKey = "";
      }
      return {
        id: p.id,
        name: p.name,
        baseUrl: p.baseUrl,
        isActive: p.isActive,
        createdAt: p.createdAt,
        apiKeyMasked: maskApiKey(rawKey),
        modelCount: p._count.models,
      };
    });

    return NextResponse.json(sanitized);
  } catch (error: unknown) {
    console.error("Failed to fetch providers:", error);
    return NextResponse.json(
      { error: "Failed to fetch providers" },
      { status: 500 }
    );
  }
}

// POST /api/admin/providers - Create or update an LLM provider
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body.id;
    const name = body.name?.trim();
    const baseUrl = (body.base_url || body.baseUrl)?.trim();
    const apiKey = (body.api_key || body.apiKey)?.trim();
    const isActive = body.is_active !== undefined ? Boolean(body.is_active) : (body.isActive !== undefined ? Boolean(body.isActive) : true);

    if (id) {
      // UPDATE existing provider
      const existing = await prisma.provider.findUnique({
        where: { id },
      });

      if (!existing) {
        return NextResponse.json(
          { error: `Provider with id "${id}" not found` },
          { status: 404 }
        );
      }

      const updateData: {
        name?: string;
        baseUrl?: string;
        apiKey?: string;
        isActive?: boolean;
      } = {};

      if (name) updateData.name = name;
      if (baseUrl) updateData.baseUrl = baseUrl;
      if (typeof isActive === "boolean") updateData.isActive = isActive;
      if (apiKey && apiKey.length > 0) {
        updateData.apiKey = encryptApiKey(apiKey);
      }

      const updated = await prisma.provider.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: { models: true },
          },
        },
      });

      const rawKey = apiKey && apiKey.length > 0 ? apiKey : decryptApiKey(updated.apiKey);

      return NextResponse.json({
        id: updated.id,
        name: updated.name,
        baseUrl: updated.baseUrl,
        isActive: updated.isActive,
        createdAt: updated.createdAt,
        apiKeyMasked: maskApiKey(rawKey),
        modelCount: updated._count.models,
      });
    }

    // CREATE new provider
    if (!name || !baseUrl || !apiKey) {
      return NextResponse.json(
        { error: "Name, Base URL, and API Key are required to create a provider" },
        { status: 400 }
      );
    }

    const encryptedKey = encryptApiKey(apiKey);

    const created = await prisma.provider.create({
      data: {
        name,
        baseUrl,
        apiKey: encryptedKey,
        isActive,
      },
      include: {
        _count: {
          select: { models: true },
        },
      },
    });

    return NextResponse.json(
      {
        id: created.id,
        name: created.name,
        baseUrl: created.baseUrl,
        isActive: created.isActive,
        createdAt: created.createdAt,
        apiKeyMasked: maskApiKey(apiKey),
        modelCount: created._count.models,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Provider create/update error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
