import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptApiKey } from "@/lib/encryption";

const KNOWN_BASE_PRICING: Record<string, { in: number; out: number }> = {
  "gpt-4o": { in: 2.50, out: 10.00 },
  "gpt-4o-mini": { in: 0.15, out: 0.60 },
  "gpt-4-turbo": { in: 10.00, out: 30.00 },
  "gpt-4": { in: 30.00, out: 60.00 },
  "gpt-3.5-turbo": { in: 0.50, out: 1.50 },
  "o1": { in: 15.00, out: 60.00 },
  "o1-mini": { in: 3.00, out: 12.00 },
  "o3-mini": { in: 1.10, out: 4.40 },
  "claude-3-5-sonnet": { in: 3.00, out: 15.00 },
  "claude-3-5-sonnet-latest": { in: 3.00, out: 15.00 },
  "claude-3-opus": { in: 15.00, out: 75.00 },
  "claude-3-5-haiku": { in: 0.80, out: 4.00 },
  "deepseek-chat": { in: 0.14, out: 0.28 },
  "deepseek-reasoner": { in: 0.55, out: 2.19 },
  "llama-3.3-70b": { in: 0.59, out: 0.79 },
  "llama-3.3-70b-instruct": { in: 0.59, out: 0.79 },
  "llama-3.1-8b": { in: 0.05, out: 0.08 },
  "llama-3.1-70b": { in: 0.50, out: 0.70 },
  "llama-3.1-405b": { in: 2.00, out: 2.00 },
};

function resolveOriginalPricing(modelId: string, rawItem?: any): { in: number; out: number } {
  // 1. Check if raw item returned upstream pricing (e.g. OpenRouter or custom endpoint)
  if (rawItem && typeof rawItem === "object") {
    if (rawItem.pricing) {
      const pIn = parseFloat(rawItem.pricing.prompt || rawItem.pricing.input || 0);
      const pOut = parseFloat(rawItem.pricing.completion || rawItem.pricing.output || 0);
      if (pIn > 0 || pOut > 0) {
        return {
          in: pIn < 0.01 ? Number((pIn * 1_000_000).toFixed(4)) : pIn,
          out: pOut < 0.01 ? Number((pOut * 1_000_000).toFixed(4)) : pOut,
        };
      }
    }
    if (rawItem.input_price_per_m !== undefined || rawItem.output_price_per_m !== undefined) {
      return {
        in: Number(rawItem.input_price_per_m) || 0,
        out: Number(rawItem.output_price_per_m) || 0,
      };
    }
  }

  // 2. Check known base pricing dictionary
  const lower = modelId.toLowerCase();
  for (const [key, price] of Object.entries(KNOWN_BASE_PRICING)) {
    if (lower === key || lower.includes(key)) {
      return price;
    }
  }

  return { in: 0.50, out: 1.50 };
}

function isChatModel(modelId: string): boolean {
  const lower = modelId.toLowerCase();
  const excludedKeywords = [
    "embedding",
    "whisper",
    "tts-",
    "dall-e",
    "moderation",
    "rerank",
    "transcription",
    "stable-diffusion",
    "flux",
    "audio-preview",
  ];

  for (const keyword of excludedKeywords) {
    if (lower.includes(keyword)) {
      return false;
    }
  }

  return true;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const provider = await prisma.provider.findUnique({
      where: { id: params.id },
    });

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const rawApiKey = decryptApiKey(provider.apiKey);
    let baseUrl = provider.baseUrl.trim().replace(/\/+$/, "");

    const fetchHeaders: Record<string, string> = {
      Authorization: `Bearer ${rawApiKey}`,
      Accept: "application/json",
      "User-Agent": "LLMPlayground/1.0",
    };

    let targetUrl = `${baseUrl}/models`;
    let response = await fetch(targetUrl, {
      method: "GET",
      headers: fetchHeaders,
    });

    if (response.status === 404 && !baseUrl.endsWith("/v1")) {
      targetUrl = `${baseUrl}/v1/models`;
      response = await fetch(targetUrl, {
        method: "GET",
        headers: fetchHeaders,
      });
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return NextResponse.json(
        {
          error: `Provider returned status ${response.status}: ${
            errorText || response.statusText
          }`,
        },
        { status: 502 }
      );
    }

    const data = await response.json();

    let rawItems: Array<{ id: string; raw: any }> = [];
    if (Array.isArray(data)) {
      rawItems = data.map((item: any) => ({
        id: item.id || item.name || String(item),
        raw: item,
      }));
    } else if (Array.isArray(data.data)) {
      rawItems = data.data.map((item: any) => ({
        id: item.id || item.name || String(item),
        raw: item,
      }));
    } else if (Array.isArray(data.models)) {
      rawItems = data.models.map((item: any) => ({
        id: item.name || item.id || String(item),
        raw: item,
      }));
    }

    const chatItems = rawItems.filter((i) => isChatModel(i.id));

    let newCount = 0;
    let existingCount = 0;
    const now = new Date();

    for (const item of chatItems) {
      const rawModelId = item.id;
      const basePricing = resolveOriginalPricing(rawModelId, item.raw);

      const existing = await prisma.model.findUnique({
        where: {
          providerId_rawModelId: {
            providerId: provider.id,
            rawModelId,
          },
        },
      });

      if (existing) {
        // Keep existing custom prices and visibility intact; update original base prices & timestamp
        await prisma.model.update({
          where: { id: existing.id },
          data: {
            originalInputPricePerM: basePricing.in,
            originalOutputPricePerM: basePricing.out,
            lastSyncedAt: now,
          },
        });
        existingCount++;
      } else {
        // New model: set original prices and default custom price to match original (user can customize)
        await prisma.model.create({
          data: {
            providerId: provider.id,
            rawModelId,
            displayName: rawModelId,
            isVisible: false,
            originalInputPricePerM: basePricing.in,
            originalOutputPricePerM: basePricing.out,
            inputPricePerM: basePricing.in,
            outputPricePerM: basePricing.out,
            lastSyncedAt: now,
          },
        });
        newCount++;
      }
    }

    const updatedModels = await prisma.model.findMany({
      where: { providerId: provider.id },
      orderBy: { rawModelId: "asc" },
    });

    return NextResponse.json({
      success: true,
      providerId: provider.id,
      totalQueried: rawItems.length,
      chatModelsFound: chatItems.length,
      newModelsAdded: newCount,
      existingModelsPreserved: existingCount,
      models: updatedModels,
    });
  } catch (err: unknown) {
    console.error("Sync error:", err);
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
