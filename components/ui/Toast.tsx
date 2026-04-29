"use client";

import { useEffect, useState } from "react";
import { CheckCircle, X, Zap, XCircle } from "lucide-react";

interface ToastProps {
 message: string;
 submessage?: string;
 type?:"success"|"error"|"info";
 duration?: number;
 onClose: () => void;
}

export function Toast({
 message,
 submessage,
 type ="success",
 duration = 5000,
 onClose,
}: ToastProps) {
 const [visible, setVisible] = useState(false);

 useEffect(() => {
 // Animate in
 const showTimer = setTimeout(() => setVisible(true), 10);
 // Auto dismiss
 const hideTimer = setTimeout(() => {
 setVisible(false);
 setTimeout(onClose, 300); // wait for fade out
 }, duration);

 return () => {
 clearTimeout(showTimer);
 clearTimeout(hideTimer);
 };
 }, [duration, onClose]);

 const colors = {
 success: {
 bg:"bg-neutral-900",
 border:"border-green-500/30",
 icon:"text-green-400",
 iconBg:"bg-green-500/10",
 },
 error: {
 bg:"bg-neutral-900",
 border:"border-red-500/30",
 icon:"text-red-400",
 iconBg:"bg-red-500/10",
 },
 info: {
 bg:"bg-neutral-900",
 border:"border-pink-500/30",
 icon:"text-pink-400",
 iconBg:"bg-pink-500/10",
 },
 };

 const c = colors[type];

 return (
 <div
 className={`fixed top-4 right-4 z-9999 flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-2xl max-w-sm transition-all duration-300 ${c.bg} ${c.border} ${
 visible ?"opacity-100 translate-y-0":"opacity-0 -translate-y-2"
 }`}
 >
 <div
 className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${c.iconBg}`}
 >
 {type ==="success"&& <CheckCircle className={`w-4 h-4 ${c.icon}`} />}
 {type ==="error"&& <XCircle className={`w-4 h-4 ${c.icon}`} />}
 {type ==="info"&& <Zap className={`w-4 h-4 ${c.icon}`} />}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-white">{message}</p>
 {submessage && (
 <p className="text-xs text-neutral-400 mt-0.5">{submessage}</p>
 )}
 </div>
 <button
 onClick={() => {
 setVisible(false);
 setTimeout(onClose, 300);
 }}
 className="shrink-0 text-neutral-500 hover:text-white transition-colors mt-0.5"
 >
 <X className="w-4 h-4"/>
 </button>
 </div>
 );
}
