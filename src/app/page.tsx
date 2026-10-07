"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ClassicUserPlayground from "@/components/ClassicUserPlayground";
import LoginModal from "@/components/LoginModal";
import BlocksWave from "@/components/BlocksWave";
import SafeThinkingOrb from "@/components/libraries/SafeThinkingOrb";
import { ShieldCheck } from "lucide-react";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    name: string;
    role: "USER" | "ADMIN";
    balance?: number;
    status?: string;
  } | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalType, setLoginModalType] = useState<"user" | "admin">("user");

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
  };

  const handleOpenLogin = (type: "user" | "admin" = "user") => {
    if (type === "admin") {
      window.location.href = "/admin";
      return;
    }
    setLoginModalType(type);
    setShowLoginModal(true);
  };

  const handleAuthSuccess = (user: {
    id: string;
    email: string;
    name: string;
    role: "USER" | "ADMIN";
  }) => {
    setCurrentUser(user);
    if (user.role === "ADMIN") {
      window.location.href = "/admin";
    }
  };

  // While checking auth on initial page load, display subtle clean background matching User Playground
  // Absolutely zero admin panel markup is rendered here, preventing any flashing or visual glitch.
  if (loadingAuth) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0D0E12] text-[#EDEDED] font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs text-[#64748B] font-medium tracking-wide">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[#0D0E12]">
      <ClassicUserPlayground
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenLogin={handleOpenLogin}
      />

      {currentUser?.role === "ADMIN" && (
        <Link
          href="/admin"
          className="hidden md:flex fixed bottom-4 right-4 z-50 px-3.5 py-2 rounded-xl bg-[#141824] border border-cyan-500/30 text-xs font-sans text-cyan-400 hover:border-cyan-400 hover:text-cyan-300 transition shadow-2xl items-center gap-2 active:scale-[0.96]"
        >
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Admin Console (/admin)</span>
        </Link>
      )}

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleAuthSuccess}
        initialType={loginModalType}
      />
    </div>
  );
}
