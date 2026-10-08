"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowUp,
  Square,
  Globe,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  LogOut,
  Download,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Columns2,
} from "lucide-react";
import Link from "next/link";
import CodeBlock from "@/components/CodeBlock";
import { MatrixPrismGlyph } from "@/components/LoginModal";
import InteractiveMascot from "@/components/InteractiveMascot";
import DeepSeekReasoningRow from "./deepseek/DeepSeekReasoningRow";
import DeepSeekToolCallCard from "./deepseek/DeepSeekToolCallCard";
import DeepSeekStatsLine from "./deepseek/DeepSeekStatsLine";
import DeepSeekMarkdown from "./deepseek/DeepSeekMarkdown";
import { OzimaHarnessMark, OzimaHarnessWordmark } from "./deepseek/OzimaHarnessBrand";
import {
  playMessageSentSound,
  playResponseArrivedSound,
  getAudioMuted,
  setAudioMuted,
} from "@/lib/audioFx";

interface PlaygroundModel {
  id: string;
  display_name: string;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  model_id?: string;
  model_name?: string;
  reasoning?: string;
  reasoningDurationMs?: number;
  toolCall?: {
    tool: string;
    query?: string;
    status: "running" | "completed" | "error";
  };
  search_results?: SearchResult[];
  route?: "MODEL" | "WEB_SEARCH";
  routeReason?: string;
  durationMs?: number;
  tokens?: number;
  speedTps?: number;
  isDuel?: boolean;
  modelA_id?: string;
  modelA_name?: string;
  modelA_content?: string;
  modelA_reasoning?: string;
  modelB_id?: string;
  modelB_name?: string;
  modelB_content?: string;
  modelB_reasoning?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

const STARTER_PROMPTS = [
  {
    category: "Full-Stack React",
    title: "Server vs Client Components",
    prompt: "Compare Next.js Server Components vs Client Components in production architecture with caching strategies",
  },
  {
    category: "Real-Time Intel",
    title: "Global Leadership 2026",
    prompt: "Who is the current Prime Minister of Bangladesh and Israel?",
  },
  {
    category: "Quantum Science",
    title: "Topological Qubits",
    prompt: "How topological quantum computing protects quantum qubits from decoherence and environmental noise",
  },
  {
    category: "TypeScript Utility",
    title: "Debounce with Cancel",
    prompt: "Write a production TypeScript debounce utility function with cancelation and generic return typing",
  },
];

interface ClassicUserPlaygroundProps {
  currentUser: {
    id: string;
    email: string;
    name: string;
    role: "USER" | "ADMIN";
    balance?: number;
    status?: string;
  } | null;
  onLogout: () => void;
  onOpenLogin: (type?: "user" | "admin") => void;
}

export default function ClassicUserPlayground({
  currentUser,
  onLogout,
  onOpenLogin,
}: ClassicUserPlaygroundProps) {
  const [models, setModels] = useState<PlaygroundModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ozima_selected_model_id") || "";
    }
    return "";
  });
  const [showModelPicker, setShowModelPicker] = useState(false);

  // Side-by-side comparison mode
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [opponentModelId, setOpponentModelId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ozima_opponent_model_id") || "";
    }
    return "";
  });
  const [showOpponentPicker, setShowOpponentPicker] = useState(false);

  const handleSelectModel = (id: string) => {
    setSelectedModelId(id);
    setShowModelPicker(false);
    try {
      localStorage.setItem("ozima_selected_model_id", id);
    } catch {}
  };

  const handleSelectOpponentModel = (id: string) => {
    setOpponentModelId(id);
    setShowOpponentPicker(false);
    try {
      localStorage.setItem("ozima_opponent_model_id", id);
    } catch {}
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaitingFirstToken, setIsWaitingFirstToken] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Web search routing control
  const [webGroundingMode, setWebGroundingMode] = useState<"auto" | "off">("auto");
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  // History sessions
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [sidebarSearch, setSidebarSearch] = useState("");

  const abortControllerRef = useRef<AbortController | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    if (!sidebarSearch.trim()) return sessions;
    const q = sidebarSearch.toLowerCase();
    return sessions.filter((s) => s.title.toLowerCase().includes(q));
  }, [sessions, sidebarSearch]);

  useEffect(() => {
    fetchModels();
    loadSessionsFromStorage();
    if (typeof window !== "undefined") {
      setSoundEnabled(!getAudioMuted());
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    }
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setAudioMuted(!next);
  };

  // Sync session to localStorage
  useEffect(() => {
    if (messages.length > 0 && currentSessionId) {
      setSessions((prev) => {
        const title = messages[0]?.content.slice(0, 42) || "New Conversation";
        const existingIdx = prev.findIndex((s) => s.id === currentSessionId);
        let updated: ChatSession[];
        if (existingIdx >= 0) {
          updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            title: prev[existingIdx].title || title,
            messages,
            updatedAt: Date.now(),
          };
        } else {
          updated = [
            {
              id: currentSessionId,
              title,
              messages,
              updatedAt: Date.now(),
            },
            ...prev,
          ];
        }
        try {
          localStorage.setItem("matrix_knowledge_sessions", JSON.stringify(updated.slice(0, 30)));
        } catch {}
        return updated;
      });
    }
  }, [messages, currentSessionId]);

  const loadSessionsFromStorage = () => {
    try {
      const stored =
        localStorage.getItem("matrix_knowledge_sessions") ||
        localStorage.getItem("claude_user_chat_sessions");
      if (stored) {
        const parsed: ChatSession[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
          setMessages(parsed[0].messages);
          return;
        }
      }
    } catch {}
    startNewChat();
  };

  const startNewChat = () => {
    const newId = "thread_" + Date.now();
    setCurrentSessionId(newId);
    setMessages([]);
    setErrorMsg(null);
    setSearchStatus(null);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const switchSession = (session: ChatSession) => {
    if (isStreaming) return;
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setErrorMsg(null);
    setSearchStatus(null);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const filtered = sessions.filter((s) => s.id !== id);
    setSessions(filtered);
    try {
      localStorage.setItem("matrix_knowledge_sessions", JSON.stringify(filtered));
    } catch {}
    if (currentSessionId === id) {
      if (filtered.length > 0) {
        setCurrentSessionId(filtered[0].id);
        setMessages(filtered[0].messages);
      } else {
        startNewChat();
      }
    }
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming, isWaitingFirstToken]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [inputPrompt]);

  const fetchModels = async () => {
    try {
      const res = await fetch("/api/playground/models");
      if (res.ok) {
        const raw: any = await res.json();
        const data: PlaygroundModel[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.models)
          ? raw.models
          : [];
        setModels(data);
        if (data.length > 0) {
          const savedModelId = typeof window !== "undefined" ? localStorage.getItem("ozima_selected_model_id") : "";
          const matchedSaved = data.find((m) => m.id === savedModelId);

          let activeId = "";
          if (matchedSaved) {
            activeId = matchedSaved.id;
            setSelectedModelId(matchedSaved.id);
          } else {
            const currentMatched = data.find((m) => m.id === selectedModelId);
            if (currentMatched) {
              activeId = currentMatched.id;
            } else {
              const preferred =
                data.find((m) => m.display_name?.toLowerCase().includes("sonnet")) ||
                data.find((m) => m.display_name?.toLowerCase().includes("r1")) ||
                data.find((m) => m.display_name?.toLowerCase().includes("gpt-4o")) ||
                data[0];
              activeId = preferred.id;
              setSelectedModelId(preferred.id);
              try {
                localStorage.setItem("ozima_selected_model_id", preferred.id);
              } catch {}
            }
          }

          const savedOpponentId = typeof window !== "undefined" ? localStorage.getItem("ozima_opponent_model_id") : "";
          const matchedOpponent = data.find((m) => m.id === savedOpponentId && m.id !== activeId);
          if (matchedOpponent) {
            setOpponentModelId(matchedOpponent.id);
          } else {
            const currentOpponentMatched = data.find((m) => m.id === opponentModelId && m.id !== activeId);
            if (currentOpponentMatched) {
              setOpponentModelId(currentOpponentMatched.id);
            } else {
              const opponent = data.find((m) => m.id !== activeId) || data[1] || data[0];
              if (opponent) {
                setOpponentModelId(opponent.id);
                try {
                  localStorage.setItem("ozima_opponent_model_id", opponent.id);
                } catch {}
              }
            }
          }
        }
      }
    } catch {
      setErrorMsg("Unable to load models");
    }
  };

  const selectedModel = Array.isArray(models) ? models.find((m) => m.id === selectedModelId) : undefined;
  const opponentModel = Array.isArray(models) ? models.find((m) => m.id === opponentModelId) : undefined;

  const handleSendMessage = async (customPrompt?: string) => {
    const text = (customPrompt || inputPrompt).trim();
    if (!text || isStreaming || !selectedModelId) return;

    setErrorMsg(null);
    setSearchStatus(null);
    setInputPrompt("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    if (!currentSessionId) {
      setCurrentSessionId("thread_" + Date.now());
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    const assistantMsgId = (Date.now() + 1).toString();
    const isCompareActive = isCompareMode && !!opponentModelId && opponentModelId !== selectedModelId;

    const assistantMessage: Message = isCompareActive
      ? {
          id: assistantMsgId,
          role: "assistant",
          content: "",
          isDuel: true,
          modelA_id: selectedModelId,
          modelA_name: selectedModel?.display_name || "Model A",
          modelA_content: "",
          modelB_id: opponentModelId,
          modelB_name: opponentModel?.display_name || "Model B",
          modelB_content: "",
        }
      : {
          id: assistantMsgId,
          role: "assistant",
          content: "",
          model_id: selectedModelId,
          model_name: selectedModel?.display_name || "Ozima AI",
        };

    const updatedMessages = [...messages, userMessage];
    setMessages([...updatedMessages, assistantMessage]);
    setIsStreaming(true);
    setIsWaitingFirstToken(true);
    playMessageSentSound();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const allowWebSearch = webGroundingMode === "auto";

    if (isCompareActive) {
      let accA = "";
      let accReasoningA = "";
      let accB = "";
      let accReasoningB = "";

      const fetchStreamA = async () => {
        try {
          const resA = await fetch("/api/playground/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: abortController.signal,
            body: JSON.stringify({
              model_id: selectedModelId,
              messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
              web_search: allowWebSearch,
            }),
          });
          if (!resA.ok || !resA.body) {
            accA = "*(Response unavailable)*";
            setMessages((prev) => {
              const copy = [...prev];
              const target = copy.find((m) => m.id === assistantMsgId);
              if (target) target.modelA_content = accA;
              return copy;
            });
            return;
          }
          const readerA = resA.body.getReader();
          const decoderA = new TextDecoder();
          let bufA = "";
          while (true) {
            const { done, value } = await readerA.read();
            if (done) break;
            bufA += decoderA.decode(value, { stream: true });
            const lines = bufA.split("\n");
            bufA = lines.pop() || "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const dataStr = trimmed.replace(/^data:\s*/, "");
              if (dataStr === "[DONE]") continue;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.type === "reasoning" || parsed.reasoning) {
                  accReasoningA += parsed.content || parsed.reasoning || "";
                  setMessages((prev) => {
                    const copy = [...prev];
                    const target = copy.find((m) => m.id === assistantMsgId);
                    if (target) target.modelA_reasoning = accReasoningA;
                    return copy;
                  });
                }
                const tok = parsed.content || parsed.text || "";
                if ((parsed.type === "token" || parsed.type === "text" || !parsed.type) && tok && !parsed.reasoning) {
                  accA += tok;
                  setMessages((prev) => {
                    const copy = [...prev];
                    const target = copy.find((m) => m.id === assistantMsgId);
                    if (target) target.modelA_content = accA;
                    return copy;
                  });
                }
              } catch {}
            }
          }
        } catch (err: any) {
          if (err.name !== "AbortError") {
            accA += "\n\n*(Error generating response)*";
            setMessages((prev) => {
              const copy = [...prev];
              const target = copy.find((m) => m.id === assistantMsgId);
              if (target) target.modelA_content = accA;
              return copy;
            });
          }
        }
      };

      const fetchStreamB = async () => {
        try {
          const resB = await fetch("/api/playground/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: abortController.signal,
            body: JSON.stringify({
              model_id: opponentModelId,
              messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
              web_search: allowWebSearch,
            }),
          });
          if (!resB.ok || !resB.body) {
            accB = "*(Response unavailable)*";
            setMessages((prev) => {
              const copy = [...prev];
              const target = copy.find((m) => m.id === assistantMsgId);
              if (target) target.modelB_content = accB;
              return copy;
            });
            return;
          }
          const readerB = resB.body.getReader();
          const decoderB = new TextDecoder();
          let bufB = "";
          while (true) {
            const { done, value } = await readerB.read();
            if (done) break;
            bufB += decoderB.decode(value, { stream: true });
            const lines = bufB.split("\n");
            bufB = lines.pop() || "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const dataStr = trimmed.replace(/^data:\s*/, "");
              if (dataStr === "[DONE]") continue;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.type === "reasoning" || parsed.reasoning) {
                  accReasoningB += parsed.content || parsed.reasoning || "";
                  setMessages((prev) => {
                    const copy = [...prev];
                    const target = copy.find((m) => m.id === assistantMsgId);
                    if (target) target.modelB_reasoning = accReasoningB;
                    return copy;
                  });
                }
                const tok = parsed.content || parsed.text || "";
                if ((parsed.type === "token" || parsed.type === "text" || !parsed.type) && tok && !parsed.reasoning) {
                  accB += tok;
                  setMessages((prev) => {
                    const copy = [...prev];
                    const target = copy.find((m) => m.id === assistantMsgId);
                    if (target) target.modelB_content = accB;
                    return copy;
                  });
                }
              } catch {}
            }
          }
        } catch (err: any) {
          if (err.name !== "AbortError") {
            accB += "\n\n*(Error generating response)*";
            setMessages((prev) => {
              const copy = [...prev];
              const target = copy.find((m) => m.id === assistantMsgId);
              if (target) target.modelB_content = accB;
              return copy;
            });
          }
        }
      };

      try {
        setIsWaitingFirstToken(false);
        await Promise.allSettled([fetchStreamA(), fetchStreamB()]);
        playResponseArrivedSound();
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setErrorMsg(err.message || "Failed to complete comparison stream");
        }
      } finally {
        setIsStreaming(false);
        setIsWaitingFirstToken(false);
        setSearchStatus(null);
        abortControllerRef.current = null;
      }
      return;
    }

    let streamStartTime = Date.now();
    let accumulated = "";

    try {
      const res = await fetch("/api/playground/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          model_id: selectedModelId,
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          web_search: allowWebSearch,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      if (!res.body) throw new Error("No response body received");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      streamStartTime = Date.now();
      let streamBuffer = "";
      accumulated = "";
      let accumulatedReasoning = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split("\n");
        streamBuffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const dataStr = trimmed.replace(/^data:\s*/, "");
          if (dataStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(dataStr);

            if (parsed.type === "intent") {
              if (parsed.route === "WEB_SEARCH") {
                setSearchStatus("Searching live web sources...");
              } else {
                setSearchStatus(null);
              }
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && last.role === "assistant") {
                  last.route = parsed.route;
                  last.routeReason = parsed.reason;
                }
                return copy;
              });
            } else if (parsed.type === "tool_call") {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && last.role === "assistant") {
                  last.toolCall = {
                    tool: parsed.tool || parsed.name || "web_search",
                    query: parsed.args?.query || parsed.query,
                    status: parsed.status || "completed",
                  };
                  if (parsed.results) {
                    last.search_results = parsed.results;
                  }
                }
                return copy;
              });
            } else if (parsed.type === "search" && parsed.results) {
              setSearchStatus(null);
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && last.role === "assistant") {
                  last.search_results = parsed.results;
                }
                return copy;
              });
            } else if (parsed.type === "reasoning" || parsed.reasoning) {
              const reasoningChunk = parsed.content || parsed.reasoning || "";
              if (reasoningChunk) {
                setIsWaitingFirstToken(false);
                accumulatedReasoning += reasoningChunk;
                setMessages((prev) => {
                  const copy = [...prev];
                  const last = copy[copy.length - 1];
                  if (last && last.role === "assistant") {
                    last.reasoning = accumulatedReasoning;
                    last.reasoningDurationMs = Date.now() - streamStartTime;
                  }
                  return copy;
                });
              }
            } else if (parsed.type === "token" || parsed.content || parsed.text) {
              const tokenText = parsed.content || parsed.text || "";
              if (tokenText && !parsed.reasoning) {
                if (isWaitingFirstToken) {
                  playResponseArrivedSound();
                }
                setIsWaitingFirstToken(false);
                setSearchStatus(null);
                accumulated += tokenText;
                setMessages((prev) => {
                  const copy = [...prev];
                  const last = copy[copy.length - 1];
                  if (last && last.role === "assistant") {
                    last.content = accumulated;
                    last.durationMs = Date.now() - streamStartTime;
                  }
                  return copy;
                });
              }
            } else if (parsed.type === "usage" && parsed.usage) {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && last.role === "assistant") {
                  if (parsed.usage.search_results) {
                    last.search_results = parsed.usage.search_results;
                  }
                  if (parsed.usage.completion_tokens) {
                    last.tokens = parsed.usage.completion_tokens;
                  }
                }
                return copy;
              });
            } else if (parsed.type === "error") {
              setErrorMsg(parsed.error || "Generation error");
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setErrorMsg(err.message || "Failed to generate response");
      }
    } finally {
      setIsStreaming(false);
      setIsWaitingFirstToken(false);
      setSearchStatus(null);
      abortControllerRef.current = null;
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last && last.role === "assistant") {
          if (!last.durationMs) {
            last.durationMs = Date.now() - (streamStartTime || Date.now());
          }
          if (!last.tokens && accumulated) {
            last.tokens = Math.round(accumulated.length / 4);
          }
        }
        return copy;
      });
    }
  };

  const handleToggleSpeech = (msgId: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const clean = text
      .replace(/```[\s\S]*?```/g, "Code block omitted.")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[*_#~>\[\]]/g, "")
      .replace(/\(.*?\)/g, "");
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);
    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleRegenerate = (msgIndex: number) => {
    if (isStreaming) return;
    let userPrompt = "";
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        userPrompt = messages[i].content;
        break;
      }
    }
    if (!userPrompt) return;
    const sliced = messages.slice(0, msgIndex);
    setMessages(sliced);
    handleSendMessage(userPrompt);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    const content = messages
      .map(
        (m) =>
          `### ${m.role === "user" ? "Inquiry" : "Response"}\n\n${m.content || (m.isDuel ? `**${m.modelA_name}**:\n${m.modelA_content}\n\n**${m.modelB_name}**:\n${m.modelB_content}` : "")}\n`
      )
      .join("\n---\n\n");
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSourceExpansion = (msgId: string) => {
    setExpandedSources((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  return (
    <div className="flex h-full w-full bg-[#0B0C0E] text-[#EDEDED] relative overflow-hidden font-sans">
      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Clean Distraction-Free History Sidebar */}
      <aside
        className={`bg-[#090A0D] border-r border-white/[0.06] flex flex-col justify-between transition-all duration-200 ease-out shrink-0 ${
          isSidebarOpen
            ? "fixed inset-y-0 left-0 z-50 w-72 md:relative md:w-64 md:z-40 shadow-2xl md:shadow-none translate-x-0"
            : "w-0 -translate-x-full overflow-hidden"
        }`}
      >
        <div className="p-3 flex flex-col gap-2 overflow-hidden h-full">
          {/* Header with DeepSeek Harness Wordmark */}
          <div className="flex items-center justify-between px-2 py-1.5">
            <OzimaHarnessWordmark size={22} />
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EDEDED] hover:bg-white/[0.04] transition"
              title="Close sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* DeepSeek Harness Workspace Pill */}
          <div className="px-2.5 py-1.5 rounded-xl bg-[#101420] border border-[#2979FF]/20 flex items-center justify-between text-[11px] font-mono text-[#8E9CAE]">
            <span className="truncate flex items-center gap-1.5 text-cyan-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Workspace</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Ozima Core</span>
          </div>

          {/* New Chat Button */}
          <button
            onClick={startNewChat}
            className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium text-[#EDEDED] bg-[#141926] border border-[#2979FF]/25 hover:border-[#2979FF]/50 hover:bg-[#1B2234] transition active:scale-[0.98] shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#2979FF]" />
              <span>New Session</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#0D101A] border border-white/10 text-slate-400">
              ⌘N
            </kbd>
          </button>

          {/* Search Library Filter */}
          {sessions.length > 2 && (
            <div className="relative px-1 pt-1">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search history..."
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                className="w-full bg-[#11131A] border border-white/[0.06] rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-[#EDEDED] placeholder-[#64748B] focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          )}

          {/* History List */}
          <div className="flex-1 overflow-y-auto space-y-0.5 mt-2 pr-1">
            <div className="text-[10px] font-medium text-[#64748B] px-2 py-1 uppercase tracking-wider">
              Recent Conversations
            </div>
            {filteredSessions.length === 0 ? (
              <div className="px-2 py-6 text-center text-xs text-[#64748B]">
                {sidebarSearch ? "No matches." : "No saved chats."}
              </div>
            ) : (
              filteredSessions.map((s) => {
                const isActive = s.id === currentSessionId;
                return (
                  <div
                    key={s.id}
                    onClick={() => switchSession(s)}
                    className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition ${
                      isActive
                        ? "bg-[#161822] text-[#EDEDED] font-medium border border-white/[0.08]"
                        : "text-[#8E9CAE] hover:bg-[#11131A] hover:text-[#EDEDED]"
                    }`}
                  >
                    <span className="truncate flex-1 pr-2">{s.title || "Conversation"}</span>
                    <button
                      onClick={(e) => deleteSession(e, s.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#64748B] hover:text-[#EF4444] transition rounded"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer User Profile */}
          <div className="pt-2 border-t border-white/[0.06]">
            {currentUser ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#11131A] border border-white/[0.06]">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-medium text-xs flex items-center justify-center">
                    {currentUser.name ? currentUser.name[0].toUpperCase() : "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-[#EDEDED] truncate">
                      {currentUser.name || currentUser.email}
                    </div>
                    <div className="text-[10px] text-[#64748B] uppercase font-mono">
                      {currentUser.role}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1 rounded text-[#64748B] hover:text-[#EF4444] transition"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onOpenLogin("user")}
                className="w-full py-2 rounded-xl bg-[#13151D] hover:bg-[#1A1D28] border border-white/[0.06] text-xs font-medium text-[#EDEDED] transition text-center"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Reading & Input Column */}
      <div className="flex-1 flex flex-col h-full bg-[#0B0C0E] text-[#EDEDED] relative overflow-hidden">
        {/* Sleek Minimalist Top Header */}
        <header className="h-12 border-b border-white/[0.06] bg-[#0B0C0E]/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 min-w-0">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EDEDED] hover:bg-white/[0.04] transition shrink-0"
                title="Open sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}

            {/* Header Brand Badge */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#121624] border border-[#2979FF]/25 text-xs shadow-sm">
              <OzimaHarnessMark size={16} />
              <span className="font-semibold text-white tracking-tight">Ozima AI</span>
              <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase bg-[#182848] text-[#4FACFE]">
                HARNESS
              </span>
            </div>
          </div>

          {/* Right Header Navigation */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Compare Toggle Button */}
            <button
              onClick={() => setIsCompareMode(!isCompareMode)}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition ${
                isCompareMode
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                  : "bg-transparent border-transparent text-[#8E9CAE] hover:text-[#EDEDED] hover:bg-white/[0.04]"
              }`}
              title="Compare two models side-by-side"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compare</span>
            </button>

            {/* Audio Mute/Unmute */}
            <button
              onClick={toggleSound}
              className={`p-1.5 rounded-lg transition ${
                soundEnabled
                  ? "text-[#8E9CAE] hover:text-[#EDEDED] hover:bg-white/[0.04]"
                  : "text-[#EF4444]/70 hover:text-[#EF4444] hover:bg-white/[0.04]"
              }`}
              title={soundEnabled ? "Mute audio cues" : "Unmute audio cues"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {messages.length > 0 && (
              <>
                <button
                  onClick={handleExportChat}
                  className="p-1.5 rounded-lg text-[#8E9CAE] hover:text-[#EDEDED] hover:bg-white/[0.04] transition"
                  title="Export markdown"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={startNewChat}
                  className="p-1.5 rounded-lg text-[#8E9CAE] hover:text-[#EDEDED] hover:bg-white/[0.04] transition"
                  title="New chat"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}

            {currentUser && (
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141620] border border-white/[0.08] text-xs font-mono text-emerald-400"
                title="User available credits"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>${typeof currentUser.balance === "number" ? currentUser.balance.toFixed(2) : "25.00"}</span>
              </div>
            )}

            {currentUser?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="px-2.5 py-1 rounded-lg bg-[#141620] border border-cyan-500/30 text-xs text-cyan-400 hover:border-cyan-400 transition flex items-center gap-1.5 ml-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
          </div>
        </header>

        {/* Content Canvas */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* DeepSeek Harness Signature Hero State with Ozima AI Branding */
            <div className="min-h-full flex flex-col items-center justify-center max-w-2xl mx-auto px-4 py-8 sm:py-12 text-center relative">
              <div className="mb-4 flex flex-col items-center">
                <div className="relative mb-3 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-[#2979FF]/20 filter blur-xl animate-pulse" />
                  <OzimaHarnessMark size={52} className="relative z-10 filter drop-shadow-[0_0_22px_rgba(41,121,255,0.45)]" />
                </div>
                <InteractiveMascot
                  variant="hero"
                  status={isStreaming ? "streaming" : searchStatus ? "searching" : "idle"}
                />
              </div>

              <div className="mb-6 flex flex-col items-center">
                <h1 className="text-2xl sm:text-3xl font-bold font-sans text-white tracking-tight flex items-center gap-2 justify-center">
                  <span>Ozima AI</span>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold tracking-wider uppercase bg-[#182848] text-[#4FACFE] border border-cyan-500/30">
                    HARNESS
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-[#8E9CAE] mt-1.5 max-w-md">
                  Autonomous Multi-Model Agent Harness with Deep Reasoning, Tool Execution & Live Web Grounding.
                </p>
              </div>

              {/* Clean Omni-Search Input */}
              <div className="w-full mb-6 text-left">
                <div className="bg-[#101420]/95 border border-white/[0.08] focus-within:border-[#2979FF]/50 focus-within:ring-2 focus-within:ring-[#2979FF]/20 rounded-2xl p-3 shadow-xl transition duration-200">
                  <textarea
                    rows={2}
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={
                      isCompareMode
                        ? `Compare ${selectedModel?.display_name || "Model A"} vs ${opponentModel?.display_name || "Model B"}...`
                        : "Ask a question, analyze code, or explore ideas..."
                    }
                    className="w-full bg-transparent px-2 text-sm text-[#EDEDED] placeholder-[#5A6578] focus:outline-none resize-none leading-relaxed"
                  />

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] mt-1 px-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Clean Model Selector - Just Model Name */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowModelPicker(!showModelPicker)}
                          className="px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 transition border border-white/[0.08] bg-[#161822] hover:bg-[#1C1F2C] text-[#EDEDED] font-medium"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="truncate max-w-[120px] sm:max-w-[180px]">
                            {selectedModel ? selectedModel.display_name : "Select Model"}
                          </span>
                          <ChevronDown className="w-3 h-3 text-[#717E91]" />
                        </button>

                        {showModelPicker && (
                          <div className="absolute left-0 top-full mt-1.5 w-64 sm:w-72 rounded-2xl border border-white/[0.08] bg-[#12141C] p-2 shadow-2xl z-50 animate-fade-in backdrop-blur-xl">
                            <div className="text-[10px] uppercase font-mono text-[#717E91] px-2.5 py-1 font-semibold border-b border-white/[0.04] mb-1">
                              Choose Model
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-0.5">
                              {models.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => handleSelectModel(m.id)}
                                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition flex items-center justify-between ${
                                    selectedModelId === m.id
                                      ? "bg-cyan-500/10 text-cyan-400 font-semibold"
                                      : "text-[#EDEDED] hover:bg-white/[0.04]"
                                  }`}
                                >
                                  <span className="truncate">{m.display_name}</span>
                                  {selectedModelId === m.id && (
                                    <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Compare Model B Selector (when Compare Mode is active) */}
                      {isCompareMode && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowOpponentPicker(!showOpponentPicker)}
                            className="px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 transition border border-purple-500/30 bg-[#161822] hover:bg-[#1C1F2C] text-purple-300 font-medium"
                          >
                            <span className="text-[10px] font-mono text-purple-400">vs</span>
                            <span className="truncate max-w-[100px] sm:max-w-[150px]">
                              {opponentModel ? opponentModel.display_name : "Model B"}
                            </span>
                            <ChevronDown className="w-3 h-3 text-purple-400/60" />
                          </button>

                          {showOpponentPicker && (
                            <div className="absolute left-0 top-full mt-1.5 w-64 sm:w-72 rounded-2xl border border-white/[0.08] bg-[#12141C] p-2 shadow-2xl z-50 animate-fade-in backdrop-blur-xl">
                              <div className="text-[10px] uppercase font-mono text-purple-400 px-2.5 py-1 font-semibold border-b border-white/[0.04] mb-1">
                                Comparison Model
                              </div>
                              <div className="max-h-60 overflow-y-auto space-y-0.5">
                                {models.map((m) => (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => handleSelectOpponentModel(m.id)}
                                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition flex items-center justify-between ${
                                      opponentModelId === m.id
                                        ? "bg-purple-500/10 text-purple-300 font-semibold"
                                        : "text-[#EDEDED] hover:bg-white/[0.04]"
                                    }`}
                                  >
                                    <span className="truncate">{m.display_name}</span>
                                    {opponentModelId === m.id && (
                                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setWebGroundingMode(webGroundingMode === "auto" ? "off" : "auto")}
                        className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 transition border ${
                          webGroundingMode === "auto"
                            ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                            : "border-white/[0.06] text-[#64748B] hover:text-[#EDEDED]"
                        }`}
                        title={webGroundingMode === "auto" ? "Intelligent search routing enabled" : "Search disabled (model weights only)"}
                      >
                        <Globe className={`w-3.5 h-3.5 ${webGroundingMode === "auto" ? "text-cyan-400" : ""}`} />
                        <span>{webGroundingMode === "auto" ? "Auto Search" : "Search Off"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsCompareMode(!isCompareMode)}
                        className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 transition border ${
                          isCompareMode
                            ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                            : "border-white/[0.06] text-[#64748B] hover:text-[#EDEDED]"
                        }`}
                      >
                        <Columns2 className="w-3.5 h-3.5" />
                        <span>Compare</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSendMessage()}
                      disabled={!inputPrompt.trim() || !selectedModelId}
                      className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#2979FF] hover:bg-[#1E6FFF] text-white font-semibold text-xs disabled:opacity-30 transition flex items-center gap-1 shadow-md hover:shadow-[#2979FF]/30 active:scale-[0.96]"
                    >
                      <span className="hidden sm:inline">{isCompareMode ? "Compare" : "Run"}</span>
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Clean Starter Prompt Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                {STARTER_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="p-3 rounded-xl border border-white/[0.06] bg-[#111319] hover:bg-[#161922] hover:border-white/[0.12] transition-all duration-150 flex flex-col justify-between group cursor-pointer text-left"
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className="text-[10px] text-[#64748B] group-hover:text-cyan-400 transition font-mono uppercase tracking-wider">
                        {item.category}
                      </span>
                      <span className="text-[10px] text-[#556377] group-hover:text-[#EDEDED] transition font-mono">
                        ↵
                      </span>
                    </div>
                    <div className="text-xs font-medium text-[#EDEDED] mt-1.5 group-hover:text-white transition">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-[#717E91] line-clamp-1 mt-0.5">
                      {item.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Conversation Thread */
            <div
              className={`mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 ${
                isCompareMode ? "max-w-5xl" : "max-w-3xl"
              }`}
            >
              {messages.map((msg, idx) => {
                if (msg.role === "user") {
                  return (
                    <div key={msg.id} className="flex justify-end pt-1">
                      <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl bg-[#161822] border border-white/[0.07] px-4 py-2.5 text-[14.5px] text-[#EDEDED] leading-relaxed shadow-sm">
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                // Side-by-side Dual Comparison Response
                if (msg.isDuel) {
                  return (
                    <div key={msg.id} className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-[#717E91] px-1">
                        <span className="font-mono text-[11px] text-[#8E9CAE]">
                          Comparison · {msg.modelA_name} vs {msg.modelB_name}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {/* Model A Column */}
                        <div className="rounded-2xl border border-white/[0.08] bg-[#111319] p-4 flex flex-col justify-between shadow-lg">
                          <div>
                            <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/[0.06]">
                              <span className="text-xs font-semibold text-[#EDEDED]">
                                {msg.modelA_name}
                              </span>
                              <div className="flex items-center gap-1">
                                {msg.modelA_content && (
                                  <>
                                    <button
                                      onClick={() => handleToggleSpeech(msg.id + "_A", msg.modelA_content || "")}
                                      className="p-1 rounded text-[#64748B] hover:text-[#EDEDED] transition"
                                      title="Read aloud"
                                    >
                                      <Volume2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleCopy(msg.modelA_content || "", msg.id + "_A")}
                                      className="p-1 rounded text-[#64748B] hover:text-[#EDEDED] transition"
                                      title="Copy response"
                                    >
                                      {copiedId === msg.id + "_A" ? (
                                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {!msg.modelA_content && !msg.modelA_reasoning && isStreaming ? (
                              <div className="py-6 flex items-center justify-center gap-2 text-xs text-cyan-400/80 animate-pulse font-mono">
                                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                                <span>Generating response...</span>
                              </div>
                            ) : (
                              <DeepSeekMarkdown
                                content={msg.modelA_content || ""}
                                reasoning={msg.modelA_reasoning}
                                isStreaming={isStreaming && idx === messages.length - 1}
                              />
                            )}
                          </div>
                        </div>

                        {/* Model B Column */}
                        <div className="rounded-2xl border border-white/[0.08] bg-[#111319] p-4 flex flex-col justify-between shadow-lg">
                          <div>
                            <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/[0.06]">
                              <span className="text-xs font-semibold text-[#EDEDED]">
                                {msg.modelB_name}
                              </span>
                              <div className="flex items-center gap-1">
                                {msg.modelB_content && (
                                  <>
                                    <button
                                      onClick={() => handleToggleSpeech(msg.id + "_B", msg.modelB_content || "")}
                                      className="p-1 rounded text-[#64748B] hover:text-[#EDEDED] transition"
                                      title="Read aloud"
                                    >
                                      <Volume2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleCopy(msg.modelB_content || "", msg.id + "_B")}
                                      className="p-1 rounded text-[#64748B] hover:text-[#EDEDED] transition"
                                      title="Copy response"
                                    >
                                      {copiedId === msg.id + "_B" ? (
                                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {!msg.modelB_content && !msg.modelB_reasoning && isStreaming ? (
                              <div className="py-6 flex items-center justify-center gap-2 text-purple-400/80 animate-pulse font-mono">
                                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                                <span>Generating response...</span>
                              </div>
                            ) : (
                              <DeepSeekMarkdown
                                content={msg.modelB_content || ""}
                                reasoning={msg.modelB_reasoning}
                                isStreaming={isStreaming && idx === messages.length - 1}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Single Assistant Response
                return (
                  <div key={msg.id} className="group space-y-3">
                    {/* Header line with model info & tools */}
                    <div className="flex items-center justify-between text-xs text-[#717E91]">
                      <div className="flex items-center gap-2 font-medium">
                        <OzimaHarnessMark size={16} />
                        <span className="text-[#EDEDED] font-semibold">
                          {msg.model_name || selectedModel?.display_name || "Ozima AI"}
                        </span>
                        {msg.route === "WEB_SEARCH" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 font-mono">
                            Live Grounded
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-500">
                          dsh-agent
                        </span>
                      </div>

                      {/* Action Controls */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {msg.content && typeof window !== "undefined" && "speechSynthesis" in window && (
                          <button
                            onClick={() => handleToggleSpeech(msg.id, msg.content)}
                            className={`p-1.5 rounded-lg transition flex items-center gap-1 ${
                              speakingMessageId === msg.id
                                ? "text-cyan-400 bg-cyan-500/10"
                                : "text-[#64748B] hover:text-[#EDEDED] hover:bg-white/[0.04]"
                            }`}
                            title={speakingMessageId === msg.id ? "Stop Speaking" : "Read Aloud"}
                          >
                            {speakingMessageId === msg.id ? (
                              <>
                                <Square className="w-3 h-3 fill-current text-cyan-400" />
                                <span className="text-[11px] text-cyan-400">Stop</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5" />
                                <span className="text-[11px]">Listen</span>
                              </>
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => handleRegenerate(idx)}
                          disabled={isStreaming}
                          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EDEDED] hover:bg-white/[0.04] transition flex items-center gap-1 disabled:opacity-30"
                          title="Regenerate response"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Retry</span>
                        </button>

                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EDEDED] hover:bg-white/[0.04] transition flex items-center gap-1"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="text-[11px] text-cyan-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* DeepSeek Agent Tool Execution Card */}
                    {(msg.toolCall || (msg.search_results && msg.search_results.length > 0)) && (
                      <DeepSeekToolCallCard
                        toolName={msg.toolCall?.tool || "web_search"}
                        query={msg.toolCall?.query}
                        status={msg.toolCall?.status || (isWaitingFirstToken ? "running" : "completed")}
                        results={msg.search_results}
                      />
                    )}

                    {/* Waiting State Feedback */}
                    {!msg.content && !msg.reasoning && isWaitingFirstToken && (
                      <div className="flex items-center gap-2 py-2 text-xs text-[#717E91]">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        <span>{searchStatus || "Thinking..."}</span>
                      </div>
                    )}

                    {/* DeepSeek Reasoning & Markdown Body */}
                    {(msg.content || msg.reasoning) && (
                      <DeepSeekMarkdown
                        content={msg.content}
                        reasoning={msg.reasoning}
                        isStreaming={isStreaming && idx === messages.length - 1}
                        reasoningDurationMs={msg.reasoningDurationMs}
                      />
                    )}

                    {/* DeepSeek Turn Metrics Strip */}
                    <DeepSeekStatsLine
                      modelName={msg.model_name || selectedModel?.display_name}
                      durationMs={msg.durationMs}
                      tokens={msg.tokens}
                      speedTps={msg.speedTps}
                      route={msg.route}
                    />
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="max-w-3xl mx-auto w-full px-4 mb-2">
            <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-[#F87171] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1">{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Grounded Bottom Input Bar (when thread is active) */}
        {messages.length > 0 && (
          <div className="p-3 sm:p-4 bg-gradient-to-t from-[#0B0C0E] via-[#0B0C0E] to-transparent sticky bottom-0 z-20">
            <div className={isCompareMode ? "max-w-5xl mx-auto w-full" : "max-w-3xl mx-auto w-full"}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="bg-[#101420]/95 border border-white/[0.08] focus-within:border-[#2979FF]/50 focus-within:ring-2 focus-within:ring-[#2979FF]/20 rounded-2xl p-2.5 sm:p-3 transition flex flex-col gap-2 shadow-2xl"
              >
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    isCompareMode
                      ? `Compare ${selectedModel?.display_name || "Model A"} vs ${opponentModel?.display_name || "Model B"}...`
                      : "Ask a follow-up, request code revision, or explore..."
                  }
                  disabled={isStreaming}
                  className="w-full bg-transparent px-2 text-sm text-[#EDEDED] placeholder-[#5A6578] focus:outline-none resize-none max-h-40 leading-relaxed"
                />

                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Clean Footer Model Selector - Just Model Name */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowModelPicker(!showModelPicker)}
                        className="px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 transition border border-white/[0.08] bg-[#161822] hover:bg-[#1C1F2C] text-[#EDEDED] font-medium"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="truncate max-w-[120px] sm:max-w-[180px]">
                          {selectedModel ? selectedModel.display_name : "Select Model"}
                        </span>
                        <ChevronDown className="w-3 h-3 text-[#717E91]" />
                      </button>

                      {showModelPicker && (
                        <div className="absolute left-0 bottom-full mb-2 w-64 sm:w-72 rounded-2xl border border-white/[0.08] bg-[#12141C] p-2 shadow-2xl z-50 animate-fade-in backdrop-blur-xl">
                          <div className="text-[10px] uppercase font-mono text-[#717E91] px-2.5 py-1 font-semibold border-b border-white/[0.04] mb-1">
                            Choose Model
                          </div>
                          <div className="max-h-60 overflow-y-auto space-y-0.5">
                            {models.map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => handleSelectModel(m.id)}
                                className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition flex items-center justify-between ${
                                  selectedModelId === m.id
                                    ? "bg-cyan-500/10 text-cyan-400 font-semibold"
                                    : "text-[#EDEDED] hover:bg-white/[0.04]"
                                }`}
                              >
                                <span className="truncate">{m.display_name}</span>
                                {selectedModelId === m.id && (
                                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Compare Model B Selector (when Compare Mode is active) */}
                    {isCompareMode && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowOpponentPicker(!showOpponentPicker)}
                          className="px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 transition border border-purple-500/30 bg-[#161822] hover:bg-[#1C1F2C] text-purple-300 font-medium"
                        >
                          <span className="text-[10px] font-mono text-purple-400">vs</span>
                          <span className="truncate max-w-[100px] sm:max-w-[150px]">
                            {opponentModel ? opponentModel.display_name : "Model B"}
                          </span>
                          <ChevronDown className="w-3 h-3 text-purple-400/60" />
                        </button>

                        {showOpponentPicker && (
                          <div className="absolute left-0 bottom-full mb-2 w-64 sm:w-72 rounded-2xl border border-white/[0.08] bg-[#12141C] p-2 shadow-2xl z-50 animate-fade-in backdrop-blur-xl">
                            <div className="text-[10px] uppercase font-mono text-purple-400 px-2.5 py-1 font-semibold border-b border-white/[0.04] mb-1">
                              Comparison Model
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-0.5">
                              {models.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => handleSelectOpponentModel(m.id)}
                                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition flex items-center justify-between ${
                                    opponentModelId === m.id
                                      ? "bg-purple-500/10 text-purple-300 font-semibold"
                                      : "text-[#EDEDED] hover:bg-white/[0.04]"
                                  }`}
                                >
                                  <span className="truncate">{m.display_name}</span>
                                  {opponentModelId === m.id && (
                                    <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setWebGroundingMode(webGroundingMode === "auto" ? "off" : "auto")}
                      className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 transition border ${
                        webGroundingMode === "auto"
                          ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                          : "border-white/[0.06] text-[#64748B] hover:text-[#EDEDED]"
                      }`}
                      title={webGroundingMode === "auto" ? "Intelligent search routing enabled" : "Search disabled (model weights only)"}
                    >
                      <Globe className={`w-3.5 h-3.5 ${webGroundingMode === "auto" ? "text-cyan-400" : ""}`} />
                      <span>{webGroundingMode === "auto" ? "Auto Search" : "Search Off"}</span>
                    </button>
                    <span className="hidden sm:inline text-[10px] text-[#64748B] font-mono">
                      ↵ send
                    </span>
                  </div>

                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={() => abortControllerRef.current?.abort()}
                      className="px-3 py-1.5 rounded-xl bg-[#1C1F2B] border border-white/[0.08] text-[#EDEDED] text-xs flex items-center gap-1.5 hover:bg-[#25293A] transition"
                    >
                      <Square className="w-3 h-3 fill-current text-[#EF4444]" />
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!inputPrompt.trim() || !selectedModelId}
                      className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#2979FF] hover:bg-[#1E6FFF] text-white font-semibold text-xs disabled:opacity-30 transition flex items-center gap-1 shadow-md hover:shadow-[#2979FF]/30 active:scale-[0.96]"
                    >
                      <span className="hidden sm:inline">{isCompareMode ? "Compare" : "Send"}</span>
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Floating Interactive Companion for Active Conversations */}
        {messages.length > 0 && (
          <div className="fixed bottom-24 right-6 z-40 hidden md:block">
            <InteractiveMascot
              variant="mini"
              status={isStreaming ? "streaming" : searchStatus ? "searching" : "idle"}
            />
          </div>
        )}
      </div>
    </div>
  );
}
