import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.NETLIFY_OAUTH_CLIENT_ID!;
  const redirectUri = process.env.NETLIFY_OAUTH_REDIRECT_URI!;

  // We pass the clerkUserId as 'state' so we know who to save the token for
  // when Netlify redirects back to us
  const authUrl = new URL("https://app.netlify.com/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", userId); // clerkUserId as state

  return NextResponse.redirect(authUrl.toString());
}
