import { NextResponse } from "next/server";
import { generateText } from "../_shared/ai-client";
import { buildDirectorSystemPrompt, buildDirectorEvaluationPrompt } from "@/engine/ai/prompt-templates/director-evaluate";
import type { StoryDirectorState } from "@/engine/types/story";
import type { PlayerStats } from "@/engine/types/stats";

interface DirectorRequest {
  director: StoryDirectorState;
  playerStats: PlayerStats;
  day: number;
  npcSummaries: Array<{ id: string; name: string; emotion: string; goal: string; playerRel: number }>;
  recentDayLogs: string[];
  playerActivities: string;
}

export async function POST(request: Request) {
  try {
    const body: DirectorRequest = await request.json();

    const systemPrompt = buildDirectorSystemPrompt(body.director.mode);
    const userPrompt = buildDirectorEvaluationPrompt(
      body.director,
      body.playerStats,
      body.day,
      body.npcSummaries,
      body.recentDayLogs,
      body.playerActivities
    );

    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}\n\nRespond in JSON format.`;

    const raw = await generateText({
      userPrompt: combinedPrompt,
      thinkingLevel: "medium",
    });

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
      else return NextResponse.json({ error: "Parse failed" }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Story director error:", error);
    return NextResponse.json({
      tensionAssessment: "평가 실패 — 조용한 하루.",
      interventions: [],
      seedsToPlant: [],
      threadGuidance: {},
      choiceRequired: false,
    });
  }
}
