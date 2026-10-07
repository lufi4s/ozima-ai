"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  CreditCard,
  Cpu,
  TrendingUp,
  RefreshCw,
  Database,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Activity,
  DollarSign,
  Clock,
} from "lucide-react";

interface OverviewData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalProviders: number;
    totalModels: number;
    visibleModels: number;
    totalTransactions: number;
    totalRevenue: number;
    totalCreditsInCirculation: number;
    totalTokensBurned: number;
    totalSpent: number;
  };
  recentUsers: Array<{
    id: string;
    email: string;
    name: string | null;
    role: "USER" | "ADMIN";
    balance: number;
    createdAt: string;
  }>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    currency: string;
    type: string;
    status: string;
    provider: string;
    createdAt: string;
    user: {
      name: string | null;
      email: string;
    };
  }>;
  dbStatus: string;
}

interface AdminOverviewProps {
  onNavigateTab: (tab: "users" | "billing" | "providers" | "overview") => void;
}

export default function AdminOverview({ onNavigateTab }: AdminOverviewProps) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20 text-[#8E9CAE]">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
          <span className="text-xs">Aggregating platform telemetry...</span>
        </div>
      </div>
    );
  }

  const overview = data?.overview;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner & Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-lg font-bold text-[#EDEDED] flex items-center gap-2">
            <span>Executive Mission Control</span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Production
            </span>
          </h1>
          <p className="text-xs text-[#717E91] mt-0.5">
            Real-time telemetry across users, billing ledger, inference gateways, and Neon PostgreSQL.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12141C] border border-white/[0.08] hover:border-white/[0.16] text-xs text-[#8E9CAE] hover:text-[#EDEDED] transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            <span>Sync Stats</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div
          onClick={() => onNavigateTab("users")}
          className="group p-5 rounded-2xl bg-[#101217] border border-white/[0.06] hover:border-cyan-500/30 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#717E91] font-medium">Total Registered Users</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#EDEDED]">
              {overview?.totalUsers ?? 0}
            </span>
            <span className="text-[11px] text-emerald-400 font-medium">
              {overview?.activeUsers ?? 0} active
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-[#717E91] group-hover:text-cyan-400 transition">
            <span>Manage accounts</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>

        {/* Total Platform Revenue */}
        <div
          onClick={() => onNavigateTab("billing")}
          className="group p-5 rounded-2xl bg-[#101217] border border-white/[0.06] hover:border-emerald-500/30 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#717E91] font-medium">Platform Revenue & Deposits</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              ${(overview?.totalRevenue ?? 0).toFixed(2)}
            </span>
            <span className="text-[11px] text-[#717E91]">
              USD
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-[#717E91] group-hover:text-emerald-400 transition">
            <span>View transactions ledger</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>

        {/* Active AI Models */}
        <div
          onClick={() => onNavigateTab("providers")}
          className="group p-5 rounded-2xl bg-[#101217] border border-white/[0.06] hover:border-purple-500/30 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#717E91] font-medium">Active AI Models & Gateways</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#EDEDED]">
              {overview?.visibleModels ?? 0}
            </span>
            <span className="text-[11px] text-[#717E91]">
              of {overview?.totalModels ?? 0} synced ({overview?.totalProviders ?? 0} upstream)
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-[#717E91] group-hover:text-purple-400 transition">
            <span>Configure pricing & margins</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>

        {/* Tokens & Inference Burn */}
        <div className="p-5 rounded-2xl bg-[#101217] border border-white/[0.06] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#717E91] font-medium">Tokens Burned & Circulation</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#EDEDED]">
              {(overview?.totalTokensBurned ?? 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-amber-400 font-medium">
              tokens
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#717E91]">
            ${(overview?.totalCreditsInCirculation ?? 0).toFixed(2)} active user credits
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Users & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registered Users */}
        <div className="p-5 rounded-2xl bg-[#101217] border border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-semibold text-[#EDEDED] uppercase tracking-wider">
                Recent User Accounts
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab("users")}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {data?.recentUsers && data.recentUsers.length > 0 ? (
              data.recentUsers.map((u) => (
                <div key={u.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold text-xs flex items-center justify-center shrink-0">
                      {u.name ? u.name[0].toUpperCase() : u.email[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[#EDEDED] truncate">
                        {u.name || "User"}
                      </div>
                      <div className="text-[11px] text-[#717E91] font-mono truncate">
                        {u.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        u.role === "ADMIN"
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      }`}
                    >
                      {u.role}
                    </span>
                    <span className="text-xs font-mono font-medium text-emerald-400">
                      ${u.balance.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-[#717E91]">
                No users found
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions Feed */}
        <div className="p-5 rounded-2xl bg-[#101217] border border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-semibold text-[#EDEDED] uppercase tracking-wider">
                Recent Transactions Ledger
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab("billing")}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {data?.recentTransactions && data.recentTransactions.length > 0 ? (
              data.recentTransactions.map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-[#EDEDED] flex items-center gap-2">
                      <span className="truncate">{tx.user?.name || tx.user?.email}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-[#8E9CAE] font-mono">
                        {tx.provider}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#717E91] font-mono flex items-center gap-1.5 mt-0.5">
                      <span>{tx.type}</span>
                      <span>·</span>
                      <span className="text-[10px]">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-xs font-mono font-bold ${
                        tx.type === "DEPOSIT" || tx.type === "MANUAL_CREDIT" || tx.type === "BONUS"
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {tx.type === "DEPOSIT" || tx.type === "MANUAL_CREDIT" || tx.type === "BONUS"
                        ? `+$${tx.amount.toFixed(2)}`
                        : `-$${tx.amount.toFixed(2)}`}
                    </div>
                    <div className="text-[10px] font-mono text-emerald-500 uppercase">
                      {tx.status}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#717E91] space-y-2">
                <p>No billing transactions recorded yet</p>
                <button
                  onClick={() => onNavigateTab("billing")}
                  className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs transition"
                >
                  Issue First Credit Top-Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Infrastructure Card */}
      <div className="p-4 rounded-xl bg-[#0D0E12] border border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#717E91]">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <span>Storage Engine:</span>
          <span className="font-mono text-[#EDEDED]">{data?.dbStatus}</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SSL Secured</span>
          </span>
          <span>AES-256-GCM Vault Active</span>
        </div>
      </div>
    </div>
  );
}
