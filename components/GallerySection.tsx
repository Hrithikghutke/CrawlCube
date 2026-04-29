import React from "react";
import Image from "next/image";

// Placeholder high-quality abstract / gradient mockups from Unsplash
const GALLERY_IMAGES = [
 // Meeting Assistant - Web
"https://mir-s3-cdn-cf.behance.net/projects/404/ee5c46238300811.Y3JvcCwzMjMyLDI1MjgsMCww.png",
 // CRM Business Growth Website
"https://mir-s3-cdn-cf.behance.net/projects/404/6f4c59240940805.Y3JvcCwzNjgyLDI4ODAsODIsMA.png",
 // SaaS Autopilot Business Growth
"https://mir-s3-cdn-cf.behance.net/projects/404/3ca6e7240102287.Y3JvcCwzNjgyLDI4ODAsODIsMA.png",
 // Expensify - Expense Management Website
"https://mir-s3-cdn-cf.behance.net/projects/404/d450d3239547501.Y3JvcCwxNjE2LDEyNjQsMCww.png",
 // DigitalPro Landing Page | Marketing Agency
"https://mir-s3-cdn-cf.behance.net/projects/404/02df1e194816905.660fb5994963c.png",
 // Squadhub - SaaS UI/UX Design
"https://mir-s3-cdn-cf.behance.net/projects/404/cb3a6e226283135.Y3JvcCwyNDI0LDE4OTYsMCww.png",
 // Finance SAAS Website Design
"https://mir-s3-cdn-cf.behance.net/projects/404/535983239855641.Y3JvcCwzMDU2LDIzOTAsNjk2LDMyNQ.png",
 // Startup & SaaS Website Design - Webflow Template
"https://mir-s3-cdn-cf.behance.net/projects/404/0b14f8242056107.Y3JvcCw0MDI3LDMxNTAsMjc5LDA.png",
 // Green Energy SaaS Website
"https://mir-s3-cdn-cf.behance.net/projects/404/f28afa241511269.Y3JvcCwzMDY4LDI0MDAsNjgsMA.png",
 // Business Innovation | UI/UX Landing Page
"https://mir-s3-cdn-cf.behance.net/projects/404/931006235806731.Y3JvcCwzMjc4LDI1NjQsMzE2LDI4NA.png",
 // SaaS Automation Platform Website
"https://mir-s3-cdn-cf.behance.net/projects/404/59c811237942151.Y3JvcCwxNTM0LDEyMDAsMzQsMA.png",
 // Codexa - Saas Company Website
"https://mir-s3-cdn-cf.behance.net/projects/404/958912241222429.Y3JvcCw1NDAwLDQyMjMsMCww.jpg",
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
"aspect-[16/9]"
 ];

 return (
 <section className="w-full bg-background pt-16 sm:pt-24 relative overflow-hidden">
 <div className="w-full px-1 sm:px-2">
 
 {/* CSS Masonry Layout */}
 <div className="columns-2 md:columns-3 xl:columns-4 2xl:columns-5 gap-2 sm:gap-3 md:gap-4 space-y-2 sm:space-y-3 md:space-y-4">
 {GALLERY_IMAGES.map((src, i) => (
 <div 
 key={i} 
 className={`break-inside-avoid relative rounded-xl sm:rounded-2xl overflow-hidden border border-border/60 bg-secondary group cursor-pointer ring-1 ring-inset ring-white/5 ${aspectRatios[i % aspectRatios.length]}`}
 >
 <img 
 src={src} 
 alt={`Gallery mockup ${i + 1}`}
 className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
 loading="lazy"
 />
 <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors duration-300 pointer-events-none"/>
 </div>
 ))}
 </div>

 </div>

 {/* Dark overlay over the entire grid to make it moodier */}
 <div className="absolute inset-0 bg-background/40 pointer-events-none z-10"/>

 {/* Fade to black gradient overlay at the bottom */}
 <div className="absolute bottom-0 inset-x-0 h-[400px] bg-linear-to-t from-black via-black/80 to-transparent pointer-events-none z-20"/>
 </section>
 );
}
