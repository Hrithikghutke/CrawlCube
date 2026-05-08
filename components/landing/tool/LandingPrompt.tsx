"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  Zap,
  Telescope,
  Settings2,
  ChevronDown,
  Atom,
  FileCode2,
} from "lucide-react";
import { normalizeLayout } from "@/lib/normalizeLayout";
import { THEME_STYLES, getThemeLabel } from "@/lib/themeConfig";
import { ThemeStyle } from "@/types/layout";
import { useCredits } from "@/context/CreditsContext";
import Logo from "@/assets/logo.svg";
import { DEEP_DIVE_MODELS, CLAUDE_LOGO_SVG } from "@/lib/modelConfig";
import Image from "next/image";
import bgLogo from "@/assets/login-assets/bg-logo-login.svg";

type GenerationMode = "fast" | "deep";

const useTypewriter = (
  words: string[],
  typingSpeed = 80,
  deletingSpeed = 40,
  pause = 1800,
) => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (subIndex === words[index].length + 1 && isDeleting!) {
      setTimeout(() => setIsDeleting(true), pause);
      return;
    }
    if (subIndex === 0 && isDeleting) {
      setIsDeleting(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }
    const timeout = setTimeout(
      () => setSubIndex((prev) => prev + (isDeleting ? -1 : 1)),
      isDeleting ? deletingSpeed : typingSpeed,
    );
    setText(words[index].substring(0, subIndex));
    return () => clearTimeout(timeout);
  }, [subIndex, index, isDeleting, words, typingSpeed, deletingSpeed, pause]);

  return text;
};

const PLACEHOLDERS = [
  "Create a modern gym website with pricing plans...",
  "Design a SaaS landing page for a project management tool...",
  "Build a premium portfolio site for a photographer...",
  "Make a restaurant website with an elegant dark theme...",
  "Create a tech startup website with glassmorphism style...",
];

const THEME_DESCRIPTIONS: Record<ThemeStyle, string> = {
  minimal: "Clean & spacious",
  bold: "High contrast & punchy",
  glassmorphism: "Frosted glass effects",
  elegant: "Refined & sophisticated",
  corporate: "Professional & formal",
};

