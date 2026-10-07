"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AdminBilling from "@/components/admin/AdminBilling";
import AdminProviders from "@/components/AdminProviders";
import LoginModal from "@/components/LoginModal";
import {
  ArrowLeft,
  ShieldCheck,
  LogOut,
  LayoutDashboard,
  Users,
  CreditCard,
  Cpu,
  Database,
} from "lucide-react";
import { MatrixPrismGlyph } from "@/components/LoginModal";

type AdminTab = "overview" | "users" | "billing" | "providers";

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    name: string;
    role: "USER" | "ADMIN";
  } | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user && data.user.role === "ADMIN") {
          setCurrentUser(data.user);
          setShowLoginModal(false);
        } else {
          setCurrentUser(null);
          setShowLoginModal(true);
        }
      } else {
        setCurrentUser(null);
        setShowLoginModal(true);
      }
    } catch {
      setCurrentUser(null);
      setShowLoginModal(true);
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    setShowLoginModal(true);
  };

  const handleAuthSuccess = (user: {
    id: string;
    email: string;
    name: string;
    role: "USER" | "ADMIN";
  }) => {
    if (user.role === "ADMIN") {
      setCurrentUser(user);
      setShowLoginModal(false);
    } else {
      window.location.href = "/";
    }
  };

  // Simple loading state
  if (loadingAuth) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0B0C0E] text-[#8E9CAE] font-sans">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Authenticating Admin Console...</span>
        </div>
      </div>
    );
  }

  // If not logged in as Admin, show clean access card
  if (!currentUser || currentUser.role !== "ADMIN") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0B0C0E] text-[#EDEDED] font-sans p-4">
        <div className="max-w-sm w-full p-6 rounded-2xl bg-[#111319] border border-white/[0.08] shadow-2xl text-center space-y-4">
          <div className="flex justify-center mb-1">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#EDEDED]">Ozima AI Admin Panel</h2>
            <p className="text-xs text-[#717E91] mt-1 leading-relaxed">
              Sign in with an administrator account to manage users, billing, payments, and model gateways.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#090A0F] font-bold text-xs transition"
            >
              Sign In as Admin
            </button>
            <Link
              href="/"
              className="w-full py-2 rounded-xl bg-[#161822] border border-white/[0.06] text-xs text-[#8E9CAE] hover:text-[#EDEDED] transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to User Playground</span>
            </Link>
          </div>
        </div>

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => {
            if (!currentUser || currentUser.role !== "ADMIN") {
              window.location.href = "/";
            } else {
              setShowLoginModal(false);
            }
          }}
          onSuccess={handleAuthSuccess}
          initialType="admin"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#0B0C0E] text-[#EDEDED] font-sans">
      {/* Top Header */}
      <header className="h-14 border-b border-white/[0.06] bg-[#0E1016]/95 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <MatrixPrismGlyph className="w-5 h-5 text-cyan-400" />
            <span className="font-semibold text-sm tracking-tight text-[#EDEDED]">
              Ozima AI Admin
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              Pro Console
            </span>
          </div>

          <div className="h-4 w-px bg-white/[0.1] hidden sm:block" />

          {/* Quick link back to User Playground */}
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 text-xs text-[#8E9CAE] hover:text-[#EDEDED] px-2.5 py-1 rounded-lg hover:bg-white/[0.04] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>User Playground</span>
          </Link>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex items-center gap-1 bg-[#12141C] p-1 rounded-xl border border-white/[0.06]">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
              activeTab === "overview"
                ? "bg-cyan-500 text-[#090A0F] font-bold shadow-md shadow-cyan-500/20"
                : "text-[#8E9CAE] hover:text-[#EDEDED] hover:bg-white/[0.04]"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
              activeTab === "users"
                ? "bg-cyan-500 text-[#090A0F] font-bold shadow-md shadow-cyan-500/20"
                : "text-[#8E9CAE] hover:text-[#EDEDED] hover:bg-white/[0.04]"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden md:inline">User Management</span>
          </button>

          <button
            onClick={() => setActiveTab("billing")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
              activeTab === "billing"
                ? "bg-cyan-500 text-[#090A0F] font-bold shadow-md shadow-cyan-500/20"
                : "text-[#8E9CAE] hover:text-[#EDEDED] hover:bg-white/[0.04]"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Billing & Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab("providers")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
              activeTab === "providers"
                ? "bg-cyan-500 text-[#090A0F] font-bold shadow-md shadow-cyan-500/20"
                : "text-[#8E9CAE] hover:text-[#EDEDED] hover:bg-white/[0.04]"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden md:inline">AI Gateways</span>
          </button>
        </nav>

        {/* Right Admin Status & Actions */}
        <div className="flex items-center gap-3">
          {/* Live Database Status */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#12141C] border border-white/[0.06] text-[11px] font-mono text-[#8E9CAE]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Neon Postgres</span>
          </div>

          {/* Admin User Info */}
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-semibold text-xs flex items-center justify-center">
              {currentUser.name ? currentUser.name[0].toUpperCase() : "A"}
            </div>
            <span className="text-[#8E9CAE] hidden sm:inline max-w-[120px] truncate">
              {currentUser.name || currentUser.email}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-[#8E9CAE] hover:text-[#EF4444] hover:bg-white/[0.04] transition"
            title="Sign out of Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Admin Workspace Tabs */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === "overview" && (
          <AdminOverview onNavigateTab={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === "users" && <AdminUserManagement />}
        {activeTab === "billing" && <AdminBilling />}
        {activeTab === "providers" && <AdminProviders />}
      </main>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleAuthSuccess}
        initialType="admin"
      />
    </div>
  );
}
