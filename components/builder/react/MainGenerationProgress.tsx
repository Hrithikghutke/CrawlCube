"use client";

import React, { useEffect, useState } from "react";
import { Cpu, RefreshCw } from "lucide-react";
import { AgentStep } from "./ReactGenerationProgress";

const codeSnippets = [
  "const [isOpen, setIsOpen] = useState(false);",
  'return <div className="flex flex-col">',
  ' <Header title="Welcome"/>',
  ' <main className="flex-1 p-4">',
  " <HeroSection data={heroData} />",
  'nt-medium text-slate-300">Your Name</Label> <input required',
  " <FeatureGrid items={features} />",
  " </main>",
  "</div>;",
  "export default App;",
];

export default function MainGenerationProgress({
  steps,
  architectData,
}: {
  steps: AgentStep[];
  architectData?: any;
}) {
  const [codeIndex, setCodeIndex] = useState(0);
  const [tokenCount, setTokenCount] = useState(17200);

  // Fake code typing effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCodeIndex((prev) => (prev + 1) % codeSnippets.length);
      setTokenCount((prev) => prev + Math.floor(Math.random() * 50) + 10);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Calculate progress
  const architectStep = steps.find((s) => s.id === "architect");
  const developerStep = steps.find((s) => s.id === "developer");
  const pageSteps = steps.filter((s) => s.id.startsWith("page-"));

  const totalSteps = 2 + Math.max(pageSteps.length, 3);
  let completedSteps = 0;

  if (architectStep?.status === "done") completedSteps++;
  if (developerStep?.status === "done") completedSteps++;

  pageSteps.forEach((p) => {
    if (p.status === "done") completedSteps++;
  });

  let targetPercentage = Math.round((completedSteps / totalSteps) * 100);

  if (architectStep?.status === "running") targetPercentage = 15;
  if (architectStep?.status === "done" && developerStep?.status === "running")
    targetPercentage = Math.max(targetPercentage, 45);
  if (targetPercentage > 100) targetPercentage = 100;

  const [percentage, setPercentage] = useState(0);
  useEffect(() => {
    const int = setInterval(() => {
      setPercentage((p) => {
        if (p < targetPercentage) return p + 1;
        if (p > targetPercentage) return targetPercentage;
        return p;
      });
    }, 30);
    return () => clearInterval(int);
  }, [targetPercentage]);

  let mode = "INIT";
  let statusText = "INITIALIZING";

  if (
    developerStep?.status === "done" &&
    pageSteps.length > 0 &&
    pageSteps.every((p) => p.status === "done")
  ) {
    mode = "DONE";
    statusText = "READY";
  } else if (
    pageSteps.some((p) => p.status === "running") ||
    pageSteps.length > 0
  ) {
    mode = "COMPILE";
    statusText = "BUNDLING MODULES";
  } else if (developerStep?.status === "running") {
    mode = "BUILD";
    statusText = "GENERATING APP FILES";
  } else if (architectStep?.status === "running") {
    mode = "PLAN";
    statusText = "MAPPING ARCHITECTURE";
  }

  const userModel = architectData?.model || "Gemini 3 Flash";
  const filledSquares = Math.floor((percentage / 100) * 5);
  const displayPhase = Math.min(
    5,
    Math.max(1, Math.ceil((percentage / 100) * 5)),
  );

  return (
    <div className="w-full bg-background border border-white/5 rounded-sm overflow-hidden font-mono text-foreground/80 p-6 shadow-2xl relative">
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="flex justify-between items-center mb-6 text-[10px] font-semibold tracking-widest text-[#a0a0a0]">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={2.5} />
          <span>SYNCING PROJECT</span>
        </div>
        <div className="text-foreground text-xs">{percentage}%</div>
      </div>

      <div className="mb-2 flex items-center gap-1 opacity-80">
        {[0, 1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className={`w-[5px] h-[5px] ${idx < filledSquares ? "bg-background" : "bg-transparent border border-white/30"} rounded-[1px]`}
          />
        ))}
      </div>
      <div className="text-[13px] font-semibold tracking-wide mb-8 uppercase text-foreground/90">
        {statusText}
      </div>

      <div
        className="h-12 flex flex-col justify-end text-[11px] text-slate-400 font-mono overflow-hidden opacity-70 mb-8 whitespace-pre"
        suppressHydrationWarning
      >
        <div className="animate-pulse">{codeSnippets[codeIndex]}</div>
      </div>

      <div className="h-px w-full bg-background/10 mb-5" />

      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 border border-white/10 flex items-center justify-center bg-background/5 rounded-sm shrink-0">
          <Cpu className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-foreground truncate">
            {userModel}
          </div>
          <div className="text-[9px] uppercase tracking-widest text-foreground/40 mt-0.5 truncate">
            {mode === "DONE" ? "SYNC COMPLETE" : "BUILDING • CODE GENERATI..."}
          </div>
          <div className="text-[10px] text-foreground/50 font-medium tracking-tight mt-0.5">
            {(tokenCount / 1000).toFixed(1)}k total tokens
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-left">
        <div>
          <div className="text-lg font-medium text-foreground mb-0.5">
            {percentage}%
          </div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-foreground/40 font-bold">
            PROGRESS
          </div>
        </div>
        <div>
          <div className="text-lg font-medium text-foreground mb-0.5">
            {displayPhase}/5
          </div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-foreground/40 font-bold">
            PHASE
          </div>
        </div>
        <div>
          <div className="text-lg font-medium text-foreground mb-0.5 uppercase">
            {mode}
          </div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-foreground/40 font-bold">
            MODE
          </div>
        </div>
      </div>
    </div>
  );
}
