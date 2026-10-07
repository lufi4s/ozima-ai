"use client";

import React, { useState } from "react";
import { Globe, Terminal, ChevronDown, ChevronUp, ExternalLink, CheckCircle2, Loader2, Sparkles } from "lucide-react";

export interface ToolResultItem {
  id?: number;
  title: string;
  url: string;
  snippet: string;
}

export interface DeepSeekToolCallCardProps {
  toolName?: string;
  query?: string;
  status?: "running" | "completed" | "error";
  results?: ToolResultItem[];
}

export default function DeepSeekToolCallCard({
  toolName = "web_search",
  query,
  status = "completed",
  results = [],
}: DeepSeekToolCallCardProps) {
  const [expanded, setExpanded] = useState<boolean>(false);

  const isRunning = status === "running";
  const resultCount = results.length;

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "web";
    }
  };

  return (
    <div
      data-variant="tool-card"
      data-status={status}
      className="my-3 rounded-xl border border-emerald-500/20 bg-[#0A0D14]/90 backdrop-blur-md overflow-hidden transition-all shadow-md shadow-emerald-950/20"
    >
      {/* Header bar */}
      <div
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center justify-between px-3.5 py-2.5 bg-[#0F1420]/80 hover:bg-[#131A2A] cursor-pointer select-none transition group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`flex items-center justify-center w-5 h-5 rounded-md ${
              isRunning
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-emerald-950/50 text-emerald-400 group-hover:bg-emerald-900/60"
            }`}
          >
            {toolName === "web_search" ? (
              <Globe className="w-3.5 h-3.5" />
            ) : (
              <Terminal className="w-3.5 h-3.5" />
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">
              {toolName}
            </span>

            {query && (
              <span className="text-xs text-slate-300 font-mono truncate max-w-[260px] sm:max-w-[420px]">
                query: &quot;{query}&quot;
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isRunning ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
              Running...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {resultCount > 0 ? `${resultCount} sources grounded` : "completed"}
            </span>
          )}

          {resultCount > 0 && (
            <div className="text-slate-400 group-hover:text-slate-200 transition">
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded search results drawer */}
      {expanded && resultCount > 0 && (
        <div className="px-3.5 py-3 border-t border-emerald-500/15 bg-[#080B12]/95 space-y-2">
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Retrieved search citations & context verification:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {results.map((res, idx) => {
              const domain = getDomain(res.url);
              return (
                <a
                  key={idx}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col p-2.5 rounded-lg bg-[#0F1320] border border-white/5 hover:border-emerald-500/30 hover:bg-[#141A2C] transition group text-left"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-semibold truncate">
                      [{idx + 1}] {domain}
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 shrink-0 transition" />
                  </div>
                  <div className="text-xs font-medium text-slate-200 group-hover:text-white line-clamp-1 mb-1">
                    {res.title}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {res.snippet}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
