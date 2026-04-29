"use client";

import { useBrand } from "@/context/BrandContext";
import EditableText from "@/components/ui/EditableText";

function AccentText({ text, color }: { text: string; color: string }) {
 const parts = text.split(/(<accent>.*?<\/accent>)/g);
 return (
 <>
 {parts.map((part, i) => {
 const match = part.match(/^<accent>(.*?)<\/accent>$/);
 if (match)
 return (
 <span key={i} style={{ color }}>
 {match[1]}
 </span>
 );
 return <span key={i}>{part}</span>;
 })}
 </>
 );
}

export default function CtaBanner({
 data,
 editable = false,
 onUpdate,
}: {
 data: any;
 editable?: boolean;
 onUpdate?: (field: string, value: string) => void;
}) {
 const brand = useBrand();
 const isDark = brand.theme ==="dark";

 return (
 <section
 className="relative py-16 @md:py-24 px-4 @md:px-8 overflow-hidden"
 style={{ background: isDark ?"#0a0a0a":"#f9fafb"}}
 >
 {/* Background glow */}
 <div
 className="absolute inset-0 pointer-events-none"
 style={{
 background: `radial-gradient(ellipse 70% 80% at 50% 50%, ${brand.primaryColor}18, transparent 70%)`,
 }}
 />
 {/* Top border accent */}
 <div
 className="absolute top-0 left-0 right-0 h-px"
 style={{
 background: `linear-gradient(to right, transparent, ${brand.primaryColor}66, transparent)`,
 }}
 />

 <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
 <h2
 className="text-2xl @md:text-4xl @lg:text-5xl font-extrabold leading-tight"
 style={{ color: isDark ?"#ffffff":"#0a0a0a"}}
 >
 {editable ? (
 <EditableText
 value={(data.headline ??"").replace(/<\/?accent>/g,"")}
 onSave={(v) => onUpdate?.("headline", v)}
 />
 ) : (
 <AccentText text={data.headline ??""} color={brand.primaryColor} />
 )}
 </h2>

 {data.subtext && (
 <p
 className="text-base @md:text-lg leading-relaxed max-w-xl mx-auto"
 style={{ color: isDark ?"#a3a3a3":"#525252"}}
 >
 {editable ? (
 <EditableText
 value={data.subtext}
 onSave={(v) => onUpdate?.("subtext", v)}
 multiline
 />
 ) : (
 data.subtext
 )}
 </p>
 )}

 <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
 {data.primaryCta && (
 <button
 className="px-7 py-3.5 rounded-full font-bold text-sm @md:text-base transition-all duration-300"
 style={{
 background:
 data.primaryCta.style?.background ?? brand.primaryColor,
 color: data.primaryCta.style?.textColor ??"#ffffff",
 }}
 onMouseEnter={(e) => {
 e.currentTarget.style.transform ="translateY(-2px)";
 e.currentTarget.style.boxShadow = `0 8px 30px ${brand.primaryColor}55`;
 }}
 onMouseLeave={(e) => {
 e.currentTarget.style.transform ="translateY(0)";
 e.currentTarget.style.boxShadow ="none";
 }}
 >
 {editable ? (
 <EditableText
 value={data.primaryCta.text}
 onSave={(v) => onUpdate?.("primaryCta.text", v)}
 />
 ) : (
 data.primaryCta.text
 )}
 </button>
 )}

 {data.secondaryCta && (
 <button
 className="px-7 py-3.5 rounded-full font-bold text-sm @md:text-base transition-all duration-300 border-2"
 style={{
 background:"transparent",
 color: brand.primaryColor,
 borderColor: brand.primaryColor,
 }}
 onMouseEnter={(e) => {
 e.currentTarget.style.background = `${brand.primaryColor}18`;
 }}
 onMouseLeave={(e) => {
 e.currentTarget.style.background ="transparent";
 }}
 >
 {editable ? (
 <EditableText
 value={data.secondaryCta.text}
 onSave={(v) => onUpdate?.("secondaryCta.text", v)}
 />
 ) : (
 data.secondaryCta.text
 )}
 </button>
 )}
 </div>
 </div>
 </section>
 );
}
