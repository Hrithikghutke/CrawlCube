import Link from "next/link";

export default function FinalCTA() {
 return (
 <section
 className="py-32 px-6"
 style={{
 background:"radial-gradient(ellipse at center, color-mix(in srgb, var(--color-primary) 15%, var(--color-background)) 0%, var(--color-background) 70%)",
 }}
 >
 <div className="max-w-4xl mx-auto text-center">
 {/* Headline */}
 <h2
 className="text-foreground font-extrabold leading-[1.1] mb-6"
 style={{ fontSize:"clamp(36px, 5vw, 56px)"}}
 >
 Your first website is free.
 </h2>

 {/* Subtext */}
 <p
 className="mx-auto mb-8 text-muted-foreground text-lg leading-[1.6]"
 style={{ maxWidth: 480 }}
 >
 Stop waiting for a designer. Describe your business and get a
 complete website in 60 seconds.
 </p>

 {/* CTA Button */}
 <Link
 href="/sign-up"
 className="inline-block bg-primary text-primary-foreground font-semibold rounded-full transition-all duration-200 hover:shadow-[0_0_24px_var(--color-primary)] hover:scale-[1.02] px-10 py-4 text-lg"
 >
 Start Building Free →
 </Link>

 {/* Below button text */}
 <p className="mt-4 text-[13px] text-muted-foreground">
 20 free credits · No credit card · Ready in 60 seconds
 </p>
 </div>
 </section>
 );
}
