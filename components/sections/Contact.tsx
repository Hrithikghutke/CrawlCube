"use client";

import { useState } from "react";
import { useBrand } from "@/context/BrandContext";
import { getThemeClasses } from "@/lib/themeConfig";
import EditableText from "@/components/ui/EditableText";

export default function Contact({
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
 const details = data.contactDetails;
 const isDark = brand.theme ==="dark";
 const [formState, setFormState] = useState<
"idle"|"sending"|"success"|"error"
 >("idle");

 const inputBase: React.CSSProperties = {
 width:"100%",
 padding:"10px 14px",
 borderRadius:"10px",
 fontSize:"14px",
 outline:"none",
 border: `1px solid ${isDark ?"#2a2a2a":"#e5e7eb"}`,
 background: isDark ?"#0a0a0a":"#f9fafb",
 color: isDark ?"#ffffff":"#0a0a0a",
 fontFamily:"inherit",
 transition:"border-color 0.2s",
 };

 const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
 e.preventDefault();
 if (editable) return;
 setFormState("sending");
 try {
 const form = e.currentTarget;
 const res = await fetch(form.action, {
 method:"POST",
 body: new FormData(form),
 headers: { Accept:"application/json"},
 });
 if (res.ok) {
 setFormState("success");
 form.reset();
 } else setFormState("error");
 } catch {
 setFormState("error");
 }
 };

 return (
 <section
 id="contact"
 className={`py-16 @md:py-24 px-4 @md:px-6 ${theme.sectionBg}`}
 >
 <div className="max-w-5xl mx-auto">
 {/* Header */}
 <div className="text-center mb-10 @md:mb-14">
 <span className={`inline-block mb-4 ${theme.badgeClass}`}>
 Contact
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

 {/* Two-column grid */}
 <div className="grid grid-cols-1 @md:grid-cols-2 gap-8 @md:gap-12 items-stretch">
 {/* Left — contact details */}
 <div
 className="rounded-2xl p-6 @md:p-8 flex flex-col gap-4"
 style={{
 background: isDark ?"#111111":"#ffffff",
 border: `1px solid ${isDark ?"#2a2a2a":"#e5e7eb"}`,
 }}
 >
 <div className={`text-sm @md:text-base mb-2 ${theme.subtextClass}`}>
 {editable ? (
 <EditableText
 value={data.subtext ??"We'd love to hear from you."}
 onSave={(v) => onUpdate?.("subtext", v)}
 multiline
 />
 ) : (
 (data.subtext ??"We'd love to hear from you.")
 )}
 </div>

 {details?.phone && (
 <div className={`${theme.card} flex items-start gap-3`}>
 <span className="text-lg mt-0.5 shrink-0">📞</span>
 <div className="min-w-0">
 <div className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-0.5">
 Phone
 </div>
 <div
 className="text-sm font-medium wrap-break-word"
 style={{ color: isDark ?"#e5e5e5":"#1a1a1a"}}
 >
 {editable ? (
 <EditableText
 value={details.phone}
 onSave={(v) => onUpdate?.("contactDetails.phone", v)}
 />
 ) : (
 details.phone
 )}
 </div>
 </div>
 </div>
 )}

 {details?.email && (
 <div className={`${theme.card} flex items-start gap-3`}>
 <span className="text-lg mt-0.5 shrink-0">✉️</span>
 <div className="min-w-0">
 <div className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-0.5">
 Email
 </div>
 <div
 className="text-sm font-medium break-all"
 style={{ color: isDark ?"#e5e5e5":"#1a1a1a"}}
 >
 {editable ? (
 <EditableText
 value={details.email}
 onSave={(v) => onUpdate?.("contactDetails.email", v)}
 />
 ) : (
 details.email
 )}
 </div>
 </div>
 </div>
 )}

 {details?.address && (
 <div className={`${theme.card} flex items-start gap-3`}>
 <span className="text-lg mt-0.5 shrink-0">📍</span>
 <div className="min-w-0">
 <div className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-0.5">
 Address
 </div>
 <div
 className="text-sm font-medium wrap-break-word"
 style={{ color: isDark ?"#e5e5e5":"#1a1a1a"}}
 >
 {editable ? (
 <EditableText
 value={details.address}
 onSave={(v) => onUpdate?.("contactDetails.address", v)}
 multiline
 />
 ) : (
 details.address
 )}
 </div>
 </div>
 </div>
 )}

 {details?.hours && (
 <div className={`${theme.card} flex items-start gap-3`}>
 <span className="text-lg mt-0.5 shrink-0">🕐</span>
 <div className="min-w-0">
 <div className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-0.5">
 Hours
 </div>
 <div
 className="text-sm font-medium"
 style={{ color: isDark ?"#e5e5e5":"#1a1a1a"}}
 >
 {editable ? (
 <EditableText
 value={`${details.hours.open} – ${details.hours.close}`}
 onSave={(v) => {
 const parts = v
 .split("–")
 .map((s: string) => s.trim());
 if (parts.length === 2) {
 onUpdate?.("contactDetails.hours.open", parts[0]);
 onUpdate?.("contactDetails.hours.close", parts[1]);
 }
 }}
 />
 ) : (
 `${details.hours.open} – ${details.hours.close}`
 )}
 </div>
 {details.hours.days?.length > 0 && (
 <div className="text-xs opacity-50 mt-0.5">
 {details.hours.days.slice(0, 5).join(",")}
 </div>
 )}
 </div>
 </div>
 )}
 </div>

 {/* Right — form */}
 <div
 className="rounded-2xl p-6 @md:p-8 relative"
 style={{
 background: isDark ?"#111111":"#ffffff",
 border: `1px solid ${isDark ?"#2a2a2a":"#e5e7eb"}`,
 }}
 >
 {editable && (
 <div
 className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap z-10"
 style={{ background: brand.primaryColor, color:"#fff"}}
 >
 ✉️ Form active on download
 </div>
 )}

 {formState ==="success"? (
 <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
 <div className="text-4xl">✅</div>
 <div
 className="font-semibold"
 style={{ color: isDark ?"#fff":"#0a0a0a"}}
 >
 Message sent!
 </div>
 <div
 className="text-sm"
 style={{ color: isDark ?"#a3a3a3":"#525252"}}
 >
 We'll get back to you soon.
 </div>
 <button
 onClick={() => setFormState("idle")}
 className="mt-2 text-xs underline opacity-60 hover:opacity-100"
 style={{ color: brand.primaryColor }}
 >
 Send another
 </button>
 </div>
 ) : (
 <form
 action={`https://formspree.io/f/YOUR_FORM_ID`}
 method="POST"
 onSubmit={handleSubmit}
 >
 <div className="space-y-4">
 <div>
 <label
 className="block text-xs font-semibold uppercase tracking-wider opacity-50 mb-1.5"
 style={{ color: isDark ?"#fff":"#0a0a0a"}}
 >
 Your Name
 </label>
 <input
 type="text"
 name="name"
 placeholder="John Smith"
 required
 style={inputBase}
 readOnly={editable}
 onFocus={(e) =>
 (e.currentTarget.style.borderColor = brand.primaryColor)
 }
 onBlur={(e) =>
 (e.currentTarget.style.borderColor = isDark
 ?"#2a2a2a"
 :"#e5e7eb")
 }
 />
 </div>
 <div>
 <label
 className="block text-xs font-semibold uppercase tracking-wider opacity-50 mb-1.5"
 style={{ color: isDark ?"#fff":"#0a0a0a"}}
 >
 Email Address
 </label>
 <input
 type="email"
 name="email"
 placeholder="john@example.com"
 required
 style={inputBase}
 readOnly={editable}
 onFocus={(e) =>
 (e.currentTarget.style.borderColor = brand.primaryColor)
 }
 onBlur={(e) =>
 (e.currentTarget.style.borderColor = isDark
 ?"#2a2a2a"
 :"#e5e7eb")
 }
 />
 </div>
 <div>
 <label
 className="block text-xs font-semibold uppercase tracking-wider opacity-50 mb-1.5"
 style={{ color: isDark ?"#fff":"#0a0a0a"}}
 >
 Message
 </label>
 <textarea
 name="message"
 rows={4}
 placeholder="Tell us how we can help..."
 required
 style={{ ...inputBase, resize:"none"}}
 readOnly={editable}
 onFocus={(e) =>
 (e.currentTarget.style.borderColor = brand.primaryColor)
 }
 onBlur={(e) =>
 (e.currentTarget.style.borderColor = isDark
 ?"#2a2a2a"
 :"#e5e7eb")
 }
 />
 </div>

 {formState ==="error"&& (
 <div
 className="text-sm px-4 py-3 rounded-xl"
 style={{ background:"#dc262622", color:"#f87171"}}
 >
 ❌ Something went wrong. Please try again or email us
 directly.
 </div>
 )}

 <button
 type="submit"
 disabled={formState ==="sending"}
 className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
 style={{
 background:
 data.cta?.style?.background ?? brand.primaryColor,
 color: data.cta?.style?.textColor ??"#ffffff",
 }}
 >
 {editable ? (
 <EditableText
 value={data.cta?.text ??"Send Message"}
 onSave={(v) => onUpdate?.("cta.text", v)}
 />
 ) : formState ==="sending"? (
"Sending…"
 ) : (
 (data.cta?.text ??"Send Message")
 )}
 </button>
 </div>
 </form>
 )}
 </div>
 </div>
 </div>
 </section>
 );
}
