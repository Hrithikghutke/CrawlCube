"use client";

import { useEffect, useRef, useState } from "react";

// ✅ Import your local images like this
import image1 from "@/assets/landingPage/prompt_page.png";
import image2 from "@/assets/landingPage/agent_page.png";
import image3 from "@/assets/landingPage/react_build_page.png";
import image4 from "@/assets/landingPage/publish_page.png";

// Next.js StaticImageData has a `.src` string property
// This helper normalises both local imports and plain URL strings
type ImageSrc = string | { src: string };
const toSrc = (img: ImageSrc) => (typeof img === "string" ? img : img.src);

const FEATURES = [
  {
    id: "userprompt",
    title: "User prompt",
    description:
      "Craft prompts for your website, its goals, target audience, and desired style. Be specific with layout, tone, and pages—the more detail, the better your AI-generated site will match your vision.",
    image: image1,
  },
  {
    id: "aiagents",
    title: "AI Agents",
    description:
      "Our Multiagent Pipeline completes your website development from scratch to deployment using various AI agents such as Designer, Developer, Content Writer, UI/UX Designer, SEO Expert, and deployer agent.",
    image: image2,
  },
  {
    id: "inlineediting",
    title: "Inline editing",
    description:
      "Edit or regenerate any element on the page using AI instantly. Rewrite copy, tweak layouts, or generate new sections without leaving the canvas—natural conversation that brings your vision to life.",
    image: image3,
  },
  {
    id: "instantdeploy",
    title: "Instant deploy",
    description:
      "Launch your website instantly with a single click. Deploy to the web, mobile, desktop, or even email. Push updates anytime to go live immediately.",
    image: image4,
  },
];

export default function HowItWorks() {
  const [activeIndex, setActiveIndex] = useState(0);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const onScroll = () => {
      const mid = window.innerHeight / 2;
      let best = 0;
      let bestDist = Infinity;
      imageRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dist = Math.abs((r.top + r.bottom) / 2 - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActiveIndex(best);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (i: number) =>
    imageRefs.current[i]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

  return (
    <section className="bg-black py-16 lg:py-24 overflow-x-clip">
      {/* ════════════════════════════════════════
          MOBILE layout  (hidden on lg+)
          Image → title → description, stacked
      ════════════════════════════════════════ */}
      <div className="lg:hidden px-5 flex flex-col">
        {/* Mobile heading */}
        <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight mb-10">
          How it
          <br />
          Works
        </h2>

        {FEATURES.map((f) => (
          <div key={f.id} className="mb-12 last:mb-0">
            {/* Full-width image */}
            <div className="rounded-2xl overflow-hidden mb-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <img
                src={toSrc(f.image)}
                alt={f.title}
                className="block w-full aspect-video object-cover"
              />
            </div>

            {/* Text */}
            <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
            <p className="text-sm text-white/50 leading-relaxed mb-3">
              {f.description}
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-1 text-sm font-semibold text-white hover:text-white/70 transition-colors"
            >
              Learn more
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        ))}
      </div>

      <div className="mb-10 max-w-6xl mx-auto ">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight">
            How It Works
          </h2>
        </div>
        <p className="text-foreground/70 text-sm">
          Three steps from your idea to a complete, production-ready website.
        </p>
      </div>
      {/* ════════════════════════════════════════
          DESKTOP layout  (hidden below lg)
          Sticky left 30% + scrolling right 70%
      ════════════════════════════════════════ */}
      <div className="hidden lg:flex max-w-7xl mx-auto pl-12 xl:pl-20 items-start">
        {/* LEFT — sticky accordion */}
        <div className="w-[35%] min-w-[260px] shrink-0 sticky top-20 self-start pr-20 pt-20">
          <div className="flex flex-col">
            {FEATURES.map((f, i) => {
              const active = activeIndex === i;
              return (
                <div key={f.id}>
                  <div className="h-px bg-white/9" />
                  <div
                    className="py-5 cursor-pointer"
                    onClick={() => scrollTo(i)}
                  >
                    <h3
                      className={`text-3xl font-normal transition-colors duration-300 ${
                        active ? "text-white" : "text-white/[0.28]"
                      }`}
                    >
                      {f.title}
                    </h3>

                    {/* Collapsible body */}
                    <div
                      className="overflow-hidden transition-all duration-500 ease-in-out"
                      style={{
                        maxHeight: active ? "200px" : "0px",
                        opacity: active ? 1 : 0,
                      }}
                    >
                      <p className="mt-3 text-sm leading-[1.75] text-white/50">
                        {f.description}
                      </p>
                      <a
                        href="#"
                        className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-white hover:text-white/70 transition-colors"
                      >
                        Learn more
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="h-px bg-white/9" />
          </div>
        </div>

        {/* RIGHT — images bleed off right edge */}
        <div className="flex-1 min-w-0 flex flex-col gap-7 overflow-visible">
          {FEATURES.map((f, i) => {
            const active = activeIndex === i;
            return (
              <div
                key={f.id}
                ref={(el) => {
                  imageRefs.current[i] = el;
                }}
                className={`relative rounded-2xl mt-12 overflow-hidden w-[160%] transition-all duration-500 ease-in-out ${
                  active
                    ? "opacity-100 scale-100 shadow-[0_32px_80px_rgba(0,0,0,0.65)]"
                    : "opacity-40 scale-[0.950] shadow-[0_16px_40px_rgba(0,0,0,0.4)]"
                }`}
              >
                <img
                  src={toSrc(f.image)}
                  alt={f.title}
                  className="block w-full aspect-auto object-fill opacity-75"
                />
                {/* Right-edge fade */}
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-transparent to-black/70 pointer-events-none" />
                {/* Active badge */}
                <div
                  className={`absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-md border border-white/12 text-[11px] font-semibold tracking-[0.09em] uppercase text-white/75 transition-opacity duration-300 ${active ? "opacity-100" : "opacity-0"}`}
                >
                  {f.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
