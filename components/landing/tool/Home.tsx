"use client";

import Header from "@/components/layout/Header";
import LandingPrompt from "@/components/landing/tool/LandingPrompt";
import RecentGenerations from "@/components/landing/sections/RecentGenerations";
import ShowcaseSection from "@/components/landing/sections/ShowcaseSection";
import GallerySection from "@/components/landing/tool/GallerySection";
import Footer from "@/components/layout/Footer";
import FinalCTA from "../website/FinalCTA";

export default function Home() {
  return (
    <main className="h-screen flex flex-col bg-[#fafafa] dark:bg-[#000000] text-foreground transition-colors overflow-hidden relative">
      <div className="z-10 relative flex-none">
        <Header transparent />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-800 scrollbar-track-transparent relative z-10">
        <LandingPrompt />
        <RecentGenerations />
        <section
          id="showcase"
          className="relative bg-background rounded-t-4xl px-6 overflow-hidden"
        >
          {/* Background Video */}
          <div className="pointer-events-none absolute inset-0 z-0 opacity-70 ">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            >
              <source src="/bg.mp4" type="video/mp4" />
            </video>
            {/* Color Overlay */}
            <div className="absolute inset-0 bg-primary opacity-55"></div>
          </div>

          {/* Content */}
          <div className="relative z-10">
            <ShowcaseSection />
          </div>
        </section>
        <GallerySection />
        <FinalCTA />
        <Footer />
      </div>
    </main>
  );
}
