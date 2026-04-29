export default function TrustedBy() {
  const brands = [
    "Webflow",
    "Framer",
    "Notion",
    "Vercel",
    "Figma",
    "Stripe",
    "Shopify",
    "Linear",
    "Raycast",
    "Supabase",
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-muted-foreground text-sm mb-10 leading-relaxed">
          Powering experiences from
          <br />
          next-gen startups to enterprises
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {brands.map((brand) => (
            <span
              key={brand}
              className="text-muted-foreground/40 font-semibold text-base tracking-wide select-none transition-colors hover:text-muted-foreground/70"
              style={{ letterSpacing: "0.04em" }}
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
