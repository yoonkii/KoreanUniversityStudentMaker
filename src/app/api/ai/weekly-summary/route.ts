import { NextResponse } from "next/server";
import { generateText } from "../_shared/ai-client";

interface WeeklySummaryRequest {
  previousSummary: string;
  weekDayLogs: string[];
  weekNumber: number;
  language: "ko" | "en";
}

export async function POST(request: Request) {
  try {
    const body: WeeklySummaryRequest = await request.json();

    const systemPrompt = body.language === "ko"
      ? `당신은 한국 대학 생활 시뮬레이션의 요약기입니다. 지난 주의 일들을 300자 이내로 압축해서 요약하세요.
중요한 사건, 관계 변화, 감정적 전환점을 중심으로 요약하세요.
이전 요약과 이어지도록 쓰세요.`
      : `You are a summarizer for a Korean university life simulation. Compress the past week into 300 characters or less.
Focus on key events, relationship changes, and emotional turning points.
Write as a continuation of the previous summary.`;

    const userPrompt = `이전 요약: ${body.previousSummary || "학기 시작."}

${body.weekNumber}주차 일지:
${body.weekDayLogs.join("\n")}

이 내용을 300자 이내로 압축 요약해주세요.`;

    const summary = await generateText({
      systemPrompt,
      userPrompt,
      thinkingLevel: "minimal",
    });

    return NextResponse.json({ summary: summary.slice(0, 500) });
  } catch (error) {
    console.error("Weekly summary error:", error);
    return NextResponse.json({ summary: "한 주가 지나갔다." });
  }
}
