import Link from "next/link";
import { Play } from "lucide-react";

const stats = [
  {
    value: "60s",
    label: "Build Time",
    description:
      "Generate a complete multi-page website from a single prompt in under a minute.",
  },
  {
    value: "4+",
    label: "Generation Modes",
    description:
      "Fast HTML, Deep Dive, React, and more — pick the stack that fits your project.",
  },
  {
    value: "100%",
    label: "Yours to Own",
    description:
      "Download the full source code. No lock-in, no watermarks, no strings attached.",
  },
  {
    value: "20",
    label: "Free Credits",
    description:
      "Every new account starts with 20 free credits. No credit card required to begin.",
  },
];

export default function StatsBar() {
  return (
    <section className="py-16 px-6 md:px-4 sm:px-6">
      <div className="max-w-6xl mx-auto rounded-3xl py-8 sm:py-12">
        {/* ── Header Row ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight ">
              We only deliver results.
            </h2>
            <p className="text-muted-foreground mt-2 text-[15px]">
              We don&apos;t use excuses or something. Okay maybe sometimes.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/sign-up"
              className="inline-flex items-center px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-all duration-200"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {stats.map((stat, idx) => (
            <div
              key={stat.label}
              className={`${
                idx < stats.length - 1 ? "lg:border-r lg:border-border/50" : ""
              } lg:pr-6`}
            >
              <p className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight ">
                {stat.value}
              </p>
              <p className="text-foreground font-semibold text-sm mt-3">
                {stat.label}
              </p>
              <p className="text-muted-foreground text-[13px] leading-relaxed mt-1.5">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
