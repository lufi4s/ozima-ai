"use client";

import React, { useState, useEffect } from "react";
import { ThinkingOrb, ThinkingOrbProps } from "thinking-orbs";

export default function SafeThinkingOrb(props: ThinkingOrbProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    const s = typeof props.size === "number" ? props.size : 32;
    return (
      <div
        style={{ width: s, height: s }}
        className="rounded-full bg-emerald-500/10 animate-pulse inline-block"
      />
    );
  }

  return <ThinkingOrb {...props} />;
}
