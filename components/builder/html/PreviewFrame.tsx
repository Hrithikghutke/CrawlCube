"use client";

import Hero from "@/components/sections/Hero";
import Stats from "@/components/sections/Stats";
import Features from "@/components/sections/Features";
import Pricing from "@/components/sections/Pricing";
import Testimonials from "@/components/sections/Testimonials";
import CtaBanner from "@/components/sections/CtaBanner";
import Contact from "@/components/sections/Contact";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { BrandContext } from "@/context/BrandContext";
import { Layout } from "@/types/layout";

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export default function PreviewFrame({
  layout,
  editable = false,
  onLayoutChange,
  isThumbnail = false,
}: {
  layout: Layout | null;
  editable?: boolean;
  onLayoutChange?: (updated: Layout) => void;
  isThumbnail?: boolean;
}) {
  if (!layout) return null;

  const updateSection = (
    sectionIndex: number,
    field: string,
    value: string,
  ) => {
    const updated = deepClone(layout);
    const section = updated.sections[sectionIndex] as any;
    const parts = field.split(".");
    let target = section;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!target[parts[i]]) target[parts[i]] = {};
      target = target[parts[i]];
    }
    target[parts[parts.length - 1]] = value;
    onLayoutChange?.(updated);
  };

  const updateSectionArrayItem = (
    sectionIndex: number,
    arrayField: string,
    itemIndex: number,
    itemField: string,
    value: string,
  ) => {
    const updated = deepClone(layout);
    const section = updated.sections[sectionIndex] as any;
    section[arrayField][itemIndex][itemField] = value;
    onLayoutChange?.(updated);
  };

  const updatePricingFeature = (
    sectionIndex: number,
    planIndex: number,
    featureIndex: number,
    value: string,
  ) => {
    const updated = deepClone(layout);
    const section = updated.sections[sectionIndex] as any;
    section.pricingOptions[planIndex].features[featureIndex] = value;
    onLayoutChange?.(updated);
  };

  const updateBranding = (field: string, value: string) => {
    const updated = deepClone(layout);
    (updated.branding as any)[field] = value;
    onLayoutChange?.(updated);
  };

  // Extract contact details so Footer + Navbar can use them
  const contactSection = layout.sections.find(
    (s) => s.type === "contact",
  ) as any;
  const contactDetails = contactSection?.contactDetails;
  const phone = contactDetails?.phone ?? undefined;

  const brandContextValue = {
    ...layout.branding,
    theme: layout.theme,
    themeStyle: layout.themeStyle,
    logo: layout.branding?.logo ?? undefined,
    socialLinks: layout.branding?.socialLinks ?? undefined,
  };

  return (
    <BrandContext.Provider value={brandContextValue}>
      <div
        className={`preview-root @container ${isThumbnail ? "min-h-full" : "min-h-screen"} ${layout.theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
      >
        {/* Developer Agent Google Font */}
        {layout.customFont?.url && (
          <link rel="stylesheet" href={layout.customFont.url} />
        )}

        {/* Developer Agent custom CSS + font-family applied to preview root */}
        {layout.customCss && (
          <style dangerouslySetInnerHTML={{ __html: layout.customCss }} />
        )}

        {/* Font enforcement — must come AFTER customCss and uses !important
            to override Tailwind utility classes like font-serif, font-normal etc. */}
        {layout.customFont && (
          <style
            dangerouslySetInnerHTML={{
              __html: `
            .preview-root h1,
            .preview-root h2,
            .preview-root h3,
            .preview-root h4,
            .preview-root h5,
            .preview-root h6 {
              font-family: ${layout.customFont.displayFamily} !important;
              font-weight: revert !important;
            }
            .preview-root nav,
            .preview-root footer,
            .preview-root p,
            .preview-root a,
            .preview-root button,
            .preview-root li,
            .preview-root input,
            .preview-root textarea,
            .preview-root label {
              font-family: ${layout.customFont.bodyFamily} !important;
              font-weight: revert !important;
            }
          `,
            }}
          />
        )}

        <Navbar
          editable={editable}
          phone={phone}
          isThumbnail={isThumbnail}
          onUpdate={(field, value) => updateBranding(field, value)}
        />

        {layout.sections.map((section, index) => {
          const i = index;

          if (section.type === "hero") {
            return (
              <Hero
                key={i}
                data={section}
                editable={editable}
                onUpdate={(field, value) => updateSection(i, field, value)}
              />
            );
          }

          if (section.type === "stats") {
            return (
              <Stats
                key={i}
                data={section}
                editable={editable}
                onUpdateItem={(itemIndex, field, value) =>
                  updateSectionArrayItem(i, "stats", itemIndex, field, value)
                }
              />
            );
          }

          if (section.type === "features") {
            return (
              <Features
                key={i}
                data={section}
                editable={editable}
                onUpdate={(field, value) => updateSection(i, field, value)}
                onUpdateItem={(itemIndex, field, value) =>
                  updateSectionArrayItem(i, "features", itemIndex, field, value)
                }
              />
            );
          }

          if (section.type === "pricing") {
            return (
              <Pricing
                key={i}
                data={section}
                editable={editable}
                onUpdate={(field, value) => updateSection(i, field, value)}
                onUpdateItem={(planIndex, field, value) =>
                  updateSectionArrayItem(
                    i,
                    "pricingOptions",
                    planIndex,
                    field,
                    value,
                  )
                }
                onUpdateFeature={(planIndex, featureIndex, value) =>
                  updatePricingFeature(i, planIndex, featureIndex, value)
                }
              />
            );
          }

          if (section.type === "testimonials") {
            return (
              <Testimonials
                key={i}
                data={section}
                editable={editable}
                onUpdate={(field, value) => updateSection(i, field, value)}
                onUpdateItem={(itemIndex, field, value) =>
                  updateSectionArrayItem(
                    i,
                    "testimonials",
                    itemIndex,
                    field,
                    value,
                  )
                }
              />
            );
          }

          if (section.type === "cta_banner") {
            return (
              <CtaBanner
                key={i}
                data={section}
                editable={editable}
                onUpdate={(field, value) => updateSection(i, field, value)}
              />
            );
          }

          if (section.type === "contact") {
            return (
              <Contact
                key={i}
                data={section}
                editable={editable}
                onUpdate={(field, value) => updateSection(i, field, value)}
              />
            );
          }

          return null;
        })}

        <Footer
          editable={editable}
          contactDetails={contactDetails}
          onUpdate={(field, value) => updateBranding(field, value)}
        />
      </div>
    </BrandContext.Provider>
  );
}
