"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  RefreshCw,
  MoreVertical,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  DollarSign,
  Trash2,
  Check,
  X,
  AlertTriangle,
  ArrowUpDown,
  Coins,
  Edit2,
} from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  balance: number;
  status: string;
  totalTokens: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    transactions: number;
  };
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
    initialBalance: "25.00",
  });
  const [createError, setCreateError] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Adjust Balance Modal State
  const [adjustTargetUser, setAdjustTargetUser] = useState<UserItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>("25.00");
  const [adjustIsCredit, setAdjustIsCredit] = useState<boolean>(true); // true = add, false = deduct
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  // Delete User Confirmation State
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserItem | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (roleFilter) query.set("role", roleFilter);
      if (statusFilter) query.set("status", statusFilter);

      const res = await fetch(`/api/admin/users?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  // Quick toggle role
  const handleToggleRole = async (user: UserItem) => {
    const nextRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u))
        );
      }
    } catch (err) {
      console.error("Failed to toggle user role:", err);
    }
  };

  // Quick toggle status (Active / Suspended)
  const handleToggleStatus = async (user: UserItem) => {
    const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
        );
      }
    } catch (err) {
      console.error("Failed to toggle user status:", err);
    }
  };

  // Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          initialBalance: parseFloat(createForm.initialBalance) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create user");
        return;
      }

      setShowCreateModal(false);
      setCreateForm({
        name: "",
        email: "",
        password: "",
        role: "USER",
        initialBalance: "25.00",
      });
      fetchUsers();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user");
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Submit Balance Adjustment
  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetUser) return;
    setAdjustSubmitting(true);

    try {
      const amountVal = parseFloat(adjustAmount) || 0;
      const signedAdjustment = adjustIsCredit ? amountVal : -amountVal;

      const res = await fetch(`/api/admin/users/${adjustTargetUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          balanceAdjustment: signedAdjustment,
          adjustmentReason:
            adjustReason ||
            `Admin ${adjustIsCredit ? "credited" : "deducted"} $${amountVal.toFixed(2)}`,
        }),
      });

      if (res.ok) {
        setAdjustTargetUser(null);
        setAdjustReason("");
        fetchUsers();
      }
    } catch (err) {
      console.error("Failed to adjust balance:", err);
    } finally {
      setAdjustSubmitting(false);
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!deleteTargetUser) return;
    setDeleteSubmitting(true);

    try {
      const res = await fetch(`/api/admin/users/${deleteTargetUser.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== deleteTargetUser.id));
        setDeleteTargetUser(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-lg font-bold text-[#EDEDED] flex items-center gap-2">
            <span>User Accounts & Access Control</span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {users.length} Users Found
            </span>
          </h1>
          <p className="text-xs text-[#717E91] mt-0.5">
            Manage user balances, roles, suspension statuses, and audit token expenditures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#090A0F] font-semibold text-xs transition shadow-lg shadow-cyan-500/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2 rounded-xl bg-[#12141C] border border-white/[0.08] hover:border-white/[0.16] text-[#8E9CAE] hover:text-[#EDEDED] transition disabled:opacity-50"
            title="Refresh Users"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#101217] p-3 rounded-2xl border border-white/[0.06]">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#717E91]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email address..."
            className="w-full bg-[#161822] border border-white/[0.06] rounded-xl pl-9 pr-4 py-1.5 text-xs text-[#EDEDED] placeholder-[#717E91] focus:outline-none focus:border-cyan-500/50"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#161822] border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-[#8E9CAE] focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">All Roles</option>
            <option value="USER">User Role</option>
            <option value="ADMIN">Admin Role</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#161822] border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-[#8E9CAE] focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="rounded-2xl bg-[#101217] border border-white/[0.06] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#0E1015] text-[11px] font-mono text-[#717E91] uppercase tracking-wider">
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Balance / Credits</th>
                <th className="py-3 px-4">Tokens Burned</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8E9CAE]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>Loading user records...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#717E91]">
                    No user accounts match current search criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* User Profile */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold text-xs flex items-center justify-center shrink-0">
                          {u.name ? u.name[0].toUpperCase() : u.email[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-[#EDEDED] truncate">
                            {u.name || "User"}
                          </div>
                          <div className="text-[11px] font-mono text-[#717E91] truncate">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleRole(u)}
                        className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full transition ${
                          u.role === "ADMIN"
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20"
                            : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20"
                        }`}
                        title="Click to switch role"
                      >
                        <Shield className="w-3 h-3" />
                        <span>{u.role}</span>
                      </button>
                    </td>

                    {/* Account Status */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full transition ${
                          u.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                        }`}
                        title="Click to toggle suspension"
                      >
                        {u.status === "ACTIVE" ? (
                          <>
                            <UserCheck className="w-3 h-3" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3" />
                            <span>Suspended</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Balance */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-emerald-400 text-xs">
                          ${u.balance.toFixed(2)}
                        </span>
                        <button
                          onClick={() => {
                            setAdjustTargetUser(u);
                            setAdjustAmount("25.00");
                            setAdjustIsCredit(true);
                            setAdjustReason("");
                          }}
                          className="px-1.5 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-mono text-[#8E9CAE] hover:text-[#EDEDED] transition"
                          title="Adjust credits"
                        >
                          ± Top Up
                        </button>
                      </div>
                    </td>

                    {/* Tokens Burned */}
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs text-[#EDEDED]">
                        {u.totalTokens.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-mono text-[#717E91]">
                        ${u.totalSpent.toFixed(4)} spent
                      </div>
                    </td>

                    {/* Joined Date */}
                    <td className="py-3 px-4 text-[11px] font-mono text-[#717E91]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setAdjustTargetUser(u);
                            setAdjustAmount("25.00");
                            setAdjustIsCredit(true);
                            setAdjustReason("");
                          }}
                          className="p-1.5 rounded-lg text-[#8E9CAE] hover:text-emerald-400 hover:bg-emerald-500/10 transition"
                          title="Adjust User Balance"
                        >
                          <Coins className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetUser(u)}
                          className="p-1.5 rounded-lg text-[#8E9CAE] hover:text-red-400 hover:bg-red-500/10 transition"
                          title="Delete User Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#111319] border border-white/[0.08] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-[#EDEDED] flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Create New User Account</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#717E91] hover:text-[#EDEDED]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-[#717E91] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. John Ozima"
                  className="w-full bg-[#161822] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-[#EDEDED] focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#717E91] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="name@domain.com"
                  className="w-full bg-[#161822] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-[#EDEDED] focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#717E91] mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-[#161822] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-[#EDEDED] focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#717E91] mb-1">
                    System Role
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full bg-[#161822] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-[#EDEDED] focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#717E91] mb-1">
                    Starter Credits ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={createForm.initialBalance}
                    onChange={(e) => setCreateForm({ ...createForm, initialBalance: e.target.value })}
                    className="w-full bg-[#161822] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-[#EDEDED] focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#161822] text-[#8E9CAE] hover:text-[#EDEDED] text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#090A0F] font-bold text-xs transition disabled:opacity-50"
                >
                  {createSubmitting ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {adjustTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#111319] border border-white/[0.08] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-[#EDEDED] flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-400" />
                <span>Adjust User Credits</span>
              </h3>
              <button
                onClick={() => setAdjustTargetUser(null)}
                className="text-[#717E91] hover:text-[#EDEDED]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#161822] border border-white/[0.04] space-y-1">
              <div className="text-xs font-medium text-[#EDEDED]">
                {adjustTargetUser.name || adjustTargetUser.email}
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-[#717E91]">
                <span>Current Balance:</span>
                <span className="text-emerald-400 font-bold">${adjustTargetUser.balance.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleAdjustBalance} className="space-y-3">
              {/* Add vs Deduct Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustIsCredit(true)}
                  className={`py-2 rounded-xl text-xs font-semibold transition ${
                    adjustIsCredit
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-[#161822] text-[#717E91]"
                  }`}
                >
                  + Add Credit (Deposit)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustIsCredit(false)}
                  className={`py-2 rounded-xl text-xs font-semibold transition ${
                    !adjustIsCredit
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-[#161822] text-[#717E91]"
                  }`}
                >
                  - Deduct Funds
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#717E91] mb-1">
                  Amount ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full bg-[#161822] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-[#EDEDED] font-mono font-bold focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5">
                {["10.00", "25.00", "50.00", "100.00"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAdjustAmount(preset)}
                    className="flex-1 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-mono text-[#8E9CAE] hover:text-[#EDEDED] transition"
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#717E91] mb-1">
                  Reason / Audit Note
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Promotional bonus, manual wire payment"
                  className="w-full bg-[#161822] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-[#EDEDED] focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustTargetUser(null)}
                  className="px-4 py-2 rounded-xl bg-[#161822] text-[#8E9CAE] hover:text-[#EDEDED] text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustSubmitting}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition disabled:opacity-50 ${
                    adjustIsCredit
                      ? "bg-emerald-500 hover:bg-emerald-400 text-[#090A0F]"
                      : "bg-red-500 hover:bg-red-400 text-white"
                  }`}
                >
                  {adjustSubmitting
                    ? "Updating..."
                    : adjustIsCredit
                    ? `Credit +$${parseFloat(adjustAmount || "0").toFixed(2)}`
                    : `Deduct -$${parseFloat(adjustAmount || "0").toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#111319] border border-white/[0.08] shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#EDEDED]">Delete User Account</h3>
                <p className="text-xs text-[#717E91] mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-[#8E9CAE] leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-[#EDEDED]">{deleteTargetUser.email}</strong>? All associated
              chat sessions and balance records will be removed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetUser(null)}
                className="px-4 py-2 rounded-xl bg-[#161822] text-[#8E9CAE] hover:text-[#EDEDED] text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deleteSubmitting}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs transition disabled:opacity-50"
              >
                {deleteSubmitting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
