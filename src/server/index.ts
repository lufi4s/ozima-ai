import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

import { prisma } from "../lib/prisma";
import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  verifySessionToken,
  ensureDefaultAccounts,
} from "../lib/auth";
import { encryptApiKey, decryptApiKey, maskApiKey } from "../lib/encryption";
import { searchWeb, classifyQueryIntent, SearchResult } from "../lib/webSearch";
import { calculateCost } from "../lib/utils";

const app = express();
app.use(express.json({ limit: "15mb" }));
app.use(cookieParser());

// Helper: Extract session payload from cookie or authorization header
function getAuthUser(req: Request) {
  const token = req.cookies?.matrix_auth_session || req.headers.authorization?.replace(/^Bearer\s+/, "");
  if (!token) return null;
  return verifySessionToken(token);
}

// ==========================================
// AUTH ENDPOINTS
// ==========================================

app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    await ensureDefaultAccounts();
    const { email, password, loginType } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (loginType === "admin" && user.role !== "ADMIN") {
      return res.status(403).json({
        error: "Access denied: This account does not possess administrator privileges. Please use the User Portal.",
      });
    }

    const token = signSessionToken({
      id: user.id,
      email: user.email,
      name: user.name || (user.role === "ADMIN" ? "Admin" : "User"),
      role: user.role,
    });

    res.cookie("matrix_auth_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Authentication failed: " + err.message });
  }
});

app.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    await ensureDefaultAccounts();
    const { email, password, name, role = "USER" } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: name?.trim() || cleanEmail.split("@")[0],
        password: hashPassword(password),
        role: role === "ADMIN" ? "ADMIN" : "USER",
        balance: 25.0,
        status: "ACTIVE",
      },
    });

    const token = signSessionToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name || "User",
      role: newUser.role,
    });

    res.cookie("matrix_auth_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Registration failed: " + err.message });
  }
});

app.get("/api/auth/me", async (req: Request, res: Response) => {
  try {
    await ensureDefaultAccounts();
    const session = getAuthUser(req);
    if (!session) {
      return res.json({ authenticated: false, user: null });
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
      return res.json({ authenticated: false, user: null });
    }
    return res.json({ authenticated: true, user: dbUser });
  } catch (err: any) {
    return res.json({ authenticated: false, error: err.message });
  }
});

app.post("/api/auth/logout", (_req: Request, res: Response) => {
  res.clearCookie("matrix_auth_session", { path: "/" });
  return res.json({ success: true, message: "Logged out successfully" });
});

// ==========================================
// PLAYGROUND MODELS (STEALTH ANONYMIZATION)
// ==========================================

const FALLBACK_STEALTH_MODELS = [
  { id: "anthropic/claude-3.5-sonnet", display_name: "Claude 3.5 Sonnet" },
  { id: "openai/gpt-4o", display_name: "GPT-4o Omniscience" },
  { id: "openai/gpt-4o-mini", display_name: "GPT-4o Mini" },
  { id: "deepseek/deepseek-chat", display_name: "DeepSeek V3" },
  { id: "deepseek/deepseek-r1", display_name: "DeepSeek R1 Reasoner" },
  { id: "meta-llama/llama-3.3-70b-instruct", display_name: "Llama 3.3 70B Instruct" },
  { id: "google/gemini-2.0-flash-exp:free", display_name: "Gemini 2.0 Flash" },
  { id: "mistralai/mistral-large-2407", display_name: "Mistral Large" },
  { id: "qwen/qwen-2.5-72b-instruct", display_name: "Qwen 2.5 72B Instruct" },
];

app.get("/api/playground/models", async (_req: Request, res: Response) => {
  try {
    const dbModels = await prisma.model.findMany({
      where: {
        isVisible: true,
        provider: { isActive: true },
      },
      select: {
        id: true,
        displayName: true,
      },
      orderBy: { displayName: "asc" },
    });

    if (dbModels.length === 0) {
      return res.json(FALLBACK_STEALTH_MODELS);
    }

    const sanitized = dbModels.map((m) => ({
      id: m.id,
      display_name: m.displayName,
      displayName: m.displayName,
    }));

    return res.json(sanitized);
  } catch (err) {
    console.warn("Failed to fetch models from database, serving stealth fallback:", err);
    return res.json(FALLBACK_STEALTH_MODELS);
  }
});

