"use client";

import React, { useState, useEffect, useRef } from "react";
import SafeBotAvatar from "@/components/libraries/SafeBotAvatar";
import {
  Sparkles,
  Settings2,
  Volume2,
  VolumeX,
  X,
  RotateCw,
  Crown,
  Glasses,
  Palette,
  Bot,
  Heart,
} from "lucide-react";
import {
  playMascotFlipSound,
  playMascotChirpSound,
  getAudioMuted,
  setAudioMuted,
} from "@/lib/audioFx";

export interface MascotConfig {
  type: "droid" | "cat" | "star" | "alien" | "ghost" | "mech" | "clover" | "blob";
  hat: "none" | "crown" | "beret" | "beanie" | "party";
  glasses: "none" | "shades" | "round" | "square";
  headphones: boolean;
  shading: "plastic" | "fabric" | "crisp";
  color: string;
}

const DEFAULT_MASCOT_CONFIG: MascotConfig = {
  type: "droid",
  hat: "crown",
  glasses: "shades",
  headphones: false,
  shading: "plastic",
  color: "#06b6d4", // Cyan
};

const MASCOT_SHAPES: { id: MascotConfig["type"]; label: string; icon: string }[] = [
  { id: "droid", label: "Ozima Droid", icon: "🤖" },
  { id: "cat", label: "Cyber Neko", icon: "🐱" },
  { id: "star", label: "Quantum Star", icon: "⭐" },
  { id: "alien", label: "Cosmic Alien", icon: "👾" },
  { id: "ghost", label: "Neon Ghost", icon: "👻" },
  { id: "mech", label: "Titan Mech", icon: "🛡️" },
  { id: "clover", label: "Lucky Clover", icon: "🍀" },
  { id: "blob", label: "Poly Blob", icon: "🔮" },
];

const MASCOT_HATS: { id: MascotConfig["hat"]; label: string }[] = [
  { id: "none", label: "None" },
  { id: "crown", label: "👑 Crown" },
  { id: "beret", label: "🎨 Beret" },
  { id: "beanie", label: "🧢 Beanie" },
  { id: "party", label: "🎉 Party" },
];

const MASCOT_GLASSES: { id: MascotConfig["glasses"]; label: string }[] = [
  { id: "none", label: "None" },
  { id: "shades", label: "😎 Cyber Shades" },
  { id: "round", label: "👓 Round Specs" },
  { id: "square", label: "🕶️ Square Frames" },
];

const COLOR_PRESETS = [
  { name: "Paladin Gold", value: "#D4AF37" },
  { name: "Damascus Steel", value: "#94a3b8" },
  { name: "Cyan Ozima", value: "#06b6d4" },
  { name: "Electric Purple", value: "#a855f7" },
  { name: "Emerald Cyber", value: "#10b981" },
  { name: "Amber Flare", value: "#f59e0b" },
  { name: "Hyper Rose", value: "#f43f5e" },
  { name: "Obsidian Titanium", value: "#475569" },
];

const PLAYFUL_QUOTES = [
  "By my honor and neural weights, I serve truth! ⚔️",
  "The Neural Round Table stands ready, noble traveler! 🛡️",
  "A quest? Command me and it shall be conquered! 📜",
  "Behold! 360 aerial acrobatics in titanium armor! 🌀",
  "No hallucination shall breach my shield! 🛡️⚡",
  "The Order of AI Knights welcomes you! 👑",
  "Wheee! 360 flip complete! 🌀",
  "I eat tokens for breakfast! 🥐",
  "Quantum entanglement stabilized! 🔬",
  "Live web search is armed & ready! 🌐",
];

interface InteractiveMascotProps {
  variant?: "hero" | "mini" | "chat";
  status?: "idle" | "searching" | "streaming";
  onMascotClick?: () => void;
  className?: string;
}

