"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  language?: string;
  value: string;
}

export default function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayLang = (language || "text").toLowerCase().replace(/^language-/, "");

  return (
    <div className="my-3 rounded-xl border border-[#2A2E37] bg-[#0A0B0D] overflow-hidden text-xs font-mono shadow-lg">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#12141A] border-b border-[#1E2127] text-[#9BA1AC] select-none">
        <span className="text-[11px] font-medium tracking-wide uppercase text-[#82AAFF]">
          {displayLang}
        </span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-[#1E2127] hover:text-[#E6E8EB] transition active:scale-[0.96] text-[11px]"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#10A37F]" />
              <span className="text-[#10A37F] font-sans font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[#6B7280]" />
              <span className="text-[#6B7280] font-sans">Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <div className="p-3.5 overflow-x-auto text-[#ECECF1] leading-relaxed">
        <pre className="!bg-transparent !p-0 !m-0 font-mono text-[12.5px]">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
}
