import React, { useState, useEffect } from "react";
import {
  Grid,
  FileText,
  Layout,
  Briefcase,
  User,
  Smartphone,
  LayoutGrid,
  X,
  Monitor,
  Tablet,
  Smartphone as MobileIcon,
} from "lucide-react";
import { createPortal } from "react-dom";

type ShowcaseItem = {
  id: number;
  title: string;
  category: string;
  categoryId: string;
  image: string;
  description: string;
  iframeUrl?: string;
  model?: string;
};

const SHOWCASE_TABS = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "landing", label: "Landing Pages", icon: FileText },
  { id: "apps", label: "Advanced Apps", icon: Layout },
  { id: "business", label: "Business Websites", icon: Briefcase },
  { id: "personal", label: "Personal Websites", icon: User },
  { id: "mobile", label: "Mobile Apps", icon: Smartphone },
];

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: 1,
    title: "CrawlCube Landing",
    category: "Landing Pages",
    image:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    categoryId: "landing",
    description:
      "A dark-themed, stunning official homepage showcasing AI generation powers.",
    iframeUrl: "showcase_html/CrawlCube.html",
  },
  {
    id: 2,
    title: "MCE Dashboard",
    category: "Business Websites",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    categoryId: "business",
    description:
      "A highly complex, data-centric web app layout tailored for management.",
    iframeUrl: "showcase_html/mce.html",
  },
  {
    id: 3,
    title: "ARVC Capitals",
    category: "Business Websites",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    categoryId: "business",
    description:
      "A highly complex, data-centric web app layout tailored for management.",
    iframeUrl: "showcase_html/ARVC.html",
  },
  {
    id: 4,
    title: "La Bella Cuisine",
    category: "Business Websites",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    categoryId: "business",
    description: "Asian Restaurant Website.",
    iframeUrl: "showcase_html/la-bella-cucina.html",
  },
];

