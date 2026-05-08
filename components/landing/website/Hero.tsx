"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUp } from "lucide-react";
import bgLogo from "@/assets/login-assets/bg-logo-login.svg";

const prompts = [
  `"Build a website for my restaurant 'Spice Garden' in Mumbai..."`,
  `"Create a modern gym website for FitLife Fitness Center..."`,
  `"Design a portfolio for a freelance photographer in Pune..."`,
];

export default function Hero() {
  const [promptIndex, setPromptIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const currentPrompt = prompts[promptIndex];
    let charIndex = 0;
    setDisplayText("");
    setIsTyping(true);

    // Typing phase
    const typeInterval = setInterval(() => {
      if (charIndex < currentPrompt.length) {
        setDisplayText(currentPrompt.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        // Wait 3 seconds then move to next prompt
        setTimeout(() => {
          setPromptIndex((prev) => (prev + 1) % prompts.length);
        }, 3000);
      }
    }, 35);

    return () => clearInterval(typeInterval);
  }, [promptIndex]);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background text-foreground"
    >
      {/* Grid dot pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(206, 205, 205, 0.09) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="absolute md:top-0 md:left-0 md:right-0  z-0">
        <Image
          src={bgLogo}
          alt="Crawl Cube Background Pattern"
          width={900}
          height={900}
          className="object-contain opacity-100"
          priority
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-32 pb-24 text-center">
        {/* Badge pill */}
        <div className=" inline-block mb-6 bg-background border border-border rounded-full px-4 py-1.5 text-[13px] tracking-wide text-foreground/80">
          ✦ AI Website Builder — Free to Start
        </div>

        {/* H1 Headline */}
        <h1
          className="font-bold  text-foreground leading-[1.1] mb-6"
          style={{ fontSize: "clamp(32px, 5vw, 68px)" }}
        >
          Your website. Built by <span className="text-primary">AI</span>
          .
          <br />
          Ready in 60 seconds.
        </h1>

        {/* Subheadline */}
        <p
          className="mx-auto mb-9 text-muted-foreground"
          style={{
            fontSize: "clamp(16px, 2vw, 18px)",
            maxWidth: 600,
            lineHeight: 1.7,
          }}
        >
          Describe your business in plain English. CrawlCube generates a
          complete, multi-page website with custom branding, real content, and
          animations — ready to download or deploy instantly.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-4">
          <Link
            href="/sign-up"
            className="bg-primary text-primary-foreground font-semibold rounded-full transition-all duration-200 hover:shadow-[0_0_20px_var(--color-primary)] hover:scale-[1.02] px-7 py-3.5"
          >
            Start Building Free →
          </Link>
          <a
            href="#showcase"
            className="rounded-full transition-all duration-200 px-7 py-3.5 border border-border text-foreground/80 bg-transparent hover:border-foreground/50 hover:text-foreground"
          >
            Watch it build live
          </a>
        </div>

        {/* Trust text */}
        <p className="text-[13px] text-muted-foreground mt-4">
          No credit card required · 20 free credits on signup · Cancel anytime
        </p>

        {/* Mock Prompt Card */}
        <div className="block mt-14 pointer-events-none">
          <div className="mx-auto transition-all duration-200 cursor-pointer group bg-secondary/10 border border-border rounded-2xl px-6 py-5 max-w-[680px] hover:border-primary/50">
            {/* Typewriter area */}
            <div className="text-left min-h-[48px] text-foreground/70 text-[15px] leading-[1.6]">
              {displayText}
              <span
                className="inline-block w-[2px] h-[1em] ml-0.5 align-middle"
                style={{
                  backgroundColor: isTyping
                    ? "var(--color-primary)"
                    : "var(--color-muted-foreground)",
                  animation: "cursorBlink 0.8s step-end infinite",
                }}
              />
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between mt-4">
              {/* Chip pills */}
              <div className="flex items-center gap-2">
                <span className="rounded-full text-xs font-medium bg-secondary/30 text-foreground/70 px-2.5 py-1">
                  HTML + JS
                </span>
                <span className="rounded-full text-xs font-medium bg-secondary/30 text-foreground/70 px-2.5 py-1">
                  Deep Dive
                </span>
                <span className="rounded-full text-xs font-medium flex items-center gap-1.5 bg-secondary/30 text-foreground/70 px-2.5 py-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                  Gemini 3 Flash
                </span>
              </div>

              {/* Send button */}
              <div className="flex items-center justify-center rounded-full bg-primary w-9 h-9">
                <ArrowUp className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes heroFloat {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(20px);
          }
        }
        @keyframes cursorBlink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
}
