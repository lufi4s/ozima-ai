"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  User,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  Check,
  Cpu,
  Fingerprint,
} from "lucide-react";
import SafeBorderBeam from "@/components/libraries/SafeBorderBeam";
import SafeBotAvatar from "@/components/libraries/SafeBotAvatar";

// Ozima Signature Neural Prism Emblem - Original Bespoke Iconography
export function OzimaPrismGlyph({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="prismGrad1" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00E5A3" />
          <stop offset="0.5" stopColor="#00D2FF" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id="prismGradGlow" x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00F2FE" stopOpacity="0.8" />
          <stop offset="1" stopColor="#4FACFE" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {/* Outer crystalline facets */}
      <path
        d="M12 2L21.5 7.5V16.5L12 22L2.5 16.5V7.5L12 2Z"
        stroke="url(#prismGrad1)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Internal neural tetrahedron axes */}
      <path
        d="M12 2V12M12 22V12M2.5 7.5L12 12M21.5 16.5L12 12M21.5 7.5L12 12M2.5 16.5L12 12"
        stroke="url(#prismGrad1)"
        strokeWidth="1.2"
        strokeOpacity="0.8"
        strokeLinecap="round"
      />
      {/* Central quantum singularity node */}
      <circle cx="12" cy="12" r="2.2" fill="url(#prismGrad1)" />
      <circle cx="12" cy="12" r="4.2" stroke="url(#prismGradGlow)" strokeWidth="0.8" strokeDasharray="2 2" />
    </svg>
  );
}

// Backward-compatible alias for any residual imports
export const MatrixPrismGlyph = OzimaPrismGlyph;
export const PerplexityIcon = OzimaPrismGlyph;

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { id: string; email: string; name: string; role: "USER" | "ADMIN" }) => void;
  initialType?: "user" | "admin";
}

