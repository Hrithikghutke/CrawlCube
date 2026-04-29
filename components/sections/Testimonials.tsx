"use client";

import { useBrand } from "@/context/BrandContext";
import { getThemeClasses } from "@/lib/themeConfig";
import EditableText from "@/components/ui/EditableText";

export default function Testimonials({
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

 return (
 <section className={`py-16 @md:py-24 px-4 @md:px-6 ${theme.altSectionBg}`}>
 <div className="max-w-6xl mx-auto">
 <div className="text-center mb-10 @md:mb-16">
 <span className={`inline-block mb-4 ${theme.badgeClass}`}>
 Testimonials
 </span>
 <h2
 className={`text-2xl @md:text-3xl @lg:text-5xl ${theme.headlineClass}`}
 style={{ color: brand.theme ==="dark"?"#ffffff":"#0a0a0a"}}
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

 <div className="grid grid-cols-1 @md:grid-cols-3 gap-4 @md:gap-6">
 {data.testimonials?.map((t: any, i: number) => (
 <div
 key={i}
 className={`${theme.testimonialCard} flex flex-col gap-4 relative overflow-hidden`}
 style={{
 borderLeftColor: t.style?.accentColor ?? brand.primaryColor,
 }}
 >
 <div
 className="text-5xl font-black leading-none absolute top-3 right-4 opacity-10 select-none"
 style={{ color: t.style?.accentColor ?? brand.primaryColor }}
 >
"
 </div>

 <div
 className={`text-sm leading-relaxed relative z-10 ${theme.subtextClass}`}
 >
 {editable ? (
 <EditableText
 value={t.review}
 onSave={(v) => onUpdateItem?.(i,"review", v)}
 multiline
 />
 ) : (
 t.review
 )}
 </div>

 <div className="flex items-center gap-3 mt-auto pt-2">
 <div
 className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
 style={{
 background: t.style?.accentColor ?? brand.primaryColor,
 }}
 >
 {t.name?.charAt(0) ??"?"}
 </div>
 <div>
 <div
 className="text-sm font-semibold"
 style={{
 color: brand.theme ==="dark"?"#ffffff":"#0a0a0a",
 }}
 >
 {editable ? (
 <EditableText
 value={t.name}
 onSave={(v) => onUpdateItem?.(i,"name", v)}
 />
 ) : (
 t.name
 )}
 </div>
 {t.role && (
 <div className="text-xs opacity-60">
 {editable ? (
 <EditableText
 value={t.role}
 onSave={(v) => onUpdateItem?.(i,"role", v)}
 />
 ) : (
 t.role
 )}
 </div>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </section>
 );
}
