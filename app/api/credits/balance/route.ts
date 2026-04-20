import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserCredits, createUserRecord } from "@/lib/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fallback sync: if webhook was missed (especially common on localhost),
    // ensure the user record exists before returning credits
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      const user = await currentUser();
      const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
      await createUserRecord(userId, email);
    }
  } catch (error) {
    console.warn("Fallback user sync failed:", error);
  }

  const credits = await getUserCredits(userId);
  return NextResponse.json({ credits });
}
