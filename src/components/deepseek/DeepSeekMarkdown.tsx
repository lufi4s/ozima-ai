"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import CodeBlock from "@/components/CodeBlock";
import DeepSeekReasoningRow from "./DeepSeekReasoningRow";

export interface DeepSeekMarkdownProps {
  content: string;
  reasoning?: string;
  isStreaming?: boolean;
  reasoningDurationMs?: number;
}

export default function DeepSeekMarkdown({
  content,
  reasoning = "",
  isStreaming = false,
  reasoningDurationMs,
}: DeepSeekMarkdownProps) {
  // Extract <think>...</think> if present in content
  const { thinkContent, mainContent, isInlineThinking } = useMemo(() => {
    let rawText = content || "";
    let extractedThink = "";
    let isThinking = false;

    // Check for <think> tag
    const thinkOpenIdx = rawText.indexOf("<think>");
    if (thinkOpenIdx !== -1) {
      const thinkCloseIdx = rawText.indexOf("</think>");
      if (thinkCloseIdx !== -1) {
        extractedThink = rawText.substring(thinkOpenIdx + 7, thinkCloseIdx).trim();
        rawText = (rawText.substring(0, thinkOpenIdx) + rawText.substring(thinkCloseIdx + 8)).trim();
      } else {
        // Still thinking inside the stream
        extractedThink = rawText.substring(thinkOpenIdx + 7).trim();
        rawText = rawText.substring(0, thinkOpenIdx).trim();
        isThinking = true;
      }
    }

    return {
      thinkContent: extractedThink || reasoning,
      mainContent: rawText,
      isInlineThinking: isThinking,
    };
  }, [content, reasoning]);

  const activeReasoning = thinkContent || reasoning;
  const isReasoningRunning = isStreaming && (isInlineThinking || (!mainContent && Boolean(activeReasoning)));

  return (
    <div className="space-y-2">
      {/* DeepSeek Reasoning Row (Think Disclosure) */}
      {activeReasoning && (
        <DeepSeekReasoningRow
          text={activeReasoning}
          running={isReasoningRunning}
          durationMs={reasoningDurationMs}
        />
      )}

      {/* Main Content Markdown with KaTeX & Code Blocks */}
      {mainContent ? (
        <div className="prose prose-invert prose-base max-w-none text-[#E6E8EB] leading-relaxed select-text">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                const isInline = !match && !String(children).includes("\n");
                if (isInline) {
                  return (
                    <code
                      className="px-1.5 py-0.5 rounded bg-[#161822] text-[#82AAFF] font-mono text-[13px] border border-[#232736]"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }
                return (
                  <CodeBlock
                    language={match ? match[1] : "text"}
                    value={String(children).replace(/\n$/, "")}
                  />
                );
              },
              p({ children }) {
                return <p className="mb-3 leading-relaxed text-[#D6D9E0] text-[15px]">{children}</p>;
              },
              ul({ children }) {
                return <ul className="my-2.5 pl-6 list-disc space-y-1 text-slate-300">{children}</ul>;
              },
              ol({ children }) {
                return <ol className="my-2.5 pl-6 list-decimal space-y-1 text-slate-300">{children}</ol>;
              },
              li({ children }) {
                return <li className="leading-relaxed text-[#D6D9E0]">{children}</li>;
              },
              blockquote({ children }) {
                return (
                  <blockquote className="my-3 pl-4 border-l-2 border-cyan-500/40 text-slate-400 italic bg-cyan-500/5 py-1 rounded-r-md">
                    {children}
                  </blockquote>
                );
              },
              table({ children }) {
                return (
                  <div className="my-4 overflow-x-auto rounded-lg border border-white/10">
                    <table className="w-full text-left text-sm border-collapse">{children}</table>
                  </div>
                );
              },
              th({ children }) {
                return (
                  <th className="bg-[#121522] px-3.5 py-2 font-semibold text-slate-200 border-b border-white/10">
                    {children}
                  </th>
                );
              },
              td({ children }) {
                return <td className="px-3.5 py-2 border-b border-white/5 text-slate-300">{children}</td>;
              },
              a({ href, children }) {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 underline underline-offset-4 hover:text-cyan-300 transition"
                  >
                    {children}
                  </a>
                );
              },
            }}
          >
            {mainContent}
          </ReactMarkdown>
        </div>
      ) : isReasoningRunning ? (
        <div className="flex items-center gap-2 text-xs text-cyan-400/80 font-mono py-1 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>DeepSeek reasoning in progress...</span>
        </div>
      ) : null}
    </div>
  );
}
