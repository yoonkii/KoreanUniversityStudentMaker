import { NextResponse } from "next/server";
import { generateStructured } from "../_shared/ai-client";
import { SceneResponseSchema } from "@/engine/ai/schemas/scene-response";
import {
  buildContextualSceneSystemPrompt,
  buildContextualSceneUserPrompt,
} from "@/engine/ai/prompt-templates/contextual-scene";
import type { PlayerStats, WeekSchedule, CharacterRelationship } from "@/store/types";
import { z } from "zod";

interface ContextualSceneRequest {
  schedule: WeekSchedule;
  playerStats: PlayerStats;
  currentWeek: number;
  relationships: Record<string, CharacterRelationship>;
}

export async function POST(request: Request) {
  try {
    const body: ContextualSceneRequest = await request.json();
    const { schedule, playerStats, currentWeek, relationships } = body;

    const systemPrompt = buildContextualSceneSystemPrompt();
    const userPrompt = buildContextualSceneUserPrompt(
      schedule,
      playerStats,
      currentWeek,
      relationships,
    );

    const result = await generateStructured(
      {
        systemPrompt,
        userPrompt,
        jsonSchema: z.toJSONSchema(SceneResponseSchema) as Record<string, unknown>,
        thinkingLevel: "low",
      },
      SceneResponseSchema,
    );

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Contextual scene generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate scene" },
      { status: 502 },
    );
  }
}
