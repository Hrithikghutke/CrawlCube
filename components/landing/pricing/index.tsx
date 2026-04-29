"use client";

import { useState } from "react";

import PricingCards from "./PricingCards";
import ComparePlans from "./ComparePlans";
import TrustedBy from "./TrustedBy";
import Testimonials from "./Testimonials";

type BillingPeriod = "monthly" | "annual";

export default function PricingSection() {
  const [billing, setBilling] = useState<BillingPeriod>("monthly");

  return (
    <div>
      <PricingCards />
      <ComparePlans billing={billing} onBillingChange={setBilling} />
      <TrustedBy />
      <Testimonials />
    </div>
  );
}
