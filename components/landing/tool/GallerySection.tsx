import React from "react";
import Image from "next/image";

// Placeholder high-quality abstract / gradient mockups from Unsplash
const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1648134859186-a05fb609f41e?q=80&w=2060&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://assets.onepagelove.com/cdn-cgi/image/width=840,height=500,fit=cover,gravity=top,format=jpg,quality=85/wp-content/uploads/2026/04/opl-master-10.jpg",
  "https://assets.onepagelove.com/cdn-cgi/image/width=840,height=500,fit=cover,gravity=top,format=jpg,quality=85/wp-content/uploads/2026/04/opl-master-11.jpg",
  "https://plus.unsplash.com/premium_photo-1719491488182-a755470273f4?q=80&w=784&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://assets.onepagelove.com/cdn-cgi/image/width=840,height=500,fit=cover,gravity=top,format=jpg,quality=85/wp-content/uploads/2026/04/opl-master-3.jpg",
  // Squadhub - SaaS UI/UX Design
  "https://assets.onepagelove.com/cdn-cgi/image/width=840,height=500,fit=cover,gravity=top,format=jpg,quality=85/wp-content/uploads/2026/03/opl-master-mono-desk.jpg",
  "https://plus.unsplash.com/premium_vector-1713201017366-f764a073f393?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://assets.onepagelove.com/cdn-cgi/image/width=840,height=500,fit=cover,gravity=top,format=jpg,quality=85/wp-content/uploads/2026/03/opl-master-4.jpg",
  "https://assets.onepagelove.com/cdn-cgi/image/width=840,height=500,fit=cover,gravity=top,format=jpg,quality=85/wp-content/uploads/2026/02/opl-master-5.jpg",
  "https://assets.onepagelove.com/cdn-cgi/image/width=840,height=500,fit=cover,gravity=top,format=jpg,quality=85/wp-content/uploads/2025/12/opl-master-razor.jpg",
  "https://images.unsplash.com/photo-1749006590639-e749e6b7d84c?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://plus.unsplash.com/premium_vector-1711987806081-f2228e240180?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://plus.unsplash.com/premium_photo-1725985758416-618e34ef5616?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1551651653-c5186a1fbba2?q=80&w=1081&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1547658719-da2b51169166?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
];

export default function GallerySection() {
  // Deterministic pattern of aspect ratios to make identical Behance source crops look authentically asymmetrical in the masonry grid
  const aspectRatios = [
    "aspect-square",
    "aspect-[3/4]",
    "aspect-[4/3]",
    "aspect-[3/5]",
    "aspect-square",
    "aspect-[4/3]",
    "aspect-[3/4]",
    "aspect-square",
    "aspect-[4/5]",
    "aspect-square",
    "aspect-[3/4]",
    "aspect-[4/4]",
    "aspect-[4/4]",
    "aspect-[4/5]",
    "aspect-[4/4.5]",
  ];

  return (
    <section className="w-full bg-background pt-16 sm:pt-24 relative overflow-hidden">
      <div className="w-full px-1 sm:px-2">
        {/* CSS Masonry Layout */}
        <div className="columns-2 md:columns-3 xl:columns-4 2xl:columns-5 gap-2 sm:gap-3 md:gap-4 space-y-2 sm:space-y-3 md:space-y-4">
          {GALLERY_IMAGES.map((src, i) => (
            <div
              key={i}
              className={`break-inside-avoid relative rounded-xl sm:rounded-2xl overflow-hidden  bg-secondary group cursor-pointer ring-1 ring-inset ring-white/5 ${aspectRatios[i % aspectRatios.length]}`}
            >
              <img
                src={src}
                alt={`Gallery mockup ${i + 1}`}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors duration-300 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>

      {/* Dark overlay over the entire grid to make it moodier */}
      <div className="absolute inset-0 bg-background/50 pointer-events-none z-10" />

      {/* Fade to black gradient overlay at the bottom */}
      <div className="absolute bottom-0 inset-x-0 h-[600px] bg-linear-to-t from-black via-black/80 to-transparent pointer-events-none z-20" />
    </section>
  );
}
