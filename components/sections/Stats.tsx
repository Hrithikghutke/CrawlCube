"use client";

import { useBrand } from "@/context/BrandContext";
import EditableText from "@/components/ui/EditableText";

export default function Stats({
 data,
 editable = false,
 onUpdateItem,
}: {
 data: any;
 editable?: boolean;
 onUpdateItem?: (index: number, field: string, value: string) => void;
}) {
 const brand = useBrand();
 const isDark = brand.theme ==="dark";

 if (!data?.stats?.length) return null;

 return (
 <section
 className="py-10 @md:py-14 px-4 @md:px-8 border-y"
 style={{
 borderColor: `${brand.primaryColor}22`,
 background: isDark ?"#080808":"#fafafa",
 }}
 >
 <div className="max-w-5xl mx-auto grid grid-cols-2 @md:grid-cols-4 gap-6 @md:gap-8">
 {data.stats.map((stat: any, i: number) => (
 <div key={i} className="flex flex-col items-center text-center gap-1">
 {/* Optional icon */}
 {stat.icon && <span className="text-2xl mb-1">{stat.icon}</span>}
 {/* Number */}
 <div
 className="text-2xl @md:text-4xl font-extrabold tracking-tight"
 style={{ color: brand.primaryColor }}
 >
 {editable ? (
 <EditableText
 value={stat.value}
 onSave={(v) => onUpdateItem?.(i,"value", v)}
 />
 ) : (
 stat.value
 )}
 </div>
 {/* Label */}
 <div
 className="text-xs @md:text-sm font-medium"
 style={{ color: isDark ?"#a3a3a3":"#525252"}}
 >
 {editable ? (
 <EditableText
 value={stat.label}
 onSave={(v) => onUpdateItem?.(i,"label", v)}
 />
 ) : (
 stat.label
 )}
 </div>
 {/* Accent underline */}
 <div
 className="h-0.5 w-8 rounded-full mt-1 opacity-50"
 style={{ backgroundColor: brand.primaryColor }}
 />
 </div>
 ))}
 </div>
 </section>
 );
}
