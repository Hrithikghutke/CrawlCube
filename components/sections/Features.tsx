"use client";

import { useBrand } from "@/context/BrandContext";
import { getThemeClasses } from "@/lib/themeConfig";
import EditableText from "@/components/ui/EditableText";

export default function Features({
 data,
 editable = false,
 onUpdate,
 onUpdateItem,
}: {
 data: any;
 editable?: boolean;
 onUpdate?: (field: string, value: string) => void;
 onUpdateItem?: (index: number, field: string, value: string) => void;
}) {
 const brand = useBrand();
 const theme = getThemeClasses(brand.themeStyle, brand.theme ==="dark");
 const isDark = brand.theme ==="dark";
 const variant = data.variant ??"grid";

 const sectionHeader = (
 <div className="text-center mb-10 @md:mb-16">
 <span className={`inline-block mb-4 ${theme.badgeClass}`}>Features</span>
 <h2
 className={`text-2xl @md:text-3xl @lg:text-5xl ${theme.headlineClass}`}
 style={{ color: isDark ?"#ffffff":"#0a0a0a"}}
 >
 {editable ? (
 <EditableText
 value={data.headline}
 onSave={(v) => onUpdate?.("headline", v)}
 />
 ) : (
 data.headline
 )}
 </h2>
 </div>
 );

 // ── GRID ──
 if (variant ==="grid") {
 return (
 <section
 id="features"
 className={`py-16 @md:py-24 px-4 @md:px-6 ${theme.altSectionBg}`}
 >
 <div className="max-w-6xl mx-auto">
 {sectionHeader}
 <div className="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-4 @md:gap-6">
 {data.features?.map((feature: any, i: number) => (
 <div key={i} className={`${theme.card} ${theme.cardHover} group`}>
 {feature.icon && (
 <div
 className="text-2xl mb-4 w-11 h-11 rounded-xl flex items-center justify-center"
 style={{ background: `${brand.primaryColor}22` }}
 >
 {feature.icon}
 </div>
 )}
 <h3
 className="text-sm @md:text-base font-semibold mb-2"
 style={{ color: isDark ?"#ffffff":"#0a0a0a"}}
 >
 {editable ? (
 <EditableText
 value={feature.title}
 onSave={(v) => onUpdateItem?.(i,"title", v)}
 />
 ) : (
 feature.title
 )}
 </h3>
 {feature.description && (
 <div
 className={`text-sm leading-relaxed ${theme.subtextClass}`}
 >
 {editable ? (
 <EditableText
 value={feature.description}
 onSave={(v) => onUpdateItem?.(i,"description", v)}
 multiline
 />
 ) : (
 feature.description
 )}
 </div>
 )}
 {/* Hover accent line */}
 <div
 className="mt-4 h-0.5 w-0 group-hover:w-12 transition-all duration-300 rounded-full"
 style={{ backgroundColor: brand.primaryColor }}
 />
 </div>
 ))}
 </div>
 </div>
 </section>
 );
 }

 // ── ALTERNATING ──
 if (variant ==="alternating") {
 return (
 <section
 id="features"
 className={`py-16 @md:py-24 px-4 @md:px-6 ${theme.altSectionBg}`}
 >
 <div className="max-w-5xl mx-auto">
 {sectionHeader}
 <div className="space-y-16 @md:space-y-24">
 {data.features?.map((feature: any, i: number) => {
 const isEven = i % 2 === 0;
 return (
 <div
 key={i}
 className="grid grid-cols-1 @md:grid-cols-2 gap-8 @md:gap-16 items-center`"
 >
 {/* Text side — swap order on odd rows */}
 <div
 className={`space-y-4 col-span-1 @md:col-span-1 ${!isEven ?"@md:order-2":""}`}
 >
 <div
 className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
 style={{ background: `${brand.primaryColor}22` }}
 >
 {feature.icon}
 </div>
 <h3
 className="text-xl @md:text-2xl font-bold"
 style={{ color: isDark ?"#fff":"#0a0a0a"}}
 >
 {editable ? (
 <EditableText
 value={feature.title}
 onSave={(v) => onUpdateItem?.(i,"title", v)}
 />
 ) : (
 feature.title
 )}
 </h3>
 {feature.description && (
 <div
 className={`text-base leading-relaxed ${theme.subtextClass}`}
 >
 {editable ? (
 <EditableText
 value={feature.description}
 onSave={(v) => onUpdateItem?.(i,"description", v)}
 multiline
 />
 ) : (
 feature.description
 )}
 </div>
 )}
 <div
 className="h-0.5 w-12 rounded-full"
 style={{ backgroundColor: brand.primaryColor }}
 />
 </div>

 {/* Visual side — real Unsplash image if available, else decorative card */}
 <div
 className={`hidden @md:block ${!isEven ?"@md:order-1":""}`}
 >
 {feature.imageUrl ? (
 <div
 className="w-full aspect-4/3 rounded-2xl overflow-hidden relative"
 style={{
 boxShadow: `0 20px 60px ${brand.primaryColor}22`,
 }}
 >
 <img
 src={feature.imageUrl}
 alt={feature.title}
 className="w-full h-full object-cover"
 />
 {/* Subtle brand color tint overlay */}
 <div
 className="absolute inset-0 opacity-10"
 style={{ background: brand.primaryColor }}
 />
 <p className="absolute bottom-2 right-3 text-white/40 text-[10px]">
 Photo via Unsplash
 </p>
 </div>
 ) : (
 /* Decorative fallback if image fetch failed */
 <div
 className="w-full aspect-4/3 rounded-2xl relative overflow-hidden flex items-center justify-center"
 style={{
 background: isDark
 ?"linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)"
 :"linear-gradient(135deg, #f8f8f8 0%, #f0f0f0 100%)",
 border: `1px solid ${isDark ?"#2a2a2a":"#e5e7eb"}`,
 }}
 >
 <div
 className="absolute rounded-full blur-3xl opacity-20"
 style={{
 width:"70%",
 height:"70%",
 background: brand.primaryColor,
 top: isEven ?"10%":"30%",
 left: isEven ?"20%":"10%",
 }}
 />
 <div className="relative z-10 flex flex-col items-center gap-4">
 <div
 className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
 style={{
 background: isDark ?"#1e1e1e":"#ffffff",
 border: `2px solid ${brand.primaryColor}33`,
 boxShadow: `0 8px 32px ${brand.primaryColor}33`,
 }}
 >
 {feature.icon}
 </div>
 <div
 className="text-sm font-semibold px-4 py-1.5 rounded-full"
 style={{
 background: `${brand.primaryColor}18`,
 color: brand.primaryColor,
 border: `1px solid ${brand.primaryColor}33`,
 }}
 >
 {feature.title}
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </section>
 );
 }

 // ── LIST ──
 return (
 <section
 id="features"
 className={`py-16 @md:py-24 px-4 @md:px-6 ${theme.altSectionBg}`}
 >
 <div className="max-w-3xl mx-auto">
 {sectionHeader}
 <div>
 {data.features?.map((feature: any, i: number) => (
 <div
 key={i}
 className="group flex items-start gap-5 py-5 @md:py-6 border-b transition-colors"
 style={{ borderColor: isDark ?"#1a1a1a":"#f0f0f0"}}
 >
 {/* Number + icon */}
 <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
 <span
 className="text-xs font-bold opacity-30 tabular-nums"
 style={{ color: isDark ?"#fff":"#0a0a0a"}}
 >
 {String(i + 1).padStart(2,"0")}
 </span>
 <div
 className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
 style={{ background: `${brand.primaryColor}18` }}
 >
 {feature.icon}
 </div>
 </div>
 {/* Content */}
 <div className="flex-1 min-w-0">
 <h3
 className="text-base @md:text-lg font-semibold mb-1.5 transition-colors group-hover:opacity-80"
 style={{ color: isDark ?"#fff":"#0a0a0a"}}
 >
 {editable ? (
 <EditableText
 value={feature.title}
 onSave={(v) => onUpdateItem?.(i,"title", v)}
 />
 ) : (
 feature.title
 )}
 </h3>
 {feature.description && (
 <div
 className={`text-sm leading-relaxed ${theme.subtextClass}`}
 >
 {editable ? (
 <EditableText
 value={feature.description}
 onSave={(v) => onUpdateItem?.(i,"description", v)}
 multiline
 />
 ) : (
 feature.description
 )}
 </div>
 )}
 </div>
 {/* Arrow hint */}
 <span
 className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1 text-base"
 style={{ color: brand.primaryColor }}
 >
 →
 </span>
 </div>
 ))}
 </div>
 </div>
 </section>
 );
}
