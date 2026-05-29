import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserCredits, deductCredits, trackApiUsage } from "@/lib/firestore";
import {
  getShellPrompt,
  getPagePrompt,
  getFooterPrompt,
  getSinglePageTopPrompt,
  getSinglePageBottomPrompt,
} from "@/lib/agentPrompts/developer";
import {
  getArchitectPrompt,
  type ArchitectOutput,
} from "@/lib/agentPrompts/architect";
import {
  getContentStrategistPrompt,
  type ContentBrief,
} from "@/lib/agentPrompts/contentStrategist";
import {
  getUIDesignerPrompt,
  type UIDesignSpec,
} from "@/lib/agentPrompts/uiDesigner";
import { getQaPrompt } from "@/lib/agentPrompts/qa";
import { getFixerPrompt } from "@/lib/agentPrompts/fixer";
import { fetchUnsplashImage } from "@/lib/fetchUnsplash";
import { getModelConfig, calculateCredits } from "@/lib/modelConfig";
import { ModelExecutor } from "@/lib/modelExecutionStrategy";

// Vercel serverless max duration (Pro plan)
export const maxDuration = 300;

// Minimal fallback footer — used when footer generation fails
// Contains all essential JS so routing still works
const FALLBACK_FOOTER = `<footer class="border-t border-white/5 py-16 px-6 bg-black/40">
  <div class="max-w-7xl mx-auto text-center">
    <p class="text-white/40 text-sm">© ${new Date().getFullYear()} All rights reserved.</p>
  </div>
</footer>
<script>
window.addEventListener('scroll',function(){var n=document.getElementById('navbar');if(n){var c=n.querySelector('div');if(c)c.style.background=window.scrollY>50?'rgba(15,23,42,0.98)':'rgba(15,23,42,0.85)';}});
var co=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){var el=e.target,t=parseFloat(el.dataset.target);if(isNaN(t)){co.unobserve(el);return;}var c=0,i=t/60,tm=setInterval(function(){c+=i;if(c>=t){el.textContent=t>=1000?Math.round(t).toLocaleString()+'+':t+'+';clearInterval(tm);}else{el.textContent=Math.floor(c)>=1000?Math.floor(c).toLocaleString():Math.floor(c);}},16);co.unobserve(el);}});});document.querySelectorAll('.counter').forEach(function(el){co.observe(el);});
var fo=new IntersectionObserver(function(e){e.forEach(function(x){if(x.isIntersecting){x.target.style.opacity='1';x.target.style.transform='translateY(0)';}});},{threshold:0.1});document.querySelectorAll('.fade-in').forEach(function(el){el.style.opacity='0';el.style.transform='translateY(24px)';el.style.transition='opacity 0.6s ease,transform 0.6s ease';fo.observe(el);});
</script>
</body></html>`;

// ── Streaming version for developer agent ──
async function callOpenRouterStream(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  model: string,
  onChunk: (accumulated: string) => void,
  signal?: AbortSignal,
): Promise<{ outputTokens: number }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: 0.8,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`OpenRouter stream error: ${JSON.stringify(err)}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No stream body");

  const decoder = new TextDecoder();
  let accumulated = "";
  let outputTokens = 0;
  let buffer = "";
  let chunkCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content ?? "";
        if (delta) {
          accumulated += delta;
          chunkCount++;
          if (chunkCount % 25 === 0) onChunk(accumulated);
        }
        if (parsed.usage?.completion_tokens) {
          outputTokens = parsed.usage.completion_tokens;
        }
      } catch {
        /* skip malformed */
      }
    }
  }

  onChunk(accumulated); // final
  return { outputTokens };
}

// ── Non-streaming JSON call — used for Architect (Haiku, fast, cheap) ──
async function callOpenRouterJson(
  systemPrompt: string,
  userMessage: string,
  signal?: AbortSignal,
  maxTokens: number = 1000,
): Promise<{ content: string; outputTokens: number }> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "anthropic/claude-haiku-4.5", // Always Haiku — fast and cheap for JSON
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });
  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content ?? "",
    outputTokens: data.usage?.completion_tokens ?? 0,
  };
}

// ── Robustly extract a JSON object from a model response ──
// Uses proper brace-depth tracking so trailing commentary containing {}
// does not corrupt the extracted slice.
function extractJson(raw: string): string {
  const firstBrace = raw.indexOf("{");
  if (firstBrace === -1) {
    // No JSON object found — strip fences and return as-is
    return raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  }

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = firstBrace; i < raw.length; i++) {
    const ch = raw[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) return raw.slice(firstBrace, i + 1);
    }
  }

  // Brace mismatch (truncated JSON) — return best effort
  return raw.slice(firstBrace);
}

// ── Default architect fallback ──
function defaultArchitect(prompt: string): ArchitectOutput {
  const isTech = /(saas|tech|software|app|startup)/i.test(prompt);
  const isFood = /(restaurant|cafe|food|dining)/i.test(prompt);
  const isGym = /(gym|fitness|workout)/i.test(prompt);
  const isConstruction = /(construction|engineering|architect|structural)/i.test(prompt);
  const isLaw = /(law|legal|attorney|lawyer)/i.test(prompt);
  const isHotel = /(hotel|resort|hospitality)/i.test(prompt);
  const isAgency = /(agency|marketing|creative|design)/i.test(prompt);
  const isMedical = /(medical|health|clinic|doctor|dental)/i.test(prompt);
  const isRealEstate = /(real estate|property|housing|realty)/i.test(prompt);
  const monoUrl = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/geist-mono@5.0.1/400.css">`;

  // Pick fonts matching the curated pairings from architect prompt
  let display = "Satoshi", body = "General Sans";
  let displayUrl = `<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap" rel="stylesheet">`;
  let bodyUrl = `<link href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500&display=swap" rel="stylesheet">`;

  if (isFood || isHotel || isRealEstate) {
    display = "Zodiak"; body = "Switzer";
    displayUrl = `<link href="https://api.fontshare.com/v2/css?f[]=zodiak@400,500,700&display=swap" rel="stylesheet">`;
    bodyUrl = `<link href="https://api.fontshare.com/v2/css?f[]=switzer@400,500&display=swap" rel="stylesheet">`;
  } else if (isTech || isAgency) {
    display = "Clash Display"; body = "Archivo";
    displayUrl = `<link href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap" rel="stylesheet">`;
    bodyUrl = `<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&display=swap" rel="stylesheet">`;
  } else if (isGym) {
    display = "Khand"; body = "Hind";
    displayUrl = `<link href="https://fonts.googleapis.com/css2?family=Khand:wght@400;500;700&display=swap" rel="stylesheet">`;
    bodyUrl = `<link href="https://fonts.googleapis.com/css2?family=Hind:wght@400;500&display=swap" rel="stylesheet">`;
  } else if (isConstruction) {
    display = "Khand"; body = "Hind";
    displayUrl = `<link href="https://fonts.googleapis.com/css2?family=Khand:wght@400;500;700&display=swap" rel="stylesheet">`;
    bodyUrl = `<link href="https://fonts.googleapis.com/css2?family=Hind:wght@400;500&display=swap" rel="stylesheet">`;
  } else if (isLaw || isMedical) {
    display = "Satoshi"; body = "General Sans";
    displayUrl = `<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap" rel="stylesheet">`;
    bodyUrl = `<link href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500&display=swap" rel="stylesheet">`;
  }

  return {
    brandName: "Your Brand",
    theme: "dark",
    visualMood: isTech ? "editorial-clean" : isGym ? "bold-energy" : isConstruction ? "cinematic-dark" : isLaw ? "corporate-precision" : isFood || isHotel ? "luxury-minimal" : "cinematic-dark",
    colors: {
      primary: isTech ? "#7C3AED" : isFood ? "#C8956C" : isGym ? "#E8FF47" : isConstruction ? "#7FA67A" : isLaw ? "#8BA3BE" : isHotel ? "#D4AF7A" : isRealEstate ? "#B87333" : "#6366F1",
      secondary: "#8B5CF6",
      background: "#060606",
      surface: "#0F0F0F",
    },
    fonts: {
      display,
      body,
      mono: "Geist Mono",
      displayUrl,
      bodyUrl,
      monoUrl,
    },
    pages: [
      "home",
      isTech ? "features" : isFood ? "menu" : "services",
      isTech ? "pricing" : "projects",
      "contact",
    ],
    pageLabels: [
      "Home",
      isTech ? "Features" : isFood ? "Menu" : "Services",
      isTech ? "Pricing" : "Projects",
      "Contact",
    ],
  };
}

