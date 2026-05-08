"use client";

import Link from "next/link";
import { Twitter, Linkedin, Instagram, Headset, Mail } from "lucide-react";
import Logo from "@/assets/logo.svg";

const productLinks = [
  { label: "Pricing", href: "/pricing" },
  { label: "How It Works", href: "/#working" },
];

const companyLinks = [{ label: "Careers", href: "/careers" }];

const serviceLinks = [{ label: "AI Generation", href: "#" }];

const socials = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Instagram, href: "#", label: "Instagram" },
];

export default function Footer() {
  return (
    <footer className="bg-background  text-foreground py-16 px-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Top Section - Newsletter */}
        <div className="pb-12 border-b border-[#2e3328] mb-12">
          <h2 className="text-foreground text-xl font-semibold mb-2">
            Sign up for our newsletter!
          </h2>
          <p className="mb-6 text-[15px]">
            Stay up to date with tips, trends and offers about AI and website
            building.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-4xl">
            <input
              type="email"
              suppressHydrationWarning
              placeholder="Enter your email address here"
              className="flex-1 bg-foreground/30 text-white px-5 py-3.5 rounded-md outline-none focus:ring-1 focus:ring-foreground border border-transparent placeholder:text-muted-foreground"
            />
            <button
              suppressHydrationWarning
              className="bg-foreground hover:bg-primary hover:text-primary-foreground text-background font-semibold px-8 py-3.5 rounded-md transition-colors duration-200 shrink-0"
            >
              Subscribe
            </button>
          </div>
        </div>

        {/* Middle Section - Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8 pb-12 border-b border-[#2e3328]">
          {/* Column 1 - Brand (Spans 2 columns on large screens) */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <img src={Logo.src} className="w-6" alt="CrawlCube logo" />
              <span className="text-foreground font-bold text-lg tracking-wide">
                CrawlCube
              </span>
            </Link>
            <p className="text-[14px] leading-relaxed mb-8 pr-4">
              CrawlCube is the AI-powered platform that brings together website
              generation, preview, and deployment. Sign up now for free to take
              advantage of the benefits.
            </p>
            <div className="flex items-center gap-5">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="transition-colors duration-200 text-foreground hover:text-foreground/30"
                >
                  <social.icon strokeWidth={1.5} className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2 - Product */}
          <div>
            <h3 className="font-semibold text-accent mb-6 text-[15px]">
              Product
            </h3>
            <ul className="space-y-4">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[14px] transition-colors duration-200 hover:text-foreground/30"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Company */}
          <div>
            <h3 className="font-semibold text-accent mb-6 text-[15px]">
              Company
            </h3>
            <ul className="space-y-4">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[14px] transition-colors duration-200 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 - Services */}
          <div>
            <h3 className="font-semibold text-accent mb-6 text-[15px]">
              Services
            </h3>
            <ul className="space-y-4">
              {serviceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[14px] transition-colors duration-200 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5 - Contact Details */}
          <div>
            <h3 className="font-semibold text-accent mb-6 text-[15px]">
              Contact details
            </h3>
            <ul className="space-y-4 text-[14px]">
              <li>
                <a
                  href="mailto:connect@crawlcube.com"
                  className="transition-colors duration-200 hover:text-foreground/30 flex items-center gap-2"
                >
                  <Mail width={16} /> connect@crawlcube.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Headset width={16} /> +91 9422816563
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section - Copyright & Legal */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 text-[13px]">
          <p>© 2026 CrawlCube. All rights reserved.</p>
          <div className="flex gap-6 mt-4 sm:mt-0">
            <Link
              href="/terms"
              className="transition-colors duration-200 hover:text-white"
            >
              Terms of Policy
            </Link>
            <Link
              href="/privacy"
              className="transition-colors duration-200 hover:text-white"
            >
              Privacy Policy
            </Link>
            <Link
              href="/cookie"
              className="transition-colors duration-200 hover:text-white"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
