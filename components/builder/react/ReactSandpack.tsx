"use client";

import {
  SandpackProvider,
  SandpackLayout,
  SandpackFileExplorer,
  SandpackCodeEditor,
  SandpackPreview,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { atomDark } from "@codesandbox/sandpack-themes";
import { useEffect, useRef, useState, useCallback } from "react";
import { GeneratedReactFiles } from "@/types/react-generation";

import { Panel, Group, Separator } from "react-resizable-panels";

interface ReactSandpackProps {
  files: GeneratedReactFiles;
  viewMode?: "code" | "preview" | "design";
  previewWidth?: "desktop" | "mobile";
  /** Increment this to force a full Sandpack remount (e.g. on new AI generation). */
  generationKey?: number;
  /** Ref that will be populated with a function to get the current files from the editor. */
  getFilesRef?: React.MutableRefObject<(() => GeneratedReactFiles) | null>;
  /** Callback fired whenever the user edits code in the editor (used to wake up the Save button) */
  onCodeEdit?: () => void;
  onAutoFix?: (newFiles: Record<string, string>) => void;
}

/**
 * Inner component that registers a"get current files" function on the parent's ref.
 * This allows the parent to read the latest editor content on demand (e.g. at save time)
 * without any real-time sync or re-render feedback loops.
 */
function SandpackFilesGetter({
  getFilesRef,
  onCodeEdit,
}: {
  getFilesRef?: React.MutableRefObject<(() => GeneratedReactFiles) | null>;
  onCodeEdit?: () => void;
}) {
  const { sandpack } = useSandpack();
  const latestFilesRef = useRef(sandpack.files);
  const isFirstRender = useRef(true);

  // Keep the ref constantly updated on every render
  latestFilesRef.current = sandpack.files;

  // Render-phase assignment guarantees the ref is never null while mounted
  if (getFilesRef) {
    getFilesRef.current = () => {
      const currentFiles: GeneratedReactFiles = {};
      for (const [path, fileObj] of Object.entries(latestFilesRef.current)) {
        currentFiles[path] = (fileObj as any).code;
      }
      return currentFiles;
    };
  }

  // Whenever sandpack.files actively changes (user typing), notify the parent
  // so it can wake up the Save button. We skip the first render to avoid false positives.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (onCodeEdit) onCodeEdit();
  }, [sandpack.files, onCodeEdit]);

  return null;
}

/**
 * Inner component that monitors Sandpack for compile errors and triggers
 * the reactive error fixer API. Runs inside SandpackProvider.
 */
