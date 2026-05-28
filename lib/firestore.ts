import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  getCountFromServer,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateShareId } from "@/lib/generateId";

const STARTING_CREDITS = 20;

/* -------------------------------------------------------
   Create a new user document when they sign up.
   Called from the webhook in Step 10.
------------------------------------------------------- */
export async function createUserRecord(clerkUserId: string, email: string) {
  const userRef = doc(db, "users", clerkUserId);
  const existing = await getDoc(userRef);

  // Don't overwrite if they already exist
  if (existing.exists()) return;

  await setDoc(userRef, {
    clerkUserId,
    email,
    credits: STARTING_CREDITS,
    totalGenerated: 0,
    createdAt: serverTimestamp(),
    // Add these fields to your existing createUserRecord function
    // inside the setDoc call — add alongside existing fields:
    subscription: null, // null = no active subscription
    subscriptionId: null, // Razorpay subscription ID
    subscriptionPlan: null, // "starter" | "pro" | "agency"
    subscriptionStatus: null, // "active" | "cancelled" | "expired"
    subscriptionPeriod: null, // "monthly" | "annual"
    creditsRefreshDate: null, // next credits refresh date (timestamp)
  });
}

/* -------------------------------------------------------
   Get a user's current credit balance.
------------------------------------------------------- */
export async function getUserCredits(clerkUserId: string): Promise<number> {
  const userRef = doc(db, "users", clerkUserId);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return 0;
  return snap.data().credits ?? 0;
}

/* -------------------------------------------------------
   Deduct 1 credit and increment totalGenerated.
   Returns false if the user doesn't have enough credits.
------------------------------------------------------- */
export async function deductCredit(clerkUserId: string): Promise<boolean> {
  return deductCredits(clerkUserId, 1);
}

export async function deductCredits(
  clerkUserId: string,
  amount: number,
): Promise<boolean> {
  const credits = await getUserCredits(clerkUserId);
  if (credits < amount) return false;

  const userRef = doc(db, "users", clerkUserId);
  await updateDoc(userRef, {
    credits: increment(-amount),
    totalGenerated: increment(1),
  });

  return true;
}

/* -------------------------------------------------------
   Save a generated website to Firestore.
   Returns the new document id and shareId.
------------------------------------------------------- */
export async function saveGeneration(
  clerkUserId: string,
  prompt: string,
  layout: any,
  deepHtml: string | null = null,
  thumbnail: string | null = null,
  reactFiles: Record<string, string> | null = null,
): Promise<{ id: string; shareId: string }> {
  const shareId = generateShareId();

  const docRef = await addDoc(collection(db, "generations"), {
    clerkUserId,
    prompt,
    layout: layout ?? null,
    deepHtml: deepHtml ?? null,
    reactFiles: reactFiles ?? null,
    mode: reactFiles ? "react" : (deepHtml ? "deep" : "fast"),
    shareId,
    siteName: deepHtml
      ? extractTitleFromHtml(deepHtml)
      : (reactFiles ? 
          (extractTitleFromHtml(reactFiles['/public/index.html'] || reactFiles['public/index.html'] || reactFiles['/index.html'] || reactFiles['index.html'] || '').replace("Untitled", "") || "React App")
          : (layout?.branding?.logoText ?? "Untitled")),
    themeStyle: reactFiles ? "react-vite" : (deepHtml ? "deep-dive" : (layout?.themeStyle ?? "corporate")),
    thumbnail: thumbnail ?? null,
    createdAt: serverTimestamp(),
  });

  return { id: docRef.id, shareId };
}

// Helper to extract <title> from deep dive HTML for siteName
function extractTitleFromHtml(html: string): string {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  if (!match) return "Untitled";
  // Strip " - Tagline" suffix if present, just keep brand name
  return match[1].split(" - ")[0].split(" | ")[0].trim();
}

/* -------------------------------------------------------
   Get all saved sites for a user, newest first.
------------------------------------------------------- */
export async function getUserGenerations(clerkUserId: string) {
  const q = query(
    collection(db, "generations"),
    where("clerkUserId", "==", clerkUserId),
    orderBy("createdAt", "desc"),
  );

  const snap = await getDocs(q);

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    // Convert Firestore timestamp to ISO string for JSON serialization
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
  }));
}

/* -------------------------------------------------------
   Get a single generation by shareId (public — no auth).
------------------------------------------------------- */
export async function getGenerationByShareId(shareId: string) {
  const q = query(
    collection(db, "generations"),
    where("shareId", "==", shareId),
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  const doc = snap.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
  };
}

