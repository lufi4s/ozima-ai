"use client";

import React, { useState, useEffect } from "react";
import { BotAvatar, BotAvatarProps } from "bot-avatars";

export default function SafeBotAvatar(props: BotAvatarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    const s = typeof props.size === "number" ? props.size : 48;
    return (
      <div
        style={{ width: s, height: s }}
        className="rounded-2xl bg-[#272832] border border-[#3E3F4B] flex items-center justify-center animate-pulse"
      />
    );
  }

  return <BotAvatar {...props} />;
}
