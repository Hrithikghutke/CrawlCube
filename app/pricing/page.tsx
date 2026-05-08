import { auth } from "@clerk/nextjs/server";
import { getUserSubscription } from "@/lib/firestore";
import PricingPage from "@/components/pricing/PricingPage";
import { Suspense } from "react";

export default async function Pricing() {
  const { userId } = await auth();

  let subscription = null;
  if (userId) {
    subscription = await getUserSubscription(userId);
  }

  // User is considered subscribed if:
  // 1. Status is "active", OR
  // 2. Status is "cancelled" but end date is in the future (still has access)
  const now = new Date();
  const endDate = subscription?.subscriptionEndDate
    ? new Date(subscription.subscriptionEndDate.seconds * 1000) // Firestore Timestamp
    : null;

  const isSubscribed =
    subscription?.subscriptionStatus === "active" ||
    (subscription?.subscriptionStatus === "cancelled" &&
      endDate !== null &&
      endDate > now);

  const isCancelled = subscription?.subscriptionStatus === "cancelled";

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950" />
      }
    >
      <PricingPage
        isSubscribed={isSubscribed}
        currentPlan={subscription?.subscriptionPlan ?? null}
        currentPeriod={subscription?.subscriptionPeriod ?? null}
        isCancelled={isCancelled}
        subscriptionEndDate={endDate}
      />
    </Suspense>
  );
}
