"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useCredits } from "@/context/CreditsContext";
import { useCurrency } from "@/lib/useCurrency";
import { Toast } from "@/components/ui/Toast";
import ComparePlans from "@/components/pricing/ComparePlans";
import {
  SUBSCRIPTION_PLANS,
  TOPUP_PACKS,
  formatPrice,
  getMonthlyEquivalent,
  getRazorpayPlanId,
  type BillingPeriod,
} from "@/lib/razorpay";
import {
  Zap,
  Check,
  Crown,
  RefreshCw,
  X,
  ArrowLeft,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import Testimonials from "./Testimonials";
import TrustedBy from "./TrustedBy";

interface Props {
  isSubscribed: boolean;
  currentPlan: string | null;
  currentPeriod: string | null;
  isCancelled?: boolean;
  subscriptionEndDate?: Date | null;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

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

export default function PricingPage({
  isSubscribed,
  currentPlan,
  currentPeriod,
  isCancelled,
  subscriptionEndDate,
}: Props) {
  const router = useRouter();
  const { userId } = useAuth();
  const { refreshCredits } = useCredits();
  const currency = useCurrency();
  const [period, setPeriod] = useState<BillingPeriod>(
    currentPeriod === "monthly" || currentPeriod === "annual"
      ? currentPeriod
      : "monthly",
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    submessage?: string;
    type?: "success" | "error" | "info";
  } | null>(null);

  const searchParams = useSearchParams();

  // Show toast based on URL params without full page reload
  useEffect(() => {
    const subscribed = searchParams.get("subscribed");
    const topup = searchParams.get("topup");
    const cancelled = searchParams.get("cancelled");

    if (subscribed) {
      setToast({
        message: "Subscription activated! 🎉",
        submessage: "Your credits have been added to your account.",
        type: "success",
      });
      router.replace("/pricing");
    } else if (topup) {
      setToast({
        message: "Credits added successfully!",
        submessage: "Your top-up credits are ready to use.",
        type: "info",
      });
      router.replace("/pricing");
    } else if (cancelled) {
      setToast({
        message: "Subscription cancelled",
        submessage:
          "You'll retain access until the end of your billing period.",
        type: "error",
      });
      router.replace("/pricing");
    }
  }, [searchParams, router]);

  const currentPlanData = SUBSCRIPTION_PLANS.find((p) => p.id === currentPlan);

  // ── Load Razorpay script ──
  const loadRazorpay = (): Promise<boolean> =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // ── Subscribe / Upgrade ──
  const handleSubscribe = async (planId: string) => {
    if (!userId) {
      router.push("/sign-in");
      return;
    }

    setLoadingId(planId);
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)!;
    const razorpayPlanId = getRazorpayPlanId(plan, period);

    try {
      const res = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: razorpayPlanId,
          plan: plan.id,
          period,
          credits: plan.creditsPerMonth,
        }),
      });
      const { subscriptionId, error } = await res.json();
      if (error) throw new Error(error);

      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Failed to load Razorpay");

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: subscriptionId,
        name: "CrawlCube",
        description: `${plan.label} Plan — ${period}`,
        image: "/assets/logo.svg",
        theme: { color: "#ec4899" },
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "subscription",
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              plan: plan.id,
              period,
              credits: plan.creditsPerMonth,
            }),
          });
          const result = await verifyRes.json();
          if (result.success) {
            await refreshCredits();
            window.location.href = "/pricing?subscribed=true";
          }
        },
        modal: { ondismiss: () => setLoadingId(null) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("[Pricing] Subscribe error:", err);
      setLoadingId(null);
    }
  };

  // ── Top-up ──
  const handleTopUp = async (packId: string) => {
    if (!userId) {
      router.push("/sign-in");
      return;
    }

    setLoadingId(packId);
    const pack = TOPUP_PACKS.find((p) => p.id === packId)!;

    try {
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const { orderId, amount, error } = await res.json();
      if (error) throw new Error(error);

      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Failed to load Razorpay");

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: orderId,
        amount,
        currency: "INR",
        name: "CrawlCube",
        description: `${pack.label} — ${pack.credits} Credits`,
        image: "/assets/logo.svg",
        theme: { color: "#ec4899" },
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "topup",
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              credits: pack.credits,
            }),
          });
          const result = await verifyRes.json();
          if (result.success) {
            await refreshCredits();
            window.location.href = "/pricing?topup=true";
          }
        },
        modal: { ondismiss: () => setLoadingId(null) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("[Pricing] Top-up error:", err);
    } finally {
      setLoadingId(null);
    }
  };

  // ── Cancel subscription ──
  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      const res = await fetch("/api/razorpay/cancel-subscription", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        await refreshCredits();
        window.location.href = "/pricing?cancelled=true";
      }
    } catch (err) {
      console.error("[Pricing] Cancel error:", err);
    } finally {
      setCancelLoading(false);
      setShowCancelConfirm(false);
    }
  };

  // Plans to show for upgrade (exclude current plan)
  const upgradePlans = SUBSCRIPTION_PLANS.filter((p) => p.id !== currentPlan);

  return (
    <div className=" min-h-screen bg-background text-foreground">
      {toast && (
        <Toast
          message={toast.message}
          submessage={toast.submessage}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {/* ── Top bar with back button ── */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between relative z-10">
        <button
          suppressHydrationWarning
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          }}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          }}
          className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col items-center w-full">
        {/* ── Header ── */}
        <div className="text-center max-w-3xl mb-12">
          {!isSubscribed || showUpgrade ? (
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Choose The Perfect Plan
              <br />
              That Fits Your Goals
            </h1>
          ) : (
            <>
              <h1 className="text-4xl font-bold mb-2">Manage Your Plan</h1>
              <p className="text-muted-foreground">
                Top up credits, upgrade, or manage your subscription.
              </p>
            </>
          )}

          {/* ── Billing toggle (unsubscribed or upgrade view) ── */}
          {(!isSubscribed || showUpgrade) && (
            <div className="inline-flex items-center gap-4 bg-secondary/10 p-3 rounded-full border border-border shadow-sm mt-4">
              <span
                className={`text-sm font-medium cursor-pointer transition-colors ${period === "monthly" ? "text-foreground" : "text-muted-foreground"}`}
                onClick={() => setPeriod("monthly")}
              >
                Monthly
              </span>

              <button
                onClick={() =>
                  setPeriod(period === "monthly" ? "annual" : "monthly")
                }
                className="w-12 h-6 bg-border rounded-full relative flex items-center px-1 transition-colors focus:outline-none"
              >
                <div
                  className={`w-4 h-4 bg-primary rounded-full transition-transform duration-300 ${period === "annual" ? "translate-x-6 shadow-[0_0_8px_var(--primary)]" : "translate-x-0 shadow-[0_0_8px_var(--primary)]"}`}
                />
              </button>

              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setPeriod("annual")}
              >
                <span
                  className={`text-sm font-medium transition-colors ${period === "annual" ? "text-foreground" : "text-muted-foreground"}`}
                >
                  Annually
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider bg-green-700 text-white rounded-full px-2 py-1">
                  Save 20%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Subscription plans (unsubscribed) ── */}
        {!isSubscribed && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-stretch mb-10">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isPro = plan.popular;
              const CheckIcon = isPro ? ProCheck : StandardCheck;

              return isPro ? (
                <div
                  key={plan.id}
                  className="bg-primary/5 rounded-[32px] border border-primary/40 shadow-[0_0_50px_-15px_var(--primary)] flex flex-col relative overflow-hidden transform md:-translate-y-4"
                >
                  <div className="bg-linear-to-b from-primary/10 to-primary/20 p-8 pb-8 text-foreground relative border-b border-primary/30 rounded-b-[32px]">
                    <div className="absolute top-6 right-6 bg-primary text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg">
                      Most popular
                    </div>

                    <div className="mb-8">
                      <h2 className="text-3xl font-bold mb-2">{plan.label}</h2>
                      <p className="text-muted-foreground text-sm leading-relaxed italic pr-12">
                        {plan.sublabel}
                      </p>
                    </div>

                    <div className="mb-6 h-[80px]">
                      <div className="flex items-end gap-1 transition-all">
                        <span className="text-4xl font-bold tracking-tight">
                          {getMonthlyEquivalent(plan, period, currency)}
                        </span>
                        <span className="text-muted-foreground mb-1 text-sm font-bold">
                          /mo
                        </span>
                      </div>
                      {period === "annual" ? (
                        <p className="text-sm text-green-600 mt-2 font-semibold">
                          Billed {formatPrice(plan.annualPriceINR, currency)}
                          /year
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-2 font-semibold">
                          Billed monthly
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 bg-background/60 rounded-xl p-4 mb-6 border border-border shadow-sm">
                      <Zap className="w-4 h-4 text-primary" />
                      <p className="text-center font-bold text-foreground">
                        {plan.creditsPerMonth.toLocaleString()} credits / month
                      </p>
                    </div>

                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={loadingId === plan.id}
                      className="w-full py-3 px-6 rounded-full font-bold text-primary-foreground bg-primary hover:bg-primary/90 shadow-md transition-colors disabled:opacity-50"
                    >
                      {loadingId === plan.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />{" "}
                          Processing...
                        </span>
                      ) : (
                        `Get ${plan.label}`
                      )}
                    </button>
                  </div>

                  <div className="p-8 flex-1 flex flex-col ">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-px bg-primary/30 flex-1"></div>
                      <span className="text-xs text-primary font-medium uppercase tracking-wider">
                        Includes
                      </span>
                      <div className="h-px bg-primary/30 flex-1"></div>
                    </div>

                    <ul className="space-y-4 flex-1">
                      <li className="flex items-start gap-3">
                        <CheckIcon />
                        <span className="text-sm text-foreground font-medium">
                          All AI models (DeepSeek, Gemini, Sonnet)
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckIcon />
                        <span className="text-sm text-foreground font-medium">
                          Unlimited downloads
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckIcon />
                        <span className="text-sm text-foreground font-medium">
                          Live preview
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckIcon />
                        <span className="text-sm text-foreground font-medium">
                          Priority generation queue
                        </span>
                      </li>
                      {plan.id === "agency" && (
                        <li className="flex items-start gap-3">
                          <CheckIcon />
                          <span className="text-sm text-foreground font-medium">
                            White-label export
                          </span>
                        </li>
                      )}
                      <li className="flex items-start gap-3">
                        <CheckIcon />
                        <span className="text-sm text-foreground font-medium">
                          Ability to top-up credits
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div
                  key={plan.id}
                  className="bg-secondary/10 rounded-[32px] border border-border p-8 flex flex-col relative"
                >
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold mb-2">{plan.label}</h2>
                    <p className="text-muted-foreground text-sm leading-relaxed italic">
                      {plan.sublabel}
                    </p>
                  </div>

                  <div className="mb-6 h-[80px]">
                    <div className="flex items-end gap-1 transition-all">
                      <span className="text-4xl font-bold tracking-tight">
                        {getMonthlyEquivalent(plan, period, currency)}
                      </span>
                      <span className="text-muted-foreground mb-1 text-sm font-medium">
                        /mo
                      </span>
                    </div>
                    {period === "annual" ? (
                      <p className="text-sm text-green-600 mt-2 font-semibold">
                        Billed {formatPrice(plan.annualPriceINR, currency)}/year
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
                      {plan.creditsPerMonth.toLocaleString()} credits / month
                    </p>
                  </div>

                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loadingId === plan.id}
                    className="w-full py-3 px-6 rounded-full font-semibold text-foreground bg-secondary/50 hover:bg-secondary/80 border border-border transition-colors mb-8 disabled:opacity-50"
                  >
                    {loadingId === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />{" "}
                        Processing...
                      </span>
                    ) : (
                      `Get ${plan.label}`
                    )}
                  </button>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-px bg-border flex-1"></div>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Includes
                    </span>
                    <div className="h-px bg-border flex-1"></div>
                  </div>

                  <ul className="space-y-4 flex-1">
                    <li className="flex items-start gap-3">
                      <CheckIcon />
                      <span className="text-sm text-muted-foreground/90">
                        All AI models (DeepSeek, Gemini, Sonnet)
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckIcon />
                      <span className="text-sm text-muted-foreground/90">
                        Unlimited downloads
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckIcon />
                      <span className="text-sm text-muted-foreground/90">
                        Live preview
                      </span>
                    </li>
                    {plan.id !== "starter" && (
                      <li className="flex items-start gap-3">
                        <CheckIcon />
                        <span className="text-sm text-muted-foreground/90">
                          Priority generation queue
                        </span>
                      </li>
                    )}
                    {plan.id === "agency" && (
                      <li className="flex items-start gap-3">
                        <CheckIcon />
                        <span className="text-sm text-muted-foreground/90">
                          White-label export
                        </span>
                      </li>
                    )}
                    <li className="flex items-start gap-3">
                      <CheckIcon />
                      <span className="text-sm text-muted-foreground/90">
                        Ability to top-up credits
                      </span>
                    </li>
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Subscribed view ── */}
        {isSubscribed && (
          <div className="space-y-8 w-full max-w-5xl">
            {/* Current plan card */}
            <div className="bg-background border border-border rounded-2xl p-6 shadow-sm dark:shadow-none">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-primary dark:text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-lg capitalize">
                        {currentPlan} Plan
                      </p>
                      {isCancelled ? (
                        <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-medium">
                          Cancels{""}
                          {subscriptionEndDate
                            ? subscriptionEndDate.toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "soon"}
                        </span>
                      ) : (
                        <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm capitalize">
                      {currentPeriod} billing ·{""}
                      {currentPlanData?.creditsPerMonth.toLocaleString()}
                      {""}
                      credits/month
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black">
                    {currentPlanData
                      ? getMonthlyEquivalent(
                          currentPlanData,
                          (currentPeriod as BillingPeriod) ?? "monthly",
                          currency,
                        )
                      : ""}
                  </p>
                  <p className="text-muted-foreground text-xs">/month</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowUpgrade(!showUpgrade)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-xl text-sm font-medium transition-all"
                >
                  <TrendingUp className="w-4 h-4" />
                  {showUpgrade ? "Hide Plans" : "Upgrade / Change Plan"}
                </button>
                {!isCancelled && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-600 dark:hover:text-red-400 border border-border text-muted-foreground rounded-xl text-sm font-medium transition-all"
                  >
                    <X className="w-4 h-4" />
                    Cancel Subscription
                  </button>
                )}
              </div>
            </div>

            {/* Upgrade plans */}
            {showUpgrade && (
              <div>
                <h2 className="text-xl font-bold mb-4">
                  Switch to a Different Plan
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upgradePlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`relative rounded-2xl border p-5 flex flex-col gap-4 transition-shadow ${
                        plan.popular
                          ? "border-primary bg-background shadow-lg dark:shadow-none"
                          : "border-border bg-background/40 shadow-sm dark:shadow-none"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{plan.label}</h3>
                          <p className="text-muted-foreground text-xs">
                            {plan.sublabel}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black">
                            {getMonthlyEquivalent(plan, period, currency)}
                          </p>
                          <p className="text-muted-foreground text-xs">/mo</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl px-3 py-2 border border-border dark:border-transparent">
                        <Zap className="w-3.5 h-3.5 text-primary dark:text-primary" />
                        <span className="text-sm font-semibold">
                          {plan.creditsPerMonth.toLocaleString()} credits /
                          month
                        </span>
                      </div>

                      <button
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={loadingId === plan.id}
                        className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
                          plan.popular
                            ? "bg-purple-600 hover:bg-purple-700 dark:bg-primary dark:hover:bg-primary/90 text-foreground"
                            : "bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-foreground"
                        } disabled:opacity-50`}
                      >
                        {loadingId === plan.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            {""}
                            Processing...
                          </span>
                        ) : (
                          `Switch to ${plan.label}`
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top-up section */}
            <div>
              <div className="mb-5">
                <h2 className="text-xl font-bold mb-1">Top Up Credits</h2>
                <p className="text-muted-foreground text-sm">
                  Need more credits this month? Top up instantly.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TOPUP_PACKS.map((pack) => (
                  <div
                    key={pack.id}
                    className={`relative rounded-2xl border p-5 flex flex-col gap-4 transition-all hover:scale-[1.02] ${
                      pack.popular
                        ? "border-primary bg-background shadow-xl dark:shadow-lg dark:shadow-purple-500/10"
                        : "border-border bg-background/40 shadow-sm dark:shadow-none"
                    }`}
                  >
                    {pack.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-primary text-foreground text-xs font-bold px-3 py-1 rounded-full">
                          Best Value
                        </span>
                      </div>
                    )}

                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold mb-1">{pack.label}</h3>
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-primary dark:text-primary" />
                          <span className="text-sm text-muted-foreground">
                            {pack.credits.toLocaleString()} credits
                          </span>
                        </div>
                      </div>
                      <p className="text-2xl font-black">
                        {formatPrice(pack.priceINR, currency)}
                      </p>
                    </div>

                    <button
                      onClick={() => handleTopUp(pack.id)}
                      disabled={loadingId === pack.id}
                      className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
                        pack.popular
                          ? "bg-purple-600 hover:bg-purple-700 dark:bg-primary dark:hover:bg-primary/90 text-foreground"
                          : "bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-foreground"
                      } disabled:opacity-50`}
                    >
                      {loadingId === pack.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          {""}
                          Processing...
                        </span>
                      ) : (
                        `Buy ${pack.credits} Credits`
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-muted-foreground text-xs mt-12">
          Payments secured by Razorpay · Credits never expire · Cancel anytime
        </p>
      </div>

      {/* ── Cancel confirmation modal ── */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-background border border-border rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold">Cancel Subscription?</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-6">
              Your subscription will remain active until the end of the current
              billing period. After that, you will lose access to your monthly
              credits. Your existing credits will not be affected.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-secondary text-sm font-medium transition-all"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-foreground text-sm font-semibold transition-all disabled:opacity-50"
              >
                {cancelLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Cancelling...
                  </span>
                ) : (
                  "Yes, Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ComparePlans
        billing={"monthly"}
        onBillingChange={function (period: "monthly" | "annual"): void {
          throw new Error("Function not implemented.");
        }}
      />

      <TrustedBy />

      <Testimonials />
    </div>
  );
}
