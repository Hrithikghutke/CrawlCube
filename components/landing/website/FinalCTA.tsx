import Link from "next/link";
import Image from "next/image";

export default function FinalCTA() {
  return (
    <section
      className="relative rounded-4xl py-20 md:py-32 px-6 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1772655151119-7dd0cdee2bb0?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
      }}
    >
      {/* Optional dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Headline */}
        <h2
          className="text-white font-bold leading-[1.1] mb-6"
          style={{ fontSize: "clamp(36px, 5vw, 56px)" }}
        >
          Your first website is free.
        </h2>

        {/* Subtext */}
        <p
          className="mx-auto mb-8 text-white/80 text-lg leading-[1.6]"
          style={{ maxWidth: 480 }}
        >
          Stop waiting for a designer. Describe your business and get a complete
          website in 60 seconds.
        </p>

        {/* CTA Button */}
        <Link
          href="/sign-up"
          className="inline-block bg-primary text-primary-foreground font-semibold rounded-full transition-all duration-200 hover:shadow-[0_0_24px_var(--color-primary)] hover:scale-[1.02] px-10 py-4 text-lg"
        >
          Start Building Free →
        </Link>

        {/* Below button text */}
        <p className="mt-4 text-[13px] text-white/70">
          20 free credits · No credit card · Ready in 60 seconds
        </p>
      </div>
    </section>
  );
}
