"use client";

import Header from "@/components/Header";
import LandingPrompt from "@/components/LandingPrompt";
import RecentGenerations from "@/components/RecentGenerations";
import ShowcaseSection from "@/components/ShowcaseSection";
import GallerySection from "@/components/GallerySection";
import LandingFooter from "@/components/LandingFooter";

export default function Home() {
  return (
    <main className="h-screen flex flex-col bg-[#fafafa] dark:bg-[#000000] text-foreground transition-colors overflow-hidden relative">
      <div className="z-10 relative flex-none">
        <Header transparent />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-800 scrollbar-track-transparent relative z-10">
        <LandingPrompt />
        <RecentGenerations />
        <ShowcaseSection />
        <GallerySection />
        <LandingFooter />
      </div>
    </main>
  );
}
