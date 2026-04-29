"use client";

import { useBrand } from "@/context/BrandContext";
import { getThemeClasses } from "@/lib/themeConfig";
import EditableText from "@/components/ui/EditableText";

export default function Pricing({
 data,
 editable = false,
 onUpdate,
 onUpdateItem,
 onUpdateFeature,
}: {
 data: any;
 editable?: boolean;
 onUpdate?: (field: string, value: string) => void;
 onUpdateItem?: (index: number, field: string, value: string) => void;
 onUpdateFeature?: (
 planIndex: number,
 featureIndex: number,
 value: string,
 ) => void;
}) {
 const brand = useBrand();
 const theme = getThemeClasses(brand.themeStyle, brand.theme ==="dark");
 const isDark = brand.theme ==="dark";

 return (
 <section
 id="pricing"
 className={`py-16 @md:py-24 px-4 @md:px-6 ${theme.sectionBg}`}
 >
 <div className="max-w-6xl mx-auto">
 {/* Section header */}
 <div className="text-center mb-10 @md:mb-16">
 <span className={`inline-block mb-4 ${theme.badgeClass}`}>
 Pricing
 </span>
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

 {/*
 FIX 1 — Grid breakpoints:
 @sm (2-col) fills the tablet gap between 1-col mobile and 3-col desktop
 FIX 2 — items-stretch:
 All cards stretch to equal height so CTA buttons align at the bottom
 FIX 3 — pt-6:
 Gives the absolute -top-4"Most Popular" badge room to breathe above the card
 */}
 <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3 gap-4 @lg:gap-6 items-stretch pt-6">
 {data.pricingOptions?.map((plan: any, i: number) => {
 const isHighlighted = !!plan.highlight;

 return (
 <div
 key={i}
 className={`relative flex flex-col rounded-2xl p-5 @md:p-7 border transition-all duration-200 ${theme.cardHover}`}
 style={{
 background: isHighlighted
 ? brand.primaryColor
 : isDark
 ?"#111111"
 :"#ffffff",
 color: isHighlighted
 ?"#ffffff"
 : isDark
 ?"#ffffff"
 :"#0a0a0a",
 borderColor: isHighlighted
 ?"transparent"
 : isDark
 ?"#2a2a2a"
 :"#e5e7eb",
 boxShadow: isHighlighted
 ? `0 20px 60px ${brand.primaryColor}44`
 :"none",
 }}
 >
 {/*"Most Popular" badge */}
 {plan.highlight && (
 <div className="absolute -top-4 left-1/2 -translate-x-1/2">
 <span
 className="text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap"
 style={{
 background:"#ffffff",
 color: brand.primaryColor,
 }}
 >
 ⭐ {plan.highlight.text}
 </span>
 </div>
 )}

 {/* Plan name */}
 <h3 className="text-base @md:text-lg font-bold mb-1">
 {editable ? (
 <EditableText
 value={plan.name}
 onSave={(v) => onUpdateItem?.(i,"name", v)}
 />
 ) : (
 plan.name
 )}
 </h3>

 {/*
 FIX 4 — Price font size:
 Reduced from text-3xl @md:text-4xl → text-2xl @md:text-3xl
 + wrap-break-word prevents long prices like"$1,999/month" from overflowing
 */}
 <div className="mb-3">
 <span className="text-2xl @md:text-3xl font-extrabold tracking-tight wrap-break-word">
 {editable ? (
 <EditableText
 value={plan.price}
 onSave={(v) => onUpdateItem?.(i,"price", v)}
 />
 ) : (
 plan.price
 )}
 </span>
 </div>

 {/* Plan description */}
 {plan.description && (
 <div className="text-sm opacity-70 mb-5 leading-relaxed">
 {editable ? (
 <EditableText
 value={plan.description}
 onSave={(v) => onUpdateItem?.(i,"description", v)}
 multiline
 />
 ) : (
 plan.description
 )}
 </div>
 )}

 {/* Divider */}
 <div
 className="h-px mb-5 opacity-20"
 style={{
 background: isHighlighted ?"#ffffff": brand.primaryColor,
 }}
 />

 {/* Feature list — flex-1 pushes CTA to bottom */}
 <ul className="space-y-2.5 flex-1 mb-6">
 {plan.features?.map((f: string, j: number) => (
 <li key={j} className="flex items-start gap-2.5 text-sm">
 <span
 className="mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
 style={{
 background: isHighlighted
 ?"rgba(255,255,255,0.3)"
 : `${brand.primaryColor}33`,
 color: isHighlighted ?"#fff": brand.primaryColor,
 }}
 >
 ✓
 </span>
 {editable ? (
 <EditableText
 value={f}
 onSave={(v) => onUpdateFeature?.(i, j, v)}
 />
 ) : (
 f
 )}
 </li>
 ))}
 </ul>

 {/* CTA button */}
 <button
 className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90"
 style={{
 background: isHighlighted ?"#ffffff": brand.primaryColor,
 color: isHighlighted ? brand.primaryColor :"#ffffff",
 }}
 >
 {editable ? (
 <EditableText
 value={plan.ctaText ??"Get Started"}
 onSave={(v) => onUpdateItem?.(i,"ctaText", v)}
 />
 ) : (
 (plan.ctaText ??"Get Started")
 )}
 </button>
 </div>
 );
 })}
 </div>
 </div>
 </section>
 );
}
