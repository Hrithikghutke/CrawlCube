"use client";

import { useState, useEffect, useRef } from "react";
import PreviewFrame from "@/components/builder/html/PreviewFrame";
import DeepPreview from "@/components/builder/html/DeepPreview";
import ElementEditorPanel from "@/components/ui/ElementEditorPanel";
import NetlifyConnectModal from "@/components/dashboard/NetlifyConnectModal";
import { Layout } from "@/types/layout";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  vs,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";
import html2canvas from "html2canvas";

import {
  Monitor,
  Smartphone,
  Save,
  Share2,
  Download,
  Check,
  Pencil,
  Telescope,
  Globe,
  ExternalLink,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Component,
  ScanEye,
  CodeXml,
} from "lucide-react";
import { generateHtml } from "@/lib/generateHtml";

// ── VS Code Dark+ syntax highlighter ──
// ── Simple HTML escaper for code display ──
function escapeHtml(code: string): string {
  return code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function captureThumbnail(html: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const iframe = document.createElement("iframe");
      // 800x600 fixed iframe off-screen
      iframe.style.cssText =
        "position:fixed;left:-9999px;top:0;width:800px;height:600px;opacity:0;pointer-events:none;border:none;";
      document.body.appendChild(iframe);

      const idoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!idoc) {
        document.body.removeChild(iframe);
        return resolve(null);
      }

      idoc.open();
      idoc.write(html);
      idoc.close();

      iframe.onload = async () => {
        try {
          // Small delay for fonts/images to render
          await new Promise((r) => setTimeout(r, 600));

          const canvas = await html2canvas(idoc.body, {
            width: 800,
            height: 600,
            windowWidth: 800,
            windowHeight: 600,
            useCORS: true,
            scale: 0.5, // 400x300 output
          });

          // Heavy JPEG compression to keep DB payload extremely small (~10kb)
          const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
          document.body.removeChild(iframe);
          resolve(dataUrl);
        } catch (e) {
          console.error("Thumbnail capture error", e);
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
          resolve(null);
        }
      };

      iframe.onerror = () => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
        resolve(null);
      };
    } catch (e) {
      console.error(e);
      resolve(null);
    }
  });
}
export default function PreviewPanel({
  layout,
  deepHtml,
  deepBrandName,
  prompt,
  savedId,
  onSaved,
  onSaveComplete,
  saveRef,
  onLayoutChange,
  onDeepHtmlChange,
  streamingCode,
  isGenerating,
  onToggleChat,
  isChatPanelHidden,
  initialDeployedUrl,
}: {
  layout: Layout | null;
  deepHtml?: string | null;
  deepBrandName?: string | null;
  prompt?: string;
  savedId?: string | null;
  onSaved?: (id: string) => void;
  onSaveComplete?: () => void;
  saveRef?: React.MutableRefObject<(() => void) | null>;
  onLayoutChange?: (updated: Layout) => void;
  onDeepHtmlChange?: (html: string) => void;
  streamingCode?: string;
  isGenerating?: boolean;
  onToggleChat?: () => void;
  isChatPanelHidden?: boolean;
  initialDeployedUrl?: string | null;
}) {
  const { resolvedTheme } = useTheme();
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [editorActiveTab, setEditorActiveTab] = useState<
    "typography" | "colors" | "spacing" | "borders" | "css" | "image"
  >("colors");
  const [saving, setSaving] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "preview" | "design">(
    "preview",
  );
  const [selectedElement, setSelectedElement] = useState<any>(null);

  // Ref to hold the silently updated HTML to avoid iframe flashing during editing
  const localHtmlRef = useRef(deepHtml);
  useEffect(() => {
    localHtmlRef.current = deepHtml;
  }, [deepHtml]);
  const codeEndRef = useRef<HTMLDivElement>(null);
  const [deploying, setDeploying] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(initialDeployedUrl ?? null);
  const [deployCopied, setDeployCopied] = useState(false);
  const [showNetlifyConnectModal, setShowNetlifyConnectModal] = useState(false);

  useEffect(() => {
    if (initialDeployedUrl) {
      setDeployedUrl(initialDeployedUrl);
    }
  }, [initialDeployedUrl]);

  // Auto-switch to Code tab when generation starts
  useEffect(() => {
    if (isGenerating) setActiveTab("code");
  }, [isGenerating]);

  // Auto-switch to Preview when generation finishes and content exists
  useEffect(() => {
    if (!isGenerating && (layout || deepHtml)) {
      if (activeTab === "code" || activeTab === "preview")
        setActiveTab("preview");
    }
  }, [isGenerating, layout, deepHtml]);

  // Handle cross-window communication for Deep Dive elements
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "ELEMENT_CLICKED" && activeTab === "design") {
        setSelectedElement(e.data.data);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [activeTab]);

  // Sync edits to parent on tab exit if changed
  useEffect(() => {
    if (
      activeTab !== "design" &&
      localHtmlRef.current !== deepHtml &&
      onDeepHtmlChange
    ) {
      onDeepHtmlChange(localHtmlRef.current || "");
    }
  }, [activeTab, onDeepHtmlChange, deepHtml]);

  const getCleanHtmlSnapshot = (idoc: Document) => {
    const clone = idoc.documentElement.cloneNode(true) as HTMLElement;

    // Modern targeted removal
    clone.querySelector("#crawlcube-editor-script")?.remove();
    clone.querySelector("#crawlcube-editor-style")?.remove();
    clone.querySelectorAll("#cc-hover-badge").forEach((el) => el.remove());
    clone
      .querySelectorAll("#crawlcube-custom-scrollbar")
      .forEach((el) => el.remove());

    // Legacy targeted removal (for instances already contaminated before the fix)
    const styles = clone.querySelectorAll("style");
    for (let i = 0; i < styles.length; i++) {
      if (styles[i].textContent?.includes(".editor-hover-outline"))
        styles[i].remove();
    }
    const scripts = clone.querySelectorAll("script");
    for (let i = 0; i < scripts.length; i++) {
      if (
        scripts[i].textContent?.includes("CrawlCube Editor Script Initializing")
      )
        scripts[i].remove();
    }

    clone
      .querySelectorAll(".editor-hover-outline")
      .forEach((el) => el.classList.remove("editor-hover-outline"));

    let finalHtml = "<!DOCTYPE html>\n" + clone.outerHTML;

    // Aggressively remove literal \n string artifacts caused by the old buggy string concatenation
    finalHtml = finalHtml.replace(/\\n/g, "");

    return finalHtml;
  };

  const rebuildResponsiveStylesheet = (idoc: Document) => {
    let styleTag = idoc.getElementById("cc-custom-edits");
    if (!styleTag) {
      styleTag = idoc.createElement("style");
      styleTag.id = "cc-custom-edits";
      if (idoc.head) idoc.head.appendChild(styleTag);
      else idoc.body.appendChild(styleTag);
    }

    let newCss = "";
    idoc
      .querySelectorAll("[data-cc-desktop], [data-cc-mobile]")
      .forEach((el) => {
        const elId = el.getAttribute("data-editor-id");
        if (!elId) return;

        const dSafe = el.getAttribute("data-cc-desktop") || "{}";
        const mSafe = el.getAttribute("data-cc-mobile") || "{}";

        let d = {},
          m = {};
        try {
          d = JSON.parse(dSafe);
        } catch (e) {}
        try {
          m = JSON.parse(mSafe);
        } catch (e) {}

        if (Object.keys(d).length > 0) {
          newCss += `[data-editor-id="${elId}"] { `;
          for (const [k, v] of Object.entries(d)) {
            let prop = k.replace(/([A-Z])/g, "-$1").toLowerCase();
            newCss += `${prop}: ${v} !important; `;
          }
          newCss += `}\n`;
        }

        if (Object.keys(m).length > 0) {
          newCss += `@media (max-width: 767px) {\n  [data-editor-id="${elId}"] { `;
          for (const [k, v] of Object.entries(m)) {
            let prop = k.replace(/([A-Z])/g, "-$1").toLowerCase();
            newCss += `${prop}: ${v} !important; `;
          }
          newCss += `}\n}\n`;
        }
      });
    styleTag.textContent = newCss;
  };

  const handleStyleUpdate = (id: string, styles: Record<string, string>) => {
    try {
      const iframe = document.querySelector(
        'iframe[title="Deep Dive Preview"]',
      ) as HTMLIFrameElement;
      if (iframe?.contentDocument) {
        const idoc = iframe.contentDocument;
        const target = idoc.querySelector(
          `[data-editor-id="${id}"]`,
        ) as HTMLElement;
        if (target) {
          const isMobileViewport = viewport === "mobile";

          if (isMobileViewport) {
            const currentMobile = JSON.parse(
              target.getAttribute("data-cc-mobile") || "{}",
            );
            Object.assign(currentMobile, styles);
            target.setAttribute(
              "data-cc-mobile",
              JSON.stringify(currentMobile),
            );
          } else {
            const currentDesktop = JSON.parse(
              target.getAttribute("data-cc-desktop") || "{}",
            );
            Object.assign(currentDesktop, styles);
            target.setAttribute(
              "data-cc-desktop",
              JSON.stringify(currentDesktop),
            );
          }

          rebuildResponsiveStylesheet(idoc);
          localHtmlRef.current = getCleanHtmlSnapshot(idoc);
          setPendingChanges(true);
        }
      }
    } catch (e) {
      console.warn("Direct DOM sync failed", e);
    }
  };

  const handleContentUpdate = (id: string, content: string) => {
    try {
      const iframe = document.querySelector(
        'iframe[title="Deep Dive Preview"]',
      ) as HTMLIFrameElement;
      if (iframe?.contentDocument) {
        const target = iframe.contentDocument.querySelector(
          `[data-editor-id="${id}"]`,
        ) as HTMLElement;
        if (target) {
          target.innerHTML = content;
          localHtmlRef.current = getCleanHtmlSnapshot(iframe.contentDocument);
          setPendingChanges(true);
          return;
        }
      }
    } catch (e) {
      console.warn("Direct DOM sync failed", e);
    }
  };

  const handleAttributeUpdate = (
    id: string,
    attributes: Record<string, string>,
  ) => {
    try {
      const iframe = document.querySelector(
        'iframe[title="Deep Dive Preview"]',
      ) as HTMLIFrameElement;
      if (iframe?.contentDocument) {
        const target = iframe.contentDocument.querySelector(
          `[data-editor-id="${id}"]`,
        ) as HTMLElement;
        if (target) {
          for (const [key, value] of Object.entries(attributes)) {
            target.setAttribute(key, value);
          }
          localHtmlRef.current = getCleanHtmlSnapshot(iframe.contentDocument);
          setPendingChanges(true);
          return;
        }
      }
    } catch (e) {
      console.warn("Direct DOM sync failed", e);
    }
  };

  const handleResetStyle = (id: string, initialStyle: string) => {
    try {
      const iframe = document.querySelector(
        'iframe[title="Deep Dive Preview"]',
      ) as HTMLIFrameElement;
      if (iframe?.contentDocument) {
        const idoc = iframe.contentDocument;
        const target = idoc.querySelector(
          `[data-editor-id="${id}"]`,
        ) as HTMLElement;
        if (target) {
          target.removeAttribute("data-cc-desktop");
          target.removeAttribute("data-cc-mobile");
          target.setAttribute("style", initialStyle || "");
          rebuildResponsiveStylesheet(idoc);

          localHtmlRef.current = getCleanHtmlSnapshot(idoc);
          setPendingChanges(true);
        }
      }
    } catch (e) {
      console.warn("Direct DOM sync failed", e);
    }
  };

  const handleSelectElement = (id: string) => {
    try {
      const iframe = document.querySelector(
        'iframe[title="Deep Dive Preview"]',
      ) as HTMLIFrameElement;
      if (iframe?.contentDocument) {
        const target = iframe.contentDocument.querySelector(
          `[data-editor-id="${id}"]`,
        ) as HTMLElement;
        if (target) {
          // Emulate a perfect native click sequence directly
          target.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
          target.dispatchEvent(
            new MouseEvent("click", { bubbles: true, cancelable: true }),
          );
          return;
        }
      }
    } catch (e) {
      console.warn("Direct DOM select failed", e);
    }

    // Fallback to postMessage
    const iframe = document.querySelector(
      'iframe[title="Deep Dive Preview"]',
    ) as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        { type: "SELECT_ELEMENT", data: { id } },
        "*",
      );
    }
  };

  // Auto-scroll code to bottom as it streams
  useEffect(() => {
    codeEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamingCode]);

  // Determine active mode
  const isDeepMode = !!deepHtml && !layout;

  // Brand name for URL bar — works for both modes
  const brandName = isDeepMode
    ? (deepBrandName ?? "preview")
    : (layout?.branding?.logoText ?? "preview");

  const urlBarName = brandName.toLowerCase().replace(/\s+/g, "");

  // Reset save state when content changes
  useEffect(() => {
    if (savedId) {
      setPendingChanges(true);
    } else {
      setSaved(false);
    }
    setCopied(false);
  }, [layout, deepHtml]);

  useEffect(() => {
    if (!savedId) {
      setShareId(null);
      setSaved(false);
      setPendingChanges(false);
    }
  }, [savedId]);

  // Expose handleSave to BuildPage for the "Stay and save" modal button
  useEffect(() => {
    if (saveRef) saveRef.current = handleSave;
  });
  // ── Save ──
  const handleSave = async () => {
    if ((!layout && !deepHtml) || saving) return;
    if (saved && !pendingChanges) return;
    setSaving(true);

    try {
      let thumbnailStr: string | null = null;
      // Make sure we use the locally edited string if saving while in Design tab
      const htmlToSave =
        activeTab === "design" ? localHtmlRef.current || deepHtml : deepHtml;

      try {
        const sourceHtml =
          isDeepMode && htmlToSave
            ? getCleanHtmlSnapshot(
                new DOMParser().parseFromString(htmlToSave, "text/html"),
              )
            : layout
              ? generateHtml(layout)
              : "";
        if (sourceHtml) {
          thumbnailStr = await captureThumbnail(sourceHtml);
        }
      } catch (err) {
        console.error("Failed to capture thumbnail", err);
      }

      const payload = {
        layout: layout ?? null,
        deepHtml: isDeepMode ? htmlToSave : null,
        prompt: prompt ?? "",
        thumbnail: thumbnailStr,
      };

      if (savedId) {
        const res = await fetch("/api/generations/save", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: savedId,
            ...payload,
          }),
        });
        if (res.ok) {
          setSaved(true);
          setPendingChanges(false);
          onSaveComplete?.();
        } else if (res.status === 404) {
          // Document was likely deleted. Fall back to POST to recreate it.
          const postRes = await fetch("/api/generations/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await postRes.json();
          if (data.id && data.shareId) {
            setShareId(data.shareId);
            onSaved?.(data.id);
            setSaved(true);
            setPendingChanges(false);
            onSaveComplete?.();
          }
        }
      } else {
        const res = await fetch("/api/generations/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.id && data.shareId) {
          setShareId(data.shareId);
          onSaved?.(data.id);
          setSaved(true);
          setPendingChanges(false);
          onSaveComplete?.();
        }
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  // ── Share ──
  const handleShare = async () => {
    if (saving) return;

    if (shareId) {
      const url = `${window.location.origin}/preview/${shareId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    setSaving(true);
    try {
      let sid: string | null = null;

      if (savedId) {
        const res = await fetch(`/api/generations/${savedId}/share`);
        if (res.ok) {
          const data = await res.json();
          sid = data.shareId;
          setShareId(sid);
        }
      }

      if (!sid) {
        const res = await fetch("/api/generations/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            layout: layout ?? null,
            deepHtml: deepHtml ?? null,
            prompt: prompt ?? "",
          }),
        });
        const data = await res.json();
        if (data.id && data.shareId) {
          sid = data.shareId;
          setShareId(sid);
          onSaved?.(data.id);
          setSaved(true);
          setPendingChanges(false);
          onSaveComplete?.();
        }
      }

      if (sid) {
        const url = `${window.location.origin}/preview/${sid}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  // ── Download ──
  // Fast mode: generate HTML from layout JSON
  // Deep mode: download the raw HTML string directly
  const handleDownload = () => {
    let html = "";
    let filename = "website";

    if (isDeepMode && deepHtml) {
      // Use DOMParser to safely execute our robust clean pipeline for downloads
      const parsed = new DOMParser().parseFromString(
        localHtmlRef.current || deepHtml,
        "text/html",
      );
      html = getCleanHtmlSnapshot(parsed);
      filename = brandName.toLowerCase().replace(/\s+/g, "-");
    } else if (layout) {
      html = generateHtml(layout);
      filename =
        layout.branding?.logoText?.toLowerCase().replace(/\s+/g, "-") ??
        "website";
    } else {
      return;
    }

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Open in new tab ──
  const handleOpenInTab = () => {
    let html = "";
    if (isDeepMode && deepHtml) {
      html = deepHtml;
    } else if (layout) {
      html = generateHtml(layout);
    } else {
      return;
    }
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    // Revoke after a short delay so the tab has time to load
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // ── Deploy to Netlify ──
  const handleDeploy = async () => {
    if (!deepHtml || deploying) return;
    
    // Check connection first
    const connRes = await fetch("/api/netlify/check-connection");
    const { connected } = await connRes.json();

    if (!connected) {
      setShowNetlifyConnectModal(true);
      return;
    }

    setDeploying(true);

    try {
      const res = await fetch("/api/netlify/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: deepHtml,
          siteName: deepBrandName ?? brandName,
          generationId: savedId ?? null,
        }),
      });

      const data = await res.json();

      if (data.error === "netlify_token_expired") {
        setShowNetlifyConnectModal(true);
        return;
      }

      if (data.error === "SUBSCRIPTION_REQUIRED") {
        alert(
          "Deploy is available for subscribers only. Upgrade your plan to publish your site.",
        );
        return;
      }

      if (!res.ok || !data.url) throw new Error(data.error ?? "Deploy failed");

      setDeployedUrl(data.url);
      sessionStorage.setItem("crawlcube_deployedUrl", data.url);
    } catch (err: any) {
      console.error("[Deploy] Failed:", err);
      alert("Deploy failed. Please try again.");
    } finally {
      setDeploying(false);
    }
  };

  // Copy deployed URL
  const handleCopyDeployUrl = async () => {
    if (!deployedUrl) return;
    await navigator.clipboard.writeText(deployedUrl);
    setDeployCopied(true);
    setTimeout(() => setDeployCopied(false), 2000);
  };

  const saveLabel = () => {
    if (saving) return "Saving…";
    if (saved && !pendingChanges) return "Saved!";
    if (saved && pendingChanges) return "Save changes";
    return "Save";
  };

  const saveDisabled = saving || (saved && !pendingChanges);
  const hasContent = !!(layout || deepHtml);

  // ── Empty state — only show if not generating and no code streaming ──
  if (!hasContent && !isGenerating && !streamingCode) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 gap-4 relative">
        <div className="absolute inset-0 dark:opacity-100 opacity-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none" />
        <div className="absolute inset-0 dark:opacity-0 opacity-100 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none" />
        <div className="relative text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mx-auto">
            <Monitor className="w-7 h-7 text-neutral-400 dark:text-neutral-600" />
          </div>
          <p className="text-neutral-500 text-sm font-medium">
            Your website preview will appear here
          </p>
          <p className="text-neutral-700 text-xs max-w-60 mx-auto">
            Describe your website in the chat on the left and hit Enter to
            generate
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#fcfcfc] dark:bg-[#111111]">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between px-4 py-3 border-b border-transparent dark:border-white/5 bg-[#fcfcfc] dark:bg-[#111111] gap-3">
        {/* Left Controls & URL bar */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Chat Toggle (Desktop only) */}
          {onToggleChat && (
            <button
              onClick={onToggleChat}
              title={isChatPanelHidden ? "Show Sidebar" : "Hide Sidebar"}
              className="hidden md:flex items-center justify-center p-2 rounded-xl bg-transparent dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/10 transition-all cursor-pointer"
            >
              {isChatPanelHidden ? (
                <PanelLeftOpen className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>
          )}

          {deployedUrl ? (
            <div className="flex items-center gap-3 bg-transparent dark:bg-[#161616] border border-neutral-300 dark:border-white/10 rounded-xl px-4 py-2 flex-1 max-w-xs shadow-sm">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate" title={deployedUrl}>
                {new URL(deployedUrl).hostname}
              </span>
              {isDeepMode && (
                <span className="ml-auto flex items-center gap-1.5 text-[10px] font-semibold text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full shrink-0">
                  <Telescope className="w-3 h-3" />
                  Deep
                </span>
              )}
              <a
                href={deployedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${isDeepMode ? 'ml-1' : 'ml-auto'} flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-full shrink-0 transition-colors cursor-pointer`}
              >
                <Globe className="w-3 h-3" />
                Live
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-transparent dark:bg-[#161616] border border-neutral-300 dark:border-white/10 rounded-xl px-4 py-2 flex-1 max-w-xs shadow-sm">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">
                {urlBarName}.crawlcube.app
              </span>
              {/* Deep Dive badge in toolbar */}
              {isDeepMode && (
                <span className="ml-auto flex items-center gap-1.5 text-[10px] font-semibold text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full shrink-0">
                  <Telescope className="w-3 h-3" />
                  Deep
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between md:justify-end gap-1 sm:gap-2 w-full md:w-auto overflow-x-auto scrollbar-none pb-1 md:pb-0">
          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saveDisabled}
            title="Save"
            className={`shrink-0 flex items-center justify-center w-11 h-11 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              saved && !pendingChanges
                ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10"
                : pendingChanges
                  ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10"
                  : "text-neutral-600 dark:text-neutral-300 bg-transparent hover:bg-neutral-100 dark:hover:bg-white/10"
            }`}
          >
            {saved && !pendingChanges ? (
              <Check className="w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            disabled={saving}
            title="Share"
            className={`shrink-0 flex items-center justify-center w-11 h-11 rounded-xl transition-all cursor-pointer disabled:opacity-50 ${
              copied
                ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10"
                : "text-neutral-600 dark:text-neutral-300 bg-transparent hover:bg-neutral-100 dark:hover:bg-white/10"
            }`}
          >
            {copied ? (
              <Check className="w-5 h-5" />
            ) : (
              <Share2 className="w-5 h-5" />
            )}
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            title="Download"
            className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-transparent hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 transition-all cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
          </button>

          {/* Open in new tab */}
          <button
            onClick={handleOpenInTab}
            disabled={isGenerating || (!layout && !deepHtml)}
            title="Open full preview"
            className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-transparent hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ExternalLink className="w-5 h-5" />
          </button>

          {/* Deploy to Netlify */}
          {isDeepMode ? (
            deployedUrl ? (
              <a
                href={deployedUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="View Live Site"
                className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20 transition-all"
              >
                <Globe className="w-5 h-5" />
              </a>
            ) : (
              <button
                onClick={handleDeploy}
                disabled={deploying || isGenerating || !deepHtml}
                title="Publish"
                className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-transparent hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deploying ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Globe className="w-5 h-5" />
                )}
              </button>
            )
          ) : (
            <div className="w-7 sm:w-11 h-11 shrink-0" /> // spacer for fast mode
          )}

          {/* Viewport toggle */}
          <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-[#1a1a1a] border border-neutral-200 dark:border-white/5 rounded-xl p-1 h-11 shrink-0">
            <button
              onClick={() => setViewport("desktop")}
              className={`flex items-center justify-center w-10 sm:w-11 h-full rounded-lg transition-all cursor-pointer ${viewport === "desktop" ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm" : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewport("mobile")}
              className={`flex items-center justify-center w-10 sm:w-11 h-full rounded-lg transition-all cursor-pointer ${viewport === "mobile" ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm" : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Code / Preview tabs */}
      <div className="flex justify-center px-4 pt-4 pb-3 bg-[#fcfcfc] dark:bg-[#111111]">
        <div className="flex items-center p-1 bg-transparent border border-neutral-300 dark:border-white/10 rounded-full w-full max-w-sm">
          <button
            onClick={() => setActiveTab("code")}
            className={`flex-1 py-2 text-sm font-medium rounded-full transition-all cursor-pointer ${
              activeTab === "code"
                ? "bg-white dark:bg-[#201d36] text-purple-600 dark:text-[#c084fc] shadow-sm ring-1 ring-black/5 dark:ring-white/5"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            Code
          </button>
          <button
            onClick={() => {
              if (!isGenerating) setActiveTab("preview");
            }}
            className={`flex items-center justify-center gap-1 flex-1 py-2 text-sm font-medium rounded-full transition-all ${
              isGenerating
                ? "cursor-not-allowed text-neutral-400 dark:text-[#404040]"
                : activeTab === "preview"
                  ? "bg-white dark:bg-[#201d36] text-purple-600 dark:text-[#c084fc] shadow-sm ring-1 ring-black/5 dark:ring-white/5 cursor-pointer"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 cursor-pointer"
            }`}
            title={
              isGenerating ? "Preview unlocks when generation is complete" : ""
            }
          >
            Preview {isGenerating && <span className="text-[10px]">🔒</span>}
          </button>
          {isDeepMode && (
            <button
              onClick={() => {
                if (!isGenerating) setActiveTab("design");
              }}
              className={`flex items-center justify-center gap-1 flex-1 py-2 text-sm font-medium rounded-full transition-all ${
                isGenerating
                  ? "cursor-not-allowed text-neutral-400 dark:text-[#404040]"
                  : activeTab === "design"
                    ? "bg-[#fdf2f8] dark:bg-[#341e30] text-pink-600 dark:text-[#f472b6] shadow-sm ring-1 ring-pink-500/20 cursor-pointer"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 cursor-pointer"
              }`}
              title={
                isGenerating
                  ? "Editing unlocks when generation is complete"
                  : ""
              }
            >
              Design {isGenerating && <span className="text-[10px]">🔒</span>}
            </button>
          )}
        </div>
      </div>

      {/* Hint bar — edit hint for Fast Mode, info bar for Deep Dive */}
      {isDeepMode ? (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-pink-500/10 border-b border-pink-500/20 text-xs text-pink-400">
          <Telescope className="w-3 h-3 shrink-0" />
          <span>
            Deep Dive website — describe changes in the chat to regenerate
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border-b border-purple-500/20 text-xs text-purple-400">
          <Pencil className="w-3 h-3 shrink-0" />
          <span>Click any text in the preview to edit it directly</span>
        </div>
      )}

      {/* Preview area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "code" ? (
          <div
            className="flex-1 overflow-auto p-4 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-[#404040] scrollbar-track-transparent hover:scrollbar-thumb-neutral-400 dark:hover:scrollbar-thumb-[#525252] [&>pre]:scrollbar-thin! [&>pre]:scrollbar-thumb-neutral-300! dark:[&>pre]:scrollbar-thumb-[#404040]! [&>pre]:scrollbar-track-transparent! hover:[&>pre]:scrollbar-thumb-neutral-400! dark:hover:[&>pre]:scrollbar-thumb-[#525252]! bg-neutral-50 dark:bg-[#141414]"
            style={{
              fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
              fontSize: "12px",
              lineHeight: "1.6",
            }}
          >
            {(() => {
              // Prefer live streaming code; fall back to existing content so
              // the panel never goes blank between generations.
              const displayCode =
                streamingCode ||
                (isDeepMode && deepHtml
                  ? deepHtml
                  : layout
                    ? generateHtml(layout)
                    : "");

              return displayCode ? (
                <SyntaxHighlighter
                  language="html"
                  style={resolvedTheme === "light" ? vs : vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    background: "transparent",
                    padding: 0,
                    fontSize: "13px",
                    fontFamily:
                      "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                  }}
                  wrapLines={true}
                  wrapLongLines={true}
                  showLineNumbers={true}
                  lineNumberStyle={{
                    minWidth: "3.5em",
                    paddingRight: "1.5em",
                    color: "#858585",
                    textAlign: "right",
                    userSelect: "none",
                  }}
                >
                  {displayCode}
                </SyntaxHighlighter>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <p
                    style={{ fontFamily: "system-ui" }}
                    className="text-sm text-neutral-500"
                  >
                    Code will appear here during generation...
                  </p>
                </div>
              );
            })()}
            <div ref={codeEndRef} />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden bg-neutral-200/50 dark:bg-neutral-800 flex flex-col items-center p-4 relative">
            {isDeepMode ? (
              // Deep Dive — raw HTML in iframe
              <>
                <DeepPreview
                  html={deepHtml!}
                  viewport={viewport}
                  editable={activeTab === "design"}
                />
                {activeTab === "design" && selectedElement && (
                  <ElementEditorPanel
                    key={selectedElement.id}
                    element={selectedElement}
                    activeTab={editorActiveTab}
                    onTabChange={setEditorActiveTab}
                    onClose={() => setSelectedElement(null)}
                    onUpdateStyle={(styles) =>
                      handleStyleUpdate(selectedElement.id, styles)
                    }
                    onUpdateContent={(content) =>
                      handleContentUpdate(selectedElement.id, content)
                    }
                    onUpdateAttribute={(attributes) =>
                      handleAttributeUpdate(selectedElement.id, attributes)
                    }
                    onSelectElement={handleSelectElement}
                    onResetStyle={(initial) =>
                      handleResetStyle(selectedElement.id, initial)
                    }
                  />
                )}
              </>
            ) : (
              // Fast Mode — React component tree
              <div
                className="@container rounded-lg shadow-2xl transition-all duration-300 origin-top overflow-x-hidden overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent"
                style={{
                  width: viewport === "mobile" ? "390px" : "100%",
                  minHeight: "100%",
                  background: "white",
                }}
              >
                <PreviewFrame
                  layout={layout}
                  editable={true}
                  onLayoutChange={onLayoutChange}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <NetlifyConnectModal 
        isOpen={showNetlifyConnectModal}
        onClose={() => setShowNetlifyConnectModal(false)}
      />
    </div>
  );
}
