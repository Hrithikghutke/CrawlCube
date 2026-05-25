import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await updateDoc(doc(db, "users", userId), {
    netlifyAccessToken: null,
    netlifyConnectedAt: null,
  });

  return NextResponse.json({ success: true });
}
