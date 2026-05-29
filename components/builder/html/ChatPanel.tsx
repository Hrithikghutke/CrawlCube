"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  LoaderCircle,
  RotateCcw,
  Zap,
  Telescope,
  Eye,
  ChevronDown,
  Square,
} from "lucide-react";
import html2canvas from "html2canvas";
import { normalizeLayout } from "@/lib/normalizeLayout";
import { rateGeneration, updateRating } from "@/lib/firestore";
import { THEME_STYLES, getThemeLabel } from "@/lib/themeConfig";
import { ThemeStyle } from "@/types/layout";
import { useCredits } from "@/context/CreditsContext";
import { useAuth } from "@clerk/nextjs";
import Logo from "@/assets/logo.svg";
import {
  DEEP_DIVE_MODELS,
  CLAUDE_LOGO_SVG,
  getModelConfig,
} from "@/lib/modelConfig";

// ── Shimmer "Thinking" animation — matches Claude UI ──
const shimmerStyle = `
  @keyframes cc-shimmer {
    0%   { background-position: -400px center; }
    100% { background-position: 400px center; }
  }
  .cc-thinking {
    background: linear-gradient(
      90deg,
      #4b5563 0%,
      #4b5563 30%,
      #d1d5db 50%,
      #4b5563 70%,
      #4b5563 100%
    );
    background-size: 400px 100%;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: cc-shimmer 2s ease-in-out infinite;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.01em;
  }
`;

// ── Derive current thinking label from live agent steps ──
function getThinkingLabel(agentSteps?: AgentStep[]): string {
  if (!agentSteps) return "Thinking";

  const running = agentSteps.find((s) => s.status === "running");
  if (!running) return "Thinking";

  // Architect phase
  if (running.id === "architect") return "Planning architecture";

  // Developer phase — shell/design system (developer step running but no page running yet)
  if (running.id === "developer") {
    const anyPageRunning = agentSteps.some(
      (s) => s.id.startsWith("page-") && s.status === "running",
    );
    return anyPageRunning ? "Assembling pages" : "Designing system";
  }

  // Individual page steps
  if (running.id.startsWith("page-")) {
    const raw = running.id.replace("page-", "");
    if (raw === "footer") return "Writing scripts";
    // Use the step label if it's a real page name, else format the id
    const label = running.label?.trim();
    if (label && label.length > 0) {
      // label is like "Services" or "Home" — already clean
      return `Building ${label}`;
    }
    // Fallback: format the id
    const name = raw.charAt(0).toUpperCase() + raw.slice(1).replace(/-/g, " ");
    return `Building ${name}`;
  }

  // QA phases
  if (running.id === "qa") return "Testing website";
  if (running.id === "visual-qa") return "Reviewing visuals";

  return "Working on it";
}

function ThinkingText({ label = "Thinking" }: { label?: string }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: shimmerStyle }} />
      <span className="cc-thinking">{label}</span>
    </>
  );
}

type GenerationMode = "fast" | "deep";

// ── Agent pipeline step state ──
type AgentStatus = "idle" | "running" | "done" | "error";

interface AgentStep {
  id: string;
  label: string;
  status: AgentStatus;
  message?: string;
  detail?: string;
}

interface ArchitectData {
  brandName: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
  };
  fonts: { display: string; body: string };
  pages: string[];
  pageLabels: string[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isGenerating?: boolean;
  agentSteps?: AgentStep[];
  architectData?: ArchitectData; // populated from ARCHITECT_DONE event
  architectOpen?: boolean; // accordion open state
  thumbnail?: string | null;
  options?: { label: string; value: string }[];
  questions?: { id: string; text: string; options: string[] }[];
}

const THEME_DESCRIPTIONS: Record<ThemeStyle, string> = {
  minimal: "Clean & spacious",
  bold: "High contrast & punchy",
  glassmorphism: "Frosted glass effects",
  elegant: "Refined & sophisticated",
  corporate: "Professional & formal",
};

const SUGGESTIONS = [
  "Modern gym website with pricing plans",
  "SaaS landing page for project management",
  "Restaurant website with elegant dark theme",
  "Portfolio site for a photographer",
  "Tech startup with glassmorphism style",
];