/* -------------------------------------------------------
   Delete a generation — only if it belongs to the user.
------------------------------------------------------- */
export async function deleteGeneration(
  docId: string,
  clerkUserId: string,
): Promise<void> {
  const ref = doc(db, "generations", docId);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error("Not found");
  if (snap.data().clerkUserId !== clerkUserId) throw new Error("Unauthorized");

  await deleteDoc(ref);
}

/* -------------------------------------------------------
  Update a generation with new layout and prompt — only if it belongs to the user.
------------------------------------------------------- */

export async function updateGeneration(
  docId: string,
  clerkUserId: string,
  layout: any,
  prompt: string,
  deepHtml: string | null = null,
  thumbnail: string | null = null,
  reactFiles: Record<string, string> | null = null,
): Promise<void> {
  const ref = doc(db, "generations", docId);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error("Not found");
  if (snap.data().clerkUserId !== clerkUserId) throw new Error("Unauthorized");

  await updateDoc(ref, {
    layout: layout ?? null,
    deepHtml: deepHtml ?? null,
    reactFiles: reactFiles ?? null,
    mode: reactFiles ? "react" : (deepHtml ? "deep" : "fast"),
    prompt,
    siteName: deepHtml
      ? extractTitleFromHtml(deepHtml)
      : (reactFiles ? 
          (extractTitleFromHtml(reactFiles['/public/index.html'] || reactFiles['public/index.html'] || reactFiles['/index.html'] || reactFiles['index.html'] || '').replace("Untitled", "") || "React App")
          : (layout?.branding?.logoText ?? "Untitled")),
    themeStyle: reactFiles ? "react-vite" : (deepHtml ? "deep-dive" : (layout?.themeStyle ?? "corporate")),
    thumbnail: thumbnail ?? null,
    updatedAt: serverTimestamp(),
  });
}

// ── Save rating as training data ──
export async function rateGeneration(
  clerkUserId: string,
  rating: "positive" | "negative",
  prompt: string,
  html: string,
  model: string,
  feedback?: string[],
): Promise<string> {
  const docRef = await addDoc(collection(db, "ratings"), {
    clerkUserId,
    rating,
    prompt,
    html,
    model,
    feedback: feedback ?? [],
    createdAt: serverTimestamp(),
  });
  return docRef.id; // return doc ID for future updates
}

export async function updateRating(
  docId: string,
  rating: "positive" | "negative",
  feedback?: string[],
): Promise<void> {
  const ref = doc(db, "ratings", docId);
  await updateDoc(ref, {
    rating,
    feedback: feedback ?? [],
    updatedAt: serverTimestamp(),
  });
}

// ── Subscription helpers ──

export async function getUserSubscription(clerkUserId: string) {
  const userRef = doc(db, "users", clerkUserId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    subscription: data.subscription ?? null,
    subscriptionId: data.subscriptionId ?? null,
    subscriptionPlan: data.subscriptionPlan ?? null,
    subscriptionStatus: data.subscriptionStatus ?? null,
    subscriptionPeriod: data.subscriptionPeriod ?? null,
    creditsRefreshDate: data.creditsRefreshDate ?? null,
    subscriptionEndDate: data.subscriptionEndDate ?? null,
  };
}

export async function activateSubscription(
  clerkUserId: string,
  subscriptionId: string,
  plan: string,
  period: string,
  creditsToAdd: number,
): Promise<void> {
  const userRef = doc(db, "users", clerkUserId);
  const nextRefresh = new Date();
  nextRefresh.setMonth(nextRefresh.getMonth() + 1);

  await updateDoc(userRef, {
    subscriptionId,
    subscriptionPlan: plan,
    subscriptionStatus: "active",
    subscriptionPeriod: period,
    creditsRefreshDate: nextRefresh,
    credits: increment(creditsToAdd),
  });
}

export async function cancelSubscription(
  clerkUserId: string,
  endDate?: Date,
): Promise<void> {
  const userRef = doc(db, "users", clerkUserId);
  await updateDoc(userRef, {
    subscriptionStatus: "cancelled",
    subscriptionEndDate: endDate ?? null,
  });
}
/* -------------------------------------------------------
   Add credits to a user (called after payment).
------------------------------------------------------- */

export async function addCredits(
  clerkUserId: string,
  amount: number,
): Promise<void> {
  const userRef = doc(db, "users", clerkUserId);
  await updateDoc(userRef, {
    credits: increment(amount),
  });
}

export async function saveDeployedUrl(
  docId: string,
  clerkUserId: string,
  deployedUrl: string,
): Promise<void> {
  const ref = doc(db, "generations", docId);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error("Not found");
  if (snap.data().clerkUserId !== clerkUserId) throw new Error("Unauthorized");

  await updateDoc(ref, {
    deployedUrl,
    deployedAt: serverTimestamp(),
  });
}

