import { Zap } from "lucide-react";
import React, { useState } from "react";

const PricingUI = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  // Pricing Data (Monthly values are assumed estimates based on standard SaaS discounts)
  const pricingData = {
    starter: { monthly: 299, annualMo: 249, annualTotal: "2,988" },
    pro: { monthly: 799, annualMo: 639, annualTotal: "7,668" },
    agency: { monthly: 1999, annualMo: 1608.25, annualTotal: "19,299" },
  };

  const starterFeatures = [
    "All AI models (DeepSeek, Gemini, Sonnet)",
    "Unlimited downloads",
    "Live preview",
    "Ability to top-up credits",
  ];

  const proFeatures = [
    "All AI models (DeepSeek, Gemini, Sonnet)",
    "Unlimited downloads",
    "Live preview",
    "Priority generation queue",
    "Ability to top-up credits",
  ];

  const agencyFeatures = [
    "All AI models (DeepSeek, Gemini, Sonnet)",
    "Unlimited downloads",
    "Live preview",
    "Priority generation queue",
    "White-label export",
  ];

  // SVG Check Icon for Starter/Agency Plans
  const StandardCheck = () => (
    <svg
      className="w-5 h-5 shrink-0 text-foreground mt-0.5"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );

  // SVG Check Icon for Pro Plan
  const ProCheck = () => (
    <svg
      className="w-5 h-5 shrink-0 text-primary mt-0.5"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );

  return (
    <div className="bg-background text-foreground py-20 px-4 font-sans flex flex-col items-center">
      {/* Header Section */}
      <div className="text-center max-w-3xl mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          Choose The Perfect Plan
          <br />
          That Fits Your Goals
        </h1>

        {/* Dynamic Pricing Toggle */}
        <div className="inline-flex items-center gap-4 bg-secondary/10 p-3 rounded-full border border-border shadow-sm mt-4">
          <span
            className={`text-sm font-medium cursor-pointer transition-colors ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}
            onClick={() => setIsAnnual(false)}
          >
            Monthly
          </span>

          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-12 h-6 bg-border rounded-full relative flex items-center px-1 transition-colors focus:outline-none"
          >
            <div
              className={`w-4 h-4 bg-primary rounded-full transition-transform duration-300 ${isAnnual ? "translate-x-6 shadow-[0_0_8px_var(--primary)]" : "translate-x-0 shadow-[0_0_8px_var(--primary)]"}`}
            />
          </button>

          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setIsAnnual(true)}
          >
            <span
              className={`text-sm font-medium transition-colors ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}
            >
              Annually
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider  bg-green-700  text-white rounded-full px-2 py-1">
              Save 20%
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl w-full items-stretch">
        {/* STARTER PLAN */}
        <div className="bg-secondary/10 rounded-[32px] border border-border p-8 flex flex-col relative">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Starter</h2>
            <p className="text-muted-foreground text-sm leading-relaxed italic">
              Perfect for individuals
            </p>
          </div>

          <div className="mb-6 h-[80px]">
            <div className="flex items-end gap-1 transition-all">
              <span className="text-4xl font-bold">
                ₹
                {isAnnual
                  ? pricingData.starter.annualMo
                  : pricingData.starter.monthly}
              </span>
              <span className="text-muted-foreground mb-1 text-sm font-medium">
                /mo
              </span>
            </div>
            {isAnnual ? (
              <p className="text-sm text-green-600 mt-2 font-semibold">
                Billed ₹{pricingData.starter.annualTotal}/year
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-2 font-medium">
                Billed monthly
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 bg-secondary/30 rounded-xl p-4 mb-6 border border-border/50">
            <Zap className="w-4 h-4 text-primary" />
            <p className="text-center font-semibold text-foreground/90">
              300 credits / month
            </p>
          </div>

          <button className="w-full py-3 px-6 rounded-full font-semibold text-foreground bg-secondary/50 hover:bg-secondary/80 border border-border transition-colors mb-8">
            Get Starter
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-border flex-1"></div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Includes
            </span>
            <div className="h-px bg-border flex-1"></div>
          </div>

          <ul className="space-y-4 flex-1">
            {starterFeatures.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <StandardCheck />
                <span className="text-sm text-muted-foreground/90">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* PRO PLAN */}
        <div className="bg-primary/5 rounded-[32px] border border-primary/40 shadow-[0_0_50px_-15px_var(--primary)] flex flex-col relative overflow-hidden transform md:-translate-y-4">
          {/* Top Light Section */}
          <div className="bg-linear-to-b from-primary/10 to-primary/20 p-8 pb-8 text-foreground relative border-b border-primary/30 rounded-b-[32px]">
            {/* Badge */}
            <div className="absolute top-6 right-6 bg-primary text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg">
              Most popular
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Pro</h2>
              <p className="text-muted-foreground text-sm leading-relaxed italic pr-12">
                For serious builders
              </p>
            </div>

            <div className="mb-6 h-[80px]">
              <div className="flex items-end gap-1 transition-all">
                <span className="text-4xl font-bold">
                  ₹
                  {isAnnual
                    ? pricingData.pro.annualMo
                    : pricingData.pro.monthly}
                </span>
                <span className="text-muted-foreground mb-1 text-sm font-bold">
                  /mo
                </span>
              </div>
              {isAnnual ? (
                <p className="text-sm text-green-600 mt-2 font-semibold">
                  Billed ₹{pricingData.pro.annualTotal}/year
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-2 font-semibold">
                  Billed monthly
                </p>
              )}
            </div>

            <div className="flex items-center gap-2  bg-background/60 rounded-xl p-4 mb-6 border border-border shadow-sm">
              <Zap className="w-4 h-4 text-primary" />
              <p className="text-center font-bold text-foreground">
                1,000 credits / month
              </p>
            </div>

            <button className="w-full py-3 px-6 rounded-full font-bold text-primary-foreground bg-primary hover:bg-primary/90 shadow-md transition-colors">
              Get Pro
            </button>
          </div>

          {/* Bottom Dark Section */}
          <div className="p-8 flex-1 flex flex-col ">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px bg-primary/30 flex-1"></div>
              <span className="text-xs text-primary font-medium uppercase tracking-wider">
                Includes
              </span>
              <div className="h-px bg-primary/30 flex-1"></div>
            </div>

            <ul className="space-y-4 flex-1">
              {proFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <ProCheck />
                  <span className="text-sm text-foreground font-medium">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* AGENCY PLAN */}
        <div className="bg-secondary/10 rounded-[32px] border border-border p-8 flex flex-col relative">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Agency</h2>
            <p className="text-muted-foreground text-sm leading-relaxed italic">
              For teams and agencies
            </p>
          </div>

          <div className="mb-6 h-[80px]">
            <div className="flex items-end gap-1 transition-all">
              <span className="text-4xl font-bold tracking-tight">
                ₹
                {isAnnual
                  ? pricingData.agency.annualMo
                  : pricingData.agency.monthly}
              </span>
              <span className="text-muted-foreground mb-1 text-sm font-medium">
                /mo
              </span>
            </div>
            {isAnnual ? (
              <p className="text-sm text-green-600 mt-2 font-semibold">
                Billed ₹{pricingData.agency.annualTotal}/year
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-2 font-medium">
                Billed monthly
              </p>
            )}
          </div>

          <div className=" flex items-center gap-2 bg-secondary/30 rounded-xl p-4 mb-6 border border-border/50">
            <Zap className="w-4 h-4 text-primary" />
            <p className="text-center font-semibold text-foreground/90">
              3,000 credits / month
            </p>
          </div>

          <button className="w-full py-3 px-6 rounded-full font-semibold text-foreground bg-secondary/50 hover:bg-secondary/80 border border-border transition-colors mb-8">
            Get Agency
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-border flex-1"></div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Includes
            </span>
            <div className="h-px bg-border flex-1"></div>
          </div>

          <ul className="space-y-4 flex-1">
            {agencyFeatures.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <StandardCheck />
                <span className="text-sm text-muted-foreground/90">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PricingUI;