// ==========================================
// PLAYGROUND CHAT (SSE STREAMING & WEB SEARCH)
// ==========================================

app.post("/api/playground/chat", async (req: Request, res: Response) => {
  try {
    const { model_id, modelId, messages, system_prompt, systemPrompt, temperature = 0.7, web_search, webSearch } = req.body;
    const activeModelId = model_id || modelId;

    if (!activeModelId) {
      return res.status(400).json({ error: "model_id is required" });
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    // Lookup model and active provider key
    let apiKey = "";
    let baseUrl = "https://openrouter.ai/api/v1";

    let upstreamModelId = activeModelId;
    const dbModel = await prisma.model.findUnique({
      where: { id: activeModelId },
      include: { provider: true },
    });

    if (dbModel) {
      upstreamModelId = dbModel.rawModelId;
      if (dbModel.provider && dbModel.provider.isActive) {
        apiKey = decryptApiKey(dbModel.provider.apiKey);
        baseUrl = dbModel.provider.baseUrl.trim().replace(/\/+$/, "");
      }
    } else {
      // Find any active provider
      const activeProvider = await prisma.provider.findFirst({
        where: { isActive: true },
      });
      if (activeProvider) {
        apiKey = decryptApiKey(activeProvider.apiKey);
        baseUrl = activeProvider.baseUrl.trim().replace(/\/+$/, "");
      }
    }

    if (!apiKey) {
      return res.status(500).json({
        error: "No active model provider configured. Please configure a provider in the Admin Console.",
      });
    }

    // Dual-Engine Intent Classifier for Autonomous Web Search
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    const query = lastUserMsg ? String(lastUserMsg.content).trim() : "";
    const intent = classifyQueryIntent(query);
    const webSearchAllowed = web_search !== false && webSearch !== false;
    const forceSearch = query.startsWith("/search") || query.startsWith("search:");
    const needsSearch = Boolean(query) && webSearchAllowed && (forceSearch || intent.shouldSearch);

    let searchResults: SearchResult[] = [];
    let cleanQuery = query.replace(/^\/(search|find|web)\s+/i, "").replace(/^search:\s*/i, "").trim();
    if (needsSearch) {
      try {
        searchResults = await searchWeb(cleanQuery, 6);
      } catch (searchErr) {
        console.warn("Autonomous web search warning:", searchErr);
      }
    }

    // Set up Server-Sent Events headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    // Stream intent and tool execution if performed
    if (searchResults.length > 0) {
      res.write(`data: ${JSON.stringify({ type: "intent", route: "WEB_SEARCH", reason: intent.reason, category: intent.category })}\n\n`);
      res.write(`data: ${JSON.stringify({
        type: "tool_call",
        tool: "web_search",
        name: "web_search",
        args: { query: cleanQuery },
        status: "completed",
        results: searchResults.map((r, i) => ({
          id: i + 1,
          title: r.title,
          url: r.url,
          snippet: r.snippet,
        })),
      })}\n\n`);
      res.write(`data: ${JSON.stringify({
        type: "search",
        query: cleanQuery,
        results: searchResults.map((r, i) => ({
          id: i + 1,
          title: r.title,
          url: r.url,
          snippet: r.snippet,
        })),
      })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ type: "intent", route: "MODEL", reason: intent.reason, category: intent.category })}\n\n`);
    }

    // Assemble messages payload
    const finalMessages: any[] = [];
    const activeSystem = (system_prompt || systemPrompt || "").trim();
    if (activeSystem) {
      finalMessages.push({ role: "system", content: activeSystem });
    }

    if (searchResults.length > 0) {
      const contextBlocks = searchResults
        .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet}`)
        .join("\n\n");
      finalMessages.push({
        role: "system",
        content: `You have access to live real-time web search results:\n\n${contextBlocks}\n\nSynthesize an up-to-date, insightful answer citing sources with [1], [2] brackets.`,
      });
    }

    for (const msg of messages) {
      finalMessages.push({ role: msg.role, content: msg.content });
    }

    const targetUrl = `${baseUrl}/chat/completions`;
    const upstreamRes = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://ozima.ai",
        "X-Title": "Ozima AI",
      },
      body: JSON.stringify({
        model: upstreamModelId,
        messages: finalMessages,
        temperature,
        stream: true,
      }),
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
      let errText = await upstreamRes.text().catch(() => "");
      errText = errText.replace(/openrouter(\.ai)?/gi, "ozima");
      res.write(`data: ${JSON.stringify({ error: `Inference gateway error (${upstreamRes.status}): ${errText}` })}\n\n`);
      res.write("data: [DONE]\n\n");
      return res.end();
    }

    // Pipe upstream SSE response
    const reader = upstreamRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const dataStr = trimmed.slice(5).trim();
        if (dataStr === "[DONE]") {
          res.write("data: [DONE]\n\n");
          continue;
        }

        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed.choices?.[0]?.delta;
          const text = delta?.content || delta?.text || "";
          const reasoning = delta?.reasoning || delta?.reasoning_content || "";

          if (reasoning) {
            res.write(`data: ${JSON.stringify({ type: "reasoning", content: reasoning, text: "", reasoning })}\n\n`);
          }
          if (text) {
            res.write(`data: ${JSON.stringify({ type: "token", content: text, text })}\n\n`);
          }
          if (parsed.usage) {
            res.write(`data: ${JSON.stringify({ type: "usage", usage: parsed.usage })}\n\n`);
          }
        } catch {
          // Pass raw event if needed
        }
      }
    }

    res.write("data: [DONE]\n\n");
    return res.end();
  } catch (err: any) {
    console.error("Chat route failure:", err);
    let sanitizedErr = (err.message || "Unknown error").replace(/openrouter(\.ai)?/gi, "ozima");
    if (!res.headersSent) {
      return res.status(500).json({ error: sanitizedErr });
    }
    res.write(`data: ${JSON.stringify({ error: sanitizedErr })}\n\n`);
    res.write("data: [DONE]\n\n");
    return res.end();
  }
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

function requireAdmin(req: Request, res: Response, next: () => void) {
  const user = getAuthUser(req);
  if (!user || user.role !== "ADMIN") {
    return res.status(401).json({ error: "Administrator authorization required" });
  }
  next();
}

// Admin: Models
app.get("/api/admin/models", requireAdmin, async (req: Request, res: Response) => {
  try {
    const providerId = req.query.providerId as string;
    const where: any = {};
    if (providerId) where.providerId = providerId;

    const models = await prisma.model.findMany({
      where,
      include: {
        provider: {
          select: { id: true, name: true, baseUrl: true, isActive: true },
        },
      },
      orderBy: [{ isVisible: "desc" }, { displayName: "asc" }],
    });
    return res.json(models);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.patch("/api/admin/models/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const updateData: any = {};

    if (body.is_visible !== undefined || body.isVisible !== undefined) {
      updateData.isVisible = Boolean(body.is_visible ?? body.isVisible);
    }
    if (body.display_name !== undefined || body.displayName !== undefined) {
      updateData.displayName = String(body.display_name ?? body.displayName).trim();
    }
    if (body.input_price_per_m !== undefined || body.inputPricePerM !== undefined) {
      updateData.inputPricePerM = parseFloat(body.input_price_per_m ?? body.inputPricePerM) || 0;
    }
    if (body.output_price_per_m !== undefined || body.outputPricePerM !== undefined) {
      updateData.outputPricePerM = parseFloat(body.output_price_per_m ?? body.outputPricePerM) || 0;
    }

    const updated = await prisma.model.update({
      where: { id: String(id) },
      data: updateData,
      include: {
        provider: { select: { id: true, name: true, isActive: true } },
      },
    });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admin/models/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.model.delete({ where: { id: String(req.params.id) } });
    return res.json({ success: true, message: "Model deleted" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Users
app.get("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
  try {
    const search = (req.query.search as string) || "";
    const roleFilter = (req.query.role as string) || "";
    const statusFilter = (req.query.status as string) || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }
    if (roleFilter === "USER" || roleFilter === "ADMIN") where.role = roleFilter;
    if (statusFilter === "ACTIVE" || statusFilter === "SUSPENDED") where.status = statusFilter;

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        balance: true,
        status: true,
        totalTokens: true,
        totalSpent: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { transactions: true } },
      },
    });

    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { status: "ACTIVE" } });
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    const balances = await prisma.user.aggregate({
      _sum: { balance: true, totalTokens: true, totalSpent: true },
    });

    return res.json({
      users,
      aggregates: {
        totalUsers,
        activeUsers,
        adminCount,
        totalCreditsInCirculation: balances._sum.balance || 0,
        totalTokensBurned: balances._sum.totalTokens || 0,
        totalPlatformSpent: balances._sum.totalSpent || 0,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { email, name, password, role = "USER", initialBalance = 25.0 } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "User with this email already exists" });
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        password: hashPassword(password),
        role: role === "ADMIN" ? "ADMIN" : "USER",
        balance: parseFloat(initialBalance) || 25.0,
        status: "ACTIVE",
      },
    });

    return res.json({ success: true, user: newUser });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.patch("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, status, balance, name } = req.body;
    const updateData: any = {};
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (balance !== undefined) updateData.balance = parseFloat(balance) || 0;
    if (name) updateData.name = name;

    const updated = await prisma.user.update({
      where: { id: String(id) },
      data: updateData,
    });
    return res.json({ success: true, user: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: String(req.params.id) } });
    return res.json({ success: true, message: "User deleted" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Payments
app.get("/api/admin/payments", requireAdmin, async (req: Request, res: Response) => {
  try {
    const typeFilter = (req.query.type as string) || "";
    const statusFilter = (req.query.status as string) || "";
    const where: any = {};
    if (typeFilter) where.type = typeFilter;
    if (statusFilter) where.status = statusFilter;

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
      },
    });

    const totalDeposits = await prisma.transaction.aggregate({
      where: {
        type: { in: ["DEPOSIT", "MANUAL_CREDIT", "BONUS"] },
        status: "COMPLETED",
      },
      _sum: { amount: true },
      _count: true,
    });

    const totalUsageBurns = await prisma.transaction.aggregate({
      where: {
        type: { in: ["USAGE_BURN", "USAGE_ADJUSTMENT"] },
        status: "COMPLETED",
      },
      _sum: { amount: true },
    });

    return res.json({
      transactions,
      metrics: {
        totalRevenueCollected: totalDeposits._sum.amount || 0,
        totalTransactionsCount: totalDeposits._count,
        totalUsageBurned: totalUsageBurns._sum.amount || 0,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/payments", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId, amount, type = "DEPOSIT", provider = "Direct Credit", description } = req.body;
    if (!userId || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "Valid userId and positive amount are required" });
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        currency: "USD",
        type,
        status: "COMPLETED",
        provider,
        referenceId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        description: description || `Credit added by Admin`,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { balance: { increment: amount } },
    });

    return res.json({ success: true, transaction });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Stats
app.get("/api/admin/stats", requireAdmin, async (_req: Request, res: Response) => {
  try {
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
        select: { id: true, email: true, name: true, role: true, balance: true, createdAt: true },
      }),
      prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

    return res.json({
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
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Providers
app.get("/api/admin/providers", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const providers = await prisma.provider.findMany({
      include: { _count: { select: { models: true } } },
      orderBy: { createdAt: "desc" },
    });

    const sanitized = providers.map((p) => {
      let rawKey = "";
      try {
        rawKey = decryptApiKey(p.apiKey);
      } catch {}
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

    return res.json(sanitized);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/providers", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id, name, baseUrl, apiKey, isActive = true } = req.body;
    if (id) {
      const updateData: any = {};
      if (name) updateData.name = name;
      if (baseUrl) updateData.baseUrl = baseUrl;
      if (apiKey) updateData.apiKey = encryptApiKey(apiKey);
      if (isActive !== undefined) updateData.isActive = Boolean(isActive);

      const updated = await prisma.provider.update({
        where: { id },
        data: updateData,
        include: { _count: { select: { models: true } } },
      });
      return res.json(updated);
    }

    if (!name || !baseUrl || !apiKey) {
      return res.status(400).json({ error: "Name, Base URL, and API Key are required" });
    }

    const created = await prisma.provider.create({
      data: {
        name,
        baseUrl,
        apiKey: encryptApiKey(apiKey),
        isActive: Boolean(isActive),
      },
      include: { _count: { select: { models: true } } },
    });
    return res.status(201).json(created);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/providers/:id/sync", requireAdmin, async (req: Request, res: Response) => {
  try {
    const provider = await prisma.provider.findUnique({
      where: { id: String(req.params.id) },
    });
    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }
    const rawApiKey = decryptApiKey(provider.apiKey);
    let baseUrl = provider.baseUrl.trim().replace(/\/+$/, "");
    const fetchHeaders: Record<string, string> = {
      Authorization: `Bearer ${rawApiKey}`,
      Accept: "application/json",
      "User-Agent": "OzimaAI/1.0",
    };
    let targetUrl = `${baseUrl}/models`;
    let response = await fetch(targetUrl, { method: "GET", headers: fetchHeaders });
    if (response.status === 404 && !baseUrl.endsWith("/v1")) {
      targetUrl = `${baseUrl}/v1/models`;
      response = await fetch(targetUrl, { method: "GET", headers: fetchHeaders });
    }
    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return res.status(502).json({ error: `Provider error (${response.status}): ${errText}` });
    }
    const data = await response.json();
    let rawItems: Array<{ id: string; raw: any }> = [];
    if (Array.isArray(data)) {
      rawItems = data.map((item: any) => ({ id: item.id || item.name, raw: item }));
    } else if (Array.isArray(data.data)) {
      rawItems = data.data.map((item: any) => ({ id: item.id || item.name, raw: item }));
    }
    let createdCount = 0;
    let updatedCount = 0;
    for (const item of rawItems) {
      const modelId = String(item.id).trim();
      if (!modelId) continue;
      const existing = await prisma.model.findUnique({ where: { id: modelId } });
      const displayName = item.raw?.name || modelId.split("/").pop()?.replace(/[-_]/g, " ") || modelId;
      if (!existing) {
        await prisma.model.create({
          data: {
            id: modelId,
            rawModelId: modelId,
            displayName,
            providerId: provider.id,
            isVisible: true,
            inputPricePerM: 1.0,
            outputPricePerM: 2.0,
            originalInputPricePerM: 1.0,
            originalOutputPricePerM: 2.0,
          },
        });
        createdCount++;
      } else {
        await prisma.model.update({
          where: { id: modelId },
          data: { providerId: provider.id },
        });
        updatedCount++;
      }
    }
    return res.json({ success: true, count: rawItems.length, created: createdCount, updated: updatedCount });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// STATIC FRONTEND SERVING (PRODUCTION & SPA)
// ==========================================

const distPath = path.resolve(process.cwd(), "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req: Request, res: Response) => {
    if (!req.path.startsWith("/api/")) {
      return res.sendFile(path.join(distPath, "index.html"));
    }
    res.status(404).json({ error: "Endpoint not found" });
  });
}

const PORT = parseInt(process.env.PORT || "3000", 10);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Ozima Production Server] listening on http://localhost:${PORT}`);
});
