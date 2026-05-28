import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserSubscription, saveDeployedUrl } from "@/lib/firestore";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Subscribers only
  const sub = await getUserSubscription(userId);
  const now = new Date();
  const endDate = sub?.subscriptionEndDate
    ? new Date(sub.subscriptionEndDate.seconds * 1000)
    : null;
  const isSubscribed =
    sub?.subscriptionStatus === "active" ||
    (sub?.subscriptionStatus === "cancelled" && endDate && endDate > now);

  if (!isSubscribed) {
    return NextResponse.json(
      {
        error: "SUBSCRIPTION_REQUIRED",
        message: "Deploy is available for subscribers only.",
      },
      { status: 403 },
    );
  }

  const { html, siteName, generationId } = await req.json();

  if (!html) {
    return NextResponse.json({ error: "No HTML provided" }, { status: 400 });
  }

  try {
    // ── Step 1: Create a new Netlify site ──
    const siteRes = await fetch("https://api.netlify.com/api/v1/sites", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: slugify(siteName ?? "crawlcube-site"),
      }),
    });

    if (!siteRes.ok) {
      const err = await siteRes.json();
      console.error("[Netlify] Site creation failed:", err);
      throw new Error("Failed to create Netlify site");
    }

    const site = await siteRes.json();
    const siteId = site.id;

    // ── Step 2: Deploy HTML as a file digest ──
    // Netlify expects files as a zip or via their Files API
    // We use the deploy files API — send a digest first, then upload
    const encoder = new TextEncoder();
    const htmlBytes = encoder.encode(html);

    // Calculate SHA1 of the HTML for Netlify's digest
    const hashBuffer = await crypto.subtle.digest("SHA-1", htmlBytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sha1 = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // Create deploy with file digest
    const deployRes = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: { "/index.html": sha1 },
          draft: false,
        }),
      },
    );

    if (!deployRes.ok) {
      const err = await deployRes.json();
      console.error("[Netlify] Deploy creation failed:", err);
      throw new Error("Failed to create deploy");
    }

    const deploy = await deployRes.json();
    const deployId = deploy.id;

    // ── Step 3: Upload the actual HTML file ──
    const uploadRes = await fetch(
      `https://api.netlify.com/api/v1/deploys/${deployId}/files/index.html`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
          "Content-Type": "application/octet-stream",
        },
        body: htmlBytes,
      },
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.json();
      console.error("[Netlify] File upload failed:", err);
      throw new Error("Failed to upload HTML");
    }

    // ── Step 4: Poll until deploy is ready (max 30s) ──
    let deployedUrl = `https://${site.subdomain}.netlify.app`;
    let attempts = 0;

    while (attempts < 15) {
      await new Promise((r) => setTimeout(r, 2000));
      const statusRes = await fetch(
        `https://api.netlify.com/api/v1/deploys/${deployId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
          },
        },
      );
      const status = await statusRes.json();
      console.log(
        `[Netlify] Deploy status: ${status.state} (attempt ${attempts + 1})`,
      );

      if (status.state === "ready") {
        deployedUrl = `https://${status.ssl_url?.replace("https://", "") ?? site.subdomain + ".netlify.app"}`;
        break;
      }
      if (status.state === "error") {
        throw new Error("Netlify deploy failed");
      }
      attempts++;
    }

    // ── Step 5: Save URL to Firestore if generationId provided ──
    if (generationId) {
      await saveDeployedUrl(generationId, userId, deployedUrl);
    }

    console.log(`[Netlify] Deployed successfully: ${deployedUrl}`);
    return NextResponse.json({ success: true, url: deployedUrl });
  } catch (err: any) {
    console.error("[Netlify] Deploy error:", err);
    return NextResponse.json(
      { error: err.message ?? "Deploy failed" },
      { status: 500 },
    );
  }
}

// ── Convert site name to a valid Netlify subdomain ──
function slugify(name: string): string {
  return (
    "crawlcube-" +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30) +
    "-" +
    Math.random().toString(36).slice(2, 7)
  );
}
