"use client";

import React from "react";

const shimmerStyle = `
 @keyframes cc-shimmer {
 0% { background-position: -400px center; }
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

export type AgentStatus = "idle" | "running" | "done" | "error";

export interface AgentStep {
  id: string;
  label: string;
  status: AgentStatus;
  message?: string;
  detail?: string;
}

export function StepIcon({ status }: { status: AgentStatus }) {
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
    <div className="w-3.5 h-3.5 shrink-0 rounded-full border border-border" />
  );
}

export function getThinkingLabel(agentSteps?: AgentStep[]): string {
  if (!agentSteps) return "Compiling React";

  const running = agentSteps.find((s) => s.status === "running");
  if (!running) return "Thinking";

  if (running.id === "architect") return "Planning files architecture";
  if (running.id === "developer") return "Starting compilers";

  if (running.id.startsWith("page-")) {
    const raw = running.id.replace("page-", "");
    return `Bundling ${raw}`;
  }
  return "Working on it";
}

export function ThinkingText({ label = "Thinking" }: { label?: string }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: shimmerStyle }} />
      <span className="cc-thinking">{label}</span>
    </>
  );
}

export default function ReactGenerationProgress({
  steps,
  architectData,
}: {
  steps: AgentStep[];
  architectData?: any;
}) {
  const [architectOpen, setArchitectOpen] = React.useState(false);
  const [developerOpen, setDeveloperOpen] = React.useState(true);

  const architectStep = steps.find((s) => s.id === "architect");
  const developerStep = steps.find((s) => s.id === "developer");
  const pageSteps = steps.filter((s) => s.id.startsWith("page-"));

  // Auto-close developer accordion when all pages compile
  React.useEffect(() => {
    if (
      pageSteps.length > 0 &&
      pageSteps.every((p) => p.status === "done") &&
      developerStep?.status === "done"
    ) {
      const t = setTimeout(() => setDeveloperOpen(false), 2000);
      return () => clearTimeout(t);
    }
  }, [pageSteps, developerStep]);

  return (
    <div className="space-y-px text-[11px] font-mono w-full">
      {/* ── Architect block ── */}
      {architectStep && (
        <div className="rounded-lg overflow-hidden border border-border/60 w-full">
          <button
            onClick={() => setArchitectOpen(!architectOpen)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-background/5 transition-colors cursor-pointer"
          >
            <StepIcon status={architectStep.status} />
            <span
              className={`font-semibold tracking-wide flex-1 ${
                architectStep.status === "done"
                  ? "text-muted-foreground"
                  : architectStep.status === "running"
                    ? "text-blue-300"
                    : architectStep.status === "error"
                      ? "text-red-400"
                      : "text-muted-foreground"
              }`}
            >
              ARCHITECT
            </span>
            <span className="text-muted-foreground truncate mr-2">
              {architectStep.message ?? "Mapping filesystem..."}
            </span>
            <svg
              className={`w-3 h-3 text-muted-foreground transition-transform ${architectOpen ? "rotate-180" : ""}`}
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
          </button>
          {architectOpen && architectStep.status === "done" && (
            <div className="px-3 pb-2 pt-1 border-t border-border/40 bg-background text-muted-foreground text-[10px]">
              <div className="mb-2">
                <p className="text-foreground/40 uppercase tracking-widest mb-1">
                  Architecture Summary
                </p>
                <div className="flex flex-wrap gap-2 text-foreground/80 font-sans">
                  {architectData && architectData.brandName && (
                    <span className="bg-[#151515] px-1.5 py-0.5 rounded border border-white/5">
                      {architectData.brandName}
                    </span>
                  )}
                  {architectData &&
                    architectData.fonts &&
                    architectData.fonts.display && (
                      <span className="bg-[#151515] px-1.5 py-0.5 rounded border border-white/5">
                        Font: {architectData.fonts.display}
                      </span>
                    )}
                  {architectData &&
                    architectData.colors &&
                    architectData.colors.primary && (
                      <span className="bg-[#151515] px-1.5 py-0.5 rounded border border-white/5 flex items-center">
                        <span
                          className="w-2 h-2 rounded-sm mr-1"
                          style={{
                            backgroundColor: architectData.colors.primary,
                          }}
                        />{" "}
                        Color: {architectData.colors.primary}
                      </span>
                    )}
                </div>
              </div>
              <p className="text-foreground/40 uppercase tracking-widest mb-1">
                Component Manifest
              </p>
              {architectData && architectData.manifest ? (
                <ul className="space-y-1 mt-1">
                  {Object.keys(architectData.manifest).map((key) => (
                    <li
                      key={key}
                      className="text-foreground/50 bg-[#151515] px-2 py-1 rounded border border-white/5 truncate max-w-[280px]"
                    >
                      <strong className="text-foreground/80 mr-1">
                        {key
                          .replace("/components/", "")
                          .replace("/pages/", "")
                          .replace(".js", "")}
                        :
                      </strong>
                      <span className="text-[9px] text-foreground/40 font-mono tracking-tighter">
                        {architectData.manifest[key]}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Files defined: {pageSteps.length}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Developer block ── */}
      {developerStep &&
        (developerStep.status !== "idle" || pageSteps.length > 0) && (
          <div className="rounded-lg border border-border/60 overflow-hidden w-full mt-1">
            <button
              onClick={() => setDeveloperOpen(!developerOpen)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-background/5 transition-colors cursor-pointer"
            >
              <StepIcon status={developerStep.status} />
              <span
                className={`font-semibold tracking-wide flex-1 ${
                  developerStep.status === "done"
                    ? "text-muted-foreground"
                    : developerStep.status === "running"
                      ? "text-blue-300"
                      : "text-muted-foreground"
                }`}
              >
                DEVELOPER
              </span>
              <span className="text-muted-foreground mr-2">
                {developerStep.message ?? "Writing code..."}
              </span>
              {pageSteps.length > 0 && (
                <svg
                  className={`w-3 h-3 text-muted-foreground transition-transform ${developerOpen ? "rotate-180" : ""}`}
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

            {/* Page sub-items */}
            {developerOpen && pageSteps.length > 0 && (
              <div className="px-3 pb-2 border-t border-border/40 space-y-0.5 pt-1.5 bg-secondary/10">
                {pageSteps.map((page) => (
                  <div
                    key={page.id}
                    className="flex justify-between items-center py-0.5 pl-2 group"
                  >
                    <div className="flex items-center gap-2">
                      <StepIcon status={page.status} />
                      <span
                        className={`${
                          page.status === "done"
                            ? "text-muted-foreground"
                            : page.status === "running"
                              ? "text-blue-300/80"
                              : "text-foreground"
                        }`}
                      >
                        {page.label}
                      </span>
                    </div>
                    {page.status === "done" && (
                      <span className="text-[9px] text-muted-foreground border border-border px-1 rounded">
                        Compiled
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
    </div>
  );
}
