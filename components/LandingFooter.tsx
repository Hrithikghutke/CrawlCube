import React from "react";
import Image from "next/image";
import Logo from "@/assets/logo.svg";

export default function LandingFooter() {
  return (
    <div className="w-full bg-background text-foreground pt-10 pb-16 relative z-10 border-t border-white/5 -mt-px">
      {/* Logos Strip */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-24">
        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-6 sm:gap-x-12 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
          {/* Simple text/SVG approximations since we don't have the explicit PNG assets */}
          <span className="font-bold text-lg tracking-tighter mix-blend-screen">
            Dribbble
          </span>
          <span className="font-semibold text-lg tracking-tight mix-blend-screen">
            ElevenLabs
          </span>
          <span className="font-medium text-lg tracking-wide mix-blend-screen">
            _zapier
          </span>
          <span className="font-bold text-lg font-mono mix-blend-screen">
            plexity
          </span>
          <span className="font-semibold text-lg mix-blend-screen">
            Cal.com
          </span>
          <span className="font-bold text-lg tracking-tight mix-blend-screen">
            mixpanel
          </span>
          <span className="font-black text-xl mix-blend-screen">miro</span>
          <span className="font-bold text-lg mix-blend-screen leading-none text-red-500">
            DOORDASH
          </span>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-12 sm:gap-8">
        {/* Brand Column */}
        <div className="col-span-1 md:col-span-1 flex flex-col items-start">
          <div className="flex items-center gap-2 font-bold text-xl mb-4 text-foreground">
            <img
              src={Logo.src}
              className="mr-2"
              alt="Logo"
              width={28}
              height={28}
            />
            CrawlCube
          </div>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs">
            Generate top-tier landing pages and full websites in seconds using
            plain English.
          </p>
          <a
            href="#"
            className="text-foreground hover:text-blue-400 font-medium text-sm transition-colors border border-white/20 hover:border-blue-400/50 rounded-full px-4 py-2"
          >
            Start Building Free
          </a>
        </div>

        {/* Product Column */}
        <div className="col-span-1 flex flex-col gap-3">
          <h4 className="text-foreground font-semibold mb-2">Product</h4>
          <a
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Features
          </a>
          <a
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Integrations
          </a>
          <a
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Pricing
          </a>
          <a
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Changelog
          </a>
        </div>

        {/* Resources Column */}
        <div className="col-span-1 flex flex-col gap-3">
          <h4 className="text-foreground font-semibold mb-2">Resources</h4>
          <a
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Documentation
          </a>
          <a
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Help Center
          </a>
          <a
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Community
          </a>
          <a
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Blog
          </a>
        </div>

        {/* Legal Column */}
        <div className="col-span-1 flex flex-col gap-3">
          <h4 className="text-foreground font-semibold mb-2">Legal</h4>
          <a
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Terms of Service
          </a>
          <a
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Cookie Policy
          </a>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 mt-12 flex flex-col sm:flex-row items-center justify-between border-t border-white/10 text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} CrawlCube Inc. All rights reserved.</p>
        <div className="flex gap-4 mt-4 sm:mt-0">
          <a href="#" className="hover:text-foreground transition-colors">
            Twitter
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            Discord
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
