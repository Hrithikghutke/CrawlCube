"use client";

import { useEffect, useRef, useState } from "react";

/* ── Google Logo SVG ── */
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/* ── Animated circular score gauge ── */
function ScoreGauge({ score, label }: { score: number; label: string }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;
  const isMax = score === 100;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let current = 0;
          const step = score / 40;
          const interval = setInterval(() => {
            current += step;
            if (current >= score) {
              current = score;
              clearInterval(interval);
            }
            setAnimatedScore(Math.round(current));
          }, 20);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [score]);

  return (
    <div ref={ref} className="flex flex-col items-center gap-3">
      <div className="relative w-[110px] h-[110px] rounded-full">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
          {/* Track */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke="#1a1e2e"
            strokeWidth="4.5"
          />
          {/* Progress arc */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 0.8s ease-out",
              filter: "drop-shadow(0 0 6px #3b9eff)",
            }}
          />
          <defs>
            <linearGradient
              id="gaugeGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="var(--foreground)" />
              <stop offset="100%" stopColor="var(--primary)" />
            </linearGradient>
          </defs>
        </svg>
        {/* Score number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-bold text-white"
            style={{ fontSize: isMax ? "1.75rem" : "1.5rem" }}
          >
            {animatedScore}
          </span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

/* ── Traffic source row ── */
function SourceRow({
  icon,
  domain,
  visits,
  barWidth,
}: {
  icon: string;
  domain: string;
  visits: string;
  barWidth: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-sm w-4 text-center opacity-60">{icon}</span>
      <span className="text-sm text-foreground/80 w-28 truncate">{domain}</span>
      <div className="flex-1 h-1.5 rounded-full bg-border/50 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/60"
          style={{ width: barWidth }}
        />
      </div>
      <span className="text-sm text-muted-foreground font-medium w-12 text-right">
        {visits}
      </span>
    </div>
  );
}

/* ── Mini chart sparkline (pure CSS) ── */
function Sparkline() {
  const points = [
    30, 25, 35, 28, 40, 38, 55, 50, 62, 58, 70, 65, 78, 82, 75, 88, 92, 85, 95,
    90,
  ];
  const width = 400;
  const height = 80;
  const maxVal = Math.max(...points);
  const step = width / (points.length - 1);

  const pathD = points
    .map((p, i) => {
      const x = i * step;
      const y = height - (p / maxVal) * height;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-20"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor="var(--color-primary)"
            stopOpacity="0.3"
          />
          <stop
            offset="100%"
            stopColor="var(--color-primary)"
            stopOpacity="0"
          />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sparkFill)" />
      <path
        d={pathD}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function SEOPerformance() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* ── Section Heading ── */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-16">
          Scale without
          <br />
          switching tools
        </h2>

        {/* ── Bento Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ━━━ Card 1: Analytics & Insights (tall left) ━━━ */}
          <div className="row-span-2 rounded-2xl border border-border bg-secondary/20 p-6 sm:p-8 flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                Analytics &amp; insights
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Track traffic, measure performance, and monitor conversions.
              </p>
              <a
                href="#"
                className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground mt-3 transition-colors"
              >
                Learn more
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
            </div>

            <div className="rounded-xl border border-border bg-background/50 p-5 flex-1">
              <p className="text-lg font-bold text-foreground mb-4">Overview</p>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Live Visitors</p>
                  <p className="text-xl font-bold text-foreground">414</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Unique Visitors
                  </p>
                  <p className="text-xl font-bold text-foreground">1.7M</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Total Pageviews
                  </p>
                  <p className="text-xl font-bold text-foreground">3.2M</p>
                </div>
              </div>

              <div className="mb-5 border-b border-border pb-5">
                <Sparkline />
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Pageviews{" "}
                    <strong className="text-foreground ml-1">258,156</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-pink-400" />
                    Visitors{" "}
                    <strong className="text-foreground ml-1">85,458</strong>
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">
                    Sources
                  </p>
                  <span className="text-xs text-muted-foreground">
                    Referrer
                  </span>
                </div>
                <SourceRow
                  icon="G"
                  domain="google.com"
                  visits="436K"
                  barWidth="85%"
                />
                <SourceRow
                  icon="◎"
                  domain="chatgpt.com"
                  visits="189K"
                  barWidth="55%"
                />
                <SourceRow
                  icon="in"
                  domain="linkedin.com"
                  visits="96K"
                  barWidth="35%"
                />
                <SourceRow
                  icon="▶"
                  domain="youtube.com"
                  visits="82K"
                  barWidth="28%"
                />
                <SourceRow
                  icon="b"
                  domain="bing.com"
                  visits="71K"
                  barWidth="22%"
                />
                <SourceRow
                  icon="𝕏"
                  domain="x.com"
                  visits="49K"
                  barWidth="16%"
                />
              </div>
            </div>
          </div>

          {/* ━━━ Card 2: Built-in optimization ━━━ */}
          <div className="rounded-2xl border border-border bg-secondary/20 p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-foreground">
              Built-in optimization
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Every generated website includes semantic HTML, meta tags, and
              responsive design out of the box.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground mt-3 transition-colors"
            >
              Learn more
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>

            <div className="mt-5 rounded-xl border border-border bg-background/50 p-4">
              <div className="flex items-center gap-2 mb-3 text-xs">
                <span className="px-2.5 py-1 rounded-md bg-primary/20 text-primary font-medium">
                  Pages
                </span>
                <span className="px-2.5 py-1 rounded-md text-muted-foreground">
                  Layers
                </span>
                <span className="px-2.5 py-1 rounded-md text-muted-foreground">
                  Assets
                </span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-foreground/80 px-2 py-1.5">
                  <span className="text-xs">🏠</span> Home
                </div>
                <div className="flex items-center gap-2 text-foreground/80 px-2 py-1.5">
                  <span className="text-xs">⚙️</span> About
                </div>
                <div className="flex items-center gap-2 text-foreground font-medium px-2 py-1.5 bg-primary/10 rounded-lg">
                  <span className="text-xs">📄</span> Services
                </div>
                <div className="flex items-center gap-2 text-foreground/80 px-2 py-1.5">
                  <span className="text-xs">✉️</span> Contact
                </div>
                <div className="flex items-center gap-2 text-foreground/80 px-2 py-1.5">
                  <span className="text-xs">💰</span> /pricing
                </div>
              </div>
            </div>
          </div>

          {/* ━━━ Card 3: Bottom-right split ━━━ */}

          {/* SEO & Performance text card */}
          <div className="rounded-2xl border border-border bg-secondary/20 p-6 sm:p-8 flex flex-col justify-between">
            <div className="pb-3">
              <h3 className="text-lg font-semibold text-foreground">
                SEO &amp; performance
              </h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Optimize every page with built-in SEO settings, metadata, and
                blazing-fast hosting.
              </p>
              <a
                href="#"
                className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground mt-3 transition-colors"
              >
                Learn more
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
            </div>

            {/* ── Google Lighthouse Scores ── */}
            <div className="rounded-2xl border border-border p-6 sm:p-7 overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-2 mb-7">
                <GoogleLogo />
                <span className="text-sm font-semibold text-white/80">
                  Google Lighthouse
                </span>
              </div>

              {/* Score Gauges */}
              <div className="flex items-center justify-around gap-1">
                <ScoreGauge score={99} label="SEO" />
                <ScoreGauge score={100} label="Performance" />
                <ScoreGauge score={98} label="Accessibility" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
