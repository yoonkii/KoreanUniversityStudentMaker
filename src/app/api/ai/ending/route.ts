import { NextResponse } from "next/server";
import { generateText } from "../_shared/ai-client";
import type { PlayerStats } from "@/engine/types/stats";
import { STAT_KEYS } from "@/engine/types/stats";

interface EndingRequest {
  playerName: string;
  university: string;
  major: string;
  stats: PlayerStats;
  rollingSummary: string;
  storytellerMode: string;
  language: "ko" | "en";
}

export async function POST(request: Request) {
  try {
    const body: EndingRequest = await request.json();

    // Determine archetype from highest stat
    const highestStat = STAT_KEYS.reduce((a, b) =>
      body.stats[a] > body.stats[b] ? a : b
    );
    const lowestStat = STAT_KEYS.reduce((a, b) =>
      body.stats[a] < body.stats[b] ? a : b
    );

    const gradeFor = (val: number) =>
      val >= 80 ? "A" : val >= 60 ? "B" : val >= 40 ? "C" : val >= 20 ? "D" : "F";

    const statReport = STAT_KEYS.map(
      (k) => `${k}: ${Math.round(body.stats[k])} (${gradeFor(body.stats[k])})`
    ).join(", ");

    const systemPrompt = body.language === "ko"
      ? `당신은 한국 대학 생활 시뮬레이션의 엔딩 내레이터입니다. 감동적이고 진솔한 학기 회고를 써주세요.
플레이어의 선택과 희생을 모두 인정하면서, "하지만..." 구조로 대가도 보여주세요.
한국 대학생이 공감할 수 있는 현실적이고 따뜻한 문체로 쓰세요. 3-5문단.`
      : `You are the ending narrator for a Korean university life simulation. Write a touching, honest semester reflection.
Acknowledge both the player's choices and sacrifices with a "but..." structure showing the cost.
Write in a realistic, warm style. 3-5 paragraphs.`;

    const userPrompt = `학기 끝. ${body.playerName}, ${body.university} ${body.major}.

최종 스탯: ${statReport}
가장 높은 스탯: ${highestStat}
가장 낮은 스탯 (희생): ${lowestStat}

학기 요약:
${body.rollingSummary || "다양한 경험을 하며 한 학기를 보냈다."}

이 학생의 한 학기를 돌아보는 엔딩 내레이션을 써주세요.
가장 높은 스탯이 이 학생의 정체성이고, 가장 낮은 스탯이 그 대가입니다.`;

    const ending = await generateText({
      systemPrompt,
      userPrompt,
      thinkingLevel: "high",
    });

    return NextResponse.json({
      ending,
      archetype: highestStat,
      sacrifice: lowestStat,
      grades: Object.fromEntries(
        STAT_KEYS.map((k) => [k, gradeFor(body.stats[k])])
      ),
    });
  } catch (error) {
    console.error("Ending generation error:", error);
    return NextResponse.json({
      ending: "한 학기가 끝났다. 많은 일이 있었고, 성장했다.",
      archetype: "gpa",
      sacrifice: "social",
      grades: {},
    });
  }
}
