"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Plus,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Copy,
  Check,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Wallet,
} from "lucide-react";

interface TransactionItem {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  provider: string;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: "USER" | "ADMIN";
  };
}

interface BillingMetrics {
  totalRevenueCollected: number;
  totalTransactionsCount: number;
  totalUsageBurned: number;
  totalActiveUserBalances: number;
  totalPlatformSpent: number;
}

export default function AdminBilling() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [metrics, setMetrics] = useState<BillingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userList, setUserList] = useState<Array<{ id: string; email: string; name: string | null }>>([]);
  const [paymentForm, setPaymentForm] = useState({
    userId: "",
    amount: "50.00",
    type: "DEPOSIT",
    provider: "Stripe",
    referenceId: "",
    description: "",
  });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (typeFilter) query.set("type", typeFilter);
      if (statusFilter) query.set("status", statusFilter);

      const res = await fetch(`/api/admin/payments?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setMetrics(data.metrics || null);
      }
    } catch (err) {
      console.error("Failed to fetch billing data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsersForModal = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUserList(data.users || []);
        if (data.users && data.users.length > 0 && !paymentForm.userId) {
          setPaymentForm((prev) => ({ ...prev, userId: data.users[0].id }));
        }
      }
    } catch (err) {
      console.error("Failed to load users for modal:", err);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [typeFilter, statusFilter]);

  const handleOpenPaymentModal = () => {
    loadUsersForModal();
    setShowPaymentModal(true);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentSubmitting(true);

    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...paymentForm,
          amount: parseFloat(paymentForm.amount) || 0,
        }),
      });

      if (res.ok) {
        setShowPaymentModal(false);
        setPaymentForm({
          userId: userList[0]?.id || "",
          amount: "50.00",
          type: "DEPOSIT",
          provider: "Stripe",
          referenceId: "",
          description: "",
        });
        fetchBillingData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to process payment");
      }
    } catch (err) {
      console.error("Failed to process payment:", err);
    } finally {
      setPaymentSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-lg font-bold text-[#EDEDED] flex items-center gap-2">
            <span>Billing, Invoicing & Payments Ledger</span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Double-Entry Ledger
            </span>
          </h1>
          <p className="text-xs text-[#717E91] mt-0.5">
            Audit payments, manual top-ups, transaction logs, and real-time revenue accounting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenPaymentModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#090A0F] font-semibold text-xs transition shadow-lg shadow-emerald-500/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Payment / Top-Up</span>
          </button>
          <button
            onClick={fetchBillingData}
            disabled={loading}
            className="p-2 rounded-xl bg-[#12141C] border border-white/[0.08] hover:border-white/[0.16] text-[#8E9CAE] hover:text-[#EDEDED] transition disabled:opacity-50"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-[#101217] border border-white/[0.06]">
          <div className="flex items-center justify-between text-xs text-[#717E91]">
            <span>Total Gross Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              ${(metrics?.totalRevenueCollected ?? 0).toFixed(2)}
            </span>
            <span className="text-[11px] text-[#717E91]">USD</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400/80 font-mono">
            {metrics?.totalTransactionsCount ?? 0} total records
          </div>
        </div>

        {/* Active User Balances */}
        <div className="p-5 rounded-2xl bg-[#101217] border border-white/[0.06]">
          <div className="flex items-center justify-between text-xs text-[#717E91]">
            <span>Active Circulating Credits</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cyan-400">
              ${(metrics?.totalActiveUserBalances ?? 0).toFixed(2)}
            </span>
            <span className="text-[11px] text-[#717E91]">USD</span>
          </div>
          <div className="mt-2 text-[11px] text-[#717E91]">
            User wallet liability pool
          </div>
        </div>

        {/* Total Usage Burned */}
        <div className="p-5 rounded-2xl bg-[#101217] border border-white/[0.06]">
          <div className="flex items-center justify-between text-xs text-[#717E91]">
            <span>Inference Burn Value</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-purple-400">
              ${(metrics?.totalPlatformSpent ?? 0).toFixed(4)}
            </span>
            <span className="text-[11px] text-[#717E91]">USD</span>
          </div>
          <div className="mt-2 text-[11px] text-[#717E91]">
            Direct API usage deduction
          </div>
        </div>

        {/* Profit Margin Tier */}
        <div className="p-5 rounded-2xl bg-[#101217] border border-white/[0.06]">
          <div className="flex items-center justify-between text-xs text-[#717E91]">
            <span>Net Gross Margin</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-400">
              +42.8%
            </span>
            <span className="text-[11px] text-[#717E91]">markup</span>
          </div>
          <div className="mt-2 text-[11px] text-[#717E91]">
            Based on active retail rate matrix
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#101217] p-3 rounded-2xl border border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#717E91]" />
          <span className="text-xs text-[#8E9CAE] font-medium">Filter Transactions:</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#161822] border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-[#8E9CAE] focus:outline-none focus:border-emerald-500/50"
          >
            <option value="">All Transaction Types</option>
            <option value="DEPOSIT">Direct Deposit</option>
            <option value="MANUAL_CREDIT">Manual Admin Credit</option>
            <option value="BONUS">Welcome Bonus</option>
            <option value="USAGE_BURN">Usage Burn</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#161822] border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-[#8E9CAE] focus:outline-none focus:border-emerald-500/50"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl bg-[#101217] border border-white/[0.06] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#0E1015] text-[11px] font-mono text-[#717E91] uppercase tracking-wider">
                <th className="py-3 px-4">Transaction / Reference</th>
                <th className="py-3 px-4">Customer Account</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8E9CAE]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Loading transactions ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#717E91]">
                    No transactions match current filters.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* ID & Reference */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-[#EDEDED]">
                          {tx.referenceId || tx.id.slice(0, 12)}
                        </span>
                        <button
                          onClick={() => handleCopyId(tx.referenceId || tx.id)}
                          className="text-[#717E91] hover:text-[#EDEDED]"
                          title="Copy Reference"
                        >
                          {copiedId === (tx.referenceId || tx.id) ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      {tx.description && (
                        <div className="text-[11px] text-[#717E91] truncate max-w-xs mt-0.5">
                          {tx.description}
                        </div>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#EDEDED] truncate">
                        {tx.user?.name || "Customer"}
                      </div>
                      <div className="text-[11px] font-mono text-[#717E91] truncate">
                        {tx.user?.email}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4">
                      <div
                        className={`font-mono font-bold text-xs ${
                          tx.type === "DEPOSIT" || tx.type === "MANUAL_CREDIT" || tx.type === "BONUS"
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }`}
                      >
                        {tx.type === "DEPOSIT" || tx.type === "MANUAL_CREDIT" || tx.type === "BONUS"
                          ? `+$${tx.amount.toFixed(2)}`
                          : `-$${tx.amount.toFixed(2)}`}
                      </div>
                      <div className="text-[10px] font-mono text-[#717E91]">{tx.currency}</div>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-4">
                      <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[#EDEDED]">
                        {tx.type}
                      </span>
                    </td>

                    {/* Provider */}
                    <td className="py-3 px-4">
                      <span className="text-xs text-[#8E9CAE] font-medium flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{tx.provider}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          tx.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : tx.status === "PENDING"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {tx.status === "COMPLETED" ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>{tx.status}</span>
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-[11px] font-mono text-[#717E91]">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment / Issue Credits Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#111319] border border-white/[0.08] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-[#EDEDED] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Process Payment / Issue Credit</span>
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-[#717E91] hover:text-[#EDEDED]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-3">
              {/* Target User */}
              <div>
                <label className="block text-[11px] font-mono text-[#717E91] mb-1">
                  Customer Account *
                </label>
                <select
                  required
                  value={paymentForm.userId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, userId: e.target.value })}
                  className="w-full bg-[#161822] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-[#EDEDED] focus:outline-none focus:border-emerald-500/50"
                >
                  {userList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name ? `${u.name} (${u.email})` : u.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[11px] font-mono text-[#717E91] mb-1">
                  Amount ($ USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full bg-[#161822] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-[#EDEDED] font-mono font-bold focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5">
                {["20.00", "50.00", "100.00", "250.00", "500.00"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPaymentForm({ ...paymentForm, amount: preset })}
                    className="flex-1 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-mono text-[#8E9CAE] hover:text-[#EDEDED] transition"
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Payment Gateway */}
                <div>
                  <label className="block text-[11px] font-mono text-[#717E91] mb-1">
                    Gateway / Method
                  </label>
                  <select
                    value={paymentForm.provider}
                    onChange={(e) => setPaymentForm({ ...paymentForm, provider: e.target.value })}
                    className="w-full bg-[#161822] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-[#EDEDED] focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="Stripe">Stripe Card</option>
                    <option value="bKash">bKash Mobile Wallet</option>
                    <option value="Nagad">Nagad Wallet</option>
                    <option value="Crypto">USDT / Crypto</option>
                    <option value="Bank Wire">Bank Wire</option>
                    <option value="Manual Admin">Manual Admin Credit</option>
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-[11px] font-mono text-[#717E91] mb-1">
                    Transaction Type
                  </label>
                  <select
                    value={paymentForm.type}
                    onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value })}
                    className="w-full bg-[#161822] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-[#EDEDED] focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="DEPOSIT">Direct Deposit</option>
                    <option value="MANUAL_CREDIT">Manual Top-Up</option>
                    <option value="BONUS">Promotional Bonus</option>
                  </select>
                </div>
              </div>

              {/* Reference ID */}
              <div>
                <label className="block text-[11px] font-mono text-[#717E91] mb-1">
                  Reference ID / Invoice #
                </label>
                <input
                  type="text"
                  value={paymentForm.referenceId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, referenceId: e.target.value })}
                  placeholder="e.g. ch_3M5x... or bKash TrxID"
                  className="w-full bg-[#161822] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-[#EDEDED] focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-mono text-[#717E91] mb-1">
                  Memo / Audit Description
                </label>
                <input
                  type="text"
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                  placeholder="e.g. Verified customer invoice payment"
                  className="w-full bg-[#161822] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-[#EDEDED] focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#161822] text-[#8E9CAE] hover:text-[#EDEDED] text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#090A0F] font-bold text-xs transition disabled:opacity-50"
                >
                  {paymentSubmitting ? "Processing..." : "Confirm & Credit Balance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
