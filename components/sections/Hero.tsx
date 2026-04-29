"use client";

import { useBrand } from "@/context/BrandContext";
import { getThemeClasses } from "@/lib/themeConfig";
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

export default function Hero({
 data,
 editable = false,
 onUpdate,
}: {
 data: any;
 editable?: boolean;
 onUpdate?: (field: string, value: string) => void;
}) {
 const brand = useBrand();
 const theme = getThemeClasses(brand.themeStyle, brand.theme ==="dark");
 const {
 headline,
 subtext,
 cta,
 secondaryCta,
 imageUrl,
 variant ="centered",
 } = data;
 const hasImage = !!imageUrl;
 const isDark = brand.theme ==="dark";

 // ── Shared elements ──

 const badgeEl = (
 <span
 className={`inline-flex items-center gap-2 self-start ${
 hasImage && variant ==="centered"
 ?"bg-white/15 backdrop-blur-sm text-white border border-white/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest"
 : theme.badgeClass
 }`}
 >
 {brand.logo?.startsWith("<svg") ? (
 <span
 style={{
 width: 18,
 height: 18,
 display:"inline-flex",
 flexShrink: 0,
 }}
 dangerouslySetInnerHTML={{
 __html: brand.logo
 .replace(/width="48"/, 'width="18"')
 .replace(/height="48"/, 'height="18"'),
 }}
 />
 ) : (
 <span>✦</span>
 )}
 {brand.logoText}
 </span>
 );

 const headlineEl = (
 <h1
 className="text-3xl @sm:text-4xl @md:text-5xl @lg:text-6xl leading-tight"
 style={{
 fontWeight: 700,
 color:
 hasImage && variant ==="centered"
 ?"#ffffff"
 : isDark
 ?"#ffffff"
 :"#0a0a0a",
 }}
 >
 {editable ? (
 <EditableText
 value={headline.replace(/<\/?accent>/g,"")}
 onSave={(v) => onUpdate?.("headline", v)}
 />
 ) : (
 <AccentText text={headline} color={brand.primaryColor} />
 )}
 </h1>
 );

 const subtextEl = subtext ? (
 <div
 className="text-base @md:text-lg max-w-xl leading-relaxed"
 style={{
 color:
 hasImage && variant ==="centered"
 ?"rgba(255,255,255,0.85)"
 : undefined,
 }}
 >
 {editable ? (
 <EditableText
 value={subtext}
 onSave={(v) => onUpdate?.("subtext", v)}
 className={
 hasImage! || variant !=="centered"? theme.subtextClass :""
 }
 multiline
 />
 ) : (
 <span
 className={
 hasImage! || variant !=="centered"? theme.subtextClass :""
 }
 >
 {subtext}
 </span>
 )}
 </div>
 ) : null;

 // Primary CTA button
 const ctaEl = cta ? (
 <button
 className="px-6 @md:px-8 py-3 @md:py-4 text-sm @md:text-base font-semibold transition-all duration-300 inline-block"
 style={{
 background: cta.style?.background ?? brand.primaryColor,
 color: cta.style?.textColor ??"#ffffff",
 borderRadius: cta.style?.borderRadius ??"12px",
 }}
 onMouseEnter={(e) => {
 e.currentTarget.style.transform ="translateY(-2px)";
 e.currentTarget.style.boxShadow = `0 8px 30px ${brand.primaryColor}66`;
 }}
 onMouseLeave={(e) => {
 e.currentTarget.style.transform ="translateY(0)";
 e.currentTarget.style.boxShadow ="none";
 }}
 >
 {editable ? (
 <EditableText
 value={cta.text}
 onSave={(v) => onUpdate?.("cta.text", v)}
 />
 ) : (
 cta.text
 )}
 </button>
 ) : null;

 // Secondary CTA button (outline style)
 const secondaryCtaEl = secondaryCta ? (
 <button
 className="px-6 @md:px-8 py-3 @md:py-4 text-sm @md:text-base font-semibold transition-all duration-300 inline-block border-2"
 style={{
 background:"transparent",
 color: secondaryCta.style?.textColor ?? brand.primaryColor,
 borderRadius: secondaryCta.style?.borderRadius ??"12px",
 borderColor: secondaryCta.style?.borderColor ?? brand.primaryColor,
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
 value={secondaryCta.text}
 onSave={(v) => onUpdate?.("secondaryCta.text", v)}
 />
 ) : (
 secondaryCta.text
 )}
 </button>
 ) : null;

 // ── CENTERED ──
 if (variant ==="centered") {
 return (
 <section
 className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 @md:px-6 py-20 @md:py-32 overflow-hidden"
 style={
 hasImage
 ? {
 backgroundImage: `url(${imageUrl})`,
 backgroundSize:"cover",
 backgroundPosition:"center",
 }
 : {}
 }
 >
 {hasImage ? (
 <div
 className="absolute inset-0"
 style={{
 background:
"linear-gradient(to bottom,rgba(0,0,0,0.5),rgba(0,0,0,0.75))",
 }}
 />
 ) : (
 <div
 className="absolute inset-0 opacity-10 pointer-events-none"
 style={{
 background: `radial-gradient(ellipse 80% 60% at 50% 20%,${brand.primaryColor},transparent)`,
 }}
 />
 )}
 <div className="relative z-10 max-w-4xl mx-auto space-y-5 w-full">
 <div className="flex justify-center">{badgeEl}</div>
 {headlineEl}
 {subtextEl && <div className="flex justify-center">{subtextEl}</div>}
 {/* CTA buttons row */}
 {(ctaEl || secondaryCtaEl) && (
 <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
 {ctaEl}
 {secondaryCtaEl}
 </div>
 )}
 {hasImage && (
 <p className="absolute bottom-3 right-3 text-white/30 text-[10px]">
 Photo via Unsplash
 </p>
 )}
 </div>
 </section>
 );
 }

 // ── SPLIT ──
 if (variant ==="split") {
 return (
 <section
 className="relative overflow-hidden"
 style={
 hasImage
 ? {
 backgroundImage: `url(${imageUrl})`,
 backgroundSize:"cover",
 backgroundPosition:"center",
 }
 : {}
 }
 >
 {/* Mobile overlay — dark gradient over background image */}
 {hasImage && (
 <div
 className="absolute inset-0 @md:hidden"
 style={{
 background:
"linear-gradient(to bottom,rgba(0,0,0,0.55),rgba(0,0,0,0.8))",
 }}
 />
 )}

 {/* Desktop background reset — covers bg image so only right column shows it */}
 {hasImage && (
 <div
 className="absolute inset-0 hidden @md:block"
 style={{ background: isDark ?"#000000":"#ffffff"}}
 />
 )}

 {/* Radial glow — only when no image */}
 {!hasImage && (
 <div
 className="absolute inset-0 opacity-5 pointer-events-none"
 style={{
 background: `radial-gradient(ellipse 60% 80% at 80% 50%,${brand.primaryColor},transparent)`,
 }}
 />
 )}

 <div
 className={`relative z-10 max-w-6xl mx-auto grid grid-cols-1 @md:grid-cols-2 gap-12 @md:gap-16 items-center px-4 @md:px-8 py-16 @md:py-24 ${!hasImage ? theme.sectionBg :""}`}
 style={{ minHeight:"60vh"}}
 >
 {/* Left text — centered on mobile, left-aligned on desktop */}
 <div className="space-y-5 flex flex-col items-center text-center @md:items-start @md:text-left">
 {/* Badge */}
 <span
 className={`inline-flex items-center gap-2 self-center @md:self-start ${
 hasImage
 ?"bg-white/15 backdrop-blur-sm text-white border border-white/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest"
 : theme.badgeClass
 }`}
 >
 {brand.logo?.startsWith("<svg") ? (
 <span
 style={{
 width: 18,
 height: 18,
 display:"inline-flex",
 flexShrink: 0,
 }}
 dangerouslySetInnerHTML={{
 __html: brand.logo
 .replace(/width="48"/, 'width="18"')
 .replace(/height="48"/, 'height="18"'),
 }}
 />
 ) : (
 <span>✦</span>
 )}
 {brand.logoText}
 </span>

 {/* Headline */}
 <h1
 className="text-2xl @sm:text-3xl @md:text-4xl @lg:text-5xl leading-tight"
 style={{
 fontWeight: 800,
 color: hasImage ?"#ffffff": isDark ?"#ffffff":"#0a0a0a",
 }}
 >
 {editable ? (
 <EditableText
 value={headline.replace(/<\/?accent>/g,"")}
 onSave={(v) => onUpdate?.("headline", v)}
 />
 ) : (
 <AccentText text={headline} color={brand.primaryColor} />
 )}
 </h1>

 {/* Subtext */}
 {subtext && (
 <p
 className="text-sm @md:text-base leading-relaxed max-w-sm"
 style={{
 color: hasImage
 ?"rgba(255,255,255,0.85)"
 : isDark
 ?"#a3a3a3"
 :"#525252",
 }}
 >
 {editable ? (
 <EditableText
 value={subtext}
 onSave={(v) => onUpdate?.("subtext", v)}
 multiline
 />
 ) : (
 subtext
 )}
 </p>
 )}

 {/* CTA buttons */}
 {(ctaEl || secondaryCtaEl) && (
 <div className="flex flex-wrap items-center justify-center @md:justify-start gap-3">
 {ctaEl}
 {secondaryCtaEl}
 </div>
 )}

 {hasImage && (
 <p className="text-white/30 text-[10px] @md:hidden">
 Photo via Unsplash
 </p>
 )}
 </div>

 {/* Right visual — hidden on mobile, shown on desktop */}
 <div className="relative hidden @md:flex items-center justify-center">
 {hasImage ? (
 <div
 className="w-full aspect-4/3 rounded-2xl overflow-hidden shadow-2xl relative"
 style={{ boxShadow: `0 40px 80px ${brand.primaryColor}33` }}
 >
 <img
 src={imageUrl}
 alt="hero"
 className="w-full h-full object-cover"
 />
 <p className="absolute bottom-2 right-3 text-white/30 text-[10px]">
 Photo via Unsplash
 </p>
 </div>
 ) : (
 <div className="w-full aspect-square max-w-sm relative">
 <div
 className="absolute inset-0 rounded-3xl opacity-20"
 style={{
 background: `radial-gradient(circle,${brand.primaryColor},transparent 70%)`,
 }}
 />
 <div
 className="absolute inset-8 rounded-2xl border-2 opacity-30"
 style={{ borderColor: brand.primaryColor }}
 />
 <div className="absolute inset-0 flex items-center justify-center">
 <div
 className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl"
 style={{
 background: `${brand.primaryColor}22`,
 border: `1px solid ${brand.primaryColor}44`,
 }}
 >
 {brand.logo?.startsWith("<svg") ? (
 <span
 style={{
 width: 48,
 height: 48,
 display:"inline-flex",
 }}
 dangerouslySetInnerHTML={{ __html: brand.logo }}
 />
 ) : (
"✦"
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 </section>
 );
 }

 // ── MINIMAL ──
 return (
 <section
 className={`relative px-4 @md:px-8 py-24 @md:py-40 ${theme.sectionBg}`}
 >
 <div className="max-w-4xl mx-auto space-y-8">
 {badgeEl}
 <h1
 className="text-4xl @sm:text-5xl @md:text-7xl @lg:text-8xl leading-none tracking-tight"
 style={{ fontWeight: 800, color: isDark ?"#ffffff":"#0a0a0a"}}
 >
 {editable ? (
 <EditableText
 value={headline}
 onSave={(v) => onUpdate?.("headline", v)}
 />
 ) : (
 <AccentText text={headline} color={brand.primaryColor} />
 )}
 </h1>
 {subtext && (
 <div
 className="text-base @md:text-xl max-w-lg leading-relaxed"
 style={{ color: isDark ?"#a3a3a3":"#525252"}}
 >
 {editable ? (
 <EditableText
 value={subtext}
 onSave={(v) => onUpdate?.("subtext", v)}
 multiline
 />
 ) : (
 subtext
 )}
 </div>
 )}
 {(ctaEl || secondaryCtaEl) && (
 <div className="flex items-center gap-4 pt-4 flex-wrap">
 {ctaEl}
 {secondaryCtaEl}
 {!secondaryCtaEl && (
 <span
 className="text-sm opacity-40"
 style={{ color: isDark ?"#fff":"#0a0a0a"}}
 >
 No commitment required
 </span>
 )}
 </div>
 )}
 </div>
 <div
 className="absolute bottom-0 left-0 right-0 h-px opacity-20"
 style={{
 background: `linear-gradient(to right,transparent,${brand.primaryColor},transparent)`,
 }}
 />
 </section>
 );
}
