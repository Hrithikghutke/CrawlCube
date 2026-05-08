"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Share2,
  Clock,
  Layers,
  Trash2,
  ChevronDown,
  ChevronUp,
  Atom,
  Code2,
} from "lucide-react";
import Header from "@/components/layout/Header";
import LiveThumbnail from "@/components/dashboard/LiveThumbnail";

interface Generation {
  id: string;
  shareId: string;
  siteName: string;
  prompt: string;
  themeStyle: string;
  createdAt: string | null;
  mode: string;
}

const THEME_COLORS: Record<string, string> = {
  minimal: "#a3a3a3",
  bold: "#f97316",
  glassmorphism: "#8b5cf6",
  elegant: "#d4af7a",
  corporate: "#3b82f6",
  "deep-dive": "#ec4899",
};

const THEME_LABELS: Record<string, string> = {
  minimal: "Minimal",
  bold: "Bold",
  glassmorphism: "Glassmorphism",
  elegant: "Elegant",
  corporate: "Corporate",
  "deep-dive": "✦ Deep Dive",
};

export default function Dashboard({ data }: any) {
  const router = useRouter();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);

  useEffect(() => {
    fetchGenerations();
  }, []);

  const fetchGenerations = async () => {
    try {
      const res = await fetch("/api/generations");
      const data = await res.json();
      setGenerations(data.generations ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (shareId: string) => {
    const url = `${window.location.origin}/preview/${shareId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(shareId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/generations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setGenerations((prev) => prev.filter((g) => g.id !== id));
      }
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <div className="max-w-6xl mx-auto w-full px-6 py-10">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">My Websites</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {generations.length} site{generations.length !== 1 ? "s" : ""}
              {""}
              generated
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            New Website
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && generations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary/10 border border-border flex items-center justify-center">
              <Layers className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No websites yet</p>
            <p className="text-muted-foreground/80 text-sm">
              Generate your first website to see it here
            </p>
            <Link
              href="/"
              className="mt-2 flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              Build your first site
            </Link>
          </div>
        )}

        {/* Grid */}
        {!loading && generations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {generations.map((gen) => {
              const isExpanded = expandedPrompt === gen.id;
              const promptText = gen.prompt?.trim() || "";
              const isLong = promptText.length > 80;

              return (
                <div
                  key={gen.id}
                  className="group relative bg-background border border-border rounded-2xl overflow-hidden hover:border-foreground/30 transition-all duration-300 flex flex-col h-[280px]"
                >
                  {/* Background Live Thumbnail Setup */}
                  <div className="absolute inset-0 z-0 overflow-hidden mix-blend-luminosity opacity-40 group-hover:opacity-70 transition-opacity duration-500">
                    <LiveThumbnail
                      gen={gen}
                      scale={0.3}
                      width={1280}
                      height={896}
                    />
                  </div>

                  {/* Framework Badge */}
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary/80 text-foreground text-[10px] font-bold shadow-lg backdrop-blur-md border border-border transition-transform group-hover:scale-110 origin-left">
                    {gen.mode === "react" ? (
                      <>
                        <Atom className="w-3 h-3 text-blue-400" />
                        React
                      </>
                    ) : (
                      <>
                        <Code2 className="w-3 h-3 text-orange-400" />
                        HTML/JS
                      </>
                    )}
                  </div>

                  {/* Heavy dark gradient overlay to ensure text legibility */}
                  <div className="absolute inset-0 z-0 bg-linear-to-t from-background via-background/80 to-background/40 pointer-events-none" />

                  {/* Foreground Content */}
                  <div className="relative z-10 flex flex-col h-full">
                    {/* Color accent top bar */}

                    <div className="p-5 flex flex-col flex-1">
                      {/* Site name + theme badge + delete */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-base leading-tight truncate">
                            {gen.siteName || "Untitled Project"}
                          </h3>
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5"
                            style={{
                              background: `${THEME_COLORS[gen.themeStyle] ?? "#6366f1"}22`,
                              color: THEME_COLORS[gen.themeStyle] ?? "#6366f1",
                            }}
                          >
                            {THEME_LABELS[gen.themeStyle] ?? gen.themeStyle}
                          </span>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(gen.id)}
                          disabled={deletingId === gen.id}
                          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer disabled:opacity-40"
                          title="Delete"
                        >
                          {deletingId === gen.id ? (
                            <div className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Prompt */}
                      <div className="mb-3 relative shrink-0">
                        {promptText ? (
                          <>
                            <div
                              className={`text-xs text-foreground/80 leading-relaxed ${
                                !isExpanded && isLong
                                  ? "line-clamp-2"
                                  : isExpanded
                                    ? "max-h-[72px] overflow-y-auto scrollbar-thin scrollbar-thumb-foreground/20 pr-1"
                                    : ""
                              }`}
                            >
                              {promptText}
                            </div>
                            {isLong && (
                              <button
                                onClick={() =>
                                  setExpandedPrompt(isExpanded ? null : gen.id)
                                }
                                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground mt-1 transition-colors cursor-pointer"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3 h-3" />
                                    Show less
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3" />
                                    Show more
                                  </>
                                )}
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="text-xs text-muted-foreground italic">
                            No prompt recorded
                          </div>
                        )}
                      </div>

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Date */}
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-4">
                        <Clock className="w-3 h-3" />
                        {formatDate(gen.createdAt)}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 relative">
                        {/* Continue editing — full width primary action */}
                        <Link
                          href={
                            gen.mode === "react"
                              ? `/react-builder?continue=${gen.id}`
                              : `/build?continue=${gen.id}`
                          }
                          className="w-full text-center text-xs font-semibold py-2 rounded-lg transition-all"
                          style={{
                            background:
                              gen.themeStyle === "deep-dive"
                                ? "linear-gradient(90deg,var(--primary))"
                                : "var(--primary)",
                            color:
                              gen.themeStyle === "deep-dive"
                                ? "#FFFFFF"
                                : "#FFFFFF",
                          }}
                        >
                          ✦ Continue Editing
                        </Link>
                        <div className="flex gap-2">
                          <Link
                            href={`/preview/${gen.shareId}`}
                            target="_blank"
                            className="flex-1 flex items-center justify-center text-xs font-semibold py-2 rounded-lg bg-secondary/80 hover:bg-secondary text-foreground backdrop-blur-sm transition-all"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleShare(gen.shareId)}
                            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg transition-all cursor-pointer backdrop-blur-sm ${
                              copiedId === gen.shareId
                                ? "bg-green-500/20 text-green-400 border border-green-500/20"
                                : "bg-secondary/80 text-foreground hover:bg-secondary border border-transparent"
                            }`}
                          >
                            <Share2 className="w-3 h-3" />
                            {copiedId === gen.shareId ? "Copied!" : "Share"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