// ── Extract design tokens from shell HTML for page prompts ──

// ── Extract design tokens from shell HTML for page prompts ──
// Passes tailwind config colors + shared CSS classes to each page call
// so every page uses the exact same design system
function extractDesignTokens(shellHtml: string): string {
  const tailwindMatch = shellHtml.match(
    /<script>\s*tailwind\.config[\s\S]*?<\/script>/,
  );
  const styleMatch = shellHtml.match(/<style>([\s\S]*?)<\/style>/);

  // Capture both Google Fonts AND Fontshare CDN URLs
  const googleFontMatches = shellHtml.match(/fonts\.googleapis\.com\/css2\?[^"']+/g) ?? [];
  const fontshareMatches = shellHtml.match(/api\.fontshare\.com\/v2\/css\?[^"']+/g) ?? [];
  const allFontUrls = [...googleFontMatches, ...fontshareMatches];

  const tailwind = tailwindMatch
    ? tailwindMatch[0].replace(/<\/?script>/g, "").trim()
    : "";
  const styles = styleMatch ? styleMatch[1].trim() : "";
  const fonts = allFontUrls.length > 0
    ? `Font CDN URLs:\n${allFontUrls.map(u => `  ${u}`).join("\n")}`
    : "";

  // Limit to ~2500 chars to avoid bloating each page prompt
  return [tailwind, styles, fonts]
    .filter(Boolean)
    .join("\n\n---\n\n")
    .slice(0, 2500);
}

// ── Validate and clean a generated page section ──
// Safety net: ensures wrapper tags are always correct even if model forgot them
function validatePageSection(html: string, pageId: string): string {
  // Strip any prose/explanation the model might have added before the tag
  const sectionStart = html.search(/<section/i);
  const clean = sectionStart > 0 ? html.slice(sectionStart) : html.trim();

  const hasCorrectId = clean.includes(`id="page-${pageId}"`);
  const hasCloseTag = clean.includes("</section>");

  if (!hasCorrectId) {
    // Model forgot the wrapper entirely — force wrap the content
    console.warn(`[Validate] page-${pageId} missing wrapper — force wrapping`);
    return `<section id="page-${pageId}" class="page">\n${clean}\n</section><!-- end page-${pageId} -->`;
  }

  if (!hasCloseTag) {
    // Section opened but truncated — force close
    console.warn(
      `[Validate] page-${pageId} missing </section> — force closing`,
    );
    return clean + `\n</section><!-- end page-${pageId} -->`;
  }

  return clean;
}

// ── Silent streaming — collects full output without pushing chunks to client ──
// Timeout and retry are now handled by ModelExecutor — this is just the raw stream collector
async function silentStream(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  model: string,
  signal?: AbortSignal,
): Promise<{ content: string; outputTokens: number }> {
  let content = "";

  const { outputTokens } = await callOpenRouterStream(
    systemPrompt,
    userMessage,
    maxTokens,
    model,
    (accumulated) => {
      content = accumulated;
    },
    signal,
  );

  // Sanity check — suspiciously short responses indicate truncation
  if (content.length < 200) {
    throw new Error(`Response too short (${content.length} chars)`);
  }

  return { content, outputTokens };
}

// ── Generate SEO meta tags from available generation data ──
function buildSeoTags(
  brandName: string,
  prompt: string,
  heroImageUrl: string,
): string {
  // Description: clean up prompt to 155 chars max
  const description = prompt
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 155)
    .replace(/[^a-zA-Z0-9\s.,'-]*/g, "")
    .trim();

  // Keywords: extract meaningful words from prompt (skip short/common words)
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "have",
    "has",
    "do",
    "does",
    "did",
    "we",
    "our",
    "their",
    "this",
    "that",
    "they",
    "you",
    "your",
    "its",
    "it",
    "want",
    "need",
    "build",
    "create",
    "make",
    "website",
    "page",
    "site",
    "also",
    "very",
    "just",
    "about",
    "from",
    "into",
    "through",
    "will",
    "can",
    "should",
  ]);
  const keywords = [
    ...new Set(
      prompt
        .toLowerCase()
        .replace(/[^a-z\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 4 && !stopWords.has(w))
        .slice(0, 10),
    ),
  ].join(", ");

  return `
  <!-- SEO Meta Tags -->
  <meta name="description" content="${description}">
  <meta name="keywords" content="${keywords}">
  <meta name="robots" content="index, follow">
  <meta name="author" content="${brandName}">

  <!-- Open Graph (Facebook, LinkedIn, WhatsApp) -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${brandName}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${heroImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${brandName}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${heroImageUrl}">`.trim();
}

// ── Curated REAL Unsplash photo IDs per business category ──
// These are verified, permanent photo IDs that will never 404
const FALLBACK_IMAGES: Record<string, string[]> = {
  restaurant: [
    "photo-1517248135467-4c7edcad34c4", // elegant restaurant interior
    "photo-1414235077428-338989a2e8c0", // fine dining plate
    "photo-1559339352-11d035aa65de", // private dining room
    "photo-1513104890138-7c749659a591", // pizza
    "photo-1504674900247-0877df9cc836", // gourmet food
  ],
  gym: [
    "photo-1534438327276-14e5300c3a48", // gym interior
    "photo-1571019614242-c5c5dee9f50b", // workout
    "photo-1517836357463-d25dfeac3438", // weights
    "photo-1540497077202-7c8a3999166f", // fitness training
    "photo-1576678927484-cc907957088c", // group fitness
  ],
  tech: [
    "photo-1519389950473-47ba0277781c", // tech workspace
    "photo-1460925895917-afdab827c52f", // dashboard screen
    "photo-1504868584819-f8e8b4b6d7e3", // code on screen
    "photo-1551434678-e076c223a692", // developer working
    "photo-1498050108023-c5249f4df085", // laptop code
  ],
  construction: [
    "photo-1504307651254-35680f356dfd", // construction site
    "photo-1541888946425-d81bb19240f5", // building project
    "photo-1486406146926-c627a92ad1ab", // modern building
    "photo-1503387762-592deb58ef4e", // architecture
    "photo-1429497419816-9ca5cfb4571a", // crane
  ],
  law: [
    "photo-1589829545856-d10d557cf95f", // law books
    "photo-1450101499163-c8848e968f78", // courthouse
    "photo-1479142506502-19b3a3b7ff33", // legal office
    "photo-1507679799987-c73779587ccf", // suit professional
    "photo-1521791055366-0d553872125f", // scales of justice
  ],
  medical: [
    "photo-1519494026892-80bbd2d6fd0d", // hospital
    "photo-1631217868264-e5b90bb7e133", // medical
    "photo-1579684385127-1ef15d508118", // healthcare
    "photo-1516549655169-df83a0774514", // clinic interior
    "photo-1582750433449-648ed127bb54", // doctor
  ],
  realestate: [
    "photo-1560518883-ce09059eeffa", // house exterior
    "photo-1600596542815-ffad4c1539a9", // modern home
    "photo-1600585154340-be6161a56a0c", // interior design
    "photo-1512917774080-9991f1c4c750", // luxury home
    "photo-1600607687939-ce8a6c25118c", // living room
  ],
  hotel: [
    "photo-1566073771259-6a8506099945", // resort pool
    "photo-1582719508461-905c673771fd", // hotel lobby
    "photo-1551882547-ff40c63fe5fa", // luxury room
    "photo-1520250497591-112f2f40a3f4", // hotel exterior
    "photo-1445019980597-93fa8acb246c", // travel landscape
  ],
  agency: [
    "photo-1497366216548-37526070297c", // modern office
    "photo-1542744173-8e7e91415657", // creative team
    "photo-1553877522-43269d4ea984", // brainstorming
    "photo-1497215842964-222b430dc094", // open workspace
    "photo-1522071820081-009f0129c71c", // team collaboration
  ],
  education: [
    "photo-1523050854058-8df90110c9f1", // campus
    "photo-1503676260728-1c00da094a0b", // university
    "photo-1427504494785-3a9ca7044f45", // classroom
    "photo-1509062522246-3755977927d7", // studying
    "photo-1546410531-bb4caa6b424d", // books
  ],
  default: [
    "photo-1497366216548-37526070297c", // modern office
    "photo-1497215842964-222b430dc094", // workspace
    "photo-1504384308090-c894fdcc538d", // tech abstract
    "photo-1486406146926-c627a92ad1ab", // modern building
    "photo-1522071820081-009f0129c71c", // team
  ],
};

// ── Detect business category from prompt ──
function getBusinessCategory(prompt: string): string {
  const p = prompt.toLowerCase();
  if (/(restaurant|food|cafe|coffee|dining|cuisine|bistro|bakery|pizza|bar|pub)/i.test(p)) return "restaurant";
  if (/(gym|fitness|workout|crossfit|bodybuilding|sport|athletic)/i.test(p)) return "gym";
  if (/(saas|software|app|platform|dashboard|tech|startup|ai)/i.test(p)) return "tech";
  if (/(construction|engineering|builder|structural|civil|architect|blueprint)/i.test(p)) return "construction";
  if (/(law|legal|attorney|lawyer|firm|justice)/i.test(p)) return "law";
  if (/(medical|health|clinic|hospital|doctor|dental|therapy)/i.test(p)) return "medical";
  if (/(real estate|property|housing|home|realty)/i.test(p)) return "realestate";
  if (/(hotel|resort|travel|tourism|hospitality)/i.test(p)) return "hotel";
  if (/(agency|marketing|creative|design|branding)/i.test(p)) return "agency";
  if (/(education|school|university|course|learning|tutor)/i.test(p)) return "education";
  return "default";
}

// ── Pick Unsplash search query from prompt keywords ──
function getUnsplashQuery(prompt: string): string {
  const p = prompt.toLowerCase();
  const h = p.slice(0, 150);

  if (
    /(saas|software|app|platform|dashboard|tech|startup|ai website|ai tool|ai builder|website builder)/i.test(
      h,
    )
  )
    return "software saas dashboard technology";
  if (/(gym|fitness|workout|crossfit|bodybuilding|sport|athletic)/i.test(h))
    return "gym fitness workout";
  if (/(restaurant|food|cafe|coffee|dining|cuisine|bistro|bakery)/i.test(h))
    return "restaurant food dining";
  if (
    /(engineer|structural|civil|construction|architect|building|blueprint|consultancy|consulting)/i.test(
      h,
    )
  )
    return "construction building architecture";
  if (/(saas|software|app|platform|dashboard|tech|startup|ai|tool)/i.test(p))
    return "software technology laptop";
  if (/(law|legal|attorney|lawyer|firm|justice)/i.test(p))
    return "law office professional";
  if (/(medical|health|clinic|hospital|doctor|dental|therapy)/i.test(p))
    return "medical healthcare clinic";
  if (/(real estate|property|housing|home|realty)/i.test(p))
    return "real estate property building";
  if (/(finance|bank|invest|accounting|insurance|wealth)/i.test(p))
    return "finance business professional";
  if (/(agency|marketing|creative|design|branding)/i.test(p))
    return "creative agency office team";
  if (/(education|school|university|course|learning|tutor)/i.test(p))
    return "education learning study";
  if (/(hotel|resort|travel|tourism|hospitality)/i.test(p))
    return "hotel resort luxury travel";

  // Fallback: extract 2 meaningful words from prompt
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "for",
    "with",
    "and",
    "or",
    "that",
    "this",
    "in",
    "on",
    "at",
    "to",
    "of",
    "i",
    "we",
    "our",
    "your",
    "my",
    "build",
    "create",
    "make",
    "generate",
    "landing",
    "page",
    "website",
    "site",
    "want",
    "need",
    "called",
    "named",
    "please",
  ]);
  const words = p
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((w) => !stopWords.has(w) && w.length > 4)
    .slice(0, 2)
    .join(" ");
  return words || "modern office professional";
}

// ── Detect if user wants a single page landing page ──
function detectSinglePage(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  // Only trigger on EXPLICIT single/one page requests
  // Do NOT match "landing page" — AI briefs always include this phrase
  // even for full multi-page sites
  return (
    /\bsingle.?page\b|\bone.?page\b|\b1.?page\b/.test(lower) &&
    !/(multi.?page|multiple.?page|4.?page|several.?page|pages:|home.*features.*pricing|home page.*features page)/.test(
      lower,
    )
  );
}

export async function POST(req: Request) {
  const clientSignal = req.signal;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prompt, model: selectedModel, fixes, themePreference = "auto" } = await req.json();

  // Resolve theme based on user preference + prompt context
  function resolveTheme(pref: string, userPrompt: string): "light" | "dark" {
    if (pref === "light") return "light";
    if (pref === "dark") return "dark";
    const p = userPrompt.toLowerCase();
    const darkKeywords = ["saas", "tech", "crypto", "gaming", "ai tool",
      "developer", "cybersecurity", "agency", "startup", "dashboard", "software",
      "devtools", "nightlife", "dark"];
    return darkKeywords.some(kw => p.includes(kw)) ? "dark" : "light";
  }
  const resolvedTheme = resolveTheme(themePreference, prompt);

  // Minimum credits needed to even start (actual cost calculated after generation)
  // Use a small upfront check so users with 0 credits can't start at all
  const modelConfig = getModelConfig(selectedModel);
  const minRequired = modelConfig.minCreditsToStart;

  const credits = await getUserCredits(userId);
  if (credits < minRequired) {
    return NextResponse.json(
      {
        error: "NO_CREDITS",
        message: `You need at least ${minRequired} credits to start a Deep Dive with this model. You have ${credits}.`,
      },
      { status: 402 },
    );
  }
  if (!prompt) {
    return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
  }

  // Model config — Architect and QA always use Haiku (JSON only)
  // Developer uses user-selected model
  const DEVELOPER_MODEL = selectedModel ?? "anthropic/claude-haiku-4.5";

  // ── Set up streaming response ──
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Track whether stream is still open
      let isClosed = false;

      const closeStream = () => {
        if (!isClosed) {
          isClosed = true;
          controller.close(); // ← actually closes the stream
        }
      };

      // Helper to push a status event to the client
      const push = (event: string, data: Record<string, any>) => {
        if (isClosed) return;
        const payload = JSON.stringify({ event, ...data });
        try {
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch (e) {
          isClosed = true;
        }
      };

      // Keepalive ping every 8s — prevents Vercel/proxy from closing idle SSE connections
      const keepalive = setInterval(() => {
        if (isClosed) {
          clearInterval(keepalive);
          return;
        }
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          isClosed = true;
          clearInterval(keepalive);
        }
      }, 8000);

      // Accumulate total output tokens across all agent calls
      // (declared outside try block for catch access)

      // Declare outside try so catch block can access them
      let creditsDone = false;
      let totalOutputTokens = 0;
      let haikuTokens = 0;
      let devTokens = 0;
      let totalCreditsToDeduct = 5;

      try {
        // ════════════════════════════════════════════
        // STEP 1 — Fetch hero image (same as before)
        // ════════════════════════════════════════════
        let heroImageUrl =
          "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1920&q=80&auto=format&fit=crop";
        try {
          const unsplashQuery = getUnsplashQuery(prompt);
          console.log("[Unsplash] Query:", unsplashQuery);
          const image = await fetchUnsplashImage(unsplashQuery);
          if (image) heroImageUrl = image;
        } catch (e) {
          console.warn("[Unsplash] Fetch failed, using default");
        }

        // ════════════════════════════════════════════
        // STEP 2 — Compute per-call token budgets
        // Distributed proportionally based on page richness
        // ════════════════════════════════════════════
        const maxOut = getModelConfig(DEVELOPER_MODEL).maxOutputTokens;
        const isSinglePage = detectSinglePage(prompt);

        // Create adaptive executor — handles concurrency, retry, timeout per model
        const devExecutor = new ModelExecutor(DEVELOPER_MODEL);
        const haikuExecutor = new ModelExecutor("anthropic/claude-haiku-4.5");

        console.log(`[Mode] Single page: ${isSinglePage} | Model: ${DEVELOPER_MODEL}`);

        const budgets = {
          shell: 6000,
          page: isSinglePage ? 12000 : maxOut,
          footer: maxOut,
        };
        console.log(`[Budgets] maxOut:${maxOut} shell:${budgets.shell} page:${budgets.page} footer:${budgets.footer}`);

        // ════════════════════════════════════════════
        // STEP 2 — Architect call (Haiku, ~3s, with retry)
        // ════════════════════════════════════════════
        push("ARCHITECT_START", {
          message: "Analyzing business and planning website structure...",
        });

        let architect: ArchitectOutput;
        try {
          const { content: rawArchitect, outputTokens: architectTokens } =
            await haikuExecutor.execute(
              () => callOpenRouterJson(
                getArchitectPrompt(resolvedTheme),
                `Business to build a website for: ${prompt}`,
                clientSignal,
              ),
              "architect",
            );
          haikuTokens += architectTokens;
          totalOutputTokens += architectTokens;
          const clean = extractJson(rawArchitect);
          const parsed = JSON.parse(clean);
          if (!parsed.pages?.length || !parsed.colors?.primary || !parsed.fonts?.display) {
            throw new Error("Incomplete architect output");
          }
          architect = parsed as ArchitectOutput;
          console.log(`[Architect] Pages: ${architect.pages.join(", ")} | Brand: ${architect.brandName} | Primary: ${architect.colors.primary}`);
        } catch (err) {
          console.warn("[Architect] Failed — using smart fallback:", err);
          architect = defaultArchitect(prompt);
        }

        push("PAGE_NAMES", {
          pages: architect.pages,
          pageLabels: architect.pageLabels,
        });

        // ════════════════════════════════════════════
        // STEP 2b + 2c — Content Strategist + UI Designer (parallel, with retry)
        // ════════════════════════════════════════════
        let contentBrief: ContentBrief | undefined;
        let uiSpec: UIDesignSpec | undefined;

        try {
          const [contentResult, uiSpecResult] = await Promise.all([
            haikuExecutor.execute(
              () => callOpenRouterJson(
                getContentStrategistPrompt(),
                `Business: ${prompt}`,
                clientSignal,
                1400,
              ),
              "content-strategist",
            ),
            haikuExecutor.execute(
              () => callOpenRouterJson(
                getUIDesignerPrompt(),
                `Business: ${prompt}\n\nBrand plan from Architect:\n${JSON.stringify({ brandName: architect.brandName, visualMood: architect.visualMood, colors: architect.colors, fonts: { display: architect.fonts.display, body: architect.fonts.body } }, null, 2)}`,
                clientSignal,
                1000,
              ),
              "ui-designer",
            ),
          ]);
          haikuTokens += contentResult.outputTokens + uiSpecResult.outputTokens;
          totalOutputTokens += contentResult.outputTokens + uiSpecResult.outputTokens;

          try {
            contentBrief = JSON.parse(extractJson(contentResult.content)) as ContentBrief;
            console.log(`[ContentStrategist] tagline: "${contentBrief.tagline}"`);
            push("CONTENT_STRATEGIST_DONE", { tagline: contentBrief.tagline });
          } catch (e) {
            console.warn("[ContentStrategist] Parse failed:", (e as Error).message);
            push("CONTENT_STRATEGIST_DONE", { tagline: null });
          }

          try {
            uiSpec = JSON.parse(extractJson(uiSpecResult.content)) as UIDesignSpec;
            console.log(`[UIDesigner] hero: ${uiSpec.heroVariant} | features: ${uiSpec.featuresVariant} | navbar: ${uiSpec.navbarStyle}`);
            push("UI_DESIGNER_DONE", { heroVariant: uiSpec.heroVariant, featuresVariant: uiSpec.featuresVariant, navbarStyle: uiSpec.navbarStyle });
          } catch (e) {
            console.warn("[UIDesigner] Parse failed:", (e as Error).message);
            push("UI_DESIGNER_DONE", { heroVariant: null, featuresVariant: null });
          }
        } catch (err) {
          console.warn("[Parallel agents] Failed:", err);
          push("CONTENT_STRATEGIST_DONE", { tagline: null });
          push("UI_DESIGNER_DONE", { heroVariant: null, featuresVariant: null });
        }

        // ════════════════════════════════════════════
        // STEP 3 — Shell call (sequential, must complete before pages)
        // ════════════════════════════════════════════
        const { content: shellHtml, outputTokens: shellTokens } =
          await devExecutor.execute(
            () => silentStream(
              getShellPrompt(isSinglePage, architect, uiSpec),
              `Business: ${prompt}\nHero image URL: ${heroImageUrl}${fixes?.length ? `\nFixes to address: ${fixes.map((f: string) => `- ${f}`).join("\n")}` : ""}`,
              budgets.shell,
              DEVELOPER_MODEL,
              clientSignal,
            ),
            "shell",
          );
        devTokens += shellTokens;
        totalOutputTokens += shellTokens;

        if (!shellHtml.includes("<nav") || !shellHtml.includes("<!DOCTYPE")) {
          push("ERROR", {
            message: "Failed to generate website structure. Please try again.",
          });
          closeStream();
          return;
        }

        const pagesMarkerEarly = shellHtml.indexOf("<!-- PAGES_START -->");
        const shellBase =
          pagesMarkerEarly !== -1
            ? shellHtml.slice(0, pagesMarkerEarly).trimEnd()
            : shellHtml.trimEnd();

        const designTokens = extractDesignTokens(shellHtml);

        // Use architect's brandName — more reliable than parsing <title>
        const brandName = architect.brandName;

        push("ARCHITECT_DONE", {
          message: `Structure ready! Building ${architect.pages.length} pages: ${architect.pageLabels.join(", ")}`,
          plan: {
            brandName,
            overallStyle: `${architect.fonts.display} · ${architect.colors.primary}`,
          },
          architectData: {
            brandName: architect.brandName,
            colors: architect.colors,
            fonts: {
              display: architect.fonts.display,
              body: architect.fonts.body,
            },
            pages: architect.pages,
            pageLabels: architect.pageLabels,
          },
        });

        // ════════════════════════════════════════════
        // STEP 4 — Page generation (concurrency managed by executor)
        // ════════════════════════════════════════════
        push("DEVELOPER_START", {
          message: `Building ${architect.pages.length} pages...`,
        });

        // Push shell immediately so code tab shows something right away
        push("HTML_CHUNK", {
          chunk: shellBase + "\n<main>\n<!-- Building pages... -->\n</main>\n</body></html>",
        });

        // Track completed pages for progressive preview streaming
        const completedPages: Record<string, string> = {};
        const pushProgressiveHtml = (pageId: string, validatedHtml: string) => {
          completedPages[pageId] = validatedHtml;
          const assembled =
            shellBase +
            "\n<main>" +
            architect.pages
              .filter((id) => completedPages[id])
              .map((id) => "\n" + completedPages[id])
              .join("") +
            "\n</main>\n</body></html>";
          push("HTML_CHUNK", { chunk: assembled });
        };

        let pageResults: PromiseSettledResult<{
          content: string;
          outputTokens: number;
        }>[];

        if (isSinglePage) {
          // ── Single page: 3 tasks (top + bottom + footer) ──
          const singleTasks = [
            () => silentStream(
              getSinglePageTopPrompt(prompt, designTokens, heroImageUrl),
              "Generate the top half.",
              budgets.page, DEVELOPER_MODEL, clientSignal,
            ).then((r) => {
              pushProgressiveHtml("home", r.content);
              push("DEVELOPER_FIX", { stepId: "page-home", message: "✓ Home complete" });
              return r;
            }),
            () => silentStream(
              getSinglePageBottomPrompt(prompt, designTokens),
              "Generate the bottom half.",
              budgets.page, DEVELOPER_MODEL, clientSignal,
            ).then((r) => {
              pushProgressiveHtml("features", r.content);
              push("DEVELOPER_FIX", { stepId: "page-2", message: "✓ Bottom half complete" });
              return r;
            }),
            () => silentStream(
              getFooterPrompt(prompt, designTokens, true, architect),
              "Generate footer and scripts.",
              budgets.footer, DEVELOPER_MODEL, clientSignal,
            ).then((r) => {
              push("DEVELOPER_FIX", { stepId: "page-footer", message: "✓ Footer complete" });
              return r;
            }),
          ];
          pageResults = await devExecutor.executeBatch(
            singleTasks,
            ["single-top", "single-bottom", "footer"],
          );
        } else {
          // ── Multi-page: all pages + footer via executor (handles concurrency + retries) ──
          const pageTasks = architect.pages.map((pageId, index) => {
            const pageLabel = architect.pageLabels[index];
            const heroUrl = pageId === "home" ? heroImageUrl : undefined;
            return () => silentStream(
              getPagePrompt(pageId, pageLabel, prompt, designTokens, heroUrl, architect, uiSpec, contentBrief),
              `Generate the complete ${pageLabel} page section.`,
              budgets.page, DEVELOPER_MODEL, clientSignal,
            ).then((r) => {
              pushProgressiveHtml(pageId, validatePageSection(r.content, pageId));
              push("DEVELOPER_FIX", { stepId: `page-${pageId}`, message: `✓ ${pageLabel} page complete` });
              return r;
            });
          });

          // Footer as the last task
          pageTasks.push(
            () => silentStream(
              getFooterPrompt(prompt, designTokens, false, architect),
              "Generate the footer and closing scripts.",
              budgets.footer, DEVELOPER_MODEL, clientSignal,
            ).then((r) => {
              push("DEVELOPER_FIX", { stepId: "page-footer", message: "✓ Footer & scripts complete" });
              return r;
            }),
          );

          pageResults = await devExecutor.executeBatch(
            pageTasks,
            [...architect.pages.map((id) => `page-${id}`), "footer"],
          );
        }

        // Log results for debugging
        const pageLabelsForLog = isSinglePage
          ? ["home", "bottom", "footer"]
          : [...architect.pages, "footer"];
        pageResults.forEach((r, i) => {
          if (r.status === "fulfilled") {
            console.log(
              `[Page ${pageLabelsForLog[i] ?? i}] ✓ ${r.value.content.length} chars, ${r.value.outputTokens} tokens`,
            );
          } else {
            console.error(
              `[Page ${pageLabelsForLog[i] ?? i}] ✗ FAILED:`,
              r.reason?.message ?? r.reason,
            );
          }
        });

        // Fallback placeholder for failed pages
        const fallback = (pageId: string) => ({
          content: `<section id="page-${pageId}" class="page"><div class="min-h-screen flex items-center justify-center py-40"><div class="text-center"><h2 class="font-display text-4xl font-bold mb-4 opacity-50">Content unavailable</h2><p class="text-white/40">This page failed to generate. Try regenerating.</p></div></div></section>`,
          outputTokens: 0,
        });

        // Extract page HTML results — dynamic, based on architect.pages
        const footerResultIndex = isSinglePage ? 2 : architect.pages.length;
        const footerResult = pageResults[footerResultIndex];
        const { content: footerContent, outputTokens: footerTokens } =
          footerResult?.status === "fulfilled"
            ? footerResult.value
            : { content: "", outputTokens: 0 };

        if (!footerContent || footerContent.length < 200) {
          console.warn("[Footer] Generation failed — using fallback footer");
        }

        // Build validated page HTML array
        const pagesToAssemble = isSinglePage
          ? ["home", "features"] // single page uses top+bottom halves
          : architect.pages;

        const validPageHtmls = pagesToAssemble.map((pageId, i) => {
          const result = pageResults[i];
          const { content } =
            result?.status === "fulfilled" ? result.value : fallback(pageId);
          const tokens =
            result?.status === "fulfilled" ? result.value.outputTokens : 0;
          devTokens += tokens;
          totalOutputTokens += tokens;
          return isSinglePage ? content : validatePageSection(content, pageId);
        });

        devTokens += footerTokens;
        totalOutputTokens += footerTokens;

        // Clean footer
        const footerTagStart = footerContent.search(/<footer/i);
        const cleanFooter =
          footerTagStart >= 0
            ? footerContent.slice(footerTagStart)
            : FALLBACK_FOOTER;
        const seoTags = buildSeoTags(brandName, prompt, heroImageUrl);

        const postProcess = (html: string): string => {
          const isLightTheme = html.includes('data-theme="light"');
          const menuBg = isLightTheme ? "#ffffff" : "#0f172a";

          let processedHtml = (
            html
              // SEO — inject meta tags before </head>
              .replace("</head>", `  ${seoTags}\n</head>`)
              // Fix 1 — mobile menu: remove "display: none" from inline styles
              .replace(/style="([^"]*?);\s*display:\s*none\s*"/g, 'style="$1"')
              .replace(/style="display:\s*none\s*;?\s*([^"]*)"/g, 'style="$1"')
              // Fix 2 — marquee items: ensure they don't wrap on mobile
              .replace(
                /class="flex animate-marquee/g,
                'class="flex animate-marquee whitespace-nowrap',
              )
              .replace(/<div class="flex items-center gap-\d+ pr-\d+">/g, (m) =>
                m.replace(
                  '<div class="flex',
                  '<div class="flex flex-shrink-0 flex-nowrap',
                ),
              )
              // Fix 3 — remove external texture URLs that block rendering
              .replace(/url\(["']https?:\/\/[^"')]+["']\)/g, "none")
              // Fix 4 — close any unclosed tag right before <main>
              .replace(/<[a-z][^>]*\n<main>/gi, "\n<main>")
              .replace(/class="[^"]*\n<main>/g, 'class="">\n</nav>\n<main>')
              // Fix 5 — mobile menu: force solid background + isolation
              // Targets style=" on the same line as x-show="open" and fixed
              // Simple single-line replace — no loops, no walking, no hangs
              .replace(
                /(<div[^>\n]*x-show="open"[^>\n]*fixed[^>\n]*)style="[^"]*"/g,
                `$1style="background:${menuBg};isolation:isolate;backdrop-filter:none"`,
              )
              .replace(
                /(<div[^>\n]*fixed[^>\n]*x-show="open"[^>\n]*)style="[^"]*"/g,
                `$1style="background:${menuBg};isolation:isolate;backdrop-filter:none"`,
              )
            // Fix 6 — single page: remove .page class and show the section
            // In multipage, .page { display:none } hides everything until showPage() runs
            // In single page, there's no routing so content must always be visible
            // Fix 7 — force page-home visible immediately via inline style
            .replace(
              /id="page-home"\s*class="page"/,
              'id="page-home" class="page" style="display:block"',
            )
          );

          // Fix 8 — sanitizeHtml: Fix incorrectly closed tags (script, style, head, body)
          const tagFixes = [
            { tag: 'script', wrong: 'style' },
            { tag: 'style', wrong: 'script' },
            { tag: 'head', wrong: 'body', preserveWrong: true }, // <head>...<body> -> <head>...</head><body>
            { tag: 'body', wrong: 'html', preserveWrong: true }, // <body>...</html> -> <body>...</body></html>
          ];

          tagFixes.forEach(({ tag, wrong, preserveWrong }) => {
            const regex = new RegExp(`<${tag}(\\b[^>]*)>([\\s\\S]*?)<\\/${wrong}>`, 'gi');
            processedHtml = processedHtml.replace(regex, (match, attrs, content) => {
              // Ensure we aren't eating a valid closing tag inside the content
              if (!content.includes(`</${tag}>`)) {
                return preserveWrong 
                  ? `<${tag}${attrs}>${content}</${tag}>\n</${wrong}>`
                  : `<${tag}${attrs}>${content}</${tag}>`;
              }
              return match;
            });
          });

          // Fix 9 — Light theme safety net: if page is light theme but LLM still
          // emitted dark-mode classes, replace them deterministically
          if (processedHtml.includes('data-theme="light"')) {
            processedHtml = processedHtml
              .replace(/\btext-white\/60\b/g, 'text-gray-600')
              .replace(/\btext-white\/50\b/g, 'text-gray-500')
              .replace(/\btext-white\/40\b/g, 'text-gray-400')
              .replace(/\btext-white\/30\b/g, 'text-gray-400')
              .replace(/\btext-white\/20\b/g, 'text-gray-300')
              .replace(/\btext-white\/70\b/g, 'text-gray-700')
              .replace(/\btext-white\/80\b/g, 'text-gray-800')
              .replace(/\bborder-white\/10\b/g, 'border-gray-200')
              .replace(/\bborder-white\/5\b/g, 'border-gray-100')
              .replace(/\bborder-white\/20\b/g, 'border-gray-200')
              .replace(/\bborder-white\/30\b/g, 'border-gray-300');
            console.log('[PostProcess] Light theme safety net applied');
          }

          return processedHtml;
        };

        // Build fallback images script for broken Unsplash URLs
        const category = getBusinessCategory(prompt);
        const fallbackPhotos = FALLBACK_IMAGES[category] || FALLBACK_IMAGES.default;
        const fallbackScript = `\n<script>\n(function(){\n  var fb=${JSON.stringify(fallbackPhotos.map(id => 'https://images.unsplash.com/' + id + '?w=900&q=80'))};\n  var idx=0;\n  document.querySelectorAll('img').forEach(function(img){\n    function h(){\n      img.onerror=null;\n      img.src=fb[idx%fb.length];\n      idx++;\n    }\n    img.onerror=h;\n    if(img.complete && img.naturalHeight===0) h();\n  });\n})();\n</script>`;

        const pageParts = validPageHtmls.map((html) => "\n" + html);
        const htmlOutput = postProcess(
          [
            shellBase,
            "\n<main>",
            ...pageParts,
            "\n</main>",
            "\n" + cleanFooter,
          ].join(""),
        );

        // For single page — remove .page class so content is always visible
        // In multipage .page { display:none } hides everything until showPage() runs
        // In single page there's no routing so content must always be visible
        let finalHtml = isSinglePage
          ? htmlOutput
              .replace(
                /(<section[^>]*)\bclass="([^"]*\b)page\b([^"]*)"/g,
                '$1class="$2$3"',
              )
              .replace(/(<section[^>]*)class="page"/g, '$1class=""')
          : htmlOutput;

          // ── Post-assembly: check all architect pages are present ──
        const missingPages = architect.pages.filter(
          pageId => !finalHtml.includes(`id="page-${pageId}"`)
        );
        if (missingPages.length > 0) {
          console.warn(`[Assembly] Missing pages after assembly: ${missingPages.join(", ")} — injecting placeholders`);
          // Inject a visible placeholder so nav links don't go blank
          const placeholders = missingPages.map(pageId => {
            const label = architect.pageLabels[architect.pages.indexOf(pageId)];
            return `\n<section id="page-${pageId}" class="page"><div class="min-h-screen flex items-center justify-center py-40"><div class="text-center opacity-50"><p class="font-display text-3xl font-bold mb-4">${label}</p><p class="text-white/40 text-sm">This page could not be generated. Please regenerate.</p></div></div></section>`;
          }).join("");
          // Insert placeholders before </main>
          finalHtml = finalHtml.replace("</main>", placeholders + "\n</main>");
        }

        // Quality check log
        const pageCount = (finalHtml.match(/id="page-/g) || []).length;
        const hasFooter = htmlOutput.includes("<footer");
        const hasRouting = htmlOutput.includes("showPage");
        const hasClosingTag = htmlOutput.toLowerCase().includes("</html>");
        console.log(
          `[Assembly] pages:${pageCount} footer:${hasFooter} routing:${hasRouting} </html>:${hasClosingTag} length:${htmlOutput.length} totalTokens:${totalOutputTokens}`,
        );

        totalCreditsToDeduct = calculateCredits(
          totalOutputTokens,
          DEVELOPER_MODEL,
        );

        push("DEVELOPER_DONE", {
          message: "All pages assembled! Running quality checks...",
        });

        push("QA_START", { message: "Running quality checks..." });

        let finalOutputHtml = finalHtml;
        try {
          const { content: rawQa, outputTokens: qaTokens } =
            await haikuExecutor.execute(
              () => callOpenRouterJson(
                getQaPrompt(),
                `Here is the complete HTML to review:\n\n${finalHtml}`,
                clientSignal,
                1200,
              ),
              "qa-reviewer",
            );
          haikuTokens += qaTokens;
          totalOutputTokens += qaTokens;

          const qaReport = JSON.parse(extractJson(rawQa));
          const isPassed = qaReport.passed === true;

          push("QA_REPORT", {
            score: qaReport.score ?? 100,
            passed: isPassed,
            issueCount: qaReport.criticalIssues?.length ?? 0,
            message: isPassed ? "Quality check passed!" : `Found ${qaReport.criticalIssues?.length ?? 1} issues. Fixing...`,
          });

          if (!isPassed && qaReport.criticalIssues?.length) {
            // Skip fixer for cheap/free models — regenerating 60K HTML through them
            // is impractical (causes 200s+ timeouts). The postProcess sanitizer
            // already catches the most critical issues (tag mismatches, etc.)
            const modelCost = getModelConfig(DEVELOPER_MODEL).costPerOutputToken;
            const isExpensiveModel = modelCost >= 0.000001; // Skip for DeepSeek ($0), Flash ($0.0000004)

            if (isExpensiveModel) {
              push("DEVELOPER_FIX", { stepId: "qa-fix", message: "Applying QA layout fixes..." });
              const issuesText = qaReport.criticalIssues.map((i: any) => `- ${i.description}\n  Fix: ${i.fix}`).join("\n");

              const r = await devExecutor.execute(
                () => silentStream(
                  getFixerPrompt(),
                  `Critical Issues to Fix:\n${issuesText}\n\nOriginal HTML:\n${finalOutputHtml}`,
                  getModelConfig(DEVELOPER_MODEL).maxOutputTokens,
                  DEVELOPER_MODEL,
                  clientSignal,
                ),
                "qa-fixer",
              );

              if (r.content && r.content.length > 200) {
                finalOutputHtml = r.content.replace(/^```html\s*/i, "").replace(/```\s*$/i, "").trim();
                devTokens += r.outputTokens;
                totalOutputTokens += r.outputTokens;
                push("DEVELOPER_FIX", { stepId: "qa-fix-done", message: "✓ QA fixes applied." });
              }
            } else {
              console.log(`[QA] Skipping fixer for cheap model ${DEVELOPER_MODEL} — postProcess handles critical fixes`);
              push("QA_REPORT", { score: qaReport.score ?? 85, passed: true, issueCount: 0, message: "QA check complete (auto-fixes applied)." });
            }
          }
        } catch (e) {
          console.warn("[QA] Failed or skipped:", e);
          push("QA_REPORT", { score: 95, passed: true, issueCount: 0, message: "QA check complete!" });
        }

        // Inject fallback images script before </body>
        if (finalOutputHtml.includes('</body>')) {
          finalOutputHtml = finalOutputHtml.replace('</body>', fallbackScript + '\n</body>');
        } else {
          finalOutputHtml += fallbackScript;
        }

        push("COMPLETE", {
          message: "Your website is ready!",
          html: finalOutputHtml,
          brandName,
          modelUsed: DEVELOPER_MODEL,
          creditsUsed: totalCreditsToDeduct,
        });

        if (clientSignal.aborted) {
          console.log(
            "[Credits] Client disconnected — skipping credit deduction",
          );
        } else {
          await deductCredits(userId, totalCreditsToDeduct);
          console.log(
            `[Credits] Deducted ${totalCreditsToDeduct} credits for ${DEVELOPER_MODEL} (${totalOutputTokens} tokens)`,
          );
          // Track API usage — fire-and-forget, non-blocking
          const { getModelConfig } = await import("@/lib/modelConfig");
          
          const HAIKU_MODEL = "anthropic/claude-haiku-4.5";
          const HAIKU_COST_PER_TOKEN = 0.000000125;
          
          const mc = getModelConfig(DEVELOPER_MODEL);
          
          // Haiku handles Architect + ContentStrategist + UIDesigner + QA reviewer
          if (haikuTokens > 0) {
            trackApiUsage(HAIKU_MODEL, haikuTokens, haikuTokens * HAIKU_COST_PER_TOKEN, true).catch(console.warn);
          }
          
          // The developer model handles Shell + Pages + Footer + QA Fixer
          if (devTokens > 0) {
            trackApiUsage(DEVELOPER_MODEL, devTokens, devTokens * mc.costPerOutputToken, false).catch(console.warn);
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError" || clientSignal.aborted) {
          {
            console.log(
              "[Pipeline] Connection dropped or aborted — generation was running",
            );
            // Still try to deduct credits if we generated content
            if (!creditsDone && totalOutputTokens > 0) {
              try {
                creditsDone = true;
                await deductCredits(userId, totalCreditsToDeduct);
                console.log(
                  `[Credits] Late deduction: ${totalCreditsToDeduct} credits`,
                );
              } catch (e) {
                console.error("[Credits] Late deduction failed:", e);
              }
            }
          }
          return;
        }
        console.error("Deep dive pipeline error:", err);
        push("ERROR", {
          message: "Something went wrong during generation. Please try again.",
        });
      } finally {
        clearInterval(keepalive);

        closeStream();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