export default function InteractiveMascot({
  variant = "hero",
  status = "idle",
  onMascotClick,
  className = "",
}: InteractiveMascotProps) {
  const [config, setConfig] = useState<MascotConfig>(DEFAULT_MASCOT_CONFIG);
  const [quote, setQuote] = useState<string>("Click me to do a 360 flip! 🌀");
  const [quoteVisible, setQuoteVisible] = useState(true);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [flipCount, setFlipCount] = useState(0);
  const [clickScale, setClickScale] = useState(false);
  const quoteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved preferences
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem("matrix_mascot_config");
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
      setSoundEnabled(!getAudioMuted());
    } catch {}
  }, []);

  // Sync state to quote
  useEffect(() => {
    if (status === "searching") {
      setQuote("Searching the live global web... 🌐");
      setQuoteVisible(true);
    } else if (status === "streaming") {
      setQuote("Synthesizing neural tokens... ⚡");
      setQuoteVisible(true);
    } else {
      if (flipCount === 0) {
        setQuote("Click me to do a 360 flip! 🌀");
      }
    }
  }, [status, flipCount]);

  const saveConfig = (newConfig: MascotConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem("matrix_mascot_config", JSON.stringify(newConfig));
    } catch {}
  };

  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    setAudioMuted(!nextState);
    if (nextState) {
      playMascotChirpSound();
    }
  };

  const handleClickMascot = () => {
    setFlipCount((prev) => prev + 1);
    setClickScale(true);
    setTimeout(() => setClickScale(false), 300);

    // Audio
    playMascotFlipSound();

    // Trigger quote
    const randomQuote = PLAYFUL_QUOTES[Math.floor(Math.random() * PLAYFUL_QUOTES.length)];
    setQuote(randomQuote);
    setQuoteVisible(true);

    if (quoteTimeoutRef.current) clearTimeout(quoteTimeoutRef.current);
    quoteTimeoutRef.current = setTimeout(() => {
      if (status === "idle") {
        setQuote("Ready to explore Ozima AI! 🚀");
      }
    }, 4500);

    onMascotClick?.();
  };

  const mascotState = status === "idle" ? "default" : "working";

  // MINI AVATAR VARIANT (e.g. Header or Chat response)
  if (variant === "mini" || variant === "chat") {
    const avatarSize = variant === "mini" ? 34 : 28;
    return (
      <div
        className={`relative inline-flex items-center justify-center cursor-pointer group ${className}`}
        onClick={handleClickMascot}
        title="Your Ozima Companion"
      >
        <div className="relative transform transition-transform duration-200 group-hover:scale-110 active:scale-95">
          <SafeBotAvatar
            type={config.type}
            hat={config.hat}
            glasses={config.glasses}
            headphones={config.headphones}
            shading={config.shading}
            color={config.color}
            state={mascotState}
            size={avatarSize}
            face="mouth"
            interactive={true}
          />
        </div>
        {status !== "idle" && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
        )}
      </div>
    );
  }

  // HERO CENTERPIECE VARIANT
  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* Radiant Ambient Backdrop Glow */}
      <div
        className="absolute -top-6 w-48 h-48 rounded-full blur-3xl opacity-25 pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${config.color} 0%, rgba(139, 92, 246, 0.4) 60%, transparent 100%)`,
        }}
      />

      {/* Floating Interactive Speech Bubble */}
      {quoteVisible && (
        <div className="relative mb-3 animate-fade-in transition-all duration-300 z-10">
          <div className="px-3.5 py-1.5 rounded-full bg-[#161822]/90 border border-white/[0.1] backdrop-blur-md shadow-lg flex items-center gap-2 text-xs text-[#EDEDED] font-medium max-w-xs text-center">
            <span className="text-cyan-400">✨</span>
            <span className="truncate">{quote}</span>
            <span
              className="text-[10px] text-[#64748B] hover:text-[#EDEDED] cursor-pointer"
              onClick={() => setQuoteVisible(false)}
            >
              ✕
            </span>
          </div>
          {/* Speech triangle beak */}
          <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#161822] mx-auto mt-[-1px]" />
        </div>
      )}

      {/* Main Mascot 3D Stage */}
      <div className="relative group flex items-center justify-center">
        {/* Luminous Pulsing Ring on Hover / Active */}
        <div
          className={`absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none`}
          style={{ background: config.color }}
        />

        {/* Mascot Interactive Canvas Container */}
        <div
          onClick={handleClickMascot}
          className={`relative cursor-pointer transition-transform duration-200 ${
            clickScale ? "scale-90" : "group-hover:scale-105 active:scale-95"
          }`}
          title="Click to flip & play!"
        >
          <SafeBotAvatar
            type={config.type}
            hat={config.hat}
            glasses={config.glasses}
            headphones={config.headphones}
            shading={config.shading}
            color={config.color}
            state={mascotState}
            size={104}
            face="mouth"
            interactive={true}
          />
        </div>

        {/* Floating Quick Action Orbit Controls */}
        <div className="absolute -bottom-2 flex items-center gap-1.5 bg-[#12141C]/90 border border-white/[0.08] backdrop-blur-md rounded-full px-2.5 py-1 shadow-xl z-10">
          <button
            onClick={() => setIsCustomizerOpen(true)}
            className="flex items-center gap-1 text-[11px] text-[#8E9CAE] hover:text-cyan-400 transition font-medium"
            title="Customize your companion"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Customize</span>
          </button>

          <span className="w-px h-3 bg-white/[0.1]" />

          <button
            onClick={handleToggleSound}
            className="p-1 text-[#8E9CAE] hover:text-[#EDEDED] transition rounded-full"
            title={soundEnabled ? "Mute Mascot Audio" : "Unmute Mascot Audio"}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-[#64748B]" />
            )}
          </button>
        </div>
      </div>

      {/* Mascot Companion Customizer Modal */}
      {isCustomizerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-[#12141C] border border-white/[0.1] shadow-2xl p-5 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#EDEDED]">Ozima Companion Studio</h3>
                  <p className="text-[11px] text-[#64748B]">Personalize your interactive AI mascot</p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomizerOpen(false)}
                className="p-1 rounded-lg text-[#64748B] hover:text-[#EDEDED] hover:bg-white/[0.04] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Interactive Preview */}
            <div className="flex flex-col items-center justify-center py-4 bg-[#0D0E12] rounded-xl border border-white/[0.04] relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, ${config.color} 0%, transparent 70%)`,
                }}
              />
              <div
                onClick={() => {
                  playMascotFlipSound();
                  setQuote("Looking sharp, captain! 🚀");
                }}
                className="cursor-pointer transform hover:scale-105 active:scale-95 transition"
                title="Click preview to test flip!"
              >
                <SafeBotAvatar
                  type={config.type}
                  hat={config.hat}
                  glasses={config.glasses}
                  headphones={config.headphones}
                  shading={config.shading}
                  color={config.color}
                  state="default"
                  size={96}
                  face="mouth"
                  interactive={true}
                />
              </div>
              <span className="text-[10px] text-[#64748B] mt-2 font-mono">
                Click preview to test 360 flip
              </span>
            </div>

            {/* Shape Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8E9CAE] flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
                Companion Shape
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {MASCOT_SHAPES.map((shape) => (
                  <button
                    key={shape.id}
                    onClick={() => {
                      saveConfig({ ...config, type: shape.id });
                      playMascotChirpSound();
                    }}
                    className={`p-2 rounded-xl border text-xs flex flex-col items-center gap-1 transition ${
                      config.type === shape.id
                        ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400 font-medium"
                        : "bg-[#161822] border-white/[0.04] text-[#8E9CAE] hover:border-white/[0.12] hover:text-[#EDEDED]"
                    }`}
                  >
                    <span className="text-base">{shape.icon}</span>
                    <span className="text-[10.5px] truncate w-full text-center">{shape.label.split(" ")[1]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hat & Headwear */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8E9CAE] flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                Headwear
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {MASCOT_HATS.map((hat) => (
                  <button
                    key={hat.id}
                    onClick={() => saveConfig({ ...config, hat: hat.id })}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] truncate text-center transition ${
                      config.hat === hat.id
                        ? "bg-amber-500/10 border-amber-500/50 text-amber-300 font-medium"
                        : "bg-[#161822] border-white/[0.04] text-[#8E9CAE] hover:text-[#EDEDED]"
                    }`}
                  >
                    {hat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Eye Accessories */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8E9CAE] flex items-center gap-1.5">
                <Glasses className="w-3.5 h-3.5 text-purple-400" />
                Eye Wear
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {MASCOT_GLASSES.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => saveConfig({ ...config, glasses: g.id })}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] truncate text-center transition ${
                      config.glasses === g.id
                        ? "bg-purple-500/10 border-purple-500/50 text-purple-300 font-medium"
                        : "bg-[#161822] border-white/[0.04] text-[#8E9CAE] hover:text-[#EDEDED]"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Hue */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8E9CAE] flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-emerald-400" />
                Cyber Hue
              </label>
              <div className="flex items-center gap-2">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => saveConfig({ ...config, color: c.value })}
                    className={`w-7 h-7 rounded-full transition transform hover:scale-110 flex items-center justify-center ${
                      config.color === c.value
                        ? "ring-2 ring-white ring-offset-2 ring-offset-[#12141C] scale-110"
                        : "opacity-75 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Finish Button */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
              <button
                onClick={() => {
                  saveConfig(DEFAULT_MASCOT_CONFIG);
                  playMascotChirpSound();
                }}
                className="text-xs text-[#64748B] hover:text-[#EDEDED] transition"
              >
                Reset to Default
              </button>
              <button
                onClick={() => {
                  setIsCustomizerOpen(false);
                  playMascotFlipSound();
                }}
                className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#090A0F] font-semibold text-xs transition"
              >
                Save & Play
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
