import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, Timestamp } from "firebase/firestore";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const clerkUserId = searchParams.get("state"); // the userId we passed earlier

  // Validate we have what we need
  if (!code || !clerkUserId) {
    return NextResponse.redirect(
      new URL("/dashboard?netlify=error", request.url),
    );
  }

  try {
    // Step 1: Exchange the code for an access_token
    const tokenResponse = await fetch("https://api.netlify.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.NETLIFY_OAUTH_CLIENT_ID!,
        client_secret: process.env.NETLIFY_OAUTH_CLIENT_SECRET!,
        redirect_uri: process.env.NETLIFY_OAUTH_REDIRECT_URI!,
      }),
    });

    if (!tokenResponse.ok) {
      console.error(
        "Netlify token exchange failed:",
        await tokenResponse.text(),
      );
      return NextResponse.redirect(
        new URL("/dashboard?netlify=error", request.url),
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Step 2: Save the token to Firestore
    const userRef = doc(db, "users", clerkUserId);
    await updateDoc(userRef, {
      netlifyAccessToken: accessToken,
      netlifyConnectedAt: Timestamp.now(),
    });

    // Step 3: Redirect back to dashboard with success flag
    // The frontend will read ?netlify=connected and auto-trigger the deploy
    return NextResponse.redirect(
      new URL("/dashboard?netlify=connected", request.url),
    );
  } catch (error) {
    console.error("Netlify OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard?netlify=error", request.url),
    );
  }
}
