import { NextResponse } from "next/server";
import { generateStructured } from "../_shared/ai-client";
import { DirectorResponseSchema } from "@/engine/ai/schemas/director-response";
import { buildDirectorSystemPrompt, buildDirectorEvaluationPrompt } from "@/engine/ai/prompt-templates/director-evaluate";
import type { StoryDirectorState } from "@/engine/types/story";
import type { PlayerStats } from "@/engine/types/stats";
import { z } from "zod";

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

    const result = await generateStructured(
      {
        systemPrompt,
        userPrompt,
        jsonSchema: z.toJSONSchema(DirectorResponseSchema) as Record<string, unknown>,
        thinkingLevel: "medium",
      },
      DirectorResponseSchema
    );

    return NextResponse.json(result.data);
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
