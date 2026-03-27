import { NextResponse } from "next/server";
import { generateText } from "../_shared/ai-client";
import {
  buildContextualSceneSystemPrompt,
  buildContextualSceneUserPrompt,
} from "@/engine/ai/prompt-templates/contextual-scene";
import type { PlayerStats, WeekSchedule, CharacterRelationship } from "@/store/types";

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

    const raw = await generateText({
      userPrompt: `${systemPrompt}\n\n${userPrompt}\n\nRespond in JSON format with this structure:\n{"id":"scene_id","location":"campus","backgroundVariant":"day","characters":[{"characterId":"jaemin","expression":"happy","position":"center"}],"dialogue":[{"characterId":null,"text":"narration"},{"characterId":"jaemin","text":"dialogue"}],"choices":[{"id":"choice1","text":"option text","statEffects":{"knowledge":2}}]}`,
      thinkingLevel: "minimal",
    });

    // Parse JSON from response
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json({ error: "Parse failed" }, { status: 502 });
      }
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Contextual scene generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate scene" },
      { status: 502 },
    );
  }
}
