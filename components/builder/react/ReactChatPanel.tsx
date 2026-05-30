"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Eye,
  RotateCcw,
  Clock,
  Box,
  LoaderCircle,
  Square,
} from "lucide-react";
import { GeneratedReactFiles } from "@/types/react-generation";
import { DEEP_DIVE_MODELS, getModelConfig } from "@/lib/modelConfig";
import { useCredits } from "@/context/CreditsContext";
import ReactGenerationProgress, {
  AgentStep,
  getThinkingLabel,
  ThinkingText,
} from "@/components/builder/react/ReactGenerationProgress";

export interface ReactMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  snapshotFiles?: GeneratedReactFiles;
  snapshotVersion?: number;
  tokens?: { input: number; output: number; total: number; credits: number };
  model?: string;
  isGenerating?: boolean;
  questions?: { id: string; text: string; options: string[] }[];
  agentSteps?: AgentStep[];
  architectData?: any;
  motionDesignerData?: any;
  createdAt: Date;
}

function QuestionCards({
  intro,
  questions,
  onSubmit,
}: {
  intro: string;
  questions: { id: string; text: string; options: string[] }[];
  onSubmit: (answers: string) => void;
}) {
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [showCustom, setShowCustom] = useState<Record<string, boolean>>({});

  const current = questions[page];
  const total = questions.length;
  const currentAnswer = answers[current.id];
  const isLastPage = page === total - 1;
  const allAnswered = questions.every((q) => answers[q.id]);

  const pickOption = (qId: string, opt: string) => {
    if (opt === "Other") {
      setShowCustom((p) => ({ ...p, [qId]: true }));
      setAnswers((p) => ({ ...p, [qId]: "" }));
    } else {
      setShowCustom((p) => ({ ...p, [qId]: false }));
      setAnswers((p) => ({ ...p, [qId]: opt }));
    }
  };

  const handleDone = () => {
    const compiled = questions
      .map((q) => {
        const ans = answers[q.id] || customInputs[q.id] || "";
        return `${q.text} ${ans}`;
      })
      .join("");
    onSubmit(compiled);
  };

  return (
    <div className="space-y-3">
      {intro && (
        <p className="text-[13px] text-muted-foreground px-1 leading-relaxed">
          {intro}
        </p>
      )}
      <div
        className="rounded-xl border border-border overflow-hidden"
        style={{ background: "rgba(255,255,255,0.02)" }}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
          <span className="text-[11px] font-mono text-muted-foreground tracking-widest uppercase">
            {page + 1} / {total}
          </span>
        </div>
        <div className="px-3 py-3 space-y-2.5">
          <p className="text-[13px] text-foreground font-medium leading-snug">
            {current.text}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {current.options.map((opt) => {
              const isSelected =
                currentAnswer === opt ||
                (opt === "Other" && showCustom[current.id]);
              return (
                <button
                  key={opt}
                  onClick={() => pickOption(current.id, opt)}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all cursor-pointer"
                  style={{
                    background: isSelected
                      ? "rgba(168,85,247,0.15)"
                      : "rgba(255,255,255,0.03)",
                    borderColor: isSelected ? "#a855f7" : "#2a2a2a",
                    color: isSelected ? "#d8b4fe" : "#737373",
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {showCustom[current.id] && (
            <input
              autoFocus
              type="text"
              placeholder="Describe your preference..."
              value={customInputs[current.id] ?? ""}
              onChange={(e) => {
                setCustomInputs((p) => ({
                  ...p,
                  [current.id]: e.target.value,
                }));
                setAnswers((p) => ({ ...p, [current.id]: e.target.value }));
              }}
              className="w-full bg-transparent border border-border focus:border-primary/60 rounded-lg px-3 py-2 text-[12px] text-foreground outline-none mt-2"
            />
          )}
        </div>
        <div className="px-3 pb-3 flex justify-between items-center">
          {!isLastPage ? (
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!currentAnswer}
              className="ml-auto px-3 py-1.5 rounded-lg text-[12px] font-semibold text-[#d8b4fe] bg-[#a855f726] border border-[#a855f740] disabled:opacity-30"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleDone}
              disabled={!allAnswered}
              className="ml-auto px-3 py-1.5 rounded-lg text-[12px] font-semibold text-foreground disabled:opacity-30"
              style={{
                background: allAnswered
                  ? "linear-gradient(135deg, #a855f7, #ec4899)"
                  : "rgba(168,85,247,0.1)",
              }}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReactChatPanel({
  onFilesChange,
  initialPrompt,
  initialFiles,
  onGenerationStateChange,
}: {
  onFilesChange: (files: GeneratedReactFiles | null) => void;
  initialPrompt?: string;
  initialFiles?: GeneratedReactFiles | null;
  onGenerationStateChange?: (
    isGenerating: boolean,
    steps: any[],
    architectData?: any,
  ) => void;
}) {
  const [messages, setMessages] = useState<ReactMessage[]>(() => {
    if (initialFiles && initialPrompt) {
      return [
        {
          id: "u-initial",
          role: "user",
          content: initialPrompt,
          createdAt: new Date(),
        },
        {
          id: "a-initial",
          role: "assistant",
          content: "Generated React components based on your request.",
          snapshotFiles: initialFiles,
          snapshotVersion: 1,
          model: "Restored from Session/DB",
          createdAt: new Date(),
        },
      ];
    }
    return [
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hi! I'm CrawlCube AI's React module. Describe the web application you want to build.",
        createdAt: new Date(),
      },
    ];
  });

  // Client-side hydration of session storage to avoid SSR mismatches
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("crawlcube_react_messages");
      if (stored) {
        setMessages(
          JSON.parse(stored).map((m: any) => ({
            ...m,
            createdAt: new Date(m.createdAt),
          })),
        );
      }
    } catch {}
  }, []);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    "anthropic/claude-3.5-sonnet",
  );

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("crawlcube_react_model");
      if (stored) setSelectedModel(stored);
    } catch {}
  }, []);
  const bottomRef = useRef<HTMLDivElement>(null);
  const briefRef = useRef<string>("");
  const hasAutoStarted = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    if (onGenerationStateChange && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant") {
        onGenerationStateChange(
          !!lastMsg.isGenerating,
          lastMsg.agentSteps || [],
          lastMsg.architectData,
        );
      }
    }
  }, [messages, onGenerationStateChange]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (
      initialPrompt &&
      !initialFiles &&
      !hasAutoStarted.current &&
      messages.length <= 1
    ) {
      hasAutoStarted.current = true;
      handleSend(initialPrompt, true);
    }
  }, [initialPrompt, initialFiles, messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(
        "crawlcube_react_messages",
        JSON.stringify(messages),
      );
    }
  }, [messages]);

  const handleSend = async (
    customPrompt?: string,
    isAutoStart: boolean = false,
  ) => {
    const text = (customPrompt || input).trim();
    if (!text || loading) return;

    const userMsg: ReactMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: new Date(),
    };
    const aiMsgId = crypto.randomUUID();

    const initAiMsg: ReactMessage = {
      id: aiMsgId,
      role: "assistant",
      content: "",
      isGenerating: true,
      agentSteps: [],
      createdAt: new Date(),
    };

    const lastSnapshot = [...messages]
      .reverse()
      .find((m) => m.snapshotFiles)?.snapshotFiles;

    if (!isAutoStart) {
      setMessages((prev) => [...prev, userMsg, initAiMsg]);
    } else {
      setMessages([userMsg, initAiMsg]);
    }

    setInput("");
    setLoading(true);

    try {
      abortControllerRef.current = new AbortController();
      let routerAction = "build_now";
      let resolvedPrompt = text;

      const routerRes = await fetch("/api/chat-react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          messages: messages
            .concat(userMsg)
            .map((m) => ({ role: m.role, content: m.content })),
          brief: briefRef.current,
          hasExistingWebsite: !!lastSnapshot,
        }),
      });

      if (!routerRes.ok) throw new Error("Chat Router failed");
      const routerData = await routerRes.json();

      if (routerData.updatedBrief) briefRef.current = routerData.updatedBrief;

      if (routerData.action === "chat") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  content: routerData.message || "Let me ask some questions.",
                  questions: routerData.questions,
                  isGenerating: false,
                }
              : m,
          ),
        );
        setLoading(false);
        return;
      }

      routerAction = routerData.action;
      resolvedPrompt = routerData.prompt || text;
      if (routerData.themePreference) {
        briefRef.current =
          (briefRef.current || "") +
          `\nTheme preference: ${routerData.themePreference}`;
      }

      // The initAiMsg is already in the messages array and has isGenerating=true.
      // We just leave it as is so the SSE stream can update it.

      // Extract theme from brief or prompt text
      const combinedText =
        `${briefRef.current || ""} ${resolvedPrompt}`.toLowerCase();
      let themePreference = "auto";
      if (
        /\b(dark|dark\s*mode|dark\s*theme|black\s*background|night)\b/.test(
          combinedText,
        )
      ) {
        themePreference = "dark";
      } else if (
        /\b(light|light\s*mode|light\s*theme|white\s*background|bright|clean\s*white|minimal\s*white)\b/.test(
          combinedText,
        )
      ) {
        themePreference = "light";
      } else {
        const briefTheme = briefRef.current?.match(
          /Theme preference:\s*(light|dark|auto)/i,
        );
        if (briefTheme) themePreference = briefTheme[1].toLowerCase();
      }

      const res = await fetch("/api/generate-react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          prompt: resolvedPrompt,
          model: selectedModel,
          existingFiles: lastSnapshot || undefined,
          themePreference,
        }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let finalFiles: any = null;
      let finalTokens: any = null;
      let buffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const line of parts) {
            if (line.startsWith("data:")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.action === "agent-update") {
                  setMessages((prev) =>
                    prev.map((m) => {
                      if (m.id === aiMsgId) {
                        const steps = m.agentSteps || [];
                        const existing = [...steps];
                        const idx = existing.findIndex(
                          (s) => s.id === data.step.id,
                        );
                        if (idx >= 0)
                          existing[idx] = { ...existing[idx], ...data.step };
                        else existing.push(data.step);
                        return {
                          ...m,
                          agentSteps: existing,
                          architectData: data.architectData || m.architectData,
                          motionDesignerData:
                            data.motionDesignerData || m.motionDesignerData,
                        };
                      }
                      return m;
                    }),
                  );
                } else if (data.action === "generation-complete") {
                  finalFiles = data.files;
                  finalTokens = data.tokens;
                } else if (data.action === "error") {
                  throw new Error(data.message);
                }
              } catch (e) {}
            }
          }
        }
      }

      if (!finalFiles)
        throw new Error("Stream closed before files were generated.");

      const v = [...messages].filter((m) => m.snapshotFiles).length + 1;

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === aiMsgId) {
            return {
              ...m,
              content: "Generated React components based on your request.",
              snapshotFiles: finalFiles,
              snapshotVersion: v,
              tokens: finalTokens
                ? {
                    input: finalTokens.inputTokens || 0,
                    output: finalTokens.outputTokens || 0,
                    total:
                      (finalTokens.inputTokens || 0) +
                      (finalTokens.outputTokens || 0),
                    credits: finalTokens.creditsUsed || 0,
                  }
                : undefined,
              model: selectedModel,
              isGenerating: false,
            };
          }
          return m;
        }),
      );

      sessionStorage.setItem(
        "crawlcube_react_files",
        JSON.stringify(finalFiles),
      );
      onFilesChange(finalFiles);
    } catch (err: any) {
      if (err.name === "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  content: "Generation stopped by user.",
                  isGenerating: false,
                }
              : m,
          ),
        );
        return;
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? { ...m, content: `❌ Error: ${err.message}`, isGenerating: false }
            : m,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (files: GeneratedReactFiles) => {
    onFilesChange(files);
    // Force set in session to persist the restored context if they hit Save
    sessionStorage.setItem("crawlcube_react_files", JSON.stringify(files));
    alert(
      "Restored version locally! Make sure to click Save to persist these changes permanently.",
    );
  };

  const MODELS = DEEP_DIVE_MODELS; // Reusing deep dive model lists
  const activeModel =
    MODELS.find((m) => m.model === selectedModel) || MODELS[0];

  return (
    <div className="w-full md:w-[350px] shrink-0 md:border-r border-[#222] bg-[#0f0f0f] flex flex-col h-full overflow-hidden text-sm">
      {/* Header */}
      <div className="p-3 border-b border-[#222] shrink-0 bg-background flex flex-col gap-2">
        <div className="flex items-center gap-2 font-semibold text-foreground px-1">
          React Generation{""}
          <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] px-1.5 py-0.5 rounded tracking-wider uppercase">
            BETA
          </span>
        </div>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="bg-[#111] border border-white/5 rounded-md px-2 py-1.5 text-xs text-foreground/70 focus:text-foreground outline-none cursor-pointer w-full"
        >
          {MODELS.map((model) => (
            <option
              key={model.model}
              value={model.model}
              className="bg-secondary text-foreground"
            >
              {model.label}
            </option>
          ))}
        </select>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
          >
            {m.role === "user" ? (
              <div className="bg-indigo-600/90 text-foreground px-4 py-2.5 rounded-2xl max-w-[90%] wrap-break-word whitespace-pre-wrap">
                {m.content}
                {m.questions && m.questions.length > 0 && (
                  <div className="mt-4">
                    <QuestionCards
                      intro=""
                      questions={m.questions}
                      onSubmit={(ans) => handleSend(ans)}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full">
                <p className="text-foreground/80 font-medium mb-3">
                  {m.content}
                </p>
                {m.questions && m.questions.length > 0 && (
                  <div className="my-4">
                    <QuestionCards
                      intro=""
                      questions={m.questions}
                      onSubmit={(ans) => handleSend(ans)}
                    />
                  </div>
                )}

                {(m.isGenerating ||
                  (m.agentSteps && m.agentSteps.length > 0)) && (
                  <div className="bg-[#151515] p-3 rounded-xl border border-white/10 my-3">
                    {m.isGenerating && (
                      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/5">
                        <LoaderCircle className="w-4 h-4 text-foreground/50 animate-spin" />
                        <ThinkingText label={getThinkingLabel(m.agentSteps)} />
                      </div>
                    )}
                    {m.agentSteps && m.agentSteps.length > 0 && (
                      <ReactGenerationProgress
                        steps={m.agentSteps}
                        architectData={m.architectData}
                        motionDesignerData={m.motionDesignerData}
                      />
                    )}
                  </div>
                )}

                {m.snapshotFiles && (
                  <div className="bg-[#151515] border border-white/10 rounded-xl overflow-hidden mt-2 flex flex-col shadow-xl shadow-black/20">
                    <div className="bg-background/5 px-3 py-2 border-b border-white/10 flex items-center justify-between text-xs text-foreground/60">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-semibold tracking-wider text-foreground">
                          SNAPSHOT
                        </span>
                        <span className="bg-indigo-500/20 text-indigo-400 px-1.5 rounded-full font-mono">
                          v{m.snapshotVersion}
                        </span>
                      </div>
                      <span className="font-mono bg-background/5 px-1.5 rounded">
                        {Object.keys(m.snapshotFiles).length} files
                      </span>
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-background p-2 rounded-lg border border-white/5">
                        <p className="text-foreground/40 font-mono text-[10px] mb-1 uppercase tracking-widest">
                          Snapshot
                        </p>
                        <p className="text-foreground/80 font-medium">
                          Generation Version {m.snapshotVersion}
                        </p>
                      </div>
                      <div className="bg-background p-2 rounded-lg border border-white/5">
                        <p className="text-foreground/40 font-mono text-[10px] mb-1 uppercase tracking-widest">
                          Framework
                        </p>
                        <p className="text-foreground/80 font-medium">React</p>
                      </div>
                      <div className="bg-background p-2 rounded-lg border border-white/5 col-span-2">
                        <p className="text-foreground/40 font-mono text-[10px] mb-1 uppercase tracking-widest">
                          Libraries
                        </p>
                        <p className="text-foreground/80 font-medium truncate">
                          react, react-dom, react-router-dom, tailwind
                        </p>
                      </div>
                    </div>
                    <div className="px-3 py-2 bg-background border-t border-white/10 text-[11px] text-foreground/50 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <p>Version {m.snapshotVersion} context active.</p>
                      </div>
                      {m.tokens && (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[#a855f7]/70 font-mono text-[10px]">
                          <span>in: {(m.tokens.input / 1000).toFixed(1)}k</span>
                          <span>
                            out: {(m.tokens.output / 1000).toFixed(1)}k
                          </span>
                          <span>
                            total: {(m.tokens.total / 1000).toFixed(1)}k
                          </span>
                          <span className="ml-auto text-yellow-500/80 font-sans tracking-wide">
                            ⚡ {m.tokens.credits.toFixed(1)} cr
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-1">
                        {m.model && (
                          <span className="max-w-[120px] truncate">
                            {m.model.split("/").pop()}
                          </span>
                        )}
                        <button
                          onClick={() =>
                            m.snapshotFiles && handleRestore(m.snapshotFiles)
                          }
                          className="text-foreground hover:text-indigo-400 flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
                        >
                          <RotateCcw className="w-3 h-3" /> Restore version
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-[#222] bg-background">
        <div className="border border-white/10 rounded-xl overflow-hidden bg-[#111] focus-within:border-indigo-500/50 transition-colors flex flex-col">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Describe your React project..."
            className="w-full bg-transparent text-foreground placeholder-white/30 p-3 min-h-[80px] max-h-[200px] resize-none outline-none overflow-y-auto"
          />
          <div className="px-2 py-1.5 bg-[#080808] border-t border-white/5 flex items-center justify-end">
            <div className="flex items-center gap-1.5">
              {loading && (
                <button
                  onClick={stopGeneration}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors"
                  title="Stop generation"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              )}
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 text-foreground disabled:opacity-40 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
