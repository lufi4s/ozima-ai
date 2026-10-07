"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Server,
  RefreshCw,
  Plus,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Database,
  Sliders,
  CheckCircle2,
  Search,
  Key,
  Globe,
  Trash2,
  Edit2,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  isActive: boolean;
  createdAt: string;
  apiKeyMasked: string;
  modelCount: number;
}

interface ModelItem {
  id: string;
  providerId: string;
  rawModelId: string;
  displayName: string;
  isVisible: boolean;
  originalInputPricePerM: number;
  originalOutputPricePerM: number;
  inputPricePerM: number;
  outputPricePerM: number;
  lastSyncedAt: string;
  provider?: {
    id: string;
    name: string;
    isActive: boolean;
  };
}

export default function AdminProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [savingModelId, setSavingModelId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    baseUrl: "",
    apiKey: "",
    isActive: true,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Filter/Search State
  const [selectedProviderFilter, setSelectedProviderFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [modelFilterTab, setModelFilterTab] = useState<"all" | "visible" | "profitable">("all");
  const [sortBy, setSortBy] = useState<
    | "enabled_first"
    | "name_asc"
    | "name_desc"
    | "margin_desc"
    | "margin_asc"
    | "retail_desc"
    | "retail_asc"
    | "cost_desc"
  >("enabled_first");

  const handleHeaderSortClick = (field: "visibility" | "name" | "retail" | "margin") => {
    if (field === "visibility") {
      setSortBy((prev) => (prev === "enabled_first" ? "name_asc" : "enabled_first"));
    } else if (field === "name") {
      setSortBy((prev) => (prev === "name_asc" ? "name_desc" : "name_asc"));
    } else if (field === "retail") {
      setSortBy((prev) => (prev === "retail_desc" ? "retail_asc" : "retail_desc"));
    } else if (field === "margin") {
      setSortBy((prev) => (prev === "margin_desc" ? "margin_asc" : "margin_desc"));
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [providersRes, modelsRes] = await Promise.all([
        fetch("/api/admin/providers"),
        fetch("/api/admin/models"),
      ]);

      if (providersRes.ok) {
        const pData = await providersRes.json();
        setProviders(pData);
      }
      if (modelsRes.ok) {
        const mData = await modelsRes.json();
        setModels(mData);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", text: "Failed to load admin data" });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setStatusMessage(null);

    try {
      const payload: any = {
        name: formData.name,
        base_url: formData.baseUrl,
        is_active: formData.isActive,
      };

      if (editingProviderId) {
        payload.id = editingProviderId;
        if (formData.apiKey) {
          payload.api_key = formData.apiKey;
        }
      } else {
        payload.api_key = formData.apiKey;
      }

      const res = await fetch("/api/admin/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save provider");
      }

      setStatusMessage({
        type: "success",
        text: editingProviderId
          ? `Provider "${data.name}" updated successfully`
          : `Provider "${data.name}" created successfully`,
      });

      setFormData({ name: "", baseUrl: "", apiKey: "", isActive: true });
      setEditingProviderId(null);
      setShowAddForm(false);
      await fetchInitialData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setFormSubmitting(false);
    }
  };

  const startEdit = (provider: Provider) => {
    setEditingProviderId(provider.id);
    setFormData({
      name: provider.name,
      baseUrl: provider.baseUrl,
      apiKey: "",
      isActive: provider.isActive,
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingProviderId(null);
    setShowAddForm(false);
    setFormData({ name: "", baseUrl: "", apiKey: "", isActive: true });
  };

  const deleteProvider = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" and all its synced models?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/providers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStatusMessage({ type: "success", text: `Provider "${name}" deleted` });
        fetchInitialData();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const syncModels = async (providerId: string, providerName: string) => {
    setSyncingId(providerId);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/providers/${providerId}/sync`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sync models");
      }

      setStatusMessage({
        type: "success",
        text: `Sync completed for ${providerName}: ${data.chatModelsFound} chat models (${data.newModelsAdded} new, ${data.existingModelsPreserved} preserved).`,
      });

      await fetchInitialData();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: `Sync failed for ${providerName}: ${err.message}`,
      });
    } finally {
      setSyncingId(null);
    }
  };

  const toggleModelVisibility = async (model: ModelItem) => {
    const newVisibility = !model.isVisible;
    setModels((prev) =>
      prev.map((m) => (m.id === model.id ? { ...m, isVisible: newVisibility } : m))
    );

    try {
      const res = await fetch(`/api/admin/models/${model.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_visible: newVisibility }),
      });

      if (!res.ok) {
        throw new Error("Failed to update visibility");
      }
    } catch (err: any) {
      setModels((prev) =>
        prev.map((m) => (m.id === model.id ? { ...m, isVisible: model.isVisible } : m))
      );
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const updateModelField = (
    modelId: string,
    field: "displayName" | "inputPricePerM" | "outputPricePerM" | "originalInputPricePerM" | "originalOutputPricePerM",
    value: any
  ) => {
    setModels((prev) =>
      prev.map((m) => (m.id === modelId ? { ...m, [field]: value } : m))
    );
  };

  const applyMarkupPreset = async (model: ModelItem, markupPercent: number) => {
    const newInput = Number((model.originalInputPricePerM * (1 + markupPercent / 100)).toFixed(4));
    const newOutput = Number((model.originalOutputPricePerM * (1 + markupPercent / 100)).toFixed(4));

    const updatedModel = {
      ...model,
      inputPricePerM: newInput,
      outputPricePerM: newOutput,
    };

    setModels((prev) =>
      prev.map((m) => (m.id === model.id ? updatedModel : m))
    );

    await saveModelChanges(updatedModel);
  };

  const resetToBasePrice = async (model: ModelItem) => {
    const updatedModel = {
      ...model,
      inputPricePerM: model.originalInputPricePerM,
      outputPricePerM: model.originalOutputPricePerM,
    };

    setModels((prev) =>
      prev.map((m) => (m.id === model.id ? updatedModel : m))
    );

    await saveModelChanges(updatedModel);
  };

function cleanModelName(rawId: string): string {
  let clean = rawId.replace(/^[~]/, "");
  const parts = clean.split("/");
  let vendor = "";
  let name = clean;
  if (parts.length === 2) {
    vendor = parts[0];
    name = parts[1];
  }

  let formatted = name
    .replace(/:free|:batch|:beta/gi, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/Gpt/gi, "GPT")
    .replace(/Qwen/gi, "Qwen")
    .replace(/Deepseek/gi, "DeepSeek")
    .replace(/Claude/gi, "Claude")
    .replace(/Mimo/gi, "MiMo");

  if (vendor) {
    const vendorFormatted = vendor.charAt(0).toUpperCase() + vendor.slice(1);
    return `${formatted} (${vendorFormatted})`;
  }
  return formatted;
}

  const saveModelChanges = async (model: ModelItem, customDisplayName?: string) => {
    const displayNameToSave = customDisplayName ?? model.displayName;
    setSavingModelId(model.id);
    try {
      const res = await fetch(`/api/admin/models/${model.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayNameToSave,
          original_input_price_per_m: Number(model.originalInputPricePerM) || 0,
          original_output_price_per_m: Number(model.originalOutputPricePerM) || 0,
          input_price_per_m: Number(model.inputPricePerM) || 0,
          output_price_per_m: Number(model.outputPricePerM) || 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update model");
      }

      setStatusMessage({
        type: "success",
        text: `Saved custom name "${displayNameToSave}" for User Dashboard`,
      });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setTimeout(() => setSavingModelId(null), 800);
    }
  };

  const filteredModels = useMemo(() => {
    const list = models.filter((m) => {
      if (selectedProviderFilter !== "all" && m.providerId !== selectedProviderFilter) {
        return false;
      }
      if (modelFilterTab === "visible" && !m.isVisible) {
        return false;
      }
      if (modelFilterTab === "profitable") {
        const cost = m.originalInputPricePerM + m.originalOutputPricePerM;
        const retail = m.inputPricePerM + m.outputPricePerM;
        const margin = retail > 0 && cost > 0 ? ((retail - cost) / retail) * 100 : 0;
        if (margin < 20) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          m.displayName.toLowerCase().includes(q) ||
          m.rawModelId.toLowerCase().includes(q) ||
          (m.provider?.name && m.provider.name.toLowerCase().includes(q))
        );
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "enabled_first") {
        if (a.isVisible !== b.isVisible) {
          return a.isVisible ? -1 : 1;
        }
        return a.displayName.localeCompare(b.displayName);
      }
      if (sortBy === "name_asc") {
        return a.displayName.localeCompare(b.displayName);
      }
      if (sortBy === "name_desc") {
        return b.displayName.localeCompare(a.displayName);
      }
      if (sortBy === "margin_desc") {
        const costA = a.originalInputPricePerM + a.originalOutputPricePerM;
        const retA = a.inputPricePerM + a.outputPricePerM;
        const marginA = retA > 0 && costA > 0 ? ((retA - costA) / retA) * 100 : 0;

        const costB = b.originalInputPricePerM + b.originalOutputPricePerM;
        const retB = b.inputPricePerM + b.outputPricePerM;
        const marginB = retB > 0 && costB > 0 ? ((retB - costB) / retB) * 100 : 0;

        return marginB - marginA;
      }
      if (sortBy === "margin_asc") {
        const costA = a.originalInputPricePerM + a.originalOutputPricePerM;
        const retA = a.inputPricePerM + a.outputPricePerM;
        const marginA = retA > 0 && costA > 0 ? ((retA - costA) / retA) * 100 : 0;

        const costB = b.originalInputPricePerM + b.originalOutputPricePerM;
        const retB = b.inputPricePerM + b.outputPricePerM;
        const marginB = retB > 0 && costB > 0 ? ((retB - costB) / retB) * 100 : 0;

        return marginA - marginB;
      }
      if (sortBy === "retail_desc") {
        const retA = a.inputPricePerM + a.outputPricePerM;
        const retB = b.inputPricePerM + b.outputPricePerM;
        return retB - retA;
      }
      if (sortBy === "retail_asc") {
        const retA = a.inputPricePerM + a.outputPricePerM;
        const retB = b.inputPricePerM + b.outputPricePerM;
        return retA - retB;
      }
      if (sortBy === "cost_desc") {
        const costA = a.originalInputPricePerM + a.originalOutputPricePerM;
        const costB = b.originalInputPricePerM + b.originalOutputPricePerM;
        return costB - costA;
      }
      return 0;
    });
  }, [models, selectedProviderFilter, modelFilterTab, searchQuery, sortBy]);

  const visibleCount = models.filter((m) => m.isVisible).length;
  const profitableCount = models.filter((m) => {
    const cost = m.originalInputPricePerM + m.originalOutputPricePerM;
    const retail = m.inputPricePerM + m.outputPricePerM;
    return retail > cost && cost > 0;
  }).length;

  const avgProfitMargin =
    models.length > 0
      ? (
          models.reduce((acc, m) => {
            const cost = m.originalInputPricePerM + m.originalOutputPricePerM;
            const retail = m.inputPricePerM + m.outputPricePerM;
            if (retail > 0 && cost > 0) {
              return acc + ((retail - cost) / retail) * 100;
            }
            return acc;
          }, 0) / models.length
        ).toFixed(1)
      : "0";

  return (
    <div className="space-y-6 w-full max-w-[1700px] 2xl:max-w-[1900px] mx-auto px-3.5 sm:px-8 lg:px-10 py-5 sm:py-6">
      {/* Overview Stat Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-[1px] rounded-xl bg-gradient-to-b from-[#1E2127] to-[#121418]">
          <div className="bg-[#101216] rounded-[11px] p-3.5 border border-[#1E2127]/50">
            <div className="text-[10px] text-[#6C7380] font-mono uppercase tracking-wider">Gateways</div>
            <div className="text-xl font-bold text-[#E6E8EB] mt-1 font-mono tabular-nums">{providers.length}</div>
          </div>
        </div>
        <div className="p-[1px] rounded-xl bg-gradient-to-b from-[#1E2127] to-[#121418]">
          <div className="bg-[#101216] rounded-[11px] p-3.5 border border-[#1E2127]/50">
            <div className="text-[10px] text-[#6C7380] font-mono uppercase tracking-wider">Models Synced</div>
            <div className="text-xl font-bold text-[#82AAFF] mt-1 font-mono tabular-nums">{models.length}</div>
          </div>
        </div>
        <div className="p-[1px] rounded-xl bg-gradient-to-b from-[#1E2127] to-[#121418]">
          <div className="bg-[#101216] rounded-[11px] p-3.5 border border-[#1E2127]/50">
            <div className="text-[10px] text-[#6C7380] font-mono uppercase tracking-wider">Playground Active</div>
            <div className="text-xl font-bold text-[#C3E88D] mt-1 font-mono tabular-nums">{visibleCount}</div>
          </div>
        </div>
        <div className="p-[1px] rounded-xl bg-gradient-to-b from-[#1E2127] to-[#121418]">
          <div className="bg-[#101216] rounded-[11px] p-3.5 border border-[#1E2127]/50">
            <div className="text-[10px] text-[#6C7380] font-mono uppercase tracking-wider">Avg Gross Margin</div>
            <div className="text-xl font-bold text-[#C792EA] mt-1 font-mono tabular-nums">+{avgProfitMargin}%</div>
          </div>
        </div>
        <div className="p-[1px] rounded-xl bg-gradient-to-b from-[#1E2127] to-[#121418] col-span-2 md:col-span-1">
          <div className="bg-[#101216] rounded-[11px] p-3.5 border border-[#1E2127]/50">
            <div className="text-[10px] text-[#6C7380] font-mono uppercase tracking-wider">Cloud Engine</div>
            <div className="text-xs font-semibold text-[#82AAFF] mt-2 truncate flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#C3E88D] animate-pulse" />
              Neon PostgreSQL
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between border font-mono transition ${
            statusMessage.type === "success"
              ? "bg-[#C3E88D]/10 border-[#C3E88D]/30 text-[#C3E88D]"
              : "bg-[#F07178]/10 border-[#F07178]/30 text-[#F07178]"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[#C3E88D] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#F07178] shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-[#6C7380] hover:text-[#E6E8EB]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Provider Management Section */}
      <div className="p-[1px] rounded-xl bg-gradient-to-b from-[#1E2127] to-[#121418]">
        <div className="bg-[#101216] rounded-[11px] p-5 space-y-4 border border-[#1E2127]/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-[#E6E8EB] font-mono flex items-center gap-2">
                <span className="text-[#82AAFF]">&gt;</span> Upstream Providers{" "}
                <span className="text-[#6C7380] font-normal text-xs">// GATEWAYS</span>
              </h3>
              <p className="text-xs text-[#9BA1AC] mt-0.5">
                Connect OpenAI, Groq, OpenRouter, DeepSeek, or Anthropic-compatible endpoints.
              </p>
            </div>

            <button
              onClick={() => {
                if (showAddForm) {
                  cancelEdit();
                } else {
                  setShowAddForm(true);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E6E8EB] hover:bg-white text-[#0A0B0D] rounded-lg text-xs font-semibold font-mono transition shadow-sm"
            >
              {showAddForm ? (
                <>
                  <X className="w-3.5 h-3.5" /> Close Form
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" /> Add Provider
                </>
              )}
            </button>
          </div>

          {/* Collapsible Form */}
          {showAddForm && (
            <form
              onSubmit={handleFormSubmit}
              className="bg-[#0A0B0D] border border-[#1E2127] rounded-lg p-4 space-y-3 font-mono"
            >
              <div className="text-xs font-semibold text-[#82AAFF]">
                {editingProviderId ? "/* Edit Provider Config */" : "/* New Provider Configuration */"}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#6C7380] mb-1">
                    Provider Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. OpenAI, Groq, OpenRouter"
                    className="w-full px-3 py-2 bg-[#101216] border border-[#1E2127] rounded-md text-xs text-[#E6E8EB] placeholder-[#4E5562] focus:outline-none focus:border-[#82AAFF]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#6C7380] mb-1">
                    Base URL
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.baseUrl}
                    onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                    placeholder="https://api.openai.com/v1"
                    className="w-full px-3 py-2 bg-[#101216] border border-[#1E2127] rounded-md text-xs text-[#E6E8EB] placeholder-[#4E5562] focus:outline-none focus:border-[#82AAFF]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#6C7380] mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    required={!editingProviderId}
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder={
                      editingProviderId
                        ? "Leave empty to keep existing key"
                        : "sk-..."
                    }
                    className="w-full px-3 py-2 bg-[#101216] border border-[#1E2127] rounded-md text-xs text-[#E6E8EB] placeholder-[#4E5562] focus:outline-none focus:border-[#82AAFF]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#1E2127]">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#9BA1AC]">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded bg-[#101216] border-[#1E2127] text-[#82AAFF] focus:ring-0"
                  />
                  Active Provider Status
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-3 py-1.5 text-xs text-[#6C7380] hover:text-[#E6E8EB]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-4 py-1.5 bg-[#E6E8EB] hover:bg-white text-[#0A0B0D] rounded-md text-xs font-semibold font-mono transition disabled:opacity-50"
                  >
                    {formSubmitting ? "Saving..." : editingProviderId ? "Update Provider" : "Save Provider"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Providers Grid */}
          {providers.length === 0 ? (
            <div className="p-8 text-center text-[#6C7380] border border-dashed border-[#1E2127] rounded-xl font-mono">
              <Server className="w-8 h-8 mx-auto mb-2 text-[#4E5562]" />
              <p className="text-xs">No providers configured yet. Click &quot;Add Provider&quot; above to connect an upstream LLM API.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {providers.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#0A0B0D] border border-[#1E2127] rounded-xl p-3.5 space-y-3 hover:border-[#2A2E37] transition font-mono"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#E6E8EB]">{p.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                            p.isActive
                              ? "bg-[#C3E88D]/10 text-[#C3E88D] border border-[#C3E88D]/30"
                              : "bg-[#1E2127] text-[#6C7380]"
                          }`}
                        >
                          {p.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#6C7380] truncate max-w-[200px] mt-0.5">
                        {p.baseUrl}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(p)}
                        className="p-1 text-[#6C7380] hover:text-[#E6E8EB] rounded hover:bg-[#16181D]"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteProvider(p.id, p.name)}
                        className="p-1 text-[#6C7380] hover:text-[#F07178] rounded hover:bg-[#F07178]/10"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#1E2127] text-[11px]">
                    <span className="text-[#6C7380]">{p.apiKeyMasked}</span>

                    <button
                      onClick={() => syncModels(p.id, p.name)}
                      disabled={syncingId === p.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#16181D] hover:bg-[#1E2127] text-[#82AAFF] border border-[#1E2127] hover:border-[#82AAFF]/40 rounded-md text-xs font-mono transition disabled:opacity-50"
                    >
                      {syncingId === p.id ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin text-[#82AAFF]" />
                          <span>Syncing...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3" />
                          <span>Sync Models</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Models & Pricing Grid */}
      <div className="p-[1px] rounded-xl bg-gradient-to-b from-[#1E2127] to-[#121418]">
        <div className="bg-[#101216] rounded-[11px] p-5 space-y-4 border border-[#1E2127]/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-semibold text-sm text-[#E6E8EB] font-mono flex items-center gap-2">
                <span className="text-[#C792EA]">&gt;</span> Synced Models &amp; Retail Pricing{" "}
                <span className="text-[#6C7380] font-normal text-xs">// TOKEN UNIT RATES</span>
              </h3>
              <p className="text-xs text-[#9BA1AC] mt-0.5">
                Set custom retail rates over provider baseline cost for per-1M tokens.
              </p>
            </div>

            {/* Search, Filter Chips & Provider Selector */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto font-mono">
              {/* Filter Chips */}
              <div className="flex items-center gap-1 bg-[#0A0B0D] p-1 rounded-lg border border-[#1E2127]">
                <button
                  type="button"
                  onClick={() => setModelFilterTab("all")}
                  className={`px-2.5 py-1 rounded text-[11px] transition ${
                    modelFilterTab === "all"
                      ? "bg-[#1E2127] text-[#E6E8EB] font-semibold"
                      : "text-[#6C7380] hover:text-[#E6E8EB]"
                  }`}
                >
                  All ({models.length})
                </button>
                <button
                  type="button"
                  onClick={() => setModelFilterTab("visible")}
                  className={`px-2.5 py-1 rounded text-[11px] transition ${
                    modelFilterTab === "visible"
                      ? "bg-[#C3E88D]/20 text-[#C3E88D] font-semibold"
                      : "text-[#6C7380] hover:text-[#C3E88D]"
                  }`}
                >
                  Active ({visibleCount})
                </button>
                <button
                  type="button"
                  onClick={() => setModelFilterTab("profitable")}
                  className={`px-2.5 py-1 rounded text-[11px] transition ${
                    modelFilterTab === "profitable"
                      ? "bg-[#C792EA]/20 text-[#C792EA] font-semibold"
                      : "text-[#6C7380] hover:text-[#C792EA]"
                  }`}
                >
                  &gt;20% Margin ({profitableCount})
                </button>
              </div>

              {/* Search with Clear */}
              <div className="relative flex-1 sm:w-44">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6C7380]" />
                <input
                  type="text"
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 bg-[#0A0B0D] border border-[#1E2127] rounded-md text-xs text-[#E6E8EB] placeholder-[#4E5562] focus:outline-none focus:border-[#82AAFF]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6C7380] hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sort By Selector */}
              <div className="flex items-center gap-1.5 bg-[#0A0B0D] border border-[#1E2127] rounded-md px-2.5 py-1 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#82AAFF] shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs text-[#E6E8EB] focus:outline-none cursor-pointer font-mono"
                  title="Sort models"
                >
                  <option value="enabled_first" className="bg-[#101216] text-[#E6E8EB]">⚡ Enabled First (Default)</option>
                  <option value="name_asc" className="bg-[#101216] text-[#E6E8EB]">🔤 Name (A → Z)</option>
                  <option value="name_desc" className="bg-[#101216] text-[#E6E8EB]">🔤 Name (Z → A)</option>
                  <option value="margin_desc" className="bg-[#101216] text-[#E6E8EB]">📈 Margin % (High → Low)</option>
                  <option value="retail_desc" className="bg-[#101216] text-[#E6E8EB]">💲 Retail Rate (High → Low)</option>
                  <option value="retail_asc" className="bg-[#101216] text-[#E6E8EB]">💲 Retail Rate (Low → High)</option>
                  <option value="cost_desc" className="bg-[#101216] text-[#E6E8EB]">🏷️ Base Cost (High → Low)</option>
                </select>
              </div>

              <select
                value={selectedProviderFilter}
                onChange={(e) => setSelectedProviderFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-[#0A0B0D] border border-[#1E2127] rounded-md text-xs text-[#9BA1AC] focus:outline-none focus:border-[#82AAFF]"
              >
                <option value="all">All Gateways</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredModels.length === 0 ? (
            <div className="p-8 text-center text-[#6C7380] border border-dashed border-[#1E2127] rounded-xl font-mono">
              <p className="text-xs">No models found. Click &quot;Sync Models&quot; on any active provider above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#1E2127]">
              <table className="w-full text-left text-xs text-[#9BA1AC] font-mono">
                <thead className="bg-[#0A0B0D] text-[#6C7380] uppercase tracking-wider border-b border-[#1E2127] text-[10px]">
                  <tr>
                    <th
                      onClick={() => handleHeaderSortClick("visibility")}
                      className="px-3 py-2.5 cursor-pointer hover:text-[#E6E8EB] select-none transition"
                      title="Click to sort: Enabled First"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Playground</span>
                        {sortBy === "enabled_first" && (
                          <span className="text-[#C3E88D] text-[11px] font-bold">●</span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleHeaderSortClick("name")}
                      className="px-3 py-2.5 cursor-pointer hover:text-[#E6E8EB] select-none transition"
                      title="Click to sort by Name (A-Z / Z-A)"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Custom Name (User UI)</span>
                        {sortBy === "name_asc" && <ArrowUp className="w-3 h-3 text-[#82AAFF]" />}
                        {sortBy === "name_desc" && <ArrowDown className="w-3 h-3 text-[#82AAFF]" />}
                      </div>
                    </th>
                    <th className="px-3 py-2.5">Model ID</th>
                    <th className="px-3 py-2.5">Provider Base ($/1M)</th>
                    <th
                      onClick={() => handleHeaderSortClick("retail")}
                      className="px-3 py-2.5 text-[#82AAFF] cursor-pointer hover:text-[#A6C5FF] select-none transition"
                      title="Click to sort by Retail Rate"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Retail Rate ($/1M)</span>
                        {sortBy === "retail_desc" && <ArrowDown className="w-3 h-3 text-[#82AAFF]" />}
                        {sortBy === "retail_asc" && <ArrowUp className="w-3 h-3 text-[#82AAFF]" />}
                      </div>
                    </th>
                    <th
                      onClick={() => handleHeaderSortClick("margin")}
                      className="px-3 py-2.5 cursor-pointer hover:text-[#E6E8EB] select-none transition"
                      title="Click to sort by Profit Margin"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Margin &amp; Presets</span>
                        {sortBy === "margin_desc" && <ArrowDown className="w-3 h-3 text-[#C792EA]" />}
                        {sortBy === "margin_asc" && <ArrowUp className="w-3 h-3 text-[#C792EA]" />}
                      </div>
                    </th>
                    <th className="px-3 py-2.5 text-right">Save</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2127]/60 bg-[#101216]">
                  {filteredModels.map((m) => {
                    const inputMarkup =
                      m.originalInputPricePerM > 0
                        ? ((m.inputPricePerM - m.originalInputPricePerM) /
                            m.originalInputPricePerM) *
                          100
                        : 0;

                    return (
                      <tr
                        key={m.id}
                        className={`hover:bg-[#16181D]/60 transition ${
                          m.isVisible ? "bg-[#131720]/40" : ""
                        }`}
                      >
                        {/* Visible Toggle */}
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => toggleModelVisibility(m)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                              m.isVisible
                                ? "bg-[#C3E88D]/15 text-[#C3E88D] border border-[#C3E88D]/30"
                                : "bg-[#16181D] text-[#6C7380] border border-[#1E2127]"
                            }`}
                          >
                            {m.isVisible ? (
                              <>
                                <Eye className="w-3 h-3" /> Visible
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" /> Hidden
                              </>
                            )}
                          </button>
                        </td>

                        {/* Custom Display Name Input */}
                        <td className="px-3 py-2.5 font-medium text-[#E6E8EB]">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={m.displayName}
                              onChange={(e) =>
                                updateModelField(m.id, "displayName", e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.currentTarget.blur();
                                  saveModelChanges(m, e.currentTarget.value);
                                }
                              }}
                              onBlur={(e) => saveModelChanges(m, e.target.value)}
                              placeholder="Custom name for user UI..."
                              className="px-2.5 py-1 bg-[#0A0B0D] border border-[#1E2127] focus:border-[#82AAFF] rounded text-xs text-[#E6E8EB] focus:outline-none w-full min-w-[180px] max-w-[260px] transition"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const cleaned = cleanModelName(m.rawModelId);
                                updateModelField(m.id, "displayName", cleaned);
                                saveModelChanges(m, cleaned);
                              }}
                              className="p-1 rounded bg-[#16181D] hover:bg-[#1E2127] text-[#6C7380] hover:text-[#82AAFF] border border-[#1E2127] transition shrink-0"
                              title="Auto-format clean custom name"
                            >
                              <Sparkles className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* Raw ID & Provider */}
                        <td className="px-3 py-2.5">
                          <div className="text-[#E6E8EB] text-[11px] truncate max-w-[150px]">
                            {m.rawModelId}
                          </div>
                          <span className="text-[10px] text-[#6C7380]">
                            {m.provider?.name || "Provider"}
                          </span>
                        </td>

                        {/* Base Cost */}
                        <td className="px-3 py-2.5 text-[11px] tabular-nums text-[#6C7380]">
                          <div className="bg-[#0A0B0D] px-2 py-1 rounded border border-[#1E2127]">
                            <div>In: <span className="text-[#E6E8EB] font-semibold">${m.originalInputPricePerM}</span></div>
                            <div>Out: <span className="text-[#E6E8EB] font-semibold">${m.originalOutputPricePerM}</span></div>
                          </div>
                        </td>

                        {/* Custom Retail Rate */}
                        <td className="px-3 py-2.5 text-[11px] tabular-nums">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-[#82AAFF] w-7 font-medium">In: $</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={m.inputPricePerM}
                                onChange={(e) =>
                                  updateModelField(
                                    m.id,
                                    "inputPricePerM",
                                    e.target.value === "" ? 0 : parseFloat(e.target.value)
                                  )
                                }
                                onBlur={() => saveModelChanges(m)}
                                className="w-16 px-1.5 py-0.5 bg-[#0A0B0D] border border-[#1E2127] rounded text-xs text-[#E6E8EB] focus:outline-none focus:border-[#82AAFF] tabular-nums"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[#82AAFF] w-7 font-medium">Out: $</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={m.outputPricePerM}
                                onChange={(e) =>
                                  updateModelField(
                                    m.id,
                                    "outputPricePerM",
                                    e.target.value === "" ? 0 : parseFloat(e.target.value)
                                  )
                                }
                                onBlur={() => saveModelChanges(m)}
                                className="w-16 px-1.5 py-0.5 bg-[#0A0B0D] border border-[#1E2127] rounded text-xs text-[#E6E8EB] focus:outline-none focus:border-[#82AAFF] tabular-nums"
                              />
                            </div>
                          </div>
                        </td>

                        {/* Margin & Quick Markup Presets */}
                        <td className="px-3 py-2.5 text-[11px] tabular-nums">
                          <div className="space-y-1">
                            <span
                              className={`inline-block px-1.5 py-0.5 text-[9px] font-semibold rounded uppercase ${
                                inputMarkup > 0
                                  ? "bg-[#C3E88D]/10 text-[#C3E88D] border border-[#C3E88D]/30"
                                  : inputMarkup < 0
                                  ? "bg-[#F78C6C]/10 text-[#F78C6C] border border-[#F78C6C]/30"
                                  : "bg-[#16181D] text-[#6C7380] border border-[#1E2127]"
                              }`}
                            >
                              {inputMarkup > 0
                                ? `+${inputMarkup.toFixed(0)}% margin`
                                : inputMarkup < 0
                                ? `${inputMarkup.toFixed(0)}% below`
                                : "At base"}
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => applyMarkupPreset(m, 20)}
                                className="px-1.5 py-0.5 bg-[#0A0B0D] hover:bg-[#16181D] hover:text-[#E6E8EB] border border-[#1E2127] rounded text-[9px] transition text-[#9BA1AC] active:scale-[0.96]"
                              >
                                +20%
                              </button>
                              <button
                                onClick={() => applyMarkupPreset(m, 50)}
                                className="px-1.5 py-0.5 bg-[#0A0B0D] hover:bg-[#16181D] hover:text-[#E6E8EB] border border-[#1E2127] rounded text-[9px] transition text-[#9BA1AC] active:scale-[0.96]"
                              >
                                +50%
                              </button>
                              <button
                                onClick={() => resetToBasePrice(m)}
                                className="px-1.5 py-0.5 bg-[#0A0B0D] hover:bg-[#16181D] hover:text-[#E6E8EB] border border-[#1E2127] rounded text-[9px] transition text-[#9BA1AC] active:scale-[0.96]"
                              >
                                Base
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="px-3 py-2.5 text-right">
                          <button
                            onClick={() => saveModelChanges(m)}
                            disabled={savingModelId === m.id}
                            className="p-1 text-[#6C7380] hover:text-[#82AAFF] hover:bg-[#16181D] rounded transition active:scale-[0.96]"
                            title="Save Changes"
                          >
                            {savingModelId === m.id ? (
                              <Check className="w-4 h-4 text-[#C3E88D]" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
