import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userDoc = await getDoc(doc(db, "users", userId));
  const userData = userDoc.data();

  if (!userData?.netlifyAccessToken) {
    return NextResponse.json({ connected: false });
  }

  // Optionally fetch their Netlify email to display in UI
  try {
    const netlifyUser = await fetch("https://api.netlify.com/api/v1/user", {
      headers: {
        Authorization: `Bearer ${userData.netlifyAccessToken}`,
      },
    });
    const netlifyUserData = await netlifyUser.json();

    return NextResponse.json({
      connected: true,
      email: netlifyUserData.email ?? null,
    });
  } catch {
    // Token might be expired — still report connected, deploy will fail gracefully
    return NextResponse.json({ connected: true, email: null });
  }
}