function SandpackErrorFixer({
  onFixingChange,
  onFixAttempt,
  onAutoFix,
}: {
  onFixingChange: (fixing: boolean) => void;
  onFixAttempt: () => { attempts: number; canRetry: boolean };
  onAutoFix?: (newFiles: Record<string, string>) => void;
}) {
  const { sandpack, listen } = useSandpack();
  const isFixingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerFix = useCallback(async (errorMessage: string) => {
    console.log("[SandpackErrorFixer] triggerFix called:", errorMessage.slice(0, 100));
    if (isFixingRef.current) return;
    const { canRetry } = onFixAttempt();
    if (!canRetry) { console.log("[SandpackErrorFixer] Max retries reached"); return; }

    isFixingRef.current = true;
    onFixingChange(true);

    // Determine which file caused the error
    const files = sandpack.files;
    const allFilePaths = Object.keys(files);
    let affectedFile: string | null = null;

    // Pattern 1: our constructed format "(in /path/file.js at line X)"
    const inPathMatch = errorMessage.match(/\(in\s+(\/[^\s)]+)/);
    if (inPathMatch) {
      affectedFile = inPathMatch[1];
    }
    // Pattern 2: Sandpack-style "/path/file.js: error"
    if (!affectedFile) {
      const sandpackPathMatch = errorMessage.match(/(\/\w[\w/]*\.\w+)/);
      if (sandpackPathMatch) {
        affectedFile = sandpackPathMatch[1];
      }
    }
    // Pattern 3: "relative to" pattern
    if (!affectedFile) {
      const relativeMatch = errorMessage.match(/relative to ['"]([^'"]+)['"]/);
      if (relativeMatch) {
        affectedFile = relativeMatch[1].startsWith("/") ? relativeMatch[1] : `/${relativeMatch[1]}`;
      }
    }
    // Pattern 4: look for known file names in the error
    if (!affectedFile) {
      for (const fp of allFilePaths) {
        const fileName = fp.split("/").pop() ?? "";
        if (fileName && errorMessage.includes(fileName)) {
          affectedFile = fp;
          break;
        }
      }
    }
    // Last resort: use App.js as it's often the root cause
    if (!affectedFile) affectedFile = "/App.js";

    const fileContent = (files[affectedFile] as any)?.code;
    if (!fileContent) {
      isFixingRef.current = false;
      onFixingChange(false);
      return;
    }

    try {
      console.log(`[SandpackErrorFixer] Fixing ${affectedFile}...`, errorMessage.slice(0, 80));
      const res = await fetch("/api/fix-react-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          errorMessage,
          filePath: affectedFile,
          fileContent,
          allFilePaths,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(`Fix route failed: ${errData.error || res.statusText}`);
      }
      const { fixedContent } = await res.json();
      
      // Robustly strip markdown if the model included it
      let cleaned = fixedContent;
      const match = fixedContent.match(/```(?:[a-zA-Z]*)\n([\s\S]*?)```/);
      if (match) {
        cleaned = match[1];
      } else {
        cleaned = fixedContent.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "");
      }
      cleaned = cleaned.trim();

      if (cleaned === fileContent.trim()) {
        console.log(`[SandpackErrorFixer] ✗ LLM failed to fix the error (returned identical code)`);
        isFixingRef.current = false;
        onFixingChange(false);
        return;
      }

      if (cleaned && cleaned.length > 50) {
        console.log(`[SandpackErrorFixer] ✓ Applied fix to ${affectedFile} (${cleaned.length} chars)`);
        
        // Instead of sandpack.updateFile (which crashes CodeMirror on huge edits),
        // we safely update the parent state to trigger a clean remount/update.
        if (onAutoFix) {
          const currentFiles: Record<string, string> = {};
          for (const [path, fileObj] of Object.entries(files)) {
            currentFiles[path] = (fileObj as any).code;
          }
          currentFiles[affectedFile] = cleaned;
          onAutoFix(currentFiles);
        } else {
          sandpack.updateFile(affectedFile, cleaned);
        }
      } else {
        console.log(`[SandpackErrorFixer] ✗ Fix too short or empty (${cleaned?.length || 0} chars)`);
      }
    } catch (err) {
      console.error("Auto-fix failed:", err);
    } finally {
      isFixingRef.current = false;
      onFixingChange(false);
    }
  }, [sandpack, listen, onFixingChange, onFixAttempt, onAutoFix]);

  // Listen for Sandpack errors via the listen API
  useEffect(() => {
    const unsub = listen((msg: any) => {
      // Skip if already fixing
      if (isFixingRef.current) return;

      // Debug: log error-related messages from Sandpack
      if (msg.type === "action" || msg.type === "error" || msg.type === "state" ||
          (msg.type === "console" && JSON.stringify(msg).includes("error"))) {
        console.log("[SandpackErrorFixer] Received:", msg.type, msg);
      }

      let errorMessage: string | null = null;

      // Type 1: action events — compile errors come as {type:"action", title, message, path, line}
      if (msg.type === "action") {
        if (msg.action === "show-error" && msg.message) {
          errorMessage = msg.message;
        }
        // Compile/transpilation errors — have title + message + path
        else if (msg.title && msg.message && msg.path) {
          const filePath = msg.path as string;
          errorMessage = `${msg.title}: ${msg.message} (in ${filePath} at line ${msg.line || "?"})`;
        }
        else if (msg.message && String(msg.message).includes("Error")) {
          errorMessage = String(msg.message);
        }
      }
      // Type 2: console log errors
      else if (msg.type === "console" && msg.codesandbox && msg.log) {
        const logEntry = Array.isArray(msg.log) ? msg.log : [msg.log];
        const errorLog = logEntry.find((l: any) => l.method === "error");
        if (errorLog?.data) {
          errorMessage = Array.isArray(errorLog.data) ? errorLog.data.join(" ") : String(errorLog.data);
        }
      }
      // Type 3: state changes with errors (transpilation/CSS errors)
      else if (msg.type === "state" && msg.state?.error) {
        errorMessage = msg.state.error.message || msg.state.error.title || String(msg.state.error);
      }
      // Type 4: direct error events
      else if (msg.type === "error" && msg.message) {
        errorMessage = msg.message;
      }
      
      // Safety net for weird Sandpack error payloads
      if (!errorMessage && msg.error) {
         errorMessage = msg.error.message || String(msg.error);
      }
      
      // Brute-force catch for Sandpack's internal unhandled rejections
      if (!errorMessage) {
        const strMsg = JSON.stringify(msg);
        if (strMsg.includes("SyntaxError") || strMsg.includes("TypeError")) {
          // Try to extract the error string from the JSON
          const match = strMsg.match(/(?:TypeError|SyntaxError)[^"}]+/);
          if (match) errorMessage = match[0];
          else errorMessage = "SyntaxError detected in Sandpack";
        }
      }

      if (errorMessage && errorMessage.length > 10) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          triggerFix(errorMessage!);
        }, 2000);
      }
    });
    return () => {
      unsub();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [listen, triggerFix]);

  // Bulletproof fallback: watch the internal Sandpack error state directly!
  // If the error overlay is visible on screen, sandpack.error is populated.
  // This catches internal crashes that bypass the event listener.
  useEffect(() => {
    if (sandpack.error) {
      const err = sandpack.error as any;
      let errorMessage = err.message || err.title || String(err);
      
      if (errorMessage && errorMessage.length > 10) {
        // Only trigger if we aren't already fixing
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          triggerFix(errorMessage);
        }, 2000);
      }
    }
  }, [sandpack.error, triggerFix]);

  return null;
}

