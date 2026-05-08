"use client";

import { useBrand } from "@/context/BrandContext";
import EditableText from "@/components/ui/EditableText";

export default function Footer({
  editable = false,
  onUpdate,
  contactDetails,
}: {
  editable?: boolean;
  onUpdate?: (field: string, value: string) => void;
  contactDetails?: {
    phone?: string;
    email?: string;
    address?: string;
    hours?: { open: string; close: string; days: string[] };
  };
}) {
  const brand = useBrand();
  const isDark = brand.theme === "dark";
  const socials = brand.socialLinks;

  const iconStyle = {
    width: 34,
    height: 34,
    borderRadius: "8px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: `${brand.primaryColor}18`,
    color: brand.primaryColor,
    fontSize: "16px",
    textDecoration: "none",
    transition: "background 0.2s",
  } as React.CSSProperties;

  const hasSocials = socials && Object.values(socials).some(Boolean);
  const hasHours = contactDetails?.hours;
  const hasContact =
    contactDetails?.phone || contactDetails?.email || contactDetails?.address;

  return (
    <footer
      className="border-t px-4 @md:px-8 pt-12 pb-6"
      style={{
        borderColor: isDark ? "#1a1a1a" : "#e5e7eb",
        background: isDark ? "#050505" : "#f9fafb",
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* 4-column grid */}
        <div className="grid grid-cols-1 @lg:grid-cols-4 gap-8 mb-10">
          {/* Column 1: Brand + description + socials */}
          <div className="space-y-2 flex flex-col items-center justify-center @lg:col-span-1 @lg:items-start @lg:justify-start">
            <div
              className="flex items-center gap-2 font-bold text-base"
              style={{ color: isDark ? "#ffffff" : "#0a0a0a" }}
            >
              {brand.logo?.startsWith("<svg") ? (
                <span
                  style={{ width: 28, height: 28, display: "inline-flex" }}
                  dangerouslySetInnerHTML={{
                    __html: brand.logo
                      .replace(/width="48"/, 'width="28"')
                      .replace(/height="48"/, 'height="28"'),
                  }}
                />
              ) : (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: brand.primaryColor }}
                />
              )}
              {editable ? (
                <EditableText
                  value={brand.logoText ?? "Brand"}
                  onSave={(v) => onUpdate?.("logoText", v)}
                />
              ) : (
                (brand.logoText ?? "Brand")
              )}
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{ color: isDark ? "#737373" : "#6b7280" }}
            >
              Powered by CrawlCube — AI website builder.
            </p>

            {/* Social icons */}
            {hasSocials && (
              <div className="flex gap-2 pt-1">
                {socials?.instagram && (
                  <a
                    href={socials.instagram}
                    target="_blank"
                    rel="noopener"
                    style={iconStyle}
                  >
                    📸
                  </a>
                )}
                {socials?.facebook && (
                  <a
                    href={socials.facebook}
                    target="_blank"
                    rel="noopener"
                    style={iconStyle}
                  >
                    📘
                  </a>
                )}
                {socials?.twitter && (
                  <a
                    href={socials.twitter}
                    target="_blank"
                    rel="noopener"
                    style={iconStyle}
                  >
                    🐦
                  </a>
                )}
                {socials?.youtube && (
                  <a
                    href={socials.youtube}
                    target="_blank"
                    rel="noopener"
                    style={iconStyle}
                  >
                    ▶️
                  </a>
                )}
                {socials?.linkedin && (
                  <a
                    href={socials.linkedin}
                    target="_blank"
                    rel="noopener"
                    style={iconStyle}
                  >
                    💼
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Column 2: Quick links */}
          <div className="space-y-4">
            <h4
              className="text-sm font-bold uppercase tracking-widest"
              style={{ color: brand.primaryColor }}
            >
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {["#features", "#pricing", "#contact"].map((href, i) => (
                <li key={i}>
                  <a
                    href={href}
                    className="text-sm transition-colors hover:opacity-100"
                    style={{ color: isDark ? "#737373" : "#6b7280" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = brand.primaryColor)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = isDark
                        ? "#737373"
                        : "#6b7280")
                    }
                  >
                    {href.replace("#", "").charAt(0).toUpperCase() +
                      href.replace("#", "").slice(1)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact info */}
          {hasContact && (
            <div className="space-y-4">
              <h4
                className="text-sm font-bold uppercase tracking-widest"
                style={{ color: brand.primaryColor }}
              >
                Contact Us
              </h4>
              <ul className="space-y-3">
                {contactDetails?.phone && (
                  <li
                    className="flex items-start gap-2 text-sm"
                    style={{ color: isDark ? "#a3a3a3" : "#525252" }}
                  >
                    <span>📞</span>
                    <a
                      href={`tel:${contactDetails.phone}`}
                      className="hover:opacity-80"
                    >
                      {contactDetails.phone}
                    </a>
                  </li>
                )}
                {contactDetails?.email && (
                  <li
                    className="flex items-start gap-2 text-sm"
                    style={{ color: isDark ? "#a3a3a3" : "#525252" }}
                  >
                    <span>✉️</span>
                    <a
                      href={`mailto:${contactDetails.email}`}
                      className="hover:opacity-80 break-all"
                    >
                      {contactDetails.email}
                    </a>
                  </li>
                )}
                {contactDetails?.address && (
                  <li
                    className="flex items-start gap-2 text-sm"
                    style={{ color: isDark ? "#a3a3a3" : "#525252" }}
                  >
                    <span className="shrink-0">📍</span>
                    <span>{contactDetails.address}</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Column 4: Working hours */}
          {hasHours && (
            <div className="space-y-4">
              <h4
                className="text-sm font-bold uppercase tracking-widest"
                style={{ color: brand.primaryColor }}
              >
                Working Hours
              </h4>
              <div className="space-y-2">
                {/* Show first day – last day range instead of all days */}
                <div
                  className="text-sm"
                  style={{ color: isDark ? "#a3a3a3" : "#525252" }}
                >
                  {contactDetails!.hours!.days.length > 1
                    ? `${contactDetails!.hours!.days[0]} – ${contactDetails!.hours!.days[contactDetails!.hours!.days.length - 1]}`
                    : contactDetails!.hours!.days[0]}
                </div>
                <div
                  className="text-sm font-semibold"
                  style={{ color: isDark ? "#ffffff" : "#0a0a0a" }}
                >
                  {contactDetails!.hours!.open} – {contactDetails!.hours!.close}
                </div>
              </div>
              <a
                href="#contact"
                className="flex justify-center items-center   text-center mt-1 px-5 py-2.5 rounded-full text-xs font-bold transition-opacity hover:opacity-90"
                style={{ background: brand.primaryColor, color: "#ffffff" }}
              >
                Book Free Consultation
              </a>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div
          className="pt-6 flex flex-col @sm:flex-row justify-between items-center gap-3 text-xs border-t"
          style={{
            borderColor: isDark ? "#1a1a1a" : "#e5e7eb",
            color: isDark ? "#525252" : "#9ca3af",
          }}
        >
          <p>
            © {new Date().getFullYear()} {brand.logoText ?? "Brand"}. All rights
            reserved.
          </p>
          <div className="flex gap-4">
            <a href="#" className="hover:opacity-80">
              Privacy
            </a>
            <a href="#" className="hover:opacity-80">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
