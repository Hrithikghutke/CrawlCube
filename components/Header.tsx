"use client";

import { useState, useEffect } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { Zap, LayoutDashboard, ShieldCheck } from "lucide-react";
import { useCredits } from "@/context/CreditsContext";
import Logo from "@/assets/logo.svg";
import cname from "@/assets/cname.svg";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ThemeToggle } from "@/components/ThemeToggle";

export default function Header({
  onNavigate,
  transparent = false,
}: {
  onNavigate?: (href: string) => void;
  transparent?: boolean;
}) {
  const { isSignedIn, user } = useUser();
  const { credits } = useCredits();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isAdmin =
    user?.primaryEmailAddress?.emailAddress === "hrithikghutke01@gmail.com";
  const nav = (href: string) =>
    onNavigate ? onNavigate(href) : router.push(href);

  return (
    <header
      className={`sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-10 transition-all duration-300 ${
        scrolled || !transparent
          ? "bg-background/95 backdrop-blur-md py-4 shadow-sm border-b border-border/40"
          : "bg-transparent py-4 border-b border-transparent"
      }`}
    >
      {/* Logo */}
      <button
        onClick={() => nav("/home")}
        className="flex items-center gap-2 cursor-pointer"
      >
        <img
          src={Logo.src}
          className="w-6 sm:w-6 lg:w-7 opacity-100 transition-opacity"
          alt="CrawlCube logo"
        />
      </button>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-4">
        {isSignedIn && credits !== null && (
          <Link
            href="/pricing"
            className="flex items-center gap-1.5 bg-secondary/50 hover:bg-secondary border border-border rounded-full px-2.5 sm:px-3 py-1.5 transition-colors"
          >
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-500 fill-yellow-500" />
            <span className="text-[12px] font-normal  text-foreground">
              {credits}
              <span className="hidden sm:inline">
                {" "}
                {credits === 1 ? "credit" : "credits"}
              </span>
            </span>
          </Link>
        )}

        {isSignedIn && (
          <button
            onClick={() => nav("/dashboard")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => nav("/admin")}
            className="flex items-center gap-1.5 text-xs text-primary dark:text-primary transition-colors cursor-pointer"
            title="Admin Dashboard"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </button>
        )}

        <ThemeToggle />
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </header>
  );
}