export default function ReactSandpack({
  files,
  viewMode = "code",
  previewWidth = "desktop",
  generationKey = 0,
  getFilesRef,
  onCodeEdit,
  onAutoFix,
}: ReactSandpackProps) {
  const showCode = viewMode === "code";
  const isMobile = previewWidth === "mobile";
  const [isFixing, setIsFixing] = useState(false);
  const fixAttemptsRef = useRef(0);
  const MAX_FIX_ATTEMPTS = 10;

  // Reset fix attempts when generation changes
  useEffect(() => {
    fixAttemptsRef.current = 0;
  }, [generationKey]);

  // We also need to reset fix attempts if the user manually types in the editor,
  // otherwise the auto-fixer stops working after 3 manual tests.
  const handleFixAttempt = useCallback(() => {
    const canRetry = fixAttemptsRef.current < 10; // Increased to 10 for manual testing
    if (canRetry) fixAttemptsRef.current++;
    return { attempts: fixAttemptsRef.current, canRetry };
  }, []);

  return (
    <div className="flex-1 w-full h-full relative border-l border-white/5 overflow-hidden">
      <SandpackProvider
        key={generationKey}
        template="react"
        theme={atomDark}
        files={files}
        options={{
          externalResources: [
            "https://cdn.tailwindcss.com",
            "https://cdn.jsdelivr.net/npm/daisyui@latest/dist/full.min.css",
          ],
          recompileMode: "delayed",
          recompileDelay: 500,
        }}
        customSetup={{
          dependencies: {
            react: "^18",
            "react-dom": "^18",
            "react-router-dom": "^6",
            "lucide-react": "0.292.0",
            recharts: "2.12.0",
            "framer-motion": "^11.0.0",
            clsx: "^2.1.1",
            "tailwind-merge": "^2.3.0",
            "react-intersection-observer": "^9.8.0",
          },
        }}
      >
        <SandpackFilesGetter
          getFilesRef={getFilesRef}
          onCodeEdit={onCodeEdit}
        />
        <SandpackErrorFixer
          onFixingChange={setIsFixing}
          onFixAttempt={handleFixAttempt}
          onAutoFix={onAutoFix}
        />
        <style>{`
 .sp-wrapper { height: 100% !important; flex: 1; display: flex; flex-direction: column; min-height: 0; }
 .sp-layout { height: 100% !important; flex: 1; display: flex; min-height: 0; }
 .sp-stack { height: 100% !important; flex: 1; min-height: 0; }
 .sp-code-editor { display: flex; flex-direction: column; height: 100% !important; min-height: 0; }
 .cm-editor { height: 100% !important; flex: 1; min-height: 0; }
 .cm-scroller { overflow: auto !important; height: 100% !important; }
 `}</style>

        <SandpackLayout className="flex-1 w-full h-full border-none! rounded-none!">
          <Group orientation="horizontal" className="w-full h-full text-white">
            {showCode && (
              <Panel
                defaultSize={20}
                minSize={10}
                className="border-r border-white/10 shrink-0 flex flex-col h-full"
              >
                <SandpackFileExplorer style={{ height: "100%" }} />
              </Panel>
            )}

            {showCode && (
              <Separator className="w-1 bg-[#1a1a1a] hover:bg-indigo-500/50 transition-colors cursor-col-resize active:bg-indigo-500 shrink-0" />
            )}

            {showCode && (
              <Panel
                defaultSize={40}
                minSize={20}
                className="border-r border-white/10 shrink-0 flex flex-col h-full"
              >
                <SandpackCodeEditor
                  showTabs
                  showLineNumbers
                  showInlineErrors
                  wrapContent
                  closableTabs
                  style={{ height: "100%", flex: 1, minHeight: 0, overflow: "hidden" }}
                />
              </Panel>
            )}

            {showCode && (
              <Separator className="w-1 bg-[#1a1a1a] hover:bg-indigo-500/50 transition-colors cursor-col-resize active:bg-indigo-500 shrink-0" />
            )}

            <Panel
              defaultSize={showCode ? 40 : 100}
              minSize={20}
              className="min-w-0 flex flex-col bg-white h-full relative"
            >
              <div
                className={`flex-1 flex items-start justify-center h-full ${isMobile ? "bg-neutral-900 pt-4" : ""}`}
              >
                <div
                  className={`h-full ${isMobile ? "w-[375px] border-x border-neutral-700 shadow-2xl rounded-xl overflow-hidden" : "w-full"}`}
                  style={isMobile ? { maxHeight: "calc(100% - 2rem)" } : {}}
                >
                  <SandpackPreview
                    showOpenInCodeSandbox={false}
                    showRefreshButton
                    style={{ height: "100%", flex: 1, minHeight: 0 }}
                  />
                </div>
              </div>
            </Panel>
          </Group>
        </SandpackLayout>

        {/* Auto-fix indicator */}
        {isFixing && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2
                          bg-zinc-900 text-white text-xs px-3 py-1.5 rounded-full z-50
                          border border-white/10 shadow-lg">
            <div className="w-3 h-3 border border-white/30 border-t-white
                            rounded-full animate-spin" />
            Auto-fixing error... ({fixAttemptsRef.current}/{MAX_FIX_ATTEMPTS})
          </div>
        )}

      </SandpackProvider>
    </div>
  );
}