/* -------------------------------------------------------
   Track API usage per model — called after every LLM call.
   Uses monthly-bucketed documents: apiUsage/YYYY-MM
   Resets automatically each month (new doc = fresh counters).
   Historical data is preserved in apiUsageHistory collection.
------------------------------------------------------- */
export async function trackApiUsage(
  model: string,
  outputTokens: number,
  costUSD: number,
  isGeneration = false, // set true for generate routes (not chat/qa)
): Promise<void> {
  if (!outputTokens || outputTokens <= 0) return;

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const usageRef = doc(db, "apiUsage", monthKey);

  // Sanitize model name for use as a Firestore field key
  const modelKey = model.replace(/\//g, "__");

  const updates: Record<string, any> = {
    totalTokens: increment(outputTokens),
    totalCostUSD: increment(costUSD),
    [`byModel.${modelKey}.tokens`]: increment(outputTokens),
    [`byModel.${modelKey}.costUSD`]: increment(costUSD),
    [`byModel.${modelKey}.calls`]: increment(1),
    updatedAt: serverTimestamp(),
  };
  if (isGeneration) {
    updates.generationsCount = increment(1);
  }

  try {
    await updateDoc(usageRef, updates);
  } catch {
    // Doc doesn't exist yet — create it for this month
    await setDoc(usageRef, {
      monthKey,
      totalTokens: outputTokens,
      totalCostUSD: costUSD,
      generationsCount: isGeneration ? 1 : 0,
      byModel: {
        [modelKey]: { tokens: outputTokens, costUSD, calls: 1 },
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

/* -------------------------------------------------------
   Admin metrics — aggregates all stats for the admin dashboard.
   Only callable server-side (requires Firestore admin access).
------------------------------------------------------- */
export async function getAdminMetrics() {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // 30 days ago threshold for "active" users
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsersSnap,
    allUsersSnap,
    apiUsageSnap,
  ] = await Promise.all([
    getCountFromServer(collection(db, "users")),
    getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"))),
    getDoc(doc(db, "apiUsage", monthKey)),
  ]);

  const totalUsers = totalUsersSnap.data().count;

  // TRUE generation counts — sum totalGenerated from every user doc
  // This includes unsaved generations (deductCredits increments this regardless of save)
  let totalGenerations = 0;
  let activeUsers = 0;
  const planPricesINR: Record<string, { monthly: number; annual: number }> = {
    starter: { monthly: 599, annual: 5990 },
    pro: { monthly: 1499, annual: 14990 },
    agency: { monthly: 3999, annual: 39990 },
  };
  const subscriptionBreakdown: Record<string, { monthly: number; annual: number; total: number }> = {};
  let estimatedMRR = 0;
  let subscribedUsers = 0;

  for (const userDoc of allUsersSnap.docs) {
    const data = userDoc.data();
    totalGenerations += data.totalGenerated ?? 0;
    // Active = has generated at least once
    if ((data.totalGenerated ?? 0) > 0) activeUsers++;

    if (data.subscriptionStatus === "active" && data.subscriptionPlan) {
      const plan = data.subscriptionPlan as string;
      const period = (data.subscriptionPeriod as string) ?? "monthly";
      if (!subscriptionBreakdown[plan]) {
        subscriptionBreakdown[plan] = { monthly: 0, annual: 0, total: 0 };
      }
      subscriptionBreakdown[plan][period as "monthly" | "annual"]++;
      subscriptionBreakdown[plan].total++;
      subscribedUsers++;

      const prices = planPricesINR[plan];
      if (prices) {
        estimatedMRR += period === "annual"
          ? Math.round(prices.annual / 12)
          : prices.monthly;
      }
    }
  }

  // API usage this month
  const apiUsage = apiUsageSnap.exists() ? apiUsageSnap.data() : null;
  const currentMonthTokens = apiUsage?.totalTokens ?? 0;
  const currentMonthCostUSD = apiUsage?.totalCostUSD ?? 0;
  // generationsCount is incremented by trackApiUsage(isGeneration=true) in generate routes
  const totalGenerationsThisMonth = apiUsage?.generationsCount ?? 0;

  // Per-model breakdown — convert sanitized keys back to readable names
  const byModel: Record<string, { tokens: number; costUSD: number; calls: number }> = {};
  if (apiUsage?.byModel) {
    for (const [key, val] of Object.entries(apiUsage.byModel)) {
      const modelName = key.replace(/__/g, "/");
      byModel[modelName] = val as { tokens: number; costUSD: number; calls: number };
    }
  }

  return {
    totalUsers,
    activeUsers,
    subscribedUsers,
    totalGenerations,
    totalGenerationsThisMonth,
    subscriptionBreakdown,
    estimatedMRR,
    currentMonthTokens,
    currentMonthCostUSD,
    byModel,
  };
}
