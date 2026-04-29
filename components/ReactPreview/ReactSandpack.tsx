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
import { useEffect, useRef } from "react";
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

export default function ReactSandpack({
  files,
  viewMode = "code",
  previewWidth = "desktop",
  generationKey = 0,
  getFilesRef,
  onCodeEdit,
}: ReactSandpackProps) {
  const showCode = viewMode === "code";
  const isMobile = previewWidth === "mobile";

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
      </SandpackProvider>
    </div>
  );
}
