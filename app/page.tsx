import type { Metadata } from "next";

import Navbar from "@/components/landing/website/Navbar";
import Hero from "@/components/landing/website/Hero";
import StatsBar from "@/components/landing/website/StatsBar";
import Showcase from "@/components/landing/website/Showcase";
import HowItWorks from "@/components/landing/website/HowItWorks";

import FinalCTA from "@/components/landing/website/FinalCTA";
import Footer from "@/components/landing/website/Footer";
import InspirationSection from "@/components/landing/website/InspirationSection";
import SEOPerformance from "@/components/landing/website/SEOPerformance";

export const metadata: Metadata = {
  title:
    "CrawlCube — AI Website Builder | Generate Complete Websites in 60 Seconds",
  description:
    "Describe your business, get a complete multi-page website in seconds. CrawlCube uses AI to generate professional websites with custom branding — free to start, yours to download.",
  keywords: [
    "AI website builder",
    "free website builder India",
    "generate website from text",
    "AI web design",
    "website builder no code",
    "website builder India",
  ],
  openGraph: {
    title:
      "CrawlCube — AI Website Builder | Generate Complete Websites in 60 Seconds",
    description:
      "Describe your business, get a complete multi-page website in seconds.",
    url: "https://www.crawlcube.com",
    siteName: "CrawlCube",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CrawlCube AI Website Builder",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CrawlCube — AI Website Builder",
    description:
      "Generate a complete website in 60 seconds from a text prompt.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://www.crawlcube.com",
  },
};

export default function LandingPage() {
  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <Hero />
      <InspirationSection />
      <StatsBar />
      <SEOPerformance />
      <Showcase />
      <HowItWorks />

      <FinalCTA />
      <Footer />
    </main>
  );
}
