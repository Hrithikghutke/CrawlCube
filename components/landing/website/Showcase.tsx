"use client";

import ShowcaseSection from "../sections/ShowcaseSection";

export default function Showcase() {
  return (
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
  );
}
