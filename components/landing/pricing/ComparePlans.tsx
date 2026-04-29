"use client";

import { Check, Minus } from "lucide-react";

type BillingPeriod = "monthly" | "annual";

interface ComparePlansProps {
  billing: BillingPeriod;
  onBillingChange: (period: BillingPeriod) => void;
}

type CellValue =
  | { type: "check" }
  | { type: "dash" }
  | { type: "text"; text: string }
  | { type: "checkText"; text: string };

interface FeatureRow {
  name: string;
  free: CellValue;
  starter: CellValue;
  pro: CellValue;
  agency: CellValue;
}

const features: FeatureRow[] = [
  {
    name: "Credits per Month",
    free: { type: "text", text: "20 credits" },
    starter: { type: "text", text: "300" },
    pro: { type: "text", text: "1,000" },
    agency: { type: "text", text: "3,000" },
  },
  {
    name: "AI Models",
    free: { type: "text", text: "Fast Mode" },
    starter: { type: "check" },
    pro: { type: "check" },
    agency: { type: "checkText", text: "Advanced AI Models" },
  },
  {
    name: "Live Preview",
    free: { type: "check" },
    starter: { type: "check" },
    pro: { type: "check" },
    agency: { type: "check" },
  },
  {
    name: "Download HTML",
    free: { type: "check" },
    starter: { type: "check" },
    pro: { type: "check" },
    agency: { type: "check" },
  },
  {
    name: "One-Click Deploy (Netlify)",
    free: { type: "dash" },
    starter: { type: "check" },
    pro: { type: "check" },
    agency: { type: "check" },
  },
  {
    name: "Priority Generation Queue",
    free: { type: "dash" },
    starter: { type: "dash" },
    pro: { type: "check" },
    agency: { type: "check" },
  },
  {
    name: "Top-up Credits",
    free: { type: "dash" },
    starter: { type: "check" },
    pro: { type: "check" },
    agency: { type: "check" },
  },
  {
    name: "White-label Export",
    free: { type: "dash" },
    starter: { type: "dash" },
    pro: { type: "dash" },
    agency: { type: "check" },
  },
  {
    name: "API Access",
    free: { type: "dash" },
    starter: { type: "dash" },
    pro: { type: "dash" },
    agency: { type: "checkText", text: "Coming Soon" },
  },
  {
    name: "Customer Support",
    free: { type: "text", text: "Community" },
    starter: { type: "text", text: "Email Support" },
    pro: { type: "text", text: "Priority Chat" },
    agency: { type: "text", text: "Dedicated Manager" },
  },
];

function CellContent({ value }: { value: CellValue }) {
  switch (value.type) {
    case "check":
      return (
        <div className="flex justify-center">
          <div className="w-6 h-6 rounded-full bg-foreground/10 border border-foreground/20 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-foreground/70" />
          </div>
        </div>
      );
    case "dash":
      return (
        <div className="flex justify-center">
          <div className="w-6 h-6 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center">
            <Minus className="w-3.5 h-3.5 text-muted-foreground/50" />
          </div>
        </div>
      );
    case "text":
      return (
        <p className="text-sm text-foreground/70 text-center">{value.text}</p>
      );
    case "checkText":
      return (
        <div className="flex flex-col items-center gap-1">
          <div className="w-6 h-6 rounded-full bg-foreground/10 border border-foreground/20 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-foreground/70" />
          </div>
          <p className="text-xs text-muted-foreground">{value.text}</p>
        </div>
      );
    default:
      return null;
  }
}

export default function ComparePlans({
  billing,
  onBillingChange,
}: ComparePlansProps) {
  const planHeaders = [
    {
      name: "Free Plan",
      monthly: "₹0",
      annual: "₹0",
      sub: "Free for all users",
    },
    {
      name: "Starter Plan",
      monthly: "₹299",
      annual: "₹249",
      sub: "billed yearly",
    },
    { name: "Pro Plan", monthly: "₹799", annual: "₹639", sub: "billed yearly" },
    {
      name: "Agency Plan",
      monthly: "₹1,999",
      annual: "₹1,608",
      sub: "billed yearly",
    },
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
              Compare
            </span>
          </div>
          <h2
            className="text-foreground font-bold"
            style={{ fontSize: "clamp(28px, 4vw, 42px)" }}
          >
            Compare Plans
          </h2>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border overflow-hidden mt-10">
          {/* Table header */}
          <div className="grid grid-cols-5 border-b border-border">
            {/* Left header cell */}
            <div className="p-6 flex flex-col justify-center border-r border-border">
              <h3 className="text-lg font-bold text-foreground mb-4 leading-snug">
                Streamline Your Websites
                <br />
                with the Right Plan
              </h3>
              <div className="inline-flex rounded-full p-1 bg-secondary/10 border border-border self-start">
                <button
                  onClick={() => onBillingChange("monthly")}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                    billing === "monthly"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Bill Monthly
                </button>
                <button
                  onClick={() => onBillingChange("annual")}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                    billing === "annual"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Bill Annually
                </button>
              </div>
            </div>

            {/* Plan header columns */}
            {planHeaders.map((plan) => (
              <div
                key={plan.name}
                className="p-5 text-center border-r last:border-r-0 border-border"
              >
                <p className="text-xs font-semibold text-muted-foreground mb-2 tracking-wide">
                  {plan.name}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {billing === "monthly" ? plan.monthly : plan.annual}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    /month
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {plan.name === "Free Plan"
                    ? plan.sub
                    : billing === "annual"
                      ? plan.sub
                      : "\u00A0"}
                </p>
              </div>
            ))}
          </div>

          {/* Feature rows */}
          {features.map((feature, i) => (
            <div
              key={feature.name}
              className={`grid grid-cols-5 border-b last:border-b-0 border-border transition-colors hover:bg-foreground/2 ${
                i % 2 === 0 ? "bg-transparent" : "bg-foreground/1.5"
              }`}
            >
              <div className="p-4 pl-6 flex items-center border-r border-border">
                <p className="text-sm font-medium text-foreground">
                  {feature.name}
                </p>
              </div>
              <div className="p-4 flex items-center justify-center border-r border-border">
                <CellContent value={feature.free} />
              </div>
              <div className="p-4 flex items-center justify-center border-r border-border">
                <CellContent value={feature.starter} />
              </div>
              <div className="p-4 flex items-center justify-center border-r border-border">
                <CellContent value={feature.pro} />
              </div>
              <div className="p-4 flex items-center justify-center">
                <CellContent value={feature.agency} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
