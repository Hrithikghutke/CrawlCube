import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getErrorFixerSystemPrompt,
  getErrorFixerUserPrompt,
} from "@/lib/reactAgents/errorFixer";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { errorMessage, filePath, fileContent, allFilePaths } =
    await req.json();

  if (!errorMessage || !filePath || !fileContent) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-v4-flash",
        max_tokens: 4000,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content: getErrorFixerSystemPrompt(),
          },
          {
            role: "user",
            content: getErrorFixerUserPrompt(
              errorMessage,
              filePath,
              fileContent,
              allFilePaths ?? [],
            ),
          },
        ],
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`OpenRouter error: ${res.statusText} - ${errorText}`);
    }
    const data = await res.json();

    const fixedContent = data.choices?.[0]?.message?.content ?? "";

    // Robustly strip markdown if the model included it
    let cleaned = fixedContent;
    const match = fixedContent.match(/```(?:[a-zA-Z]*)\n([\s\S]*?)```/);
    if (match) {
      cleaned = match[1];
    } else {
      cleaned = fixedContent
        .replace(/^```[a-z]*\n?/i, "")
        .replace(/\n?```$/i, "");
    }
    cleaned = cleaned.trim();

    return NextResponse.json({ fixedContent: cleaned });
  } catch (error: any) {
    console.error("Error fixer failed:", error);
    return NextResponse.json(
      { error: error?.message || "Fix attempt failed" },
      { status: 500 },
    );
  }
}
