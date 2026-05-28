import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserSubscription, saveDeployedUrl } from "@/lib/firestore";
import * as esbuild from "esbuild";
import path from "path";
import os from "os";
import fs from "fs/promises";
import crypto from "crypto";

export const maxDuration = 120; // 2 minutes for bundling & deployment

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

  const { files, siteName, generationId } = await req.json();

  if (!files || Object.keys(files).length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  // Create workspace in system temp
  const workDir = path.join(os.tmpdir(), `crawlcube-build-${crypto.randomUUID()}`);
  
  try {
    // 1. Setup Build Workspace
    await fs.mkdir(workDir, { recursive: true });
    
    // Write out all files
    for (const [filepath, content] of Object.entries(files)) {
      if (filepath === "/public/index.html") continue;
      
      let finalContent = content as string;
      if (filepath.endsWith(".css")) {
         // Strip @tailwind directives as they break Tailwind CDN which auto-injects its own base.
         finalContent = finalContent.replace(/@tailwind\s+(base|components|utilities);?/g, "");
      }

      const localPath = filepath.startsWith('/') ? filepath.slice(1) : filepath;
      const fullPath = path.join(workDir, localPath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, finalContent, "utf8");
    }

    // Ensure there is an index.js entrypoint
    const entryPath = path.join(workDir, "index.js");

    const EXTERNAL_PACKAGES = [
      "react", "react-dom", "react-dom/client",
      "react-router-dom", "lucide-react", "recharts",
      "framer-motion", "clsx", "tailwind-merge", "react-intersection-observer"
    ];

    // 2. Build via esbuild
    const buildResult = await esbuild.build({
      entryPoints: [entryPath],
      bundle: true,
      write: false, 
      format: 'esm',
      outdir: "dist",
      loader: { '.js': 'jsx', '.jsx': 'jsx', '.css': 'css' },
      external: EXTERNAL_PACKAGES,
      minify: true,
    });

    if (buildResult.errors.length > 0) {
       console.error("esbuild errors:", buildResult.errors);
       throw new Error("Build compilation failed");
    }

    let bundleBytes: any = new Uint8Array();
    let cssBytes: any = new Uint8Array();

    for (const file of buildResult.outputFiles) {
        if (file.path.endsWith(".js")) bundleBytes = file.contents;
        if (file.path.endsWith(".css")) cssBytes = file.contents;
    }

    const importMap = {
      imports: {
        "react": "https://esm.sh/react@18.2.0",
        "react/": "https://esm.sh/react@18.2.0/",
        "react-dom": "https://esm.sh/react-dom@18.2.0",
        "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
        "react-router-dom": "https://esm.sh/react-router-dom@6.22.3?external=react,react-dom",
        "framer-motion": "https://esm.sh/framer-motion@11.0.8?external=react,react-dom",
        "lucide-react": "https://esm.sh/lucide-react@0.344.0?external=react,react-dom",
        "recharts": "https://esm.sh/recharts@2.12.2?external=react,react-dom",
        "clsx": "https://esm.sh/clsx@2.1.0",
        "tailwind-merge": "https://esm.sh/tailwind-merge@2.2.1",
        "react-intersection-observer": "https://esm.sh/react-intersection-observer@9.8.1?external=react,react-dom"
      }
    };

    let indexHtml = files["/public/index.html"] || `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${siteName || 'React App'}</title></head><body><div id="root"></div></body></html>`;

    if (!indexHtml.includes("cdn.tailwindcss.com")) {
        indexHtml = indexHtml.replace('</head>', `  <script src="https://cdn.tailwindcss.com"></script>\n</head>`);
    }
    if (!indexHtml.includes("daisyui")) {
        indexHtml = indexHtml.replace('</head>', `  <link href="https://cdn.jsdelivr.net/npm/daisyui@latest/dist/full.min.css" rel="stylesheet" type="text/css" />\n</head>`);
    }
    
    if (!indexHtml.includes('type="importmap"')) {
        indexHtml = indexHtml.replace('</head>', `  <script type="importmap">${JSON.stringify(importMap)}</script>\n</head>`);
    }

    if (!indexHtml.includes('<script type="module" src="/bundle.js"></script>')) {
        indexHtml = indexHtml.replace('</body>', '  <script type="module" src="/bundle.js"></script>\n  </body>');
    }

    if (cssBytes.length > 0 && !indexHtml.includes('href="/bundle.css"')) {
        indexHtml = indexHtml.replace('</head>', '  <link rel="stylesheet" href="/bundle.css">\n</head>');
    }

    if (!indexHtml.includes("font-smoothing")) {
        indexHtml = indexHtml.replace('</head>', '  <style>body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }</style>\n</head>');
    }

    const encoder = new TextEncoder();
    const htmlBytes = encoder.encode(indexHtml);

    // 4. Deploy to Netlify
    // Step 4a: Create site
    // Step 4a: Create site
    const siteRes = await fetch("https://api.netlify.com/api/v1/sites", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: slugify(siteName ?? "crawlcube-react"),
      }),
    });

    if (!siteRes.ok) throw new Error("Failed to create Netlify site");
    const site = await siteRes.json();
    const siteId = site.id;

    // Step 4b: Calculate SHA1
    const bundleHash = crypto.createHash('sha1').update(bundleBytes).digest('hex');
    const htmlHash = crypto.createHash('sha1').update(htmlBytes).digest('hex');
    
    // Support React Router SPA behavior
    const redirectsBytes = encoder.encode("/*    /index.html   200");
    const redirectsHash = crypto.createHash('sha1').update(redirectsBytes).digest('hex');
    
    const mappedFiles: Record<string, string> = {
        "/index.html": htmlHash,
        "/bundle.js": bundleHash,
        "/_redirects": redirectsHash
    };
    
    if (cssBytes.length > 0) {
        mappedFiles["/bundle.css"] = crypto.createHash('sha1').update(cssBytes).digest('hex');
    }

    const deployRes = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: mappedFiles,
          draft: false,
        }),
      },
    );

    if (!deployRes.ok) throw new Error("Failed to create deploy digest");
    const deploy = await deployRes.json();
    const deployId = deploy.id;

    // Upload files that Netlify requested
    const requiredFiles = deploy.required || [];

    const uploadFile = async (filepath: string, bytes: Uint8Array) => {
        const uploadRes = await fetch(
            `https://api.netlify.com/api/v1/deploys/${deployId}/files${filepath}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
                "Content-Type": "application/octet-stream",
              },
              body: Buffer.from(bytes),
            },
        );
        if (!uploadRes.ok) throw new Error(`Failed to upload ${filepath}`);
    };

    if (requiredFiles.includes(htmlHash)) await uploadFile("/index.html", htmlBytes);
    if (requiredFiles.includes(bundleHash)) await uploadFile("/bundle.js", bundleBytes);
    if (requiredFiles.includes(redirectsHash)) await uploadFile("/_redirects", redirectsBytes);
    if (cssBytes.length > 0 && requiredFiles.includes(mappedFiles["/bundle.css"])) await uploadFile("/bundle.css", cssBytes);

    // Step 4c: Wait for Readiness
    let deployedUrl = `https://${site.subdomain}.netlify.app`;
    let attempts = 0;

    while (attempts < 15) {
      await new Promise((r) => setTimeout(r, 2000));
      const statusRes = await fetch(
        `https://api.netlify.com/api/v1/deploys/${deployId}`,
        {
          headers: { Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}` },
        },
      );
      const status = await statusRes.json();
      if (status.state === "ready") {
        deployedUrl = `https://${status.ssl_url?.replace("https://", "") ?? site.subdomain + ".netlify.app"}`;
        break;
      }
      if (status.state === "error") throw new Error("Netlify deploy failed");
      attempts++;
    }

    if (generationId) {
      await saveDeployedUrl(generationId, userId, deployedUrl);
    }

    return NextResponse.json({ success: true, url: deployedUrl });
  } catch (err: any) {
    console.error("[Netlify React] Deploy error:", err);
    return NextResponse.json(
      { error: err.message ?? "Deploy failed" },
      { status: 500 },
    );
  } finally {
     await fs.rm(workDir, { recursive: true, force: true }).catch(console.error);
  }
}

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
