"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toast } from "@/components/ui/Toast";
import Header from "@/components/Header";
import ChatPanel from "@/components/ChatPanel";
import PreviewPanel from "@/components/PreviewPanel";
import { Layout } from "@/types/layout";

type GenerationMode = "fast" | "deep";

export default function BuildPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<{
    message: string;
    submessage?: string;
    type?: "success" | "error" | "info";
  } | null>(null);
  const [layout, setLayout] = useState<any>(null);
  const [deepHtml, setDeepHtml] = useState<string | null>(null);
  const [deepBrandName, setDeepBrandName] = useState<string | null>(null);
  const [initialPrompt, setInitialPrompt] = useState<string>("");
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [initialMode, setInitialMode] = useState<GenerationMode>("fast");
  const [mobileView, setMobileView] = useState<"chat" | "preview">("preview");
  const [showChatPanel, setShowChatPanel] = useState(true);
  const [ready, setReady] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [initialModel, setInitialModel] = useState(
    "anthropic/claude-haiku-4.5",
  );
  const [streamingCode, setStreamingCode] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const pendingNavRef = useRef<string | null>(null);
  const triggerSaveRef = useRef<(() => void) | null>(null);
  const typewriterQueue = useRef<string>("");
  const typewriterDisplayed = useRef<string>("");
  const typewriterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Typewriter drain — called recursively until queue is empty
  const drainQueue = useCallback(() => {
    const queue = typewriterQueue.current;
    const displayed = typewriterDisplayed.current;
    if (displayed.length >= queue.length) {
      typewriterTimer.current = null;
      return;
    }
    // Advance dynamically based on backlog so it never takes more than ~30 frames (500ms) to catch up
    const missing = queue.length - displayed.length;
    const baseChars = Math.floor(Math.random() * 12) + 8;
    const charsPerTick = Math.max(baseChars, Math.ceil(missing / 15));
    const next = queue.slice(0, displayed.length + charsPerTick);
    typewriterDisplayed.current = next;
    setStreamingCode(next);
    typewriterTimer.current = setTimeout(drainQueue, 16); // ~60fps
  }, []);

  // Called by ChatPanel with each new server chunk
  const handleStreamCode = useCallback(
    (code: string) => {
      if (!code) {
        // Reset on new generation
        typewriterQueue.current = "";
        typewriterDisplayed.current = "";
        setStreamingCode("");
        if (typewriterTimer.current) clearTimeout(typewriterTimer.current);
        typewriterTimer.current = null;
        return;
      }
      typewriterQueue.current = code;
      // Start draining if not already running
      if (!typewriterTimer.current) {
        typewriterTimer.current = setTimeout(drainQueue, 16);
      }
    },
    [drainQueue],
  );

  useEffect(() => {
    const continueId = searchParams.get("continue");

    // ── Continue from dashboard ──
    if (continueId) {
      const restoreGeneration = async () => {
        try {
          const res = await fetch(`/api/generations/${continueId}`);
          if (!res.ok) {
            router.replace("/");
            return;
          }
          const data = await res.json();
          const gen = data.generation;

          // Clear any previous session's messages/brief so they don't leak
          // into this project's chat panel. ChatPanel's useState initializer
          // must see empty sessionStorage to fall into the correct
          // dashboard-restore branch ("Welcome back! Your website is loaded…").
          sessionStorage.removeItem("crawlcube_messages");
          sessionStorage.removeItem("crawlcube_brief");
          sessionStorage.removeItem("crawlcube_seed_messages");

          setSavedId(continueId);
          setInitialPrompt(gen.prompt ?? "");
          setCurrentPrompt(gen.prompt ?? "");

          if (gen.deepHtml) {
            // Restore Deep Dive
            setDeepHtml(gen.deepHtml);
            setDeepBrandName(gen.siteName ?? null);
            setInitialMode("deep");
            sessionStorage.setItem("crawlcube_mode", "deep");
          } else if (gen.layout) {
            // Restore Fast Mode
            setLayout(gen.layout);
            setInitialMode("fast");
            sessionStorage.setItem(
              "crawlcube_layout",
              JSON.stringify(gen.layout),
            );
            sessionStorage.setItem("crawlcube_mode", "fast");
          }

          if (gen.prompt) {
            sessionStorage.setItem("crawlcube_prompt", gen.prompt);
          }
        } catch {
          router.replace("/");
          return;
        } finally {
          setReady(true);
        }
      };

      restoreGeneration();
      return;
    }

    // ── Normal flow from sessionStorage ──
    const stored = sessionStorage.getItem("crawlcube_layout");
    const storedPrompt = sessionStorage.getItem("crawlcube_prompt");
    const storedMode = sessionStorage.getItem(
      "crawlcube_mode",
    ) as GenerationMode | null;
    const storedModel = sessionStorage.getItem("crawlcube_model");
    setInitialMode(storedMode === "deep" ? "deep" : "fast");
    if (storedModel) setInitialModel(storedModel);

    if (stored) {
      try {
        setLayout(JSON.parse(stored));
        setInitialPrompt(storedPrompt ?? "");
        setCurrentPrompt(storedPrompt ?? "");
      } catch {
        // fail silently
      }
    } else if (storedMode === "deep" && storedPrompt) {
      setInitialPrompt(storedPrompt ?? "");
      setCurrentPrompt(storedPrompt ?? "");
    }

    // Restore deep HTML from previous session
    const storedDeepHtml = sessionStorage.getItem("crawlcube_deep_html");
    if (storedDeepHtml) {
      setDeepHtml(storedDeepHtml);
    }

    // Restore savedId to prevent duplicate saves on refresh
    const storedSavedId = sessionStorage.getItem("crawlcube_savedId");
    if (storedSavedId) {
      setSavedId(storedSavedId);
    }

    setReady(true);
  }, [router, searchParams]);

  // Block browser close/refresh when there's unsaved work
  const hasUnsavedWork = !!(deepHtml || layout) && isSaved!;

  useEffect(() => {
    if (!hasUnsavedWork) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedWork]);

  // Intercept browser back button
  useEffect(() => {
    if (!hasUnsavedWork) return;

    // Push a dummy state so there's something to pop back to
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      // Re-push so the URL doesn't actually change
      window.history.pushState(null, "", window.location.href);
      pendingNavRef.current = "/";
      setShowLeaveModal(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [hasUnsavedWork]);

  // Show toast after payment redirect
  useEffect(() => {
    const subscribed = searchParams.get("subscribed");
    const topup = searchParams.get("topup");
    const cancelled = searchParams.get("cancelled");

    if (subscribed) {
      setToast({
        message: "Subscription activated! 🎉",
        submessage: "Your credits have been added to your account.",
        type: "success",
      });
      // Clean URL without reload
      router.replace("/build");
    } else if (topup) {
      setToast({
        message: "Credits added successfully!",
        submessage: "Your top-up credits are ready to use.",
        type: "info",
      });
      router.replace("/build");
    } else if (cancelled) {
      setToast({
        message: "Subscription cancelled",
        submessage:
          "You'll retain access until the end of your billing period.",
        type: "error",
      });
      router.replace("/build");
    }
  }, [searchParams, router]);

  // ── Fast Mode: layout JSON from ChatPanel ──
  const handleChatGenerate = (generatedLayout: any, prompt?: string) => {
    setLayout(generatedLayout);
    setDeepHtml(null);
    setIsSaved(false);
    if (prompt) setCurrentPrompt(prompt);
    if (generatedLayout) {
      sessionStorage.setItem(
        "crawlcube_layout",
        JSON.stringify(generatedLayout),
      );
    }
    setMobileView("preview");
  };

  // ── Deep Dive Mode: raw HTML from ChatPanel ──
  const handleDeepHtml = (html: string, brandName?: string) => {
    setDeepHtml(html);
    setDeepBrandName(brandName ?? null);
    setLayout(null);
    setIsSaved(false);
    sessionStorage.setItem("crawlcube_deep_html", html);
    setMobileView("preview");
  };

  const handleNewChat = () => {
    setSavedId(null);
    setLayout(null);
    setDeepHtml(null);
    setDeepBrandName(null);
    setCurrentPrompt("");
    sessionStorage.removeItem("crawlcube_layout");
    sessionStorage.removeItem("crawlcube_prompt");
    sessionStorage.removeItem("crawlcube_mode");
    sessionStorage.removeItem("crawlcube_deep_html");
    sessionStorage.removeItem("crawlcube_messages");
    sessionStorage.removeItem("crawlcube_brief");
    sessionStorage.removeItem("crawlcube_savedId");
  };

  const handleLayoutChange = (updated: Layout) => {
    setLayout(updated);
    sessionStorage.setItem("crawlcube_layout", JSON.stringify(updated));
  };

  if (!ready) {
    return (
      <div className="h-screen flex flex-col bg-background transition-colors">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen flex flex-col bg-background text-foreground overflow-hidden transition-colors">
      {/* ── Leave confirmation modal ── */}
      {/* ── Leave confirmation modal ── */}
      {showLeaveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="w-full max-w-sm mx-4 rounded-3xl border border-border overflow-hidden bg-background shadow-2xl">
            {/* Illustration area */}
            <div
              className="relative flex items-center justify-center py-10"
              style={{
                background:
                  "linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(236,72,153,0.10) 100%)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Decorative blobs */}
              <div
                className="absolute top-3 left-4 w-16 h-16 rounded-2xl rotate-12 opacity-20"
                style={{ background: "rgba(168,85,247,0.6)" }}
              />
              <div
                className="absolute bottom-3 right-6 w-10 h-10 rounded-xl -rotate-12 opacity-20"
                style={{ background: "rgba(236,72,153,0.6)" }}
              />
              <div
                className="absolute top-6 right-10 w-6 h-6 rounded-lg rotate-45 opacity-15"
                style={{ background: "rgba(99,102,241,0.8)" }}
              />

              {/* Central icon */}
              <div
                className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 25%, transparent), rgba(236,72,153,0.20))",
                  border:
                    "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
                  boxShadow:
                    "0 0 40px color-mix(in srgb, var(--color-primary) 20%, transparent)",
                }}
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="url(#leaveGrad)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <defs>
                    <linearGradient
                      id="leaveGrad"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="var(--color-primary)" />
                      <stop offset="100%" stopColor="#f472b6" />
                    </linearGradient>
                  </defs>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
            </div>

            {/* Text + actions */}
            <div className="p-6 space-y-5 relative">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="absolute top-0 right-0 w-7 h-7 flex items-center justify-center rounded-lg text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800 transition-all cursor-pointer"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <div className="space-y-2 text-center">
                <h2 className="text-base font-semibold text-foreground tracking-tight">
                  Save your work?
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your generated website will be lost if you leave without
                  saving it to your dashboard.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    triggerSaveRef.current?.();
                    setShowLeaveModal(false);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_20px_var(--color-primary)] opacity-80 hover:opacity-100"
                >
                  Stay and save
                </button>
                <button
                  onClick={() => {
                    setShowLeaveModal(false);
                    sessionStorage.removeItem("crawlcube_deep_html");
                    sessionStorage.removeItem("crawlcube_messages");
                    sessionStorage.removeItem("crawlcube_brief");
                    if (pendingNavRef.current)
                      router.push(pendingNavRef.current);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all text-muted-foreground hover:text-foreground tracking-wide uppercase"
                >
                  Quit without saving
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          submessage={toast.submessage}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <Header
        onNavigate={(href) => {
          if (hasUnsavedWork) {
            pendingNavRef.current = href;
            setShowLeaveModal(true);
          } else {
            router.push(href);
          }
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* DESKTOP */}
        <div
          className={`${showChatPanel ? "hidden md:flex w-[38%]" : "hidden"} shrink-0 border-r border-border flex-col transition-all duration-300 ease-in-out`}
        >
          <ChatPanel
            setLayout={handleChatGenerate}
            setDeepHtml={handleDeepHtml}
            initialLayout={layout}
            initialPrompt={initialPrompt}
            initialMode={initialMode}
            onNewChat={handleNewChat}
            initialModel={initialModel}
            restoredDeepHtml={deepHtml}
            onStreamCode={handleStreamCode}
            onGeneratingChange={setIsGenerating}
          />
        </div>

        <div className="hidden md:flex flex-1 flex-col min-w-0 bg-background">
          <PreviewPanel
            layout={layout}
            deepHtml={deepHtml}
            onDeepHtmlChange={setDeepHtml}
            deepBrandName={deepBrandName}
            prompt={currentPrompt}
            savedId={savedId}
            onSaved={(id) => {
              setSavedId(id);
              setIsSaved(true);
              sessionStorage.setItem("crawlcube_savedId", id);
            }}
            onSaveComplete={() => setIsSaved(true)}
            saveRef={triggerSaveRef}
            onLayoutChange={handleLayoutChange}
            streamingCode={streamingCode}
            isGenerating={isGenerating}
            onToggleChat={() => setShowChatPanel(!showChatPanel)}
            isChatPanelHidden={!showChatPanel}
          />
        </div>

        {/* MOBILE */}
        <div className="flex md:hidden flex-1 flex-col overflow-hidden">
          {mobileView === "chat" ? (
            <ChatPanel
              setLayout={handleChatGenerate}
              setDeepHtml={handleDeepHtml}
              initialLayout={layout}
              initialPrompt={initialPrompt}
              initialModel={initialModel}
              restoredDeepHtml={deepHtml}
              initialMode={initialMode}
              onShowPreview={() => setMobileView("preview")}
              hasLayout={!!(layout || deepHtml)}
              onNewChat={handleNewChat}
              onStreamCode={handleStreamCode}
              onGeneratingChange={setIsGenerating}
            />
          ) : (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-background border-b border-border">
                <button
                  onClick={() => setMobileView("chat")}
                  className="flex items-center gap-2 text-sm text-foreground transition-colors cursor-pointer"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to chat
                </button>
                <span className="text-sm text-foreground">Preview</span>
              </div>
              <PreviewPanel
                layout={layout}
                deepHtml={deepHtml}
                onDeepHtmlChange={setDeepHtml}
                deepBrandName={deepBrandName}
                prompt={currentPrompt}
                savedId={savedId}
                onSaved={(id) => {
                  setSavedId(id);
                  setIsSaved(true);
                  sessionStorage.setItem("crawlcube_savedId", id);
                }}
                onSaveComplete={() => setIsSaved(true)}
                saveRef={triggerSaveRef}
                onLayoutChange={handleLayoutChange}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
