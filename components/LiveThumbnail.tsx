"use client";

import PreviewFrame from "@/components/PreviewFrame";

interface Generation {
  id: string;
  shareId: string;
  siteName: string;
  prompt: string;
  themeStyle: string;
  createdAt: string | null;
  mode?: "fast" | "deep";
  layout?: any;
  deepHtml?: string | null;
  thumbnail?: string | null;
}

export const THEME_PALETTES: Record<
  string,
  { bg: string; accent: string; bar: string; blocks: string[] }
> = {
  minimal: {
    bg: "#f9fafb",
    accent: "#111827",
    bar: "#e5e7eb",
    blocks: ["#f3f4f6", "#e5e7eb", "#d1d5db"],
  },
  bold: {
    bg: "#0f0f0f",
    accent: "#facc15",
    bar: "#1f1f1f",
    blocks: ["#facc15", "#f97316", "#1f1f1f"],
  },
  glassmorphism: {
    bg: "linear-gradient(135deg,#1e1b4b,#312e81)",
    accent: "#818cf8",
    bar: "rgba(255,255,255,0.1)",
    blocks: [
      "rgba(129,140,248,0.4)",
      "rgba(196,181,253,0.3)",
      "rgba(255,255,255,0.1)",
    ],
  },
  elegant: {
    bg: "#1a1209",
    accent: "#d4a855",
    bar: "#2d2215",
    blocks: ["#d4a855", "#a37c32", "#2d2215"],
  },
  corporate: {
    bg: "#f8fafc",
    accent: "#2563eb",
    bar: "#e2e8f0",
    blocks: ["#2563eb", "#3b82f6", "#e2e8f0"],
  },
  "deep-dive": {
    bg: "#0a0a0a",
    accent: "#a855f7",
    bar: "#1a1a1a",
    blocks: ["#a855f7", "#ec4899", "#1a1a1a"],
  },
};

export function ThemeThumbnail({ themeStyle }: { themeStyle: string }) {
  const p = THEME_PALETTES[themeStyle] ?? THEME_PALETTES["corporate"];
  const isGradientBg = p.bg.startsWith("linear");
  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{ background: isGradientBg ? p.bg : p.bg }}
    >
      {/* Nav bar simulation */}
      <div
        className="absolute top-0 left-0 right-0 h-[18%] flex items-center px-4 gap-2"
        style={{ background: p.bar }}
      >
        <div
          className="w-4 h-2 rounded-sm"
          style={{ background: p.accent, opacity: 0.9 }}
        />
        <div className="flex-1" />
        <div
          className="w-3 h-1.5 rounded-sm"
          style={{ background: p.accent, opacity: 0.4 }}
        />
        <div
          className="w-3 h-1.5 rounded-sm"
          style={{ background: p.accent, opacity: 0.4 }}
        />
      </div>
      {/* Hero block */}
      <div
        className="absolute top-[22%] left-3 right-3 h-[28%] rounded-md"
        style={{ background: p.blocks[0], opacity: 0.7 }}
      />
      {/* Two feature cards */}
      <div
        className="absolute top-[55%] left-3 right-[52%] h-[20%] rounded-md"
        style={{ background: p.blocks[1], opacity: 0.55 }}
      />
      <div
        className="absolute top-[55%] left-[52%] right-3 h-[20%] rounded-md"
        style={{ background: p.blocks[2], opacity: 0.45 }}
      />
      {/* Bottom bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[12%]"
        style={{ background: p.bar, opacity: 0.6 }}
      />
    </div>
  );
}

export default function LiveThumbnail({
  gen,
  scale = 0.0625,
  width = 1280,
  height = 896,
}: {
  gen: any;
  scale?: number;
  width?: number;
  height?: number;
}) {
  if (gen.thumbnail) {
    return (
      <img
        src={gen.thumbnail}
        alt={gen.siteName || "Site thumbnail"}
        className="w-full h-full object-cover object-top"
      />
    );
  }

  if (gen.mode === "deep" && gen.deepHtml) {
    return (
      <div className="absolute inset-0 bg-background pointer-events-none select-none">
        <iframe
          srcDoc={gen.deepHtml}
          style={{
            width: `${width}px`,
            height: `${height}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            border: "none",
          }}
          scrolling="no"
          tabIndex={-1}
        />
      </div>
    );
  }

  if (gen.layout) {
    return (
      <div className="absolute inset-0 bg-background pointer-events-none select-none">
        <div
          style={{
            width: `${width}px`,
            height: `${height}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <PreviewFrame
            layout={gen.layout}
            editable={false}
            isThumbnail={true}
          />
        </div>
      </div>
    );
  }

  return <ThemeThumbnail themeStyle={gen.themeStyle} />;
}