export default function LandingPrompt() {
  const router = useRouter();
  const { credits, deductCredit, refreshCredits } = useCredits();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeStyle>("corporate");
  const [selectedMode, setSelectedMode] = useState<GenerationMode>("deep");
  const [selectedModel, setSelectedModel] = useState(
    "google/gemini-3-flash-preview",
  );

  const [selectedStack, setSelectedStack] = useState<"html" | "react">("html");
  const [showStackPicker, setShowStackPicker] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const animatedPlaceholder = useTypewriter(PLACEHOLDERS);

  const MODELS = DEEP_DIVE_MODELS;
  const activeModel =
    MODELS.find((m) => m.model === selectedModel) ?? MODELS[0];

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);

    // ── REACT MODE ──
    if (selectedStack === "react") {
      sessionStorage.setItem("crawlcube_react_prompt", prompt);
      sessionStorage.setItem("crawlcube_react_model", selectedModel);
      sessionStorage.removeItem("crawlcube_react_messages");
      sessionStorage.removeItem("crawlcube_react_files");
      router.push("/react-builder");
      return;
    }

    // ── DEEP DIVE MODE ──
    if (selectedMode === "deep") {
      const isDetailedPrompt = prompt.trim().length > 500;

      sessionStorage.setItem("crawlcube_mode", "deep");
      sessionStorage.setItem("crawlcube_model", selectedModel);
      sessionStorage.removeItem("crawlcube_layout");
      sessionStorage.removeItem("crawlcube_deep_html");
      sessionStorage.removeItem("crawlcube_messages");
      sessionStorage.removeItem("crawlcube_brief");
      sessionStorage.removeItem("crawlcube_savedId");

      if (isDetailedPrompt) {
        sessionStorage.setItem("crawlcube_prompt", prompt);
        sessionStorage.removeItem("crawlcube_seed_messages");
        router.push("/build");
        return;
      }

      try {
        const chatRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            brief: "",
            hasExistingWebsite: false,
            existingPages: [],
          }),
        });

        const chatData = await chatRes.json();
        const action = chatData.action ?? "chat";

        if (action === "build_now" || action === "generate") {
          sessionStorage.setItem(
            "crawlcube_prompt",
            chatData.prompt ?? chatData.updatedBrief ?? prompt,
          );
          sessionStorage.removeItem("crawlcube_seed_messages");
        } else {
          sessionStorage.removeItem("crawlcube_prompt");
          sessionStorage.setItem(
            "crawlcube_seed_messages",
            JSON.stringify([
              { role: "user", content: prompt },
              {
                role: "assistant",
                content:
                  chatData.message ??
                  "Tell me more about what you'd like to build.",
                questions: chatData.questions ?? undefined,
              },
            ]),
          );
        }

        router.push("/build");
      } catch {
        setError("Something went wrong. Please try again.");
        setLoading(false);
      }
      return;
    }

    // ── FAST MODE ──
    deductCredit();

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, themeStyle: selectedTheme }),
      });

      const data = await res.json();

      if (res.status === 402) throw new Error("NO_CREDITS");
      if (!res.ok || !data.layout) throw new Error("Generation failed");

      const normalized = normalizeLayout(data.layout);
      normalized.themeStyle = selectedTheme;

      sessionStorage.setItem("crawlcube_layout", JSON.stringify(normalized));
      sessionStorage.setItem("crawlcube_prompt", prompt);
      sessionStorage.setItem("crawlcube_mode", "fast");
      sessionStorage.removeItem("crawlcube_savedId");
      sessionStorage.removeItem("crawlcube_deep_html");
      sessionStorage.removeItem("crawlcube_messages");
      sessionStorage.removeItem("crawlcube_brief");

      await refreshCredits();
      router.push("/build");
    } catch (err: any) {
      await refreshCredits();
      setError(
        err.message === "NO_CREDITS"
          ? "You're out of credits. Purchase more to keep building!"
          : "Something went wrong. Please try again.",
      );
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey || e.shiftKey === false)) {
      if (!e.shiftKey) {
        e.preventDefault();
        handleGenerate();
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center w-full min-h-[70vh] justify-center pb-12 pt-8 sm:pt-20 px-4 md:px-0 scroll-hidden">
      <div className="absolute top-0 left-0  -z-10">
        <Image src={bgLogo} alt="Robot" width={850} />
      </div>

      {/* Hero Headings */}
      {/* ── Content ── */}
      <div className="relative z-10 max-w-4xl mx-auto px-6  pb-10 text-center">
        {/* Badge pill */}
        <div className="inline-block mb-6 bg-background border border-border rounded-full px-4 py-1.5 text-[13px] tracking-wide text-foreground/80">
          ✦ AI Website Builder — Free to Start
        </div>

        {/* H1 Headline */}
        <h1
          className="font-bold text-foreground leading-[1.1] mb-6"
          style={{ fontSize: "clamp(32px, 5vw, 68px)" }}
        >
          What Do You Want To Build Today?
        </h1>

        {/* Subheadline */}
        <p
          className="mx-auto  text-muted-foreground"
          style={{
            fontSize: "clamp(16px, 2vw, 18px)",
            maxWidth: 600,
            lineHeight: 1.7,
          }}
        >
          Describe your business in plain English. CrawlCube generates a
          complete, multi-page website with custom branding, real content, and
          animations — ready to download or deploy instantly.
        </p>
      </div>

      {/* Input Shell */}
      <div className="relative z-20 w-full max-w-3xl mx-auto rounded-3xl  bg-background shadow-2xl transition-colors">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={animatedPlaceholder}
          rows={3}
          className="w-full resize-none bg-transparent px-5 pt-5 pb-16 text-base text-foreground outline-none placeholder:text-muted-foreground dark:placeholder:text-muted-foreground scrollbar-none"
        />

        {/* Bottom Toolbar inside textarea */}
        <div className="absolute bottom-3 left-4 right-3 flex items-center justify-between pointer-events-none">
          {/* Action Chips */}
          <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
            {/* Stack Toggle Button */}
            <div className="relative">
              <button
                suppressHydrationWarning
                onClick={() => setShowStackPicker(!showStackPicker)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background/50 hover:bg-secondary text-[11px] font-semibold text-muted-foreground transition-colors cursor-pointer"
              >
                {selectedStack === "react" ? (
                  <Atom className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <FileCode2 className="w-3 h-3 text-muted-foreground" />
                )}
                {selectedStack === "react" ? (
                  <span>
                    React{""}
                    <span className="text-[9px] text-[#C9A84C] ml-0.5">
                      BETA
                    </span>
                  </span>
                ) : (
                  "HTML + JS"
                )}
                <ChevronDown className="w-3 h-3 opacity-40 ml-0.5" />
              </button>

              {showStackPicker && (
                <div className="absolute top-full mb-2 sm:mb-0 sm:mt-2 left-0 sm:bottom-auto bottom-full w-48 bg-background dark:bg-[#141414] border border-border rounded-xl shadow-xl overflow-hidden z-30">
                  <button
                    onClick={() => {
                      setSelectedStack("html");
                      setShowStackPicker(false);
                    }}
                    className="w-full flex items-center gap-2 p-3 text-left hover:bg-background /5 transition-colors cursor-pointer"
                  >
                    <FileCode2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className="block text-xs font-semibold text-foreground">
                        HTML + JS
                      </span>
                      <span className="block text-[10px] text-muted-foreground">
                        Vanilla framework-less
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedStack("react");
                      setShowStackPicker(false);
                    }}
                    className="w-full flex items-center gap-2 p-3 text-left hover:bg-background /5 transition-colors cursor-pointer"
                  >
                    <Atom className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className=" text-xs font-semibold text-foreground flex items-center gap-1.5">
                        React{""}
                        <span className="text-[9px] py-0.5 px-1 rounded border border-[#C9A84C]/30 text-[#C9A84C]">
                          BETA
                        </span>
                      </span>
                      <span className="block text-[10px] text-muted-foreground">
                        Full frontend stack
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Mode Toggle Button (HTML stack only) */}
            {selectedStack === "html" && (
              <div className="relative">
                <button
                  onClick={() => setShowModePicker(!showModePicker)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background/50 hover:bg-secondary text-[11px] font-semibold text-muted-foreground transition-colors cursor-pointer"
                >
                  {selectedMode === "fast" ? (
                    <Zap className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <Telescope className="w-3 h-3 text-muted-foreground" />
                  )}
                  {selectedMode === "fast" ? "Fast Mode" : "Deep Dive"}
                  <ChevronDown className="w-3 h-3 opacity-40" />
                </button>

                {showModePicker && (
                  <div className="absolute top-full mt-2 left-0 w-48 bg-background dark:bg-[#141414] border border-border rounded-xl shadow-xl overflow-hidden z-30">
                    <button
                      onClick={() => {
                        setSelectedMode("fast");
                        setShowModePicker(false);
                      }}
                      className="w-full flex items-center gap-2 p-3 text-left hover:bg-background /5 transition-colors cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <span className="block text-xs font-semibold text-foreground">
                          Fast Mode
                        </span>
                        <span className="block text-[10px] text-muted-foreground">
                          Structured layout (1 credit)
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedMode("deep");
                        setShowModePicker(false);
                      }}
                      className="w-full flex items-center gap-2 p-3 text-left hover:bg-background /5 transition-colors cursor-pointer"
                    >
                      <Telescope className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <span className="block text-xs font-semibold text-foreground">
                          Deep Dive
                        </span>
                        <span className="block text-[10px] text-muted-foreground">
                          Agent pipeline (3 credits)
                        </span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Model Toggle Button (Deep HTML & React Mode) */}
            {(selectedStack === "react" || selectedMode === "deep") && (
              <div className="relative">
                <button
                  onClick={() => setShowModelPicker(!showModelPicker)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background/50 hover:bg-secondary text-[11px] font-semibold text-muted-foreground transition-colors cursor-pointer"
                >
                  {/* Colored brand logo */}
                  <span
                    className="w-3.5 h-3.5 flex items-center justify-center shrink-0"
                    dangerouslySetInnerHTML={{
                      __html: activeModel.logo ?? CLAUDE_LOGO_SVG,
                    }}
                  />
                  {activeModel.label}
                  <ChevronDown className="w-3 h-3 opacity-40" />
                </button>
                {showModelPicker && (
                  <div className="absolute top-full mt-2 left-0 w-[300px] bg-background dark:bg-[#1a1a1a] border border-border rounded-xl shadow-2xl z-30 p-2 overflow-hidden">
                    <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-muted-foreground tracking-wider">
                      {selectedStack === "react"
                        ? "REACT GENERATION"
                        : "HTML GENERATION"}
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
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
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group ${
                                insufficientCredits
                                  ? "opacity-50 cursor-not-allowed bg-background"
                                  : "hover:bg-secondary cursor-pointer"
                              }`}
                            >
                              <div className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`w-5 flex items-center justify-center shrink-0 transition-colors ${
                                      insufficientCredits
                                        ? "text-muted-foreground"
                                        : "text-muted-foreground group-hover:text-foreground dark:group-hover:text-foreground"
                                    }`}
                                    dangerouslySetInnerHTML={{
                                      __html: logo ?? CLAUDE_LOGO_SVG,
                                    }}
                                  />
                                  <span
                                    className={`text-sm font-semibold ${
                                      insufficientCredits
                                        ? "text-muted-foreground"
                                        : "text-foreground"
                                    }`}
                                  >
                                    {label}
                                  </span>
                                </div>

                                <div className="pl-8 text-[10px] text-muted-foreground text-left leading-snug">
                                  {sublabel && <span>{sublabel} • </span>}
                                  <span
                                    className={
                                      insufficientCredits
                                        ? ""
                                        : "text-emerald-500 dark:text-emerald-400"
                                    }
                                  >
                                    {estimatedCredits}
                                  </span>

                                  {insufficientCredits && (
                                    <div className="text-red-500 dark:text-red-400 font-semibold mt-1">
                                      Requires {minCreditsToStart} credits (You
                                      have {Math.floor(currentCredits)}) to
                                      avoid truncation.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Theme Style Picker (Fast only) */}
            {selectedMode === "fast" && (
              <div className="relative">
                <button
                  onClick={() => setShowThemePicker(!showThemePicker)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background/50 hover:bg-secondary text-[11px] font-semibold text-muted-foreground transition-colors cursor-pointer"
                >
                  <Settings2 className="w-3 h-3 text-muted-foreground" />
                  {getThemeLabel(selectedTheme)}
                  <ChevronDown className="w-3 h-3 opacity-40" />
                </button>
                {showThemePicker && (
                  <div className="absolute top-full mt-2 left-0 w-[240px] bg-background dark:bg-[#1a1a1a] border border-border rounded-xl shadow-2xl z-30 p-2 overflow-hidden">
                    <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-muted-foreground tracking-wider">
                      STYLE OPTIONS
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      {THEME_STYLES.map((style) => (
                        <button
                          key={style}
                          onClick={() => {
                            setSelectedTheme(style);
                            setShowThemePicker(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors cursor-pointer group"
                        >
                          <span className="text-sm font-semibold text-foreground">
                            {getThemeLabel(style)}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-200/50 dark:bg-neutral-800 text-muted-foreground group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-colors">
                            {style}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt?.trim()}
            className="pointer-events-auto flex items-center justify-center p-2 rounded-xl bg-secondary hover:bg-secondary dark:hover:bg-neutral-200 text-foreground dark:text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <img
                src={Logo.src}
                alt="Loading"
                className="w-4 h-4 animate-spin dark:invert"
              />
            ) : (
              <ArrowUp className="w-4 h-4 font-bold" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="relative z-10 p-3 mt-4 text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl">
          {error}
        </div>
      )}
    </div>
  );
}
