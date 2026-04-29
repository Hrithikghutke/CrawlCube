"use client";

import { useState } from "react";
import { Quote } from "lucide-react";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
  color: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "CrawlCube has completely transformed how I build websites for clients. What used to take weeks now takes minutes with AI-powered generation!",
    name: "Priya S.",
    role: "Freelance Designer",
    initials: "PS",
    color: "#ec4899",
  },
  {
    quote:
      "The quality of websites generated is incredible. My clients can't believe these are AI-generated. The one-click deploy to Netlify is a game-changer.",
    name: "Rahul M.",
    role: "Agency Owner",
    initials: "RM",
    color: "#8b5cf6",
  },
  {
    quote:
      "I went from idea to a fully deployed landing page in under 2 minutes. CrawlCube's Deep Dive mode produces production-ready code that just works.",
    name: "Ananya K.",
    role: "Startup Founder",
    initials: "AK",
    color: "#3b82f6",
  },
  {
    quote:
      "As an agency, we use CrawlCube to prototype entire sites before pitching to clients. It saves us hundreds of hours and the results are stunning.",
    name: "Vikram T.",
    role: "Creative Director",
    initials: "VT",
    color: "#10b981",
  },
  {
    quote:
      "The AI understands modern design trends better than most human developers I've worked with. Absolutely worth every credit.",
    name: "Sneha D.",
    role: "Product Manager",
    initials: "SD",
    color: "#f59e0b",
  },
];

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const current = testimonials[active];

  return (
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 mb-6">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
            Testimonials
          </span>
        </div>

        <h2
          className="text-foreground font-bold mb-12"
          style={{ fontSize: "clamp(28px, 4vw, 42px)" }}
        >
          Trusted by Developers
          <br />
          Worldwide
        </h2>

        {/* Quote card */}
        <div className="relative rounded-2xl border border-border bg-foreground/3 p-8 md:p-10 text-left max-w-2xl mx-auto">
          {/* Quote icon top-left */}
          <div className="absolute top-6 left-6 w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center">
            <Quote className="w-4 h-4 text-muted-foreground/50 rotate-180" />
          </div>

          {/* Quote icon top-right */}
          <div className="absolute top-6 right-6">
            <span className="text-3xl font-serif text-primary/40">
              &ldquo;&rdquo;
            </span>
          </div>

          {/* Quote text */}
          <p className="text-foreground/90 text-base md:text-lg leading-relaxed mt-8 mb-6">
            &ldquo;{current.quote}&rdquo;
          </p>

          {/* Author */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: current.color }}
            >
              {current.initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {current.name}
              </p>
              <p className="text-xs text-primary">{current.role}</p>
            </div>
          </div>
        </div>

        {/* Avatar selector */}
        <div className="flex items-center justify-center gap-3 mt-8">
          {testimonials.map((t, i) => (
            <button
              key={t.name}
              onClick={() => setActive(i)}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-300 border-2 ${
                i === active
                  ? "scale-110 border-primary shadow-lg"
                  : "opacity-50 border-transparent hover:opacity-80 hover:scale-105"
              }`}
              style={{
                backgroundColor: t.color,
                boxShadow: i === active ? `0 0 20px ${t.color}44` : "none",
              }}
              aria-label={`View testimonial from ${t.name}`}
            >
              {t.initials}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
