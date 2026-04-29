"use client";

import Link from "next/link";
import { Twitter, Linkedin, Instagram } from "lucide-react";
import Logo from "@/assets/logo_darkbg.svg";

const productLinks = [
 { label:"Features", href:"/#showcase"},
 { label:"Pricing", href:"/#pricing"},
 { label:"How It Works", href:"/#how-it-works"},
 { label:"Dashboard", href:"/dashboard"},
];

const companyLinks = [
 {
 label:"Contact",
 href:"mailto:info@crawlcube.com",
 display:"info@crawlcube.com",
 },
 { label:"Privacy Policy", href:"/privacy"},
 { label:"Terms of Service", href:"/terms"},
];

const socials = [
 { icon: Twitter, href:"#", label:"Twitter"},
 { icon: Linkedin, href:"#", label:"LinkedIn"},
 { icon: Instagram, href:"#", label:"Instagram"},
];

export default function Footer() {
 return (
 <footer className="bg-background py-16 px-6 border-t border-border">
 <div className="max-w-7xl mx-auto">
 {/* Main columns */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-12">
 {/* Column 1 — Brand */}
 <div>
 <Link href="/" className="flex items-center gap-2 mb-4">
 <img
 src={Logo.src}
 className="w-8"
 alt="CrawlCube logo"
 />
 <span className="text-foreground font-bold text-lg">crawlcube</span>
 </Link>
 <p
 className="text-muted-foreground text-[14px] leading-[1.6]"
 style={{ maxWidth: 220 }}
 >
 AI-powered website builder. Generate, preview, and deploy
 complete websites from a single text prompt.
 </p>
 <div className="flex items-center gap-4 mt-5">
 {socials.map((social) => (
 <a
 key={social.label}
 href={social.href}
 aria-label={social.label}
 className="transition-colors duration-200 text-muted-foreground hover:text-foreground"
 >
 <social.icon className="w-[18px] h-[18px]"/>
 </a>
 ))}
 </div>
 </div>

 {/* Column 2 — Product */}
 <div>
 <p
 className="font-semibold mb-4 text-muted-foreground"
 style={{
 fontSize: 12,
 letterSpacing:"0.08em",
 }}
 >
 PRODUCT
 </p>
 <ul className="space-y-3">
 {productLinks.map((link) => (
 <li key={link.label}>
 <Link
 href={link.href}
 className="transition-colors duration-200 text-foreground/65 hover:text-foreground text-[14px]"
 >
 {link.label}
 </Link>
 </li>
 ))}
 </ul>
 </div>

 {/* Column 3 — Company */}
 <div>
 <p
 className="font-semibold mb-4 text-muted-foreground"
 style={{
 fontSize: 12,
 letterSpacing:"0.08em",
 }}
 >
 COMPANY
 </p>
 <ul className="space-y-3">
 {companyLinks.map((link) => (
 <li key={link.label}>
 <a
 href={link.href}
 className="transition-colors duration-200 text-foreground/65 hover:text-foreground text-[14px]"
 >
 {"display" in link ? link.display : link.label}
 </a>
 </li>
 ))}
 </ul>
 </div>
 </div>

 {/* Bottom bar */}
 <div
 className="flex flex-col sm:flex-row items-center justify-between mt-12 pt-6 border-t border-border"
 >
 <p className="text-muted-foreground text-[13px]">
 © 2026 CrawlCube. All rights reserved.
 </p>
 <p className="mt-2 sm:mt-0 text-muted-foreground text-[13px]">
 Made in India 🇮🇳
 </p>
 </div>
 </div>
 </footer>
 );
}
