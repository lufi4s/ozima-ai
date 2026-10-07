"use client";

import React from "react";
import { Zap, Clock, Cpu, CheckCircle } from "lucide-react";

export interface DeepSeekStatsLineProps {
  modelName?: string;
  durationMs?: number;
  tokens?: number;
  speedTps?: number;
  route?: "MODEL" | "WEB_SEARCH";
}

export default function DeepSeekStatsLine({
  modelName,
  durationMs,
  tokens,
  speedTps,
  route,
}: DeepSeekStatsLineProps) {
  if (!durationMs && !tokens && !modelName) return null;

  const seconds = durationMs ? (durationMs / 1000).toFixed(1) : null;
  const calculatedTps =
    speedTps || (tokens && durationMs && durationMs > 0 ? (tokens / (durationMs / 1000)).toFixed(1) : null);

  return (
    <div className="mt-2.5 pt-2 flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-white/[0.04] select-none">
      <div className="flex items-center gap-3 flex-wrap">
        {modelName && (
          <span className="flex items-center gap-1 text-slate-400">
            <Cpu className="w-3 h-3 text-cyan-500/70" />
            <span>{modelName}</span>
          </span>
        )}

        {seconds && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{seconds}s</span>
          </span>
        )}

        {tokens && (
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500/70" />
            <span>{tokens} tok</span>
          </span>
        )}

        {calculatedTps && (
          <span className="text-slate-500">
            {calculatedTps} tok/s
          </span>
        )}
      </div>

      <div>
        {route === "WEB_SEARCH" ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-2.5 h-2.5" />
            Live Grounded
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-800/80 text-slate-400 border border-slate-700/50">
            Parametric Weights
          </span>
        )}
      </div>
    </div>
  );
}