export default function LoginModal({
  isOpen,
  onClose,
  onSuccess,
  initialType = "user",
}: LoginModalProps) {
  const [authType, setAuthType] = useState<"user" | "admin">(initialType);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filledDemo, setFilledDemo] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFillDemo = (type: "user" | "admin") => {
    setError(null);
    setFilledDemo(type);
    if (type === "admin") {
      setAuthType("admin");
      setEmail("admin@ozima.ai");
      setPassword("admin123");
    } else {
      setAuthType("user");
      setEmail("user@ozima.ai");
      setPassword("user123");
    }
    setTimeout(() => setFilledDemo(null), 1800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const payload: any = {
        email: email.trim(),
        password,
        loginType: authType,
      };

      if (isRegister) {
        payload.name = name.trim();
        payload.role = authType === "admin" ? "ADMIN" : "USER";
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      onSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to authenticate");
    } finally {
      setLoading(false);
    }
  };

  const isUserMode = authType === "user";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 [overscroll-behavior:contain]">
      {/* Ambient Pulsing Atmospheric Glow Mesh */}
      <div className="absolute w-[360px] sm:w-[480px] h-[360px] sm:h-[480px] bg-gradient-to-tr from-[#00E5A3]/20 via-[#00D2FF]/20 to-[#6366F1]/20 rounded-full blur-3xl pointer-events-none opacity-60 animate-pulse" />

      <div className="relative z-10 w-full max-w-md">
        <SafeBorderBeam
          size="md"
          colorVariant="ocean"
          strength={0.85}
          active={true}
        >
          <div
            className={`w-full max-h-[92dvh] overflow-y-auto rounded-3xl border transition-all duration-300 ${
              isUserMode
                ? "bg-[#0C0E14]/92 border-white/10 shadow-2xl shadow-cyan-950/40 font-sans"
                : "bg-[#090A0F]/95 border-blue-500/20 shadow-2xl shadow-blue-950/50 font-mono"
            }`}
          >
            {/* Top Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/[0.08] relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className={`w-11 h-11 rounded-2xl border flex items-center justify-center overflow-hidden shrink-0 shadow-lg ${
                        isUserMode
                          ? "bg-gradient-to-br from-[#121622] to-[#182030] border-cyan-500/30"
                          : "bg-gradient-to-br from-[#10141E] to-[#151D2A] border-blue-500/30"
                      }`}
                    >
                      {isUserMode ? (
                        <MatrixPrismGlyph className="w-6 h-6" />
                      ) : (
                        <SafeBotAvatar
                          type="mech"
                          size={46}
                          state={loading ? "working" : "default"}
                          color="#82AAFF"
                        />
                      )}
                    </div>
                    {/* Live Micro Status Pulse */}
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#00E5A3] border-2 border-[#0C0E14] animate-ping" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#00E5A3] border-2 border-[#0C0E14]" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold tracking-tight text-[#F3F4F6]">
                        {isUserMode ? "Ozima AI Intelligence" : "Ozima AI Root Terminal"}
                      </h2>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-medium tracking-wide bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {isUserMode ? "v2.4" : "CORE"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5 leading-snug">
                      {isUserMode
                        ? "Autonomous frontier research & live multi-engine consensus"
                        : "Neural gateway orchestration, margin matrix & live telemetry"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.06] transition active:scale-[0.96]"
                  title="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Pill Strip */}
              <div className="mt-3 flex items-center gap-2 text-[10px] text-[#6B7280]">
                <span className="flex items-center gap-1 font-mono text-[#00E5A3]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A3]" />
                  Neon DB Live
                </span>
                <span>·</span>
                <span className="text-[#9CA3AF]">AES-256 GCM</span>
                <span>·</span>
                <span className="text-[#9CA3AF]">Zero Query Retention</span>
              </div>
            </div>

            {/* Futuristic Segment Controller Switcher */}
            <div className="p-4 sm:p-5 pb-0">
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#07080C] border border-white/[0.06] relative">
                <button
                  type="button"
                  onClick={() => {
                    setAuthType("user");
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs transition duration-200 active:scale-[0.98] ${
                    isUserMode
                      ? "bg-gradient-to-r from-[#141A28] to-[#182236] border border-cyan-500/40 text-cyan-300 font-medium shadow-md shadow-cyan-950/40"
                      : "text-[#6B7280] hover:text-[#9CA3AF]"
                  }`}
                >
                  <MatrixPrismGlyph className="w-3.5 h-3.5" />
                  <span>Explorer Pass</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthType("admin");
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs transition duration-200 active:scale-[0.98] ${
                    !isUserMode
                      ? "bg-gradient-to-r from-[#121624] to-[#1A1F32] border border-blue-500/40 text-blue-300 font-semibold shadow-md shadow-blue-950/40"
                      : "text-[#6B7280] hover:text-[#9CA3AF]"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#82AAFF]" />
                  <span>Operator Core</span>
                </button>
              </div>
            </div>

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {isRegister && (
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-[#9CA3AF] mb-1 font-semibold">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Vance"
                      className="w-full pl-9 pr-3 py-2.5 sm:py-2 rounded-xl text-base sm:text-xs bg-[#07080C] border border-white/[0.08] text-[#F3F4F6] placeholder-[#4B5563] focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition font-sans"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-[#9CA3AF] mb-1 font-semibold">
                  Identity Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@ozima.ai"
                    className="w-full pl-9 pr-3 py-2.5 sm:py-2 rounded-xl text-base sm:text-xs bg-[#07080C] border border-white/[0.08] text-[#F3F4F6] placeholder-[#4B5563] focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition font-sans"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-[#9CA3AF] font-semibold">
                    Security Passcode
                  </label>
                  <span className="text-[10px] text-[#6B7280] font-mono">
                    {showPassword ? "Visible" : "Hidden"}
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 sm:py-2 rounded-xl text-base sm:text-xs bg-[#07080C] border border-white/[0.08] text-[#F3F4F6] placeholder-[#4B5563] focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#F3F4F6] transition p-0.5"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Primary Authentication Action */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50 active:scale-[0.96] shadow-lg ${
                  isUserMode
                    ? "bg-gradient-to-r from-[#00E5A3] to-[#00D2FF] text-[#0A0B10] shadow-cyan-500/25 hover:opacity-95"
                    : "bg-gradient-to-r from-[#00D2FF] to-[#6366F1] text-[#0A0B10] shadow-indigo-500/25 hover:opacity-95"
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-2 font-mono">
                    <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    <span>Verifying Token...</span>
                  </div>
                ) : (
                  <>
                    <span>
                      {isRegister
                        ? "Generate Identity & Proceed"
                        : isUserMode
                        ? "Enter Ozima AI Knowledge Canvas"
                        : "Access Root Operator Console"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Holographic One-Tap Evaluation Credentials */}
              <div className="pt-3 border-t border-white/[0.08]">
                <div className="text-[10px] mb-2 flex items-center justify-between text-[#9CA3AF]">
                  <span className="flex items-center gap-1.5 font-mono text-[#00E5A3]">
                    <KeyRound className="w-3 h-3 text-[#00E5A3]" />
                    One-Tap Test Access:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsRegister(!isRegister)}
                    className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline transition"
                  >
                    {isRegister ? "Switch to Sign In" : "Create new account"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleFillDemo("user")}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] text-left transition duration-200 active:scale-[0.96] flex items-center justify-between group ${
                      filledDemo === "user"
                        ? "bg-[#00E5A3]/15 border-[#00E5A3] text-white"
                        : "bg-[#07080C] border-white/[0.08] hover:border-cyan-400/40 text-[#9CA3AF] hover:text-[#F3F4F6]"
                    }`}
                  >
                    <div className="truncate pr-1">
                      <div className="text-[9px] uppercase font-mono text-[#00E5A3] font-semibold">
                        Explorer
                      </div>
                      <div className="text-xs truncate font-medium">user@ozima.ai</div>
                    </div>
                    {filledDemo === "user" ? (
                      <Check className="w-3.5 h-3.5 text-[#00E5A3] shrink-0" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-[#6B7280] group-hover:text-cyan-400 shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFillDemo("admin")}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] text-left transition duration-200 active:scale-[0.96] flex items-center justify-between group ${
                      filledDemo === "admin"
                        ? "bg-[#6366F1]/20 border-[#6366F1] text-white"
                        : "bg-[#07080C] border-white/[0.08] hover:border-indigo-400/40 text-[#9CA3AF] hover:text-[#F3F4F6]"
                    }`}
                  >
                    <div className="truncate pr-1">
                      <div className="text-[9px] uppercase font-mono text-[#82AAFF] font-semibold">
                        Operator
                      </div>
                      <div className="text-xs truncate font-medium">admin@ozima.ai</div>
                    </div>
                    {filledDemo === "admin" ? (
                      <Check className="w-3.5 h-3.5 text-[#82AAFF] shrink-0" />
                    ) : (
                      <ShieldCheck className="w-3 h-3 text-[#6B7280] group-hover:text-indigo-400 shrink-0" />
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </SafeBorderBeam>
      </div>
    </div>
  );
}