export default function ShowcaseSection() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedPreview, setSelectedPreview] = useState<ShowcaseItem | null>(
    null,
  );
  const [deviceView, setDeviceView] = useState<"desktop" | "tablet" | "mobile">(
    "desktop",
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handlePopState = () => {
      if (selectedPreview) setSelectedPreview(null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [selectedPreview]);

  const openPreview = (item: ShowcaseItem) => {
    window.history.pushState({ showcaseOpen: true }, "");
    setSelectedPreview(item);
  };

  const closePreview = () => {
    if (window.history.state?.showcaseOpen) {
      window.history.back();
    } else {
      setSelectedPreview(null);
    }
  };

  const filteredItems =
    activeTab === "all"
      ? SHOWCASE_ITEMS
      : SHOWCASE_ITEMS.filter((item) => item.categoryId === activeTab);

  return (
    <>
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 relative z-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight">
              Showcase
            </h2>
          </div>
          <p className="text-foreground/80 text-sm">
            Explore what the community is building with CrawlCube.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-10 overflow-x-auto scrollbar-none pb-2">
          {SHOWCASE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                suppressHydrationWarning
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border whitespace-nowrap ${
                  isActive
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-foreground border-foreground/20 hover:border-foreground/40 hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 ">
          {/* Color Overlay */}
          {filteredItems.map((item) => (
            <div key={item.id} className="group cursor-pointer">
              {/* Image Card */}
              <div
                className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-secondary/10 mb-4 drop-shadow-xl  transition-all duration-300 group-hover:backdrop-blur-md  "
                onClick={() => openPreview(item)}
              >
                <div className="absolute inset-0 bg-background animate-pulse" />{" "}
                {/* Loading state */}
                {item.iframeUrl ? (
                  <div className="absolute inset-0 z-0 bg-background pointer-events-none select-none overflow-hidden transition-transform duration-700 group-hover:scale-105">
                    <div className="absolute top-0 left-0 w-[400%] h-[400%] origin-top-left scale-[0.25]">
                      <iframe
                        src={item.iframeUrl}
                        className="w-full h-full border-0"
                        scrolling="no"
                        tabIndex={-1}
                      />
                    </div>
                  </div>
                ) : (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />
                {/* Hover Preview Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100 z-20 pointer-events-none">
                  <span className="bg-background/10 backdrop-blur-md text-foreground border border-foreground/20 font-medium px-6 py-2.5 rounded-full text-sm shadow-xl flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Preview
                  </span>
                </div>
              </div>

              {/* Meta */}
              <div>
                <h3 className="text-foreground font-semibold text-base mb-1 group-hover:text-foreground/80 transition-colors">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">{item.category}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Full-Screen Preview Modal */}
      {mounted && selectedPreview && createPortal(
        <div className="fixed inset-0 z-[100] bg-background flex flex-col md:flex-row h-screen overflow-hidden animate-in fade-in duration-200">
          {/* Left Sidebar (Top bar on mobile) */}
          <div className="w-full md:w-[320px] shrink-0 bg-background border-b md:border-b-0 md:border-r border-border flex flex-col h-auto md:h-full relative z-20">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-border">
              <h2 className="text-foreground font-bold text-base md:text-lg truncate pr-4">
                {selectedPreview.title}
              </h2>
              <button
                onClick={closePreview}
                className="text-muted-foreground hover:text-foreground transition-colors bg-background hover:bg-secondary/40 p-1.5 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Description - Expandable or hidden on mobile to prioritize preview */}
            <div className="hidden md:flex flex-col p-5 flex-1 overflow-y-auto">
              <p className="text-sm leading-relaxed text-muted-foreground mb-4">
                {selectedPreview.description}
              </p>
              <div className="bg-secondary/10 border border-border p-3 rounded-lg flex flex-col gap-1 mt-auto">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Generated Using
                </span>
                <span className="text-sm text-foreground/80 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]"></span>{" "}
                  {selectedPreview.model || "Gemini 3.1 Pro"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Main Content */}
          <div className="flex-1 flex flex-col relative h-[calc(100vh-65px)] md:h-full bg-background overflow-hidden">
            {/* Navbar (Hidden on mobile) */}
            <div className="hidden md:flex h-14 border-b border-border items-center justify-center px-4 bg-background relative z-10">
              <div className="flex items-center gap-1 bg-secondary/10 border border-border rounded-lg p-1">
                <button
                  onClick={() => setDeviceView("desktop")}
                  className={`p-1.5 rounded-md transition-colors ${deviceView === "desktop" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeviceView("tablet")}
                  className={`p-1.5 rounded-md transition-colors ${deviceView === "tablet" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeviceView("mobile")}
                  className={`p-1.5 rounded-md transition-colors ${deviceView === "mobile" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
                >
                  <MobileIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preview Frame */}
            <div
              className={`flex-1 w-full h-full pb-0 sm:pb-8 md:pb-12 px-0 pt-0 sm:px-8 md:px-12 sm:pt-8 md:pt-12 overflow-y-auto flex items-start justify-center ${selectedPreview.iframeUrl && deviceView === "desktop" ? "p-0 sm:p-0 md:p-0 overflow-hidden" : ""}`}
            >
              <div
                className={`${deviceView === "mobile" ? "w-full md:w-[390px]" : deviceView === "tablet" ? "w-full md:w-[768px]" : "w-full max-w-[1200px]"} bg-background md:rounded-xl overflow-hidden md:shadow-[0_0_50px_rgba(0,0,0,0.5)] md:border border-border h-full transition-all duration-300 ${selectedPreview.iframeUrl && deviceView === "desktop" ? "max-w-none md:rounded-none border-0" : "min-h-full sm:min-h-0"}`}
              >
                {selectedPreview.iframeUrl ? (
                  <iframe
                    src={selectedPreview.iframeUrl}
                    className="w-full h-full border-0 bg-background"
                    title={selectedPreview.title}
                  />
                ) : (
                  <img
                    src={selectedPreview.image}
                    alt={selectedPreview.title}
                    className="w-full h-auto block"
                  />
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
