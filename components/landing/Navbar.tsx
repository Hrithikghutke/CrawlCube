"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Logo from "@/assets/logo.svg";
import { Search } from "lucide-react";

/* ── Nav structure ── */
interface NavItem {
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  {
    label: "Product",
    children: [
      { label: "AI Generation", href: "/#hero" },
      { label: "Live Preview", href: "/#showcase" },
      { label: "One-Click Deploy", href: "/#how-it-works" },
      { label: "Download HTML", href: "/#how-it-works" },
    ],
  },
  { label: "Showcase", children: [{ label: "Showcase", href: "/#hero" }] },
  {
    label: "Pricing",
    children: [{ label: "View Pricing", href: "/plans" }],
  },
  {
    label: "How It Works",
    children: [{ label: "Documentation", href: "/#hero" }],
  },
  {
    label: "Company",
    children: [
      { label: "About Us", href: "/#hero" },
      { label: "Contact", href: "mailto:info@crawlcube.com" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

export default function Navbar() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isHoveringNav, setIsHoveringNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Delayed close so moving between top‑bar and panel doesn't flicker */
  const scheduleClose = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
      setIsHoveringNav(false);
    }, 150);
  };

  const cancelClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const openDropdown = (label: string) => {
    cancelClose();
    setActiveDropdown(label);
    setIsHoveringNav(true);
  };

  const handleItemEnter = (item: NavItem) => {
    cancelClose();
    if (item.children) {
      openDropdown(item.label);
    } else {
      setActiveDropdown(null);
    }
    setIsHoveringNav(true);
  };

  const handleNavLeave = () => {
    scheduleClose();
  };

  /* Close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
        setIsHoveringNav(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const activeItem = navItems.find((i) => i.label === activeDropdown);
  const isExpanded = !!activeItem?.children;

  return (
    <>
      {/* Backdrop overlay when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40 transition-opacity duration-300"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => {
            setActiveDropdown(null);
            setIsHoveringNav(false);
          }}
        />
      )}

      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${
          isHoveringNav || scrolled
            ? "bg-background/70 backdrop-blur-lg  shadow-sm"
            : "bg-transparent "
        }`}
        onMouseEnter={cancelClose}
        onMouseLeave={handleNavLeave}
      >
        {/* ── Top bar ── */}
        <div className="max-w-7xl mx-auto px-6 pt-2 flex justify-between">
          <div className="h-14 flex items-center justify-start">
            {/* Left: Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <img src={Logo.src} className="w-7" alt="CrawlCube logo" />
            </Link>

            {/* Center: Nav links */}
            <div className="hidden md:flex gap-1 ml-8">
              {navItems.map((item) => {
                const isActive = activeDropdown === item.label;
                return item.href && item!.children ? (
                  <a
                    key={item.label}
                    href={item.href}
                    className="relative px-3 py-1.5 text-[13px] transition-colors duration-150 rounded-md text-foreground/70 hover:text-foreground"
                    onMouseEnter={() => handleItemEnter(item)}
                    onMouseOver={() => {
                      /* keep nav background while hovering plain links */
                      cancelClose();
                      setIsHoveringNav(true);
                      setActiveDropdown(null);
                    }}
                  >
                    <span>{item.label}</span>
                  </a>
                ) : (
                  <button
                    key={item.label}
                    className="relative px-3 py-1.5 text-[13px] transition-colors duration-150 rounded-md cursor-default "
                    style={{
                      color: isActive
                        ? "var(--color-foreground)"
                        : "color-mix(in srgb, var(--color-foreground) 72%, transparent)",
                      fontWeight: isActive ? 600 : 400,
                    }}
                    onMouseEnter={() => handleItemEnter(item)}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Right: Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/sign-in"
              className="hidden md:flex items-center gap-1 text-[13px] rounded-full px-4 py-[7px] transition-colors duration-150 text-foreground/80 border border-transparent hover:border-foreground/40 hover:text-foreground"
            >
              Log in
              <span className="ml-0.5 text-[10px] text-foreground/50">▾</span>
            </Link>
            <Link
              href="/sign-up"
              className="bg-primary text-primary-foreground font-semibold text-[13px] px-4 py-[7px] rounded-full hover:scale-[1.02] transition-transform flex items-center gap-1"
            >
              Start Building Free
              <span className="text-[11px]">↗</span>
            </Link>
          </div>
        </div>

        {/* ── Expanded dropdown panel ── */}
        <div
          className="overflow-hidden transition-all duration-300 ease-out"
          style={{
            maxHeight: isExpanded ? 320 : 0,
            opacity: isExpanded ? 1 : 0,
          }}
        >
          {activeItem?.children && (
            <div className="max-w-7xl mx-auto px-6 pb-10 pt-4">
              {/* Section label */}
              <p
                className="mb-4 text-muted-foreground"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                }}
              >
                Explore {activeItem.label}
              </p>

              {/* Links */}
              <div className="flex flex-col gap-1">
                {activeItem.children.map((child) => (
                  <a
                    key={child.label}
                    href={child.href}
                    className="block transition-colors duration-150 group"
                    onClick={() => {
                      setActiveDropdown(null);
                      setIsHoveringNav(false);
                    }}
                  >
                    <span
                      className="text-foreground/90 group-hover:text-primary transition-colors"
                      style={{
                        fontSize: "clamp(24px, 3vw, 18px)",
                        fontWeight: 600,
                        lineHeight: 2,
                      }}
                    >
                      {child.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile: simple bar (no dropdown on mobile) */}
      <div
        className={`md:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between transition-all duration-300 ${
          scrolled
            ? "bg-background/95 backdrop-blur-md border-b border-border/40 shadow-sm"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <Link href="/" className="flex items-center gap-2">
          <img src={Logo.src} className="w-7" alt="CrawlCube logo" />
          <span className="text-foreground font-bold text-base">crawlcube</span>
        </Link>
        <Link
          href="/sign-up"
          className="bg-primary text-primary-foreground font-semibold text-xs px-3.5 py-1.5 rounded-full"
        >
          Start Free
        </Link>
      </div>
    </>
  );
}
