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
    <main className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-foreground transition-colors relative overflow-x-hidden">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        body { scrollbar-width: none; -ms-overflow-style: none; }
        body::-webkit-scrollbar { display: none; }
      `,
        }}
      />
      <Header transparent />
      <div className="relative z-10 ">
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
