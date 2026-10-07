import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptApiKey } from "@/lib/encryption";
import { calculateCost } from "@/lib/utils";
import { searchWeb, classifyQueryIntent, SearchResult } from "@/lib/webSearch";
import { getAuthenticatedUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const modelId = body.model_id || body.modelId;
    const messages = body.messages || [];
    const systemPrompt = (body.system_prompt || body.systemPrompt || "").trim();
    const temperature =
      typeof body.temperature === "number" ? body.temperature : 0.7;

    if (!modelId) {
      return NextResponse.json(
        { error: "model_id is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Lookup model & provider
    const model = await prisma.model.findUnique({
      where: { id: modelId },
      include: { provider: true },
    });

    if (!model) {
      return NextResponse.json(
        { error: "Model not found" },
        { status: 404 }
      );
    }

    if (!model.isVisible) {
      return NextResponse.json(
        { error: "This model is currently disabled/invisible" },
        { status: 403 }
      );
    }

    if (!model.provider || !model.provider.isActive) {
      return NextResponse.json(
        { error: "The provider for this model is inactive" },
        { status: 403 }
      );
    }

    const decryptedKey = decryptApiKey(model.provider.apiKey);
    let baseUrl = model.provider.baseUrl.trim().replace(/\/+$/, "");

    const focusMode = (body.focus_mode || body.focusMode || "web").toLowerCase();
    const isProSearch =
      body.pro_search === true ||
      body.proSearch === true ||
      body.force_web_search === true;

    // Intelligent Dual-Engine Intent Classifier:
    // Determine whether query requires real-time search or routes directly to parametric model weights.
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    const query = lastUserMsg ? String(lastUserMsg.content).trim() : "";
    const intent = classifyQueryIntent(query);

    const webSearchAllowed = body.web_search !== false && body.webSearch !== false;
    const forceSearch =
      body.force_web_search === true ||
      query.startsWith("/search") ||
      query.startsWith("search:");
    const needsSearch =
      Boolean(query) && webSearchAllowed && (forceSearch || intent.shouldSearch);

    console.log(
      `[Smart Classifier] Query: "${query}" | Route: ${intent.route} (${intent.category}) | Reason: ${intent.reason} | Executing Search: ${needsSearch}`
    );

    let searchResults: SearchResult[] = [];
    if (needsSearch) {
      try {
        const searchLimit = isProSearch ? 8 : 5;
        searchResults = await searchWeb(query, searchLimit, focusMode);
        console.log(
          `[Smart Classifier] Retrieved ${searchResults.length} live sources for "${query}" (mode: ${focusMode})`
        );
      } catch (err) {
        console.warn("Live web search failed:", err);
      }
    }

    // Prepare outbound messages with concise, high-signal, anti-slop prompt engineering
    const outboundMessages: Array<{ role: string; content: string }> = [];
    let effectiveSystemPrompt =
      systemPrompt ||
      "You are a concise, direct, and exceptionally capable AI assistant. Give clear, well-structured, high-signal answers. Never include meta-commentary, conversational filler, or self-evident introductory phrases. Answer directly with depth and clean typography.";

    if (focusMode === "academic") {
      effectiveSystemPrompt += `\n\n[Focus: Academic Rigor]: Provide rigorous scholarly depth. Reference established theoretical frameworks and empirical methodologies without conversational filler.`;
    } else if (focusMode === "code") {
      effectiveSystemPrompt += `\n\n[Focus: Software Engineering]: Deliver production-grade, bug-free code with explicit types and edge-case handling. State Big-O computational complexity briefly. Avoid hand-waving or unnecessary pleasantries.`;
    } else if (focusMode === "writing") {
      effectiveSystemPrompt += `\n\n[Focus: Executive Briefing]: Deliver articulate, executive-grade synthesis. Structure cleanly with high-signal headings and decisive insights. Eliminate fluff.`;
    }

    if (searchResults.length > 0) {
      const searchContext = searchResults
        .map(
          (r, idx) =>
            `[Source ${idx + 1}] Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}`
        )
        .join("\n\n");

      effectiveSystemPrompt += `\n\n[Verified Real-Time Search Grounding for "${query}"]:\n${searchContext}\n\nGrounding Guidelines:
- Ground facts directly in the verified sources provided above.
- Embed concise markdown links [Source Name](URL) on specific factual assertions where relevant.
- Address leadership status factually (if in transition, state both the official title status and current interim leadership).
- Do NOT add a redundant "Sources" or "References" section at the end of the text, as the interface displays verified sources automatically.`;
    }

    if (effectiveSystemPrompt) {
      outboundMessages.push({ role: "system", content: effectiveSystemPrompt });
    }

    for (const msg of messages) {
      if (msg.role && msg.content !== undefined) {
        outboundMessages.push({
          role: msg.role,
          content: String(msg.content),
        });
      }
    }

    // Construct target URL for completions
    let targetUrl = `${baseUrl}/chat/completions`;

    const requestPayload = {
      model: model.rawModelId,
      messages: outboundMessages,
      temperature,
      stream: true,
      stream_options: {
        include_usage: true,
      },
    };

    const fetchHeaders: Record<string, string> = {
      Authorization: `Bearer ${decryptedKey}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream, application/json",
    };

    let upstreamRes = await fetch(targetUrl, {
      method: "POST",
      headers: fetchHeaders,
      body: JSON.stringify(requestPayload),
    });

    // Fallback if URL needs /v1
    if (upstreamRes.status === 404 && !baseUrl.endsWith("/v1")) {
      targetUrl = `${baseUrl}/v1/chat/completions`;
      upstreamRes = await fetch(targetUrl, {
        method: "POST",
        headers: fetchHeaders,
        body: JSON.stringify(requestPayload),
      });
    }

    if (!upstreamRes.ok || !upstreamRes.body) {
      let errText = await upstreamRes.text().catch(() => "");
      errText = errText.replace(/openrouter(\.ai)?/gi, "ozima");
      return NextResponse.json(
        {
          error: `Inference gateway error (${upstreamRes.status}): ${
            errText || upstreamRes.statusText
          }`,
        },
        { status: upstreamRes.status >= 400 && upstreamRes.status < 600 ? upstreamRes.status : 502 }
      );
    }

    // Stream SSE to client
    const encoder = new TextEncoder();
    const decoder = new TextDecoder("utf-8");
    const reader = upstreamRes.body.getReader();

    let fullAccumulatedText = "";
    let promptTokens = 0;
    let completionTokens = 0;
    let usageFound = false;

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        const streamStartTime = Date.now();

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "intent",
              route: needsSearch ? "WEB_SEARCH" : "MODEL",
              reason: intent.reason,
              category: intent.category,
              hasSearchResults: searchResults.length > 0,
            })}\n\n`
          )
        );

        if (searchResults.length > 0) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "search",
                query,
                results: searchResults,
              })}\n\n`
            )
          );
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;

              const dataStr = trimmed.replace(/^data:\s*/, "");
              if (dataStr === "[DONE]") {
                continue;
              }

              try {
                const parsed = JSON.parse(dataStr);

                // Handle token content delta
                const contentChunk =
                  parsed.choices?.[0]?.delta?.content ||
                  parsed.choices?.[0]?.delta?.text ||
                  "";

                if (contentChunk) {
                  fullAccumulatedText += contentChunk;
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "token",
                        content: contentChunk,
                      })}\n\n`
                    )
                  );
                }

                // Check for usage in stream
                if (parsed.usage) {
                  usageFound = true;
                  promptTokens = parsed.usage.prompt_tokens || promptTokens;
                  completionTokens =
                    parsed.usage.completion_tokens || completionTokens;
                }
              } catch {
                // Non-JSON SSE line, ignore
              }
            }
          }

          // Fallback token estimation if upstream didn't send usage
          if (!usageFound || (promptTokens === 0 && completionTokens === 0)) {
            const promptChars = JSON.stringify(outboundMessages).length;
            promptTokens = Math.max(1, Math.ceil(promptChars / 4));
            completionTokens = Math.max(1, Math.ceil(fullAccumulatedText.length / 4));
          }

          const totalTokens = promptTokens + completionTokens;
          const cost = calculateCost(
            promptTokens,
            completionTokens,
            model.inputPricePerM,
            model.outputPricePerM
          );
          const originalCost = calculateCost(
            promptTokens,
            completionTokens,
            model.originalInputPricePerM,
            model.originalOutputPricePerM
          );
          const profit = Number(Math.max(0, cost - originalCost).toFixed(6));
          const durationMs = Math.max(1, Date.now() - streamStartTime);
          const durationSec = durationMs / 1000;
          const tps = Number((completionTokens / durationSec).toFixed(1));

          // Emit final usage event with TPS and token burn breakdown
          const usagePayload = {
            type: "usage",
            usage: {
              prompt_tokens: promptTokens,
              completion_tokens: completionTokens,
              total_tokens: totalTokens,
              tokens_burned: totalTokens,
              duration_ms: durationMs,
              duration_sec: Number(durationSec.toFixed(2)),
              tps,
              cost,
              original_cost: originalCost,
              profit,
              input_price_per_m: model.inputPricePerM,
              output_price_per_m: model.outputPricePerM,
              original_input_price_per_m: model.originalInputPricePerM,
              original_output_price_per_m: model.originalOutputPricePerM,
              focus_mode: focusMode,
              pro_search: isProSearch,
              search_results: searchResults.length > 0 ? searchResults : undefined,
            },
          };

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(usagePayload)}\n\n`)
          );

          // Update user token accounting and deduct live balance if session is authenticated
          try {
            const session = await getAuthenticatedUser(req);
            if (session) {
              await prisma.user.update({
                where: { id: session.id },
                data: {
                  totalTokens: { increment: totalTokens },
                  totalSpent: { increment: cost },
                  balance: { decrement: cost },
                },
              });
            }
          } catch (accErr) {
            console.warn("User balance accounting error:", accErr);
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err: unknown) {
          console.error("Streaming error:", err);
          const errMsg = err instanceof Error ? err.message : "Stream failed";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: errMsg,
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    console.error("Chat API error:", err);
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
