import type { Metadata } from "next";
import Navbar from "@/components/landing/Navbar";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Pricing — CrawlCube AI Website Builder",
  description:
    "Start free and scale when ready. Choose from Starter, Pro, or Agency plans. All plans include every AI model, unlimited downloads, and live preview.",
  alternates: {
    canonical: "https://www.crawlcube.com/plans",
  },
};

export default function PlansPage() {
  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <div className="pt-20">
        <Pricing />
      </div>
      <Footer />
    </main>
  );
}
