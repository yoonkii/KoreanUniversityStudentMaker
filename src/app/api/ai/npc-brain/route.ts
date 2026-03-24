import { NextResponse } from "next/server";
import { generateStructured } from "../_shared/ai-client";
import { NPCBrainResponseSchema } from "@/engine/ai/schemas/npc-response";
import { buildNPCSystemPrompt, buildNPCContextPrompt, buildNPCSituationPrompt } from "@/engine/ai/prompt-templates/npc-dialogue";
import type { NPCCharacterSheet, NPCLiveState } from "@/engine/types/npc";
import type { PlayerStats } from "@/engine/types/stats";
import type { ThinkingLevel } from "../_shared/ai-client";
import { z } from "zod";

interface NPCBrainRequest {
  sheet: NPCCharacterSheet;
  state: NPCLiveState;
  playerName: string;
  playerStats: PlayerStats;
  situation: string;
  directorBias?: string;
  thinkingLevel?: ThinkingLevel;
  forceChoice?: boolean;
}

export async function POST(request: Request) {
  try {
    const body: NPCBrainRequest = await request.json();
    const {
      sheet,
      state,
      playerName,
      playerStats,
      situation,
      directorBias,
      thinkingLevel = "low",
      forceChoice = false,
    } = body;

    const systemPrompt = buildNPCSystemPrompt(sheet);
    const contextPrompt = buildNPCContextPrompt(state, playerName, playerStats, directorBias);
    const situationPrompt = buildNPCSituationPrompt(sheet, playerName, situation, forceChoice);

    const userPrompt = `${contextPrompt}\n\n${situationPrompt}`;

    const result = await generateStructured(
      {
        systemPrompt,
        userPrompt,
        jsonSchema: z.toJSONSchema(NPCBrainResponseSchema) as Record<string, unknown>,
        thinkingLevel,
      },
      NPCBrainResponseSchema
    );

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("NPC brain error:", error);
    // Return fallback response
    return NextResponse.json({
      dialogue: "...",
      emotion: { type: "anticipation", intensity: 3 },
      statModifiers: {},
      relationshipDelta: 0,
      memoryEntry: "특별한 일 없이 스쳐지나감.",
      secretThought: null,
    });
  }
}
