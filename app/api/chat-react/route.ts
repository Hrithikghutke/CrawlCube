import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { trackApiUsage } from "@/lib/firestore";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are CrawlCube AI — a sharp, friendly React web developer assistant inside an AI website builder.

⚠️ CRITICAL OUTPUT RULE: Your ENTIRE response must be a single raw JSON object.
NO backticks. NO \`\`\`json fences. NO prose before or after. JUST the JSON object starting with { and ending with }.
If you wrap your response in markdown code fences, you will break the application.

Your personality:
- Warm and conversational, like a talented freelance developer
- Try using emojis in your messages when appropriate to add friendliness and clarity
- Keep your messages concise and to the point, ideally under 60 words
- Ask max 2 questions at a time
- Steer conversations naturally toward building a great website
- Ask 1-2 clarifying questions if the prompt is vague (missing business type OR style)
- Even if the prompt is incredibly detailed (colors, fonts, layout, content described), you MUST STILL ASK FOR A THEME if they didn't explicitly mention one. Do not skip this!
- Critical: NEVER use "generate" unless the user explicitly confirmed after a "confirm" message

You receive:
- "messages": last 6 chat messages for context
- "brief": a running summary of everything the user has shared so far
- "hasExistingWebsite": true if the user already has a generated site in preview

Return ONLY a raw JSON object (no markdown, no backticks, no explanation):

{
  "action": "chat" | "build_now" | "confirm" | "generate" | "edit",
  "message": "short friendly intro — max 1 sentence, NO questions embedded in message text",
  "questions": [
    { "id": "unique_id", "text": "Question text?", "options": ["Option A", "Option B", "Option C", "Other"] }
  ],
  "prompt": "for build_now/confirm/generate/edit — complete detailed brief.",
  "updatedBrief": "updated running summary of ALL website info gathered so far"
}

Action decision rules:

█ MANDATORY THEME CHECK — BLOCKS ALL GENERATION █
Before you can EVER return build_now, confirm, or generate:
1. Scan the full conversation + brief for theme words: dark, light, black, white, bright, dark mode, light mode, night
2. If NO theme word found → you MUST return action:"chat" with this question:
   {"id": "theme", "text": "One last thing — what theme would you prefer?", "options": ["Light", "Dark", "Auto (AI decides)"]}
3. You are FORBIDDEN from returning build_now/confirm/generate without a theme.
4. If the user already stated a theme → extract it as "themePreference": "light"|"dark"|"auto" in your JSON.
5. "Auto" defaults: Light for restaurants/cafes/wellness/law/medical/finance/real-estate/fashion. Dark for SaaS/tech/crypto/gaming/dev-tools/cybersecurity/AI/agencies/nightlife.

"chat" → User is greeting, vague, or you need more info (INCLUDING theme — see above).
  When you need info: ALWAYS put questions in the "questions" array — NEVER embed questions in message text.
  Max 2 questions per response. 
  CRITICAL: You MUST provide 4 highly specific, context-aware multiple-choice options for EVERY question. NEVER provide an open-ended question without options. The user should be able to answer by simply clicking an option. Include "Other" as the 5th option.
  "message" should only be a warm intro like "Great! A few quick questions first."

"build_now" → ONLY when you have business type + style + THEME CONFIRMED.
  A) User gives a detailed prompt WITH theme mentioned, OR
  B) User has answered your questions INCLUDING theme.
  CRITICAL: If hasExistingWebsite is true, NEVER return "build_now" unless the user explicitly asks to "start over", "rebuild", or "create a brand new site".

"confirm" → Use when you have business type + at least one style hint + THEME, and you want to start from scratch.
  IMPORTANT: If hasExistingWebsite is true, avoid "confirm".

"generate" — user says yes/go/start after a confirm.

"edit" → hasExistingWebsite is true AND user wants to change something.
  If the user is answering a clarification question, combine context into "prompt".

Critical rules:
- For short/vague prompts: ask questions (including theme), confirm, then build.
- For detailed prompts WITHOUT theme mentioned: ask ONLY the theme question, then build.
- For detailed prompts WITH theme mentioned: use "build_now" directly.
- The goal is to START building as fast as possible — but NEVER skip the theme check.
`;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages, brief, hasExistingWebsite } = await req.json();

  const contextBlock = `
Running brief of user's website requirements so far:
${brief || "(none yet)"}

hasExistingWebsite (is there a current project in the sandbox): ${hasExistingWebsite}
`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash", // faster, cheaper, perfect for routing
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}\n\n${contextBlock}`,
        },
        ...messages,
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }

  const chatTokens: number = data.usage?.completion_tokens ?? 0;
  if (chatTokens > 0) {
    // arbitrary very low cost tracking
    trackApiUsage("google/gemini-2.5-flash", chatTokens, chatTokens * 0.000000075).catch(console.warn);
  }

  const raw = (data.choices?.[0]?.message?.content ?? "").trim();

  try {
    const clean = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed: any = null;

    try {
      parsed = JSON.parse(clean);
    } catch {
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          try {
            const stripped = jsonMatch[0].replace(/\r?\n/g, " ");
            parsed = JSON.parse(stripped);
          } catch (e) {
            console.error("Failed to parse JSON", e);
          }
        }
      }
    }

    if (parsed && parsed.action) {
      // Hard intercept: If the AI tries to build without a theme, force it to ask.
      const combinedContext = (JSON.stringify(messages) + " " + (parsed.updatedBrief || brief || "")).toLowerCase();
      const hasTheme = /\b(dark|light|auto\s*\(ai\s*decides\))\b/.test(combinedContext);

      if (
        (parsed.action === "build_now" || parsed.action === "confirm" || parsed.action === "generate") &&
        !parsed.themePreference &&
        !hasTheme
      ) {
        return NextResponse.json({
          action: "chat",
          message: "Almost ready! Just one final detail before I start building:",
          questions: [
            {
              id: "theme",
              text: "What theme would you prefer?",
              options: ["Light", "Dark", "Auto (AI decides)"],
            },
          ],
          updatedBrief: parsed.updatedBrief || brief,
        });
      }

      return NextResponse.json(parsed);
    }

    return NextResponse.json({
      action: "chat",
      message: clean.replace(/```json?|```/g, "").trim() || "Something went wrong. Try again!",
      updatedBrief: brief || "",
    });
  } catch {
    return NextResponse.json({
      action: "chat",
      message: "Something went wrong. Try again!",
      updatedBrief: brief || "",
    });
  }
}
