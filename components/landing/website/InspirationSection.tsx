import React from "react";
import bgLogo from "@/assets/login-assets/bg-logo-login.svg";
import Image from "next/image";

// Animation styles to add to your global CSS or a <style> tag
const scrollStyles = `
 @keyframes scroll-left {
 0% { transform: translateX(0); }
 100% { transform: translateX(-50%); }
 }
 @keyframes scroll-right {
 0% { transform: translateX(-50%); }
 100% { transform: translateX(0); }
 }
 .animate-scroll-left {
 animation: scroll-left 40s linear infinite;
 }
 .animate-scroll-right {
 animation: scroll-right 40s linear infinite;
 }
`;

const ScrollingRow = ({
  images,
  direction = "left",
}: {
  images: string[];
  direction?: "left" | "right";
}) => {
  const animationClass =
    direction === "left" ? "animate-scroll-left" : "animate-scroll-right";

  // We double the array to create a seamless loop
  const displayImages = [...images, ...images];

  return (
    <div className="flex overflow-hidden select-none group ">
      <div
        className={`flex gap-6  py-4 whitespace-nowrap ${animationClass} group-hover:[animation-play-state:paused]`}
      >
        {displayImages.map((src, index) => (
          <div
            key={index}
            className="shrink-0 w-[400px] h-[250px]  md:w-[500px] md:h-[320px]   rounded-2xl overflow-hidden shadow-lg "
          >
            <img
              src={src}
              alt="Template Preview"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const InfiniteInspiration = () => {
  const row1 = [
    "https://images.unsplash.com/photo-1648134859186-a05fb609f41e?q=80&w=2060&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://assets.onepagelove.com/cdn-cgi/image/width=840,height=500,fit=cover,gravity=top,format=jpg,quality=85/wp-content/uploads/2026/04/opl-master-10.jpg",
    "https://assets.onepagelove.com/cdn-cgi/image/width=840,height=500,fit=cover,gravity=top,format=jpg,quality=85/wp-content/uploads/2026/04/opl-master-11.jpg",
    "https://assets.onepagelove.com/cdn-cgi/image/width=840,height=500,fit=cover,gravity=top,format=jpg,quality=85/wp-content/uploads/2026/04/opl-master-3.jpg",
  ];

  const row2 = [
    "https://assets.onepagelove.com/cdn-cgi/image/width=840,height=500,fit=cover,gravity=top,format=jpg,quality=85/wp-content/uploads/2026/03/opl-master-mono-desk.jpg",
    "https://assets.onepagelove.com/cdn-cgi/image/width=840,height=500,fit=cover,gravity=top,format=jpg,quality=85/wp-content/uploads/2026/03/opl-master-4.jpg",
    "https://assets.onepagelove.com/cdn-cgi/image/width=840,height=500,fit=cover,gravity=top,format=jpg,quality=85/wp-content/uploads/2026/02/opl-master-5.jpg",
    "https://assets.onepagelove.com/cdn-cgi/image/width=840,height=500,fit=cover,gravity=top,format=jpg,quality=85/wp-content/uploads/2025/12/opl-master-razor.jpg",
  ];

  return (
    <section className="bg-zigzag-pattern relative bg-foreground py-15 md:py-20 lg:py-20 overflow-hidden rounded-4xl">
      <style>{scrollStyles}</style>

      {/* Header - Kept in container */}
      <div className="max-w-6xl mx-auto px-6 mb-8 md:mb-8 lg:mb-16">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-secondary mb-4  ">
          Get <span className="font-display text-primary">inspired.</span>
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
          Quickly turn your business or any idea into fully functional website
          with AI. No technical skills needed.
        </p>
      </div>

      {/* Edge-to-Edge Scrolling Section */}
      <div className="relative flex flex-col gap-4 w-full">
        {/* Gradient Masks for smooth edges */}
        <ScrollingRow images={row1} direction="left" />
        <ScrollingRow images={row2} direction="right" />
      </div>
    </section>
  );
};

export default InfiniteInspiration;