// ── Agent step progress UI ──
// ── Status dot/icon for each step ──
function StepIcon({ status }: { status: AgentStatus }) {
  if (status === "done")
    return (
      <svg
        className="w-3.5 h-3.5 text-emerald-500 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  if (status === "running")
    return (
      <div className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
      </div>
    );
  if (status === "error")
    return (
      <div className="w-3.5 h-3.5 shrink-0 rounded-full bg-red-500/20 border border-red-500/50" />
    );
  return (
    <div className="w-3.5 h-3.5 shrink-0 rounded-full border border-neutral-700" />
  );
}

// ── Color swatch ──
function ColorSwatch({ hex }: { hex: string }) {
  return (
    <span
      className="inline-block w-3 h-3 rounded-sm border border-white/10 align-middle mr-1"
      style={{ background: hex }}
    />
  );
}

// ── New generation progress UI ──
function GenerationProgress({
  message,
  onToggleArchitect,
}: {
  message: Message;
  onToggleArchitect: (msgId: string) => void;
}) {
  const steps = message.agentSteps ?? [];
  const architectStep = steps.find((s) => s.id === "architect");
  const developerStep = steps.find((s) => s.id === "developer");
  const pageSteps = steps.filter((s) => s.id.startsWith("page-"));
  const qaStep = steps.find((s) => s.id === "qa");
  const visualQaStep = steps.find((s) => s.id === "visual-qa");

  const ad = message.architectData;

  return (
    <div className="space-y-px text-[11px] font-mono">
      {/* ── Architect block ── */}
      {architectStep && (
        <div className="rounded-lg overflow-hidden border border-neutral-800/60">
          {/* Header row — always visible */}
          <button
            onClick={() => onToggleArchitect(message.id)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/2 transition-colors"
          >
            <StepIcon status={architectStep.status} />
            <span
              className={`font-semibold tracking-wide flex-1 ${
                architectStep.status === "done"
                  ? "text-neutral-300"
                  : architectStep.status === "running"
                    ? "text-blue-300"
                    : architectStep.status === "error"
                      ? "text-red-400"
                      : "text-neutral-600"
              }`}
            >
              ARCHITECT
            </span>
            {/* Summary when done */}
            {architectStep.status === "done" && ad && (
              <span className="text-neutral-500 truncate max-w-40">
                {ad.brandName} · {ad.fonts.display} · {ad.colors.primary}
              </span>
            )}
            {/* Running message */}
            {architectStep.status === "running" && (
              <span className="text-neutral-600">
                {architectStep.message ?? "Analyzing..."}
              </span>
            )}
            {/* Chevron */}
            {architectStep.status === "done" && (
              <svg
                className={`w-3 h-3 text-neutral-600 shrink-0 transition-transform ${message.architectOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
          </button>

          {/* Expanded architect details */}
          {message.architectOpen && ad && (
            <div className="px-3 pb-3 pt-1 border-t border-neutral-800/60 space-y-1.5">
              <div className="grid grid-cols-[80px_1fr] gap-x-3 gap-y-1">
                <span className="text-neutral-600 uppercase tracking-widest text-[10px]">
                  Brand
                </span>
                <span className="text-neutral-300">{ad.brandName}</span>

                <span className="text-neutral-600 uppercase tracking-widest text-[10px]">
                  Primary
                </span>
                <span className="text-neutral-300">
                  <ColorSwatch hex={ad.colors.primary} />
                  {ad.colors.primary}
                  <span className="text-neutral-600 mx-2">·</span>
                  <ColorSwatch hex={ad.colors.secondary} />
                  {ad.colors.secondary}
                </span>

                <span className="text-neutral-600 uppercase tracking-widest text-[10px]">
                  Background
                </span>
                <span className="text-neutral-300">
                  <ColorSwatch hex={ad.colors.background} />
                  {ad.colors.background}
                  <span className="text-neutral-600 mx-2">·</span>
                  <ColorSwatch hex={ad.colors.surface} />
                  {ad.colors.surface}
                </span>

                <span className="text-neutral-600 uppercase tracking-widest text-[10px]">
                  Fonts
                </span>
                <span className="text-neutral-300">
                  {ad.fonts.display} / {ad.fonts.body}
                </span>

                <span className="text-neutral-600 uppercase tracking-widest text-[10px]">
                  Pages
                </span>
                <span className="text-neutral-300">
                  {ad.pageLabels.join(" · ")}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Developer block ── */}
      {developerStep &&
        (developerStep.status !== "idle" || pageSteps.length > 0) && (
          <div className="rounded-lg border border-neutral-800/60 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2">
              <StepIcon status={developerStep.status} />
              <span
                className={`font-semibold tracking-wide flex-1 ${
                  developerStep.status === "done"
                    ? "text-neutral-300"
                    : developerStep.status === "running"
                      ? "text-blue-300"
                      : "text-neutral-600"
                }`}
              >
                DEVELOPER
              </span>
              {developerStep.status === "running" && developerStep.message && (
                <span className="text-neutral-600 truncate max-w-45">
                  {developerStep.message}
                </span>
              )}
              {developerStep.status === "done" && (
                <span className="text-neutral-500">Complete</span>
              )}
            </div>

            {/* Page sub-items */}
            {pageSteps.length > 0 && (
              <div className="px-3 pb-2 border-t border-neutral-800/40 space-y-0.5 pt-1.5">
                {pageSteps.map((page) => (
                  <div
                    key={page.id}
                    className="flex items-center gap-2 py-0.5 pl-2"
                  >
                    <StepIcon status={page.status} />
                    <span
                      className={`${
                        page.status === "done"
                          ? "text-neutral-400"
                          : page.status === "running"
                            ? "text-blue-300/80"
                            : "text-neutral-700"
                      }`}
                    >
                      {page.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      {/* ── QA rows ── */}
      {[qaStep, visualQaStep].filter(Boolean).map(
        (step) =>
          step &&
          step.status !== "idle" && (
            <div
              key={step.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-800/60"
            >
              <StepIcon status={step.status} />
              <span
                className={`font-semibold tracking-wide ${
                  step.status === "done"
                    ? "text-neutral-300"
                    : step.status === "running"
                      ? "text-blue-300"
                      : "text-neutral-600"
                }`}
              >
                {step.id === "qa" ? "QA" : "VISUAL QA"}
              </span>
              {step.message && (
                <span className="text-neutral-600">{step.message}</span>
              )}
            </div>
          ),
      )}
    </div>
  );
}

// ── Structured question cards — shown when AI returns questions array ──
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
    // Compile all answers into a natural message
    const compiled = questions
      .map((q) => {
        const ans = answers[q.id] || customInputs[q.id] || "";
        return `${q.text} ${ans}`;
      })
      .join(" ");
    onSubmit(compiled);
  };

  return (
    <div className="space-y-3">
      {/* Intro text */}
      {intro && (
        <p className="text-[13px] text-neutral-300 px-1 leading-relaxed">
          {intro}
        </p>
      )}

      {/* Question card */}
      <div
        className="rounded-xl border border-neutral-800 overflow-hidden"
        style={{ background: "rgba(255,255,255,0.02)" }}
      >
        {/* Card header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800/60">
          <span className="text-[11px] font-mono text-neutral-600 tracking-widest uppercase">
            {page + 1} / {total}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-6 h-6 flex items-center justify-center rounded-md text-neutral-600 hover:text-neutral-300 disabled:opacity-20 transition-colors cursor-pointer"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(total - 1, p + 1))}
              disabled={page === total - 1}
              className="w-6 h-6 flex items-center justify-center rounded-md text-neutral-600 hover:text-neutral-300 disabled:opacity-20 transition-colors cursor-pointer"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Question + options */}
        <div className="px-3 py-3 space-y-2.5">
          <p className="text-[13px] text-neutral-200 font-medium leading-snug">
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

          {/* Custom input for "Other" */}
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
              className="w-full bg-transparent border border-neutral-700 focus:border-purple-500/60 rounded-lg px-3 py-2 text-[12px] text-neutral-200 placeholder:text-neutral-600 outline-none transition-colors"
            />
          )}
        </div>

        {/* Footer — next or done */}
        <div className="px-3 pb-3 flex justify-between items-center">
          {!isLastPage ? (
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!currentAnswer}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer disabled:opacity-30"
              style={{
                background: "rgba(168,85,247,0.15)",
                border: "1px solid rgba(168,85,247,0.3)",
                color: "#d8b4fe",
              }}
            >
              Next
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleDone}
              disabled={!allAnswered}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer disabled:opacity-30"
              style={{
                background: allAnswered
                  ? "linear-gradient(135deg, #a855f7, #ec4899)"
                  : "rgba(168,85,247,0.1)",
                border: "1px solid rgba(168,85,247,0.3)",
                color: "#fff",
              }}
            >
              Done
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPanel({
  setLayout,
  setDeepHtml,
  onStreamCode,
  onGeneratingChange,
  initialLayout,
  initialPrompt,
  initialMode,
  initialModel,
  onShowPreview,
  hasLayout,
  onNewChat,
  restoredDeepHtml,
}: {
  setLayout: (layout: any, prompt?: string) => void;
  setDeepHtml?: (html: string, brandName?: string) => void;
  onStreamCode?: (code: string) => void;
  onGeneratingChange?: (generating: boolean) => void;
  initialLayout?: any;
  initialPrompt?: string;
  initialMode?: GenerationMode;
  initialModel?: string;
  onShowPreview?: () => void;
  hasLayout?: boolean;
  onNewChat?: () => void;
  restoredDeepHtml?: string | null;
}) {
  const [mode, setMode] = useState<GenerationMode>(initialMode ?? "fast");
  const [selectedModel, setSelectedModel] = useState(
    initialModel ?? "google/gemini-3-flash-preview",
  );
  const [showModelPicker, setShowModelPicker] = useState(false);

  const MODELS = DEEP_DIVE_MODELS;
  const activeModel =
    MODELS.find((m) => m.model === selectedModel) ?? MODELS[0];
  const [messages, setMessages] = useState<Message[]>(() => {
    // Check sessionStorage first — survives page refresh
    try {
      const stored = sessionStorage.getItem("crawlcube_messages");
      if (stored) {
        const parsed = JSON.parse(stored) as Message[];
        if (parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}

    // Restored from dashboard — show continuation message
    if (restoredDeepHtml && initialPrompt) {
      return [
        {
          id: "initial-user",
          role: "user" as const,
          content: initialPrompt,
        },
        {
          id: "initial-response",
          role: "assistant" as const,
          content: `Welcome back! Your website is loaded in the preview.\n\nDescribe any changes you want — I'll regenerate it with your updates.`,
        },
      ];
    }
    if (initialLayout && initialPrompt) {
      return [
        {
          id: "initial-user",
          role: "user" as const,
          content: initialPrompt,
        },
        {
          id: "initial-response",
          role: "assistant" as const,
          content: `Welcome back! Your **${getThemeLabel(initialLayout.themeStyle ?? "corporate")}** website for **${initialLayout.branding?.logoText || "your brand"}** is loaded.\n\nDescribe changes you want or generate something completely new!`,
        },
      ];
    }
    return [
      {
        id: "welcome",
        role: "assistant" as const,
        content:
          initialMode === "deep"
            ? "Hi! I'm CrawlCube AI. I'm ready to build your website using the full agent pipeline."
            : "Hi! I'm CrawlCube AI. Describe the website you want to build and I'll generate it instantly.",
      },
    ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeStyle>("corporate");
  const [showThemes, setShowThemes] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const deepHtmlRef = useRef<string | null>(restoredDeepHtml ?? null);
  const pendingPromptRef = useRef<string | null>(null);
  const briefRef = useRef<string>("");
  const { credits, deductCredit, refreshCredits } = useCredits();
  const [currentLayout, setCurrentLayout] = useState<any>(
    initialLayout ?? null,
  );
  const hasAutoStarted = useRef(false);
  // Hash-like key — length + first 40 chars makes collisions extremely unlikely
  const autoStartKey = initialPrompt
    ? `cc_as_${initialPrompt.length}_${initialPrompt.slice(0, 40).replace(/\s+/g, "_")}`
    : null;
  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { userId } = useAuth();
  const [fixLoading, setFixLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pagePicker, setPagePicker] = useState<{
    instruction: string;
    section: string;
    pages: { id: string; label: string }[];
    editMeta: any;
  } | null>(null);
  const [ratingState, setRatingState] = useState<{
    prompt: string;
    html: string;
    model: string;
    submitted: boolean;
    rating: "positive" | "negative" | null;
    showFeedback: boolean;
    feedbackItems: string[];
    feedbackText: string;
    docId: string | null;
    submittedFeedback: string[]; // stored after submit for fix button
  } | null>(null);

  // Sync edits made in PreviewPanel back to ChatPanel context
  useEffect(() => {
    if (initialLayout !== undefined) {
      setCurrentLayout(initialLayout);
    }
  }, [initialLayout]);

  useEffect(() => {
    if (restoredDeepHtml !== undefined) {
      deepHtmlRef.current = restoredDeepHtml ?? null;
    }
  }, [restoredDeepHtml]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Persist messages + brief to sessionStorage so refresh doesn't lose state
  useEffect(() => {
    if (messages.length === 0) return;
    // Don't persist the synthetic welcome message — it would fill crawlcube_messages
    // before the auto-start useEffect runs, causing the auto-start guard to bail early
    // and the deep-dive pipeline never triggering for detailed landing-page prompts.
    const isOnlyWelcome = messages.length === 1 && messages[0].id === "welcome";
    if (isOnlyWelcome) return;
    try {
      // Strip completedHtml from messages — it's saved separately as crawlcube_deep_html
      const stripped = messages.map((m) => ({
        ...m,
        completedHtml: undefined,
      }));
      sessionStorage.setItem("crawlcube_messages", JSON.stringify(stripped));
      if (briefRef.current) {
        sessionStorage.setItem("crawlcube_brief", briefRef.current);
      }
    } catch {}
  }, [messages]);

  // ── Auto-start Deep Dive if navigated from landing page ──

  const initialPromptRef = useRef(initialPrompt);
  const initialModeRef = useRef(initialMode);
  useEffect(() => {
    initialPromptRef.current = initialPrompt;
    initialModeRef.current = initialMode;
  });

  useEffect(() => {
    // Check for seed messages from LandingPrompt conversation flow
    const seedRaw = sessionStorage.getItem("crawlcube_seed_messages");
    if (
      seedRaw &&
      initialModeRef.current === "deep" &&
      !hasAutoStarted.current
    ) {
      try {
        const seeded: { role: string; content: string }[] = JSON.parse(seedRaw);
        sessionStorage.removeItem("crawlcube_seed_messages");
        setMessages(
          seeded.map((m, i) => ({
            id: `seed-${i}`,
            role: m.role as "user" | "assistant",
            content: m.content,
            questions: (m as any).questions ?? undefined,
          })),
        );
        briefRef.current = seeded.find((m) => m.role === "user")?.content ?? "";
        return; // Don't auto-start — wait for user to respond
      } catch {
        sessionStorage.removeItem("crawlcube_seed_messages");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt, initialMode]);
  useEffect(() => {
    // Restore brief from previous session
    const storedBrief = sessionStorage.getItem("crawlcube_brief");
    if (storedBrief && !briefRef.current) {
      briefRef.current = storedBrief;
    }

    // Don't auto-start if messages were restored from a previous session
    if (sessionStorage.getItem("crawlcube_messages")) return;

    if (
      initialModeRef.current === "deep" &&
      initialPromptRef.current &&
      !initialLayout &&
      !restoredDeepHtml &&
      !hasAutoStarted.current
    ) {
      hasAutoStarted.current = true;
      handleDeepDive(initialPromptRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt, initialMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  // ════════════════════════════════
  // FAST MODE generation
  // ════════════════════════════════
  const handleFastGenerate = async (promptOverride?: string) => {
    const prompt = promptOverride ?? input.trim();
    if (!prompt || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
    };
    const thinkingMessage: Message = {
      id: Date.now().toString() + "-thinking",
      role: "assistant",
      content: "",
      isGenerating: true,
    };

    setMessages((prev) => [...prev, userMessage, thinkingMessage]);
    setInput("");
    setLoading(true);

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    deductCredit();
    onGeneratingChange?.(true);
    onStreamCode?.("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          themeStyle: selectedTheme,
          currentLayout: currentLayout ?? null,
        }),
      });

      if (res.status === 402) {
        const errData = await res.json();
        throw new Error(errData.message ?? "Not enough credits.");
      }
      const data = await res.json();
      if (!res.ok || !data.layout) throw new Error("Generation failed");

      const normalized = normalizeLayout(data.layout);
      normalized.themeStyle = selectedTheme;
      setCurrentLayout(normalized);
      setLayout(normalized, prompt);
      await refreshCredits();

      // Typewriter effect — feeds JSON into Code tab character by character
      const jsonStr = JSON.stringify(normalized, null, 2);
      let charIdx = 0;
      const typeNext = () => {
        charIdx += Math.floor(Math.random() * 10) + 6; // 6-16 chars per tick
        if (charIdx >= jsonStr.length) {
          onStreamCode?.(jsonStr);
          onGeneratingChange?.(false); // unlock Preview tab
          return;
        }
        onStreamCode?.(jsonStr.slice(0, charIdx));
        typewriterRef.current = setTimeout(typeNext, 16);
      };
      typewriterRef.current = setTimeout(typeNext, 50);

      setMessages((prev) =>
        prev.map((m) =>
          m.isGenerating
            ? {
                ...m,
                isGenerating: false,
                content: `Done! I've generated a **${getThemeLabel(selectedTheme)}** style website for **${normalized.branding?.logoText || "your brand"}**. It's now showing in the preview.\n\nWant to tweak anything?`,
              }
            : m,
        ),
      );
    } catch (err: any) {
      onGeneratingChange?.(false);
      if (typewriterRef.current) clearTimeout(typewriterRef.current);
      await refreshCredits();
      const errorMsg =
        err.message === "NO_CREDITS"
          ? "You're out of credits. Purchase more to keep building!"
          : "Something went wrong. Please try again.";
      setMessages((prev) =>
        prev.map((m) =>
          m.isGenerating
            ? { ...m, isGenerating: false, content: `❌ ${errorMsg}` }
            : m,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  // ════════════════════════════════
  // DEEP DIVE MODE generation
  // ════════════════════════════════
  const handleDeepDive = async (promptOverride?: string, fixes?: string[]) => {
    const prompt = promptOverride ?? input.trim();
    if (!prompt || loading) return;

    // Initial agent steps — all idle
    // Pages are not included here — they're added dynamically when PAGE_NAMES event fires
    const initialSteps: AgentStep[] = [
      { id: "architect", label: "Architect", status: "idle" },
      { id: "content-strategist", label: "Content Strategist", status: "idle" },
      { id: "ui-designer", label: "UI Designer", status: "idle" },
      { id: "developer", label: "Developer", status: "idle" },
      { id: "qa", label: "QA", status: "idle" },
      { id: "visual-qa", label: "Visual QA", status: "idle" },
    ];

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
    };
    const agentMessage: Message = {
      id: Date.now().toString() + "-agents",
      role: "assistant",
      content: "",
      isGenerating: true,
      agentSteps: initialSteps,
    };

    setMessages((prev) => [...prev, userMessage, agentMessage]);
    setInput("");
    setLoading(true);
    onGeneratingChange?.(true);
    onStreamCode?.("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    // Optimistically deduct the model's minimum cost so the header credit
    // counter shows a realistic drop, not just -1 for an expensive generation.
    deductCredit(getModelConfig(selectedModel).minCreditsToStart);

    // Helper to update a specific agent step in the message
    const updateStep = (
      stepId: string,
      status: AgentStatus,
      message?: string,
      detail?: string,
    ) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === agentMessage.id
            ? {
                ...m,
                agentSteps: m.agentSteps?.map((s) =>
                  s.id === stepId ? { ...s, status, message, detail } : s,
                ),
              }
            : m,
        ),
      );
    };

    // Dynamically insert page steps after "developer" step when PAGE_NAMES fires
    const addPageSteps = (pages: string[], labels: string[]) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== agentMessage.id) return m;
          const existing = m.agentSteps ?? [];
          const devIndex = existing.findIndex((s) => s.id === "developer");
          const pageSteps: AgentStep[] = pages.map((id, i) => ({
            id: `page-${id}`,
            label: labels[i] ?? id,
            status: "idle" as AgentStatus,
          }));
          // Insert page steps right after developer
          const next = [
            ...existing.slice(0, devIndex + 1),
            ...pageSteps,
            ...existing.slice(devIndex + 1),
          ];
          return { ...m, agentSteps: next };
        }),
      );
    };

    // Create a new AbortController for this generation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Warn user if generation takes too long (likely timeout approaching)
    const timeoutWarning = setTimeout(() => {
      if (loading) {
        updateStep(
          "developer",
          "running",
          "Still working... Opus takes longer for complex sites. If this hangs, try Sonnet instead.",
        );
      }
    }, 50000); // warn at 50 seconds

    try {
      // Extract theme preference from the brief or prompt
      const themeMatch = (briefRef.current || prompt).match(/\b(dark|light)\b/i);
      const themePreference = themeMatch ? themeMatch[1].toLowerCase() : "auto";

      const res = await fetch("/api/generate-deep", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-generation-id": Date.now().toString(),
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          fixes: fixes ?? [],
          themePreference,
        }),
        signal: abortController.signal,
      });

      if (res.status === 402) {
        const errData = await res.json();
        throw new Error(errData.message ?? "Not enough credits.");
      }
      if (!res.ok) throw new Error("Pipeline failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream");

      let buffer = "";

      let receivedComplete = false;
      let receivedError = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Only show timeout message if:
          // 1. We never got COMPLETE, AND
          // 2. We never got an ERROR event (ERROR already showed its own message)
          if (!receivedComplete && !receivedError) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === agentMessage.id
                  ? {
                      ...m,
                      isGenerating: false,
                      content: `⚠️ Generation completed on the server but the response timed out before reaching your browser.\n\nTry regenerating with **Sonnet** instead — it completes in 25-35 seconds reliably.`,
                      agentSteps: m.agentSteps?.map((s) =>
                        s.status === "running"
                          ? {
                              ...s,
                              status: "error" as AgentStatus,
                              message: "Connection timed out.",
                            }
                          : s,
                      ),
                    }
                  : m,
              ),
            );
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          let event: any;
          try {
            event = JSON.parse(jsonStr);
          } catch {
            continue;
          }

          // ── Handle each event type ──
          switch (event.event) {
            case "ARCHITECT_START":
              updateStep("architect", "running", event.message);
              break;

            case "PAGE_NAMES": {
              const pages: string[] = event.pages ?? [];
              const labels: string[] = event.pageLabels ?? [];
              // Dynamically add real page steps + footer to developer block
              addPageSteps(
                [...pages, "footer"],
                [...labels, "Footer & scripts"],
              );
              break;
            }

            case "ARCHITECT_DONE":
              updateStep("architect", "done", event.message);
              // Trigger content strategist + ui designer as running simultaneously
              updateStep(
                "content-strategist",
                "running",
                "Writing copy & brand voice...",
              );
              updateStep(
                "ui-designer",
                "running",
                "Designing layout & visual system...",
              );
              // Store architect data in message for the dropdown
              if (event.architectData) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === agentMessage.id
                      ? {
                          ...m,
                          architectData: event.architectData,
                          architectOpen: false,
                        }
                      : m,
                  ),
                );
              }
              break;

            case "CONTENT_STRATEGIST_DONE":
              updateStep(
                "content-strategist",
                "done",
                event.tagline ? `"${event.tagline}"` : "Copy ready",
              );
              break;

            case "UI_DESIGNER_DONE":
              updateStep(
                "ui-designer",
                "done",
                event.heroVariant && event.featuresVariant
                  ? `${event.heroVariant.replace(/-/g, " ")} · ${event.featuresVariant.replace(/-/g, " ")}`
                  : "Layout spec ready",
              );
              break;

            case "DEVELOPER_START": {
              const estimates: Record<string, string> = {
                "anthropic/claude-haiku-4.5": "~5 credits",
                "anthropic/claude-sonnet-4.6": "~20-30 credits",
                "anthropic/claude-opus-4": "~300-500 credits",
                "deepseek/deepseek-v3.2": "~5 credits · sequential",
              };
              const estimate = estimates[selectedModel] ?? "variable";
              // Ensure both spec agents are marked done before developer starts
              // (covers edge case where their _DONE events hadn't been received yet)
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== agentMessage.id) return m;
                  return {
                    ...m,
                    agentSteps: m.agentSteps?.map((s) => {
                      if (
                        (s.id === "content-strategist" ||
                          s.id === "ui-designer") &&
                        (s.status === "idle" || s.status === "running")
                      ) {
                        return {
                          ...s,
                          status: "done" as AgentStatus,
                          message: "Ready",
                        };
                      }
                      return s;
                    }),
                  };
                }),
              );
              updateStep("developer", "running", `est. ${estimate}`);
              break;
            }
            case "DEVELOPER_DONE":
              updateStep("developer", "done", event.message);
              break;

            case "HTML_CHUNK":
              // Live streaming — feed into Code tab
              onStreamCode?.(event.chunk);
              break;

            case "DEVELOPER_FIX": {
              const stepId = event.stepId as string | undefined;
              const msg = event.message ?? "";
              if (stepId) {
                // Mark that page done, then mark the next idle page as running
                updateStep(stepId, "done");
                setMessages((prev) =>
                  prev.map((m) => {
                    if (m.id !== agentMessage.id) return m;
                    const steps = m.agentSteps ?? [];
                    const nextIdle = steps.find(
                      (s) => s.id.startsWith("page-") && s.status === "idle",
                    );
                    if (!nextIdle) return m;
                    return {
                      ...m,
                      agentSteps: steps.map((s) =>
                        s.id === nextIdle.id
                          ? { ...s, status: "running" as AgentStatus }
                          : s,
                      ),
                    };
                  }),
                );
              } else {
                updateStep("developer", "running", msg);
              }
              break;
            }

            case "QA_START":
              updateStep("qa", "running", event.message);
              break;

            case "QA_REPORT":
              updateStep(
                "qa",
                event.passed ? "done" : "running",
                event.message,
              );
              break;

            case "COMPLETE":
              receivedComplete = true;
              updateStep("qa", "done", "All checks passed!");
              onStreamCode?.(event.html); // show final HTML in code tab
              onGeneratingChange?.(false); // unlock Preview tab

              deepHtmlRef.current = event.html;
              setDeepHtml?.(event.html, event.brandName);

              const finalHtml = await runVisualQA(
                event.html,
                agentMessage.id,
                updateStep,
              );

              if (finalHtml !== event.html) {
                deepHtmlRef.current = finalHtml;
                setDeepHtml?.(finalHtml, event.brandName);
              }

              const thumb = await captureScreenshot(finalHtml);
              setRatingState({
                prompt,
                html: finalHtml,
                model: selectedModel,
                submitted: false,
                rating: null,
                showFeedback: false,
                feedbackItems: [],
                feedbackText: "",
                docId: null,
                submittedFeedback: [],
              });

              setMessages((prev) =>
                prev.map((m) =>
                  m.id === agentMessage.id
                    ? {
                        ...m,
                        isGenerating: false,
                        content: `Your **${event.brandName}** website is ready! It's showing in the preview.\n\n${event.creditsUsed ? `**${event.creditsUsed} credits** used for this generation.` : ""}\n\nDescribe changes and I'll rebuild it for you. Model: **${activeModel.label}**.`,
                        thumbnail: thumb,
                      }
                    : m,
                ),
              );

              await refreshCredits();
              if (autoStartKey) sessionStorage.removeItem(autoStartKey);
              break;

            case "ERROR":
              receivedError = true;
              onGeneratingChange?.(false);
              updateStep("architect", "error", event.message);
              updateStep("developer", "error");
              updateStep("qa", "error");
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === agentMessage.id
                    ? {
                        ...m,
                        isGenerating: false,
                        content: `❌ ${event.message}`,
                      }
                    : m,
                ),
              );
              await refreshCredits();
              if (autoStartKey) sessionStorage.removeItem(autoStartKey);
              break;
          }
        }
      }
    } catch (err: any) {
      // Ignore abort errors — handleStop already updated the UI
      if (err.name === "AbortError") return;

      await refreshCredits();
      // NO_CREDITS message comes directly from the server with exact counts
      const errorMsg = err.message.startsWith("Not enough")
        ? `💳 ${err.message}`
        : "Something went wrong. Please try again.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === agentMessage.id
            ? { ...m, isGenerating: false, content: `❌ ${errorMsg}` }
            : m,
        ),
      );
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
      clearTimeout(timeoutWarning);
    }
  };

  // ── Extract page IDs from current HTML for classifier context ──
  const extractExistingPages = (): string[] => {
    const html = deepHtmlRef.current;
    if (!html) return [];
    const matches = [...html.matchAll(/id="page-([a-z0-9-]+)"/g)];
    return [...new Set(matches.map((m) => m[1]))];
  };

  // ── Find all CC section occurrences across pages ──
  const findSectionPages = (
    sectionName: string,
  ): { id: string; label: string }[] => {
    const html = deepHtmlRef.current;
    if (!html) return [];
    // Find all page-X sections that contain CC:sectionName
    const pageMatches = [
      ...html.matchAll(
        /<section[^>]*id="page-([a-z0-9-]+)"[^>]*>[\s\S]*?<!-- CC:sectionName[\s\S]*?<\/section>/g,
      ),
    ];
    // Simpler: find the page context around each CC marker
    const ccPattern = new RegExp(`<!-- CC:${sectionName} -->`, "g");
    const results: { id: string; label: string }[] = [];
    let match;
    while ((match = ccPattern.exec(html)) !== null) {
      // Look backwards for the nearest id="page-X"
      const before = html.slice(0, match.index);
      const pageMatch = [...before.matchAll(/id="page-([a-z0-9-]+)"/g)].pop();
      if (pageMatch) {
        const id = pageMatch[1];
        if (!results.find((r) => r.id === id)) {
          results.push({
            id,
            label: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " "),
          });
        }
      }
    }
    return results;
  };

  const getLatestHtml = () => {
    try {
      const iframe = document.querySelector(
        'iframe[title="Deep Dive Preview"]',
      ) as HTMLIFrameElement;
      if (iframe?.contentDocument) {
        const clone = iframe.contentDocument.documentElement.cloneNode(
          true,
        ) as HTMLElement;
        clone.querySelector("#crawlcube-editor-script")?.remove();
        clone.querySelector("#crawlcube-editor-style")?.remove();
        clone
          .querySelectorAll(".editor-hover-outline")
          .forEach((el) => el.classList.remove("editor-hover-outline"));
        let finalHtml = "<!DOCTYPE html>\n" + clone.outerHTML;
        finalHtml = finalHtml.replace(/\\n/g, "");
        return finalHtml;
      }
    } catch (e) {
      console.warn("Failed to get live HTML from iframe", e);
    }
    return deepHtmlRef.current;
  };

  // ── Smart surgical edit — uses section markers when available ──
  const handleSurgicalEdit = async (
    instruction: string,
    editMeta?: { section?: string; scope?: string; action?: string },
    targetPageId?: string,
  ) => {
    const currentHtml = getLatestHtml();
    if (!currentHtml) return;

    // If section identified and exists on multiple pages, ask which page first
    if (
      editMeta?.section &&
      !targetPageId &&
      editMeta.scope !== "navbar" &&
      editMeta.scope !== "head"
    ) {
      const sectionPages = findSectionPages(editMeta.section);
      if (sectionPages.length > 1) {
        setPagePicker({
          instruction,
          section: editMeta.section,
          pages: sectionPages,
          editMeta,
        });
        return; // Wait for user to pick a page
      }
    }

    const thinkingMsg: Message = {
      id: Date.now().toString() + "-editing",
      role: "assistant",
      content: "",
      isGenerating: true,
    };
    setMessages((prev) => [...prev, thinkingMsg]);
    setIsEditing(true);
    setLoading(true);

    try {
      const body: any = {
        html: currentHtml,
        instruction,
        action: editMeta?.action ?? "section_edit",
        targetSection: editMeta?.section ?? null,
        targetPage: targetPageId ?? null,
        model: selectedModel, // ← add this
      };

      const res = await fetch("/api/edit-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 402) {
        const errData = await res.json();
        throw new Error(errData.message ?? "Not enough credits.");
      }
      if (!res.ok) throw new Error("Edit failed");

      const data = await res.json();

      // Server says section markers missing — fall back to legacy edit
      if (data.fallback) {
        // Remove the thinking bubble added by handleSurgicalEdit first,
        // then delegate to handleEditRequest which adds its own user+thinking pair.
        setMessages((prev) => prev.filter((m) => m.id !== thinkingMsg.id));
        setLoading(false);
        setIsEditing(false);
        await handleEditRequest(instruction);
        return;
      }

      if (!data.html) throw new Error("No HTML returned");

      deepHtmlRef.current = data.html;
      setDeepHtml?.(data.html);
      await refreshCredits();

      setMessages((prev) =>
        prev.map((m) =>
          m.isGenerating
            ? {
                ...m,
                isGenerating: false,
                content: `✅ Done! **${data.creditsUsed} credit${data.creditsUsed === 1 ? "" : "s"}** used.\n\nWant to make more changes?`,
              }
            : m,
        ),
      );
    } catch (err: any) {
      await refreshCredits();
      const errorMsg = err.message.startsWith("Not enough")
        ? `💳 ${err.message}`
        : "Edit failed. Want me to regenerate the whole site instead?";
      setMessages((prev) =>
        prev.map((m) =>
          m.isGenerating
            ? { ...m, isGenerating: false, content: `❌ ${errorMsg}` }
            : m,
        ),
      );
    } finally {
      setLoading(false);
      setIsEditing(false);
      setPagePicker(null);
    }
  };

  // ── Add a new page to existing site ──
  const handleAddPage = async (
    pageId: string,
    pageLabel: string,
    businessContext: string,
  ) => {
    const currentHtml = getLatestHtml();
    if (!currentHtml) return;

    const thinkingMsg: Message = {
      id: Date.now().toString() + "-addpage",
      role: "assistant",
      content: "",
      isGenerating: true,
    };
    setMessages((prev) => [...prev, thinkingMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/edit-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: currentHtml,
          instruction: businessContext,
          action: "add_page",
          targetPage: pageId,
          pageLabel,
          model: selectedModel,
        }),
      });

      if (res.status === 402) {
        const errData = await res.json();
        throw new Error(errData.message ?? "Not enough credits.");
      }
      if (!res.ok) throw new Error("Add page failed");

      const data = await res.json();
      if (!data.html) throw new Error("No HTML returned");

      deepHtmlRef.current = data.html;
      setDeepHtml?.(data.html);
      await refreshCredits();

      setMessages((prev) =>
        prev.map((m) =>
          m.isGenerating
            ? {
                ...m,
                isGenerating: false,
                content: `✅ **${data.addedPage?.label ?? pageLabel}** page added! **${data.creditsUsed} credit${data.creditsUsed === 1 ? "" : "s"}** used.\n\nWant to make more changes?`,
              }
            : m,
        ),
      );
    } catch (err: any) {
      await refreshCredits();
      setMessages((prev) =>
        prev.map((m) =>
          m.isGenerating
            ? {
                ...m,
                isGenerating: false,
                content: `❌ Failed to add page. Try again.`,
              }
            : m,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Surgical edit via /api/edit-html ──
  const handleEditRequest = async (instruction: string) => {
    const currentHtml = getLatestHtml();
    if (!currentHtml) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: instruction,
    };
    const thinkingMessage: Message = {
      id: Date.now().toString() + "-editing",
      role: "assistant",
      content: "",
      isGenerating: true,
    };

    setMessages((prev) => [...prev, userMessage, thinkingMessage]);
    setInput("");
    setIsEditing(true);
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await fetch("/api/edit-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: currentHtml, instruction }),
      });

      if (res.status === 402) {
        const errData = await res.json();
        throw new Error(errData.message ?? "Not enough credits.");
      }
      if (!res.ok) throw new Error("Edit failed");

      const data = await res.json();
      if (!data.html) throw new Error("No HTML returned");

      deepHtmlRef.current = data.html;
      setDeepHtml?.(data.html);
      await refreshCredits();

      setMessages((prev) =>
        prev.map((m) =>
          m.isGenerating
            ? {
                ...m,
                isGenerating: false,
                content: `✅ Done! **${data.creditsUsed} credit${data.creditsUsed === 1 ? "" : "s"}** used.\n\nWant to make more changes?`,
              }
            : m,
        ),
      );
    } catch (err: any) {
      await refreshCredits();
      const errorMsg = err.message.startsWith("Not enough")
        ? `💳 ${err.message}`
        : "Edit failed. Want me to regenerate the whole site instead?";
      setMessages((prev) =>
        prev.map((m) =>
          m.isGenerating
            ? { ...m, isGenerating: false, content: `❌ ${errorMsg}` }
            : m,
        ),
      );
    } finally {
      setLoading(false);
      setIsEditing(false);
    }
  };

  // ── Conversational chat handler — routes through AI brain first ──
  const handleGenerate = async (
    promptOverride?: string,
    fromQuestionChip?: boolean,
  ) => {
    const prompt = promptOverride ?? input.trim();
    if (!prompt || loading) return;

    console.log(
      "[handleGenerate] prompt:",
      prompt,
      "mode:",
      mode,
      "promptOverride:",
      promptOverride,
    );

    // Suggestion chips bypass conversational layer — option chips do not
    const isOptionChip =
      promptOverride === "Yes, start the build" ||
      promptOverride === "Not yet, I want to change something";
    if (promptOverride && !isOptionChip && !fromQuestionChip) {
      if (mode === "deep") {
        handleDeepDive(promptOverride);
      } else {
        handleFastGenerate(promptOverride);
      }
      return;
    }
    console.log("[handleGenerate] reached mode check, mode:", mode);
    // Fast mode — no conversational layer, just generate
    if (mode === "fast") {
      handleFastGenerate();
      return;
    }

    // ── Deep Dive: route through AI brain ──

    // Last 6 non-generating messages for context
    const recentHistory = messages
      .filter((m) => !m.isGenerating && m.content)
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    recentHistory.push({ role: "user", content: prompt });

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
    };
    const thinkingMsg: Message = {
      id: Date.now().toString() + "-thinking",
      role: "assistant",
      content: "",
      isGenerating: true,
    };

    setMessages((prev) => [...prev, userMsg, thinkingMsg]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: recentHistory,
          brief: briefRef.current,
          hasExistingWebsite: !!deepHtmlRef.current,
          existingPages: extractExistingPages(),
        }),
      });

      const data = await res.json();
      const {
        action,
        message,
        prompt: aiPrompt,
        updatedBrief,
        editMeta,
        newPage,
        questions,
      } = data;

      // Always update running brief if AI returned one
      if (updatedBrief) briefRef.current = updatedBrief;

      const resolveThinking = (content: string, qs?: typeof questions) => {
        console.log("[resolveThinking] qs:", qs);
        setMessages((prev) =>
          prev.map((m) =>
            m.isGenerating
              ? { ...m, isGenerating: false, content, questions: qs }
              : m,
          ),
        );
      };

      switch (action) {
        case "chat": {
          // Safety net — if message looks like leaked raw JSON, don't show it
          const looksLikeJson =
            message?.trim().startsWith("{") || message?.includes("```json");

          // Safety net — if AI returned "chat" but user said yes + we have a pending prompt, force generate
          const isAffirmative =
            /^(yes|yep|sure|ok|okay|go|build|start|do it|let'?s go|proceed|generate|yeah|yup|absolutely|perfect|ready)[\s!.]*$/i.test(
              prompt.trim(),
            );
          if (isAffirmative && pendingPromptRef.current) {
            resolveThinking(message || "Starting now! 🚀");
            handleDeepDive(pendingPromptRef.current);
            pendingPromptRef.current = null;
            break;
          }

          console.log("[chat] questions from API:", questions);

          // Safety net — if message sounds like a confirmation but action was "chat",
          // treat it as confirm and show Yes/No chips
          const looksLikeConfirm =
            /make sure|got everything|ready to build|shall I|should I start|want me to|go ahead|ready\?|start building|begin/i.test(
              message ?? "",
            );

          if (looksLikeConfirm && !questions?.length) {
            setMessages((prev) =>
              prev.map((m) =>
                m.isGenerating
                  ? {
                      ...m,
                      isGenerating: false,
                      content: message,
                      options: [
                        {
                          label: "Yes, build it!",
                          value: "Yes, start the build",
                        },
                        {
                          label: "Not yet",
                          value: "Not yet, I want to change something",
                        },
                      ],
                    }
                  : m,
              ),
            );
            pendingPromptRef.current = briefRef.current || prompt;
            break;
          }

          resolveThinking(
            looksLikeJson ? "Got it! Let me help with that." : message,
            questions?.length ? questions : undefined,
          );
          break;
        }

        case "confirm":
          setMessages((prev) =>
            prev.map((m) =>
              m.isGenerating
                ? {
                    ...m,
                    isGenerating: false,
                    content: message,
                    options: [
                      {
                        label: "Yes, build it!",
                        value: "Yes, start the build",
                      },
                      {
                        label: "Not yet",
                        value: "Not yet, I want to change something",
                      },
                    ],
                  }
                : m,
            ),
          );
          pendingPromptRef.current = aiPrompt ?? pendingPromptRef.current;
          break;

        case "build_now":
          // Rich prompt — show a brief "building now" message then start
          resolveThinking(
            message ||
              "Great, I have everything I need — building your site now! 🚀",
          );
          const buildNowPrompt = aiPrompt || briefRef.current || prompt;
          handleDeepDive(buildNowPrompt);
          pendingPromptRef.current = null;
          break;

        case "generate":
          // User confirmed after a "confirm" — use stored brief or AI prompt
          resolveThinking(message || "Starting now! 🚀");
          const buildPrompt =
            pendingPromptRef.current || aiPrompt || briefRef.current || prompt;
          handleDeepDive(buildPrompt);
          pendingPromptRef.current = null;
          break;

        case "edit":
          resolveThinking(message);
          if (aiPrompt) handleSurgicalEdit(aiPrompt, editMeta);
          break;

        case "add_page":
          resolveThinking(message);
          if (newPage?.pageId) {
            handleAddPage(
              newPage.pageId,
              newPage.pageLabel,
              aiPrompt || briefRef.current || prompt,
            );
          }
          break;

        default:
          resolveThinking(message || "Something went wrong. Try again!");
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.isGenerating
            ? {
                ...m,
                isGenerating: false,
                content: "Something went wrong. Try again!",
              }
            : m,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleGenerate();
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant" as const,
        content:
          "Hi! I'm CrawlCube. Describe the website you want to build and I'll generate it instantly.",
      },
    ]);
    setCurrentLayout(null);
    setLayout(null);
    briefRef.current = "";
    pendingPromptRef.current = null;
    onNewChat?.();
  };

  // ── Capture screenshot of HTML string using a hidden iframe + html2canvas ──
  // Capture a single screenshot from an already-loaded iframe document
  const captureIframeDoc = async (
    doc: Document,
    width: number,
    fullPage: boolean,
  ): Promise<string | null> => {
    try {
      const scrollHeight = doc.documentElement.scrollHeight;
      // Cap full page height at 4000px — beyond that adds cost with no QA benefit
      const captureHeight = fullPage
        ? Math.min(scrollHeight, 4000)
        : Math.min(scrollHeight, 900);

      const canvas = await html2canvas(doc.body, {
        width,
        height: captureHeight,
        useCORS: true,
        allowTaint: false,
        logging: false,
        windowWidth: width,
        windowHeight: captureHeight,
        scrollX: 0,
        scrollY: 0,
      });

      // Scale down to max 800px wide for smaller base64 payload
      const MAX_WIDTH = 800;
      const scale = Math.min(1, MAX_WIDTH / canvas.width);
      const scaledWidth = Math.floor(canvas.width * scale);
      const scaledHeight = Math.floor(canvas.height * scale);

      const scaled = document.createElement("canvas");
      scaled.width = scaledWidth;
      scaled.height = scaledHeight;
      const ctx = scaled.getContext("2d");
      if (!ctx) return canvas.toDataURL("image/jpeg", 0.7);

      ctx.drawImage(canvas, 0, 0, scaledWidth, scaledHeight);

      // JPEG at 70% quality — much smaller than PNG, still readable by vision model
      return scaled.toDataURL("image/jpeg", 0.7);
    } catch (err) {
      console.error("[html2canvas] error:", err);
      return null;
    }
  };

  // Load HTML into an iframe at a given width, wait for render, return doc
  const loadIframe = (
    html: string,
    width: number,
  ): Promise<{ doc: Document; cleanup: () => void } | null> => {
    return new Promise((resolve) => {
      const iframe = document.createElement("iframe");
      iframe.style.cssText = `position:fixed;left:-9999px;top:0;width:${width}px;height:900px;opacity:0;pointer-events:none;border:none;`;

      const cleanup = () => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      };

      let isResolved = false;

      const finishAndCapture = async () => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(timeout);

        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc || !doc.body) {
          cleanup();
          resolve(null);
          return;
        }
        resolve({ doc, cleanup });
      };

      // Force capture after 10s even if onload is blocked by hanging fonts/scripts
      const timeout = setTimeout(finishAndCapture, 10000);

      iframe.onload = async () => {
        await new Promise((r) => setTimeout(r, 3000)); // wait for fonts + images
        finishAndCapture();
      };

      iframe.onerror = () => {
        clearTimeout(timeout);
        cleanup();
        resolve(null);
      };
      document.body.appendChild(iframe);

      // Write HTML directly to the iframe document to guarantee exact same-origin
      // and ensure onload fires reliably across all browsers.
      const idoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (idoc) {
        idoc.open();
        idoc.write(html);
        idoc.close();
      } else {
        iframe.srcdoc = html; // fallback
      }
    });
  };

  // Main screenshot function — captures desktop + mobile, full page
  const captureScreenshot = async (html: string): Promise<string | null> => {
    // We return only the desktop viewport screenshot for the chat thumbnail
    // but runVisualQA uses captureAllScreenshots for thorough review
    const result = await loadIframe(html, 1280);
    if (!result) return null;
    const { doc, cleanup } = result;
    const screenshot = await captureIframeDoc(doc, 1280, false);
    cleanup();
    return screenshot;
  };

  // Full QA screenshots — desktop full page + mobile viewport + mobile full page
  const captureAllScreenshots = async (
    html: string,
  ): Promise<{
    desktopFull: string | null;
    mobileViewport: string | null;
    mobileFull: string | null;
  }> => {
    // Desktop — full page
    const desktopResult = await loadIframe(html, 1280);
    let desktopFull: string | null = null;
    if (desktopResult) {
      desktopFull = await captureIframeDoc(desktopResult.doc, 1280, true);
      desktopResult.cleanup();
    }

    // Mobile — viewport only (full page mobile adds minimal QA value)
    const mobileResult = await loadIframe(html, 390);
    let mobileViewport: string | null = null;
    if (mobileResult) {
      mobileViewport = await captureIframeDoc(mobileResult.doc, 390, false);
      mobileResult.cleanup();
    }

    return { desktopFull, mobileViewport, mobileFull: null };
  };

  // ── Run visual QA on generated HTML ──
  const runVisualQA = async (
    html: string,
    agentMessageId: string,
    updateStep: (
      id: string,
      status: AgentStatus,
      message?: string,
      detail?: string,
    ) => void,
  ): Promise<string> => {
    updateStep(
      "visual-qa",
      "running",
      "Capturing desktop + mobile screenshots...",
    );

    const screenshots = await captureAllScreenshots(html);
    const hasAnyScreenshot =
      screenshots.desktopFull || screenshots.mobileViewport;

    if (!hasAnyScreenshot) {
      updateStep(
        "visual-qa",
        "done",
        "Visual review skipped (screenshot unavailable)",
      );
      return html;
    }

    try {
      updateStep(
        "visual-qa",
        "running",
        "Analyzing desktop and mobile layouts...",
      );

      const qaRes = await fetch("/api/visual-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          desktopImage: screenshots.desktopFull,
          mobileImage: screenshots.mobileViewport,
          // html intentionally excluded — vision model reviews images only
          // html is still passed to /api/fix-html separately
        }),
      });

      const qaReport = await qaRes.json();

      if (qaReport.passed || !qaReport.issues?.length) {
        updateStep(
          "visual-qa",
          "done",
          "Layout looks great! No visual issues found.",
        );
        if (screenshots.desktopFull) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === agentMessageId
                ? { ...m, thumbnail: screenshots.desktopFull }
                : m,
            ),
          );
        }
        return html;
      }

      // Issues found — send to fix
      updateStep(
        "visual-qa",
        "running",
        `Found ${qaReport.issues.length} layout issue(s). Fixing...`,
        qaReport.issues.slice(0, 2).join(" · "),
      );

      const fixRes = await fetch("/api/fix-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, issues: qaReport.issues }),
      });

      const fixData = await fixRes.json();

      if (fixData.html) {
        updateStep(
          "visual-qa",
          "done",
          `Fixed ${qaReport.issues.length} layout issue(s) ✓`,
        );
        // Show before/after screenshots in chat
        if (screenshots.desktopFull) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === agentMessageId
                ? { ...m, thumbnail: screenshots.desktopFull }
                : m,
            ),
          );
        }
        return fixData.html;
      } else {
        updateStep("visual-qa", "done", "Fix attempted — showing best result.");
        return html;
      }
    } catch {
      updateStep("visual-qa", "done", "Visual review completed.");
      return html;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear the auto-start lock so user can retry from landing page
    if (autoStartKey) sessionStorage.removeItem(autoStartKey);

    setLoading(false);

    // Mark any in-progress agent message as stopped
    setMessages((prev) =>
      prev.map((m) =>
        m.isGenerating
          ? {
              ...m,
              isGenerating: false,
              content: "Generation stopped.",
              agentSteps: m.agentSteps?.map((s) =>
                s.status === "running"
                  ? {
                      ...s,
                      status: "error" as AgentStatus,
                      message: "Stopped by user.",
                    }
                  : s,
              ),
            }
          : m,
      ),
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            crawlcube.ai
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasLayout && onShowPreview && (
            <button
              onClick={onShowPreview}
              className="flex md:hidden items-center gap-1.5 text-xs font-medium bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-all px-3 py-1.5 rounded-lg cursor-pointer"
            >
              Preview
            </button>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            New chat
          </button>
        </div>
      </div>

      {/* Mode toggle */}
      {/* Mode toggle */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <button
          onClick={() => setMode("fast")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          style={{
            background:
              mode === "fast" ? "rgba(168,85,247,0.15)" : "transparent",
            color: mode === "fast" ? "#d8b4fe" : "#525252",
            border: `1px solid ${mode === "fast" ? "#a855f7" : "#2a2a2a"}`,
          }}
        >
          <Zap className="w-3 h-3" />
          Fast · 1 credit
        </button>
        <button
          onClick={() => setMode("deep")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          style={{
            background:
              mode === "deep" ? "rgba(236,72,153,0.15)" : "transparent",
            color: mode === "deep" ? "#f9a8d4" : "#525252",
            border: `1px solid ${mode === "deep" ? "#ec4899" : "#2a2a2a"}`,
          }}
        >
          <Telescope className="w-3 h-3" />
          Deep Dive
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-[#262626] scrollbar-track-transparent">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <div className="w-7 h-7 flex items-center justify-center shrink-0 mt-0.5">
                <img
                  src={Logo.src}
                  alt="CrawlCube"
                  className="w-6 h-6 opacity-80"
                />
              </div>
            )}

            <div
              className={`max-w-[85%] text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60 text-neutral-900 dark:text-neutral-100 rounded-2xl rounded-tr-sm px-4 py-3"
                  : "bg-transparent text-neutral-800 dark:text-neutral-300 rounded-2xl rounded-tl-sm px-0 py-0"
              }`}
            >
              {/* Generation progress — new accordion UI */}
              {message.agentSteps && message.agentSteps.length > 0 && (
                <div className="mb-3 pb-3 border-b border-white/10">
                  <GenerationProgress
                    message={message}
                    onToggleArchitect={(msgId) => {
                      setMessages((prev) =>
                        prev.map((m) =>
                          m.id === msgId
                            ? { ...m, architectOpen: !m.architectOpen }
                            : m,
                        ),
                      );
                    }}
                  />
                </div>
              )}

              {/* Thumbnail — shown after Deep Dive completes */}
              {message.thumbnail && (
                <div
                  className="mb-3 rounded-lg overflow-hidden border border-neutral-700 cursor-pointer"
                  onClick={() => window.open(message.thumbnail!, "_blank")}
                  title="Click to view full screenshot"
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      paddingBottom: "56.25%",
                    }}
                  >
                    <img
                      src={message.thumbnail}
                      alt="Website preview"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "top",
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-neutral-800 border-t border-neutral-700">
                    <Eye className="w-3 h-3 text-pink-400" />
                    <span className="text-[10px] text-neutral-400">
                      Visual QA screenshot · Click to expand
                    </span>
                  </div>
                </div>
              )}

              {/* Quick-reply option chips — only rendered ONCE here, before the message text */}
              {message.options && message.options.length > 0 && !loading && (
                <div className="flex flex-wrap gap-2 px-1 pt-2">
                  {message.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        // Clear options so they disappear after click
                        setMessages((prev) =>
                          prev.map((m) =>
                            m.id === message.id
                              ? { ...m, options: undefined }
                              : m,
                          ),
                        );
                        setInput(opt.value);
                        // Simulate immediate send
                        setTimeout(() => handleGenerate(opt.value), 0);
                      }}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all cursor-pointer hover:bg-neutral-700/60"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid #3a3a3a",
                        color: "#d4d4d4",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Message text */}
              {/* Rating UI — shown after Deep Dive completes */}
              {!message.isGenerating &&
                message.content?.includes("website is ready") &&
                ratingState &&
                (() => {
                  const FEEDBACK_OPTIONS = [
                    "Mobile layout broken",
                    "Navbar not working",
                    "Wrong colors/theme",
                    "Missing sections",
                    "HTML incomplete",
                    "Content not relevant",
                    "Poor design quality",
                    "Page routing broken",
                  ];

                  const handlePositive = async () => {
                    setRatingState((r) =>
                      r
                        ? {
                            ...r,
                            rating: "positive",
                            submitted: true,
                            showFeedback: false,
                          }
                        : r,
                    );
                    try {
                      if (ratingState.docId) {
                        // Update existing record
                        await updateRating(ratingState.docId, "positive", []);
                      } else {
                        // First time rating — create record and store doc ID
                        const docId = await rateGeneration(
                          userId!,
                          "positive",
                          ratingState.prompt,
                          ratingState.html,
                          ratingState.model,
                        );
                        setRatingState((r) => (r ? { ...r, docId } : r));
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  };

                  const handleNegative = () => {
                    setRatingState((r) =>
                      r ? { ...r, rating: "negative", showFeedback: true } : r,
                    );
                  };

                  const handleFeedbackSubmit = async () => {
                    const feedback = [
                      ...ratingState.feedbackItems,
                      ...(ratingState.feedbackText.trim()
                        ? [`Custom: ${ratingState.feedbackText.trim()}`]
                        : []),
                    ];
                    setRatingState((r) =>
                      r
                        ? { ...r, submitted: true, submittedFeedback: feedback }
                        : r,
                    );
                    try {
                      if (ratingState.docId) {
                        // Update existing record
                        await updateRating(
                          ratingState.docId,
                          "negative",
                          feedback,
                        );
                      } else {
                        // First time rating — create record and store doc ID
                        const docId = await rateGeneration(
                          userId!,
                          "negative",
                          ratingState.prompt,
                          ratingState.html,
                          ratingState.model,
                          feedback,
                        );
                        setRatingState((r) => (r ? { ...r, docId } : r));
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  };

                  const handleRerate = () => {
                    setRatingState((r) =>
                      r
                        ? {
                            ...r,
                            submitted: false,
                            rating: null,
                            showFeedback: false,
                            feedbackItems: [],
                            feedbackText: "",
                            submittedFeedback: [],
                          }
                        : r,
                    );
                  };

                  const toggleFeedbackItem = (item: string) => {
                    setRatingState((r) =>
                      r
                        ? {
                            ...r,
                            feedbackItems: r.feedbackItems.includes(item)
                              ? r.feedbackItems.filter((i) => i !== item)
                              : [...r.feedbackItems, item],
                          }
                        : r,
                    );
                  };

                  return (
                    <div className="mt-4 pt-3 border-t border-neutral-800/60 font-mono text-[11px]">
                      {/* ── Submitted positive ── */}
                      {ratingState.submitted &&
                        ratingState.rating === "positive" && (
                          <div className="flex items-center justify-between mb-3">
                            <span className="flex items-center gap-2 text-emerald-500">
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              FEEDBACK RECORDED
                            </span>
                            <button
                              onClick={handleRerate}
                              className="text-neutral-700 hover:text-neutral-400 transition-colors cursor-pointer tracking-wide"
                            >
                              CHANGE
                            </button>
                          </div>
                        )}

                      {/* ── Submitted negative ── */}
                      {ratingState.submitted &&
                        ratingState.rating === "negative" && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-2 text-emerald-500">
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2.5}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                FEEDBACK SAVED
                              </span>
                              <button
                                onClick={handleRerate}
                                className="text-neutral-700 hover:text-neutral-400 transition-colors cursor-pointer tracking-wide"
                              >
                                CHANGE
                              </button>
                            </div>
                            {ratingState.submittedFeedback.length > 0 && (
                              <button
                                onClick={async () => {
                                  const fixPrompt = ratingState.prompt;
                                  const fixes = ratingState.submittedFeedback;
                                  const currentHtml = ratingState.html;
                                  setFixLoading(true);
                                  try {
                                    const res = await fetch("/api/fix-html", {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        html: currentHtml,
                                        issues: fixes,
                                      }),
                                    });
                                    const data = await res.json();
                                    if (data.requiresFullRegen) {
                                      handleDeepDive(fixPrompt, fixes);
                                    } else if (data.html) {
                                      setDeepHtml?.(data.html);
                                      setRatingState((r) =>
                                        r
                                          ? {
                                              ...r,
                                              html: data.html,
                                              submittedFeedback: [],
                                              submitted: false,
                                              rating: null,
                                              showFeedback: false,
                                            }
                                          : r,
                                      );
                                    }
                                  } catch {
                                    setRatingState(null);
                                    handleDeepDive(fixPrompt, fixes);
                                  } finally {
                                    setFixLoading(false);
                                  }
                                }}
                                disabled={fixLoading}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-neutral-700 hover:border-neutral-500 text-neutral-400 hover:text-neutral-200 transition-all cursor-pointer disabled:opacity-40 tracking-wide"
                              >
                                {fixLoading ? (
                                  <>
                                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                    APPLYING FIX...
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={2}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                      />
                                    </svg>
                                    AUTO-FIX AND REGENERATE
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}

                      {/* ── Initial rating buttons ── */}
                      {!ratingState.submitted && !ratingState.showFeedback && (
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-neutral-600 tracking-widest uppercase">
                            Rate
                          </span>
                          <div className="flex items-center gap-2 flex-1">
                            <button
                              onClick={handlePositive}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer tracking-wide"
                              style={{
                                borderColor:
                                  ratingState.rating === "positive"
                                    ? "rgba(52,211,153,0.5)"
                                    : "#2a2a2a",
                                background:
                                  ratingState.rating === "positive"
                                    ? "rgba(52,211,153,0.08)"
                                    : "transparent",
                                color:
                                  ratingState.rating === "positive"
                                    ? "#6ee7b7"
                                    : "#525252",
                              }}
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                                />
                              </svg>
                              LOOKS GREAT
                            </button>
                            <button
                              onClick={handleNegative}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-600 text-neutral-600 hover:text-neutral-400 transition-all cursor-pointer tracking-wide"
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
                                />
                              </svg>
                              NEEDS WORK
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ── Negative feedback form ── */}
                      {!ratingState.submitted && ratingState.showFeedback && (
                        <div className="space-y-3 mb-3">
                          <span className="text-neutral-600 tracking-widest uppercase">
                            What went wrong?
                          </span>
                          <div className="grid grid-cols-2 gap-1 mt-2">
                            {FEEDBACK_OPTIONS.map((item) => {
                              const selected =
                                ratingState.feedbackItems.includes(item);
                              return (
                                <button
                                  key={item}
                                  onClick={() => toggleFeedbackItem(item)}
                                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer"
                                  style={{
                                    borderColor: selected
                                      ? "rgba(248,113,113,0.4)"
                                      : "#2a2a2a",
                                    background: selected
                                      ? "rgba(248,113,113,0.07)"
                                      : "transparent",
                                    color: selected ? "#fca5a5" : "#525252",
                                  }}
                                >
                                  <div
                                    className="w-2 h-2 rounded-sm shrink-0 border transition-all"
                                    style={{
                                      borderColor: selected
                                        ? "#fca5a5"
                                        : "#404040",
                                      background: selected
                                        ? "#fca5a5"
                                        : "transparent",
                                    }}
                                  />
                                  {item}
                                </button>
                              );
                            })}
                          </div>
                          <textarea
                            value={ratingState.feedbackText}
                            onChange={(e) =>
                              setRatingState((r) =>
                                r ? { ...r, feedbackText: e.target.value } : r,
                              )
                            }
                            placeholder="Additional notes (optional)"
                            rows={2}
                            className="w-full bg-transparent border border-neutral-800 focus:border-neutral-600 rounded-lg px-3 py-2 text-neutral-400 placeholder:text-neutral-700 outline-none resize-none transition-colors"
                          />
                          <div className="flex items-center gap-3">
                            <button
                              onClick={handleFeedbackSubmit}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-700 hover:border-neutral-500 text-neutral-400 hover:text-neutral-200 transition-all cursor-pointer tracking-wide"
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              SUBMIT
                            </button>
                            <button
                              onClick={() =>
                                setRatingState((r) =>
                                  r ? { ...r, showFeedback: false } : r,
                                )
                              }
                              className="text-neutral-700 hover:text-neutral-500 transition-colors cursor-pointer tracking-wide"
                            >
                              CANCEL
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

              {/* Message text */}
              {/* Message text */}
              {message.isGenerating && !message.agentSteps ? (
                // Fast mode or chat API reply — static thinking
                <div className="px-1 py-0.5">
                  <ThinkingText label="Thinking" />
                </div>
              ) : message.isGenerating && message.agentSteps ? (
                // Deep dive — label derived from whichever step is currently running
                <div className="px-1 pt-2">
                  <ThinkingText label={getThinkingLabel(message.agentSteps)} />
                </div>
              ) : message.questions?.length ? (
                <QuestionCards
                  intro={message.content}
                  questions={message.questions}
                  onSubmit={(compiled) => {
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === message.id
                          ? { ...m, questions: undefined }
                          : m,
                      ),
                    );
                    handleGenerate(compiled, true);
                  }}
                />
              ) : (
                message.content && (
                  <>
                    <p className="whitespace-pre-wrap px-1 py-0.5 text-inherit text-[13px] leading-relaxed">
                      {message.content.split(/\*\*(.*?)\*\*/g).map((part, i) =>
                        i % 2 === 1 ? (
                          <strong
                            key={i}
                            className={`font-medium ${message.role === "user" ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-950 dark:text-neutral-100"}`}
                          >
                            {part}
                          </strong>
                        ) : (
                          part
                        ),
                      )}
                    </p>

                    {/* Options chips rendered above — not duplicated here */}
                  </>
                )
              )}
            </div>
          </div>
        ))}

        {/* ── Page picker — shown when edit section is ambiguous ── */}
        {pagePicker && (
          <div className="mx-1 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/60 space-y-2 font-mono text-[11px]">
            <p className="text-neutral-500 tracking-widest uppercase">
              Which page should I fix?
            </p>
            <div className="flex flex-wrap gap-2">
              {pagePicker.pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => {
                    const { instruction, section, editMeta } = pagePicker;
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: Date.now().toString(),
                        role: "user",
                        content: `Fix ${section} on the ${page.label} page`,
                      },
                    ]);
                    handleSurgicalEdit(instruction, editMeta, page.id);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 text-neutral-700 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-all cursor-pointer tracking-wide uppercase"
                >
                  {page.label}
                </button>
              ))}
              <button
                onClick={() => setPagePicker(null)}
                className="px-3 py-1.5 text-neutral-700 hover:text-neutral-500 transition-colors cursor-pointer tracking-wide"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}

        {/* Suggestion chips */}
        {messages.length === 1 && (
          <div className="space-y-2 mt-4">
            <p className="text-xs text-neutral-600 text-center">
              Try one of these:
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleGenerate(s)}
                  className="text-left text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-purple-500/50 dark:hover:border-purple-500/50 hover:text-neutral-900 dark:hover:text-neutral-200 rounded-xl px-3 py-2.5 transition-all duration-200 cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Theme selector — Fast Mode only */}
      {mode === "fast" && (
        <div className="px-4 pb-2">
          <button
            onClick={() => setShowThemes(!showThemes)}
            className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background:
                  selectedTheme === "corporate"
                    ? "#3b82f6"
                    : selectedTheme === "minimal"
                      ? "#a3a3a3"
                      : selectedTheme === "bold"
                        ? "#f97316"
                        : selectedTheme === "glassmorphism"
                          ? "#8b5cf6"
                          : "#d4af7a",
              }}
            />
            <span>
              Style:{" "}
              <strong className="text-neutral-300">
                {getThemeLabel(selectedTheme)}
              </strong>
            </span>
            <span className="opacity-50">
              · {THEME_DESCRIPTIONS[selectedTheme]}
            </span>
          </button>
          {showThemes && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {THEME_STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => {
                    setSelectedTheme(style);
                    setShowThemes(false);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg border transition-all duration-150 cursor-pointer"
                  style={{
                    borderColor:
                      selectedTheme === style ? "#a855f7" : "#2a2a2a",
                    background:
                      selectedTheme === style
                        ? "rgba(168,85,247,0.15)"
                        : "transparent",
                    color: selectedTheme === style ? "#d8b4fe" : "#737373",
                  }}
                >
                  {getThemeLabel(style)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input area */}
      {/* Input area */}
      <div className="px-4 pb-4">
        <div
          className="flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl transition-all duration-200 shadow-sm dark:shadow-none overflow-visible"
          style={{
            borderColor: loading
              ? mode === "deep"
                ? "#ec489944"
                : "#a855f744"
              : undefined,
          }}
        >
          {/* Textarea */}
          <div className="flex items-end gap-2 px-4 pt-3 pb-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === "deep" && deepHtmlRef.current
                  ? "Describe a change or type a new idea to regenerate..."
                  : mode === "deep"
                    ? "Describe your website for Deep Dive generation..."
                    : "Describe your website..."
              }
              rows={1}
              className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-neutral-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none resize-none max-h-30 scrollbar-none"
            />
          </div>

          {/* Bottom bar — model pill + send button */}
          <div className="flex items-center justify-between px-3 pb-2.5">
            {/* Left: model selector (Deep Dive) or fast mode label */}
            {mode === "deep" ? (
              <div className="relative">
                {selectedModel === "anthropic/claude-opus-4" && !loading && (
                  <div
                    className="mb-2 flex items-start gap-2 px-3 py-2 rounded-xl text-xs"
                    style={{
                      background: "rgba(234,179,8,0.08)",
                      border: "1px solid rgba(234,179,8,0.25)",
                      color: "#fde68a",
                    }}
                  >
                    <span className="shrink-0 mt-0.5">⏳</span>
                    <span>
                      Opus takes <strong>3–5 minutes</strong> and uses{" "}
                      <strong>300–500 credits</strong> for a complete site. For
                      faster results, try{" "}
                      <button
                        onClick={() =>
                          setSelectedModel("anthropic/claude-sonnet-4.6")
                        }
                        className="underline cursor-pointer hover:text-yellow-200 transition-colors"
                      >
                        Sonnet instead
                      </button>
                      .
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setShowModelPicker(!showModelPicker)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer"
                  style={{
                    background: "rgba(236,72,153,0.08)",
                    border: "1px solid rgba(236,72,153,0.25)",
                    color: "#f9a8d4",
                  }}
                >
                  <span
                    dangerouslySetInnerHTML={{
                      __html: activeModel.logo ?? CLAUDE_LOGO_SVG,
                    }}
                    className="shrink-0"
                  />
                  <span>{activeModel.label}</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>

                {/* Dropdown — opens upward */}
                {showModelPicker && (
                  <div className="absolute bottom-full mb-2 left-0 rounded-xl overflow-hidden z-50 min-w-48 bg-white dark:bg-[#141414] border border-neutral-200 dark:border-neutral-800 shadow-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                    {MODELS.map(
                      ({
                        model,
                        label,
                        sublabel,
                        minCreditsToStart,
                        credits: estimatedCredits,
                        logo,
                      }) => {
                        const currentCredits = credits ?? 0;
                        const insufficientCredits =
                          currentCredits < minCreditsToStart;
                        return (
                          <button
                            key={model}
                            onClick={() => {
                              if (!insufficientCredits) {
                                setSelectedModel(model);
                                setShowModelPicker(false);
                              }
                            }}
                            disabled={insufficientCredits}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                              insufficientCredits
                                ? "opacity-50 cursor-not-allowed bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                                : "cursor-pointer hover:bg-neutral-100 dark:hover:bg-white/5"
                            }`}
                            style={{
                              background:
                                selectedModel === model && !insufficientCredits
                                  ? "rgba(236,72,153,0.08)"
                                  : undefined,
                            }}
                          >
                            {/* Claude logo */}
                            <span
                              dangerouslySetInnerHTML={{
                                __html: logo ?? CLAUDE_LOGO_SVG,
                              }}
                              className={`shrink-0 self-start mt-0.5 ${
                                insufficientCredits
                                  ? "text-neutral-400 dark:text-neutral-600"
                                  : ""
                              }`}
                            />

                            {/* Label + sublabel */}
                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                              <span
                                className={`text-xs font-semibold truncate ${
                                  selectedModel === model &&
                                  !insufficientCredits
                                    ? "text-pink-400"
                                    : insufficientCredits
                                      ? "text-neutral-500"
                                      : "text-neutral-700 dark:text-neutral-200"
                                }`}
                              >
                                {label}
                              </span>
                              <span className="text-[10px] text-neutral-500 text-wrap leading-snug">
                                {sublabel}
                                {insufficientCredits && (
                                  <div className="text-red-500 dark:text-red-400 font-semibold mt-1">
                                    Requires {minCreditsToStart} credits (You
                                    have {Math.floor(currentCredits)}) to avoid
                                    truncation.
                                  </div>
                                )}
                              </span>
                            </div>

                            {/* Credits + checkmark */}
                            <div className="flex items-center gap-2 shrink-0 self-start mt-0.5">
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap"
                                style={{
                                  background:
                                    selectedModel === model &&
                                    !insufficientCredits
                                      ? "rgba(236,72,153,0.2)"
                                      : "rgba(255,255,255,0.06)",
                                  color:
                                    selectedModel === model &&
                                    !insufficientCredits
                                      ? "#f9a8d4"
                                      : insufficientCredits
                                        ? "#3f3f46"
                                        : "#525252",
                                }}
                              >
                                {estimatedCredits}
                              </span>
                              {selectedModel === model &&
                                !insufficientCredits && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                                )}
                            </div>
                          </button>
                        );
                      },
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: "rgba(168,85,247,0.12)",
                  border: "1px solid rgba(168,85,247,0.3)",
                  color: "#d8b4fe",
                }}
              >
                <Zap className="w-3 h-3" />
                <span>Fast Mode · 1 credit</span>
              </div>
            )}

            {/* Stop button (Deep Dive while loading) or Send button */}
            {mode === "deep" && loading ? (
              <button
                onClick={handleStop}
                className="shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-xl cursor-pointer transition-all duration-200 text-xs font-semibold"
                style={{
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.4)",
                  color: "#fca5a5",
                }}
              >
                <Square className="w-3 h-3 fill-current" />
                Stop
              </button>
            ) : (
              <button
                onClick={() => void handleGenerate()}
                disabled={loading || !input.trim()}
                className="shrink-0 w-8 h-8 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 cursor-pointer"
                style={{ background: mode === "deep" ? "#ec4899" : "#a855f7" }}
              >
                {loading ? (
                  <LoaderCircle className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-white" />
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-[10px] text-neutral-500 dark:text-neutral-700 mt-1.5 text-center">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
