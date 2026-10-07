"use client";

import React, { useState, useEffect, useRef } from "react";
import { Brain, ChevronDown, ChevronUp, Copy, Check, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export interface DeepSeekReasoningRowProps {
  text: string;
  running?: boolean;
  durationMs?: number;
}

export default function DeepSeekReasoningRow({
  text,
  running = false,
  durationMs,
}: DeepSeekReasoningRowProps) {
  const [expanded, setExpanded] = useState<boolean>(running);
  const [copied, setCopied] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // Live timer for reasoning duration when running
  useEffect(() => {
    if (running) {
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedSeconds((Date.now() - startTime) / 1000);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running]);

  // Keep expanded while running, or stay in user's toggle state
  useEffect(() => {
    if (running) {
      setExpanded(true);
    }
  }, [running]);

  if (!text && !running) return null;

  // Single-line summary of the current / last thought line
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const latestLine = lines[lines.length - 1] || "Thinking...";
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const displayTime = running
    ? `${elapsedSeconds.toFixed(1)}s`
    : durationMs
    ? `${(durationMs / 1000).toFixed(1)}s`
    : elapsedSeconds > 0
    ? `${elapsedSeconds.toFixed(1)}s`
    : "";

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      data-variant="think"
      data-state={running ? "running" : "completed"}
      className="my-3 rounded-xl border border-cyan-500/20 bg-[#0C0E17]/85 backdrop-blur-md overflow-hidden transition-all duration-200 shadow-md shadow-cyan-950/20"
    >
      {/* DeepSeek Harness Style Disclosure Header */}
      <div
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center justify-between px-3.5 py-2.5 bg-[#101320]/80 hover:bg-[#141829] cursor-pointer select-none transition group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`flex items-center justify-center w-5 h-5 rounded-md ${
              running
                ? "bg-cyan-500/20 text-cyan-400 animate-pulse"
                : "bg-slate-800 text-slate-300 group-hover:text-cyan-400"
            }`}
          >
            {running ? (
              <Brain className="w-3.5 h-3.5 animate-spin-slow" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
          </div>

          <span className="text-xs font-semibold text-slate-200 tracking-wide flex items-center gap-2">
            <span>Thought Process</span>
            {running ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-mono font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                Thinking for {displayTime}
              </span>
            ) : (
              <span className="text-[11px] font-normal text-slate-400 font-mono">
                {displayTime ? `Thought for ${displayTime}` : `${wordCount} words`}
              </span>
            )}
          </span>

          {/* Running stream single line snippet */}
          {running && !expanded && (
            <span className="hidden sm:inline-block text-[11px] text-slate-400 font-mono truncate max-w-[280px]">
              &middot; {latestLine}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {expanded && text && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-white/5 transition"
              title="Copy reasoning chain"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          <div className="text-slate-400 group-hover:text-slate-200 transition">
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Reasoning Body */}
      {expanded && (
        <div className="px-4 py-3.5 border-t border-cyan-500/10 bg-[#090B12]/95 text-slate-300 text-xs font-mono leading-relaxed select-text overflow-x-auto max-h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
          <div className="prose prose-invert prose-xs max-w-none text-slate-300 font-mono">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                p: ({ children }) => <p className="my-1.5 leading-relaxed text-slate-300">{children}</p>,
                code: ({ children }) => (
                  <code className="px-1 py-0.5 rounded bg-slate-800 text-cyan-300 text-[11.5px] font-mono">
                    {children}
                  </code>
                ),
              }}
            >
              {text}
            </ReactMarkdown>
          </div>
          {running && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 text-[11px] text-cyan-400/90 font-mono animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>Generating thoughts...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
