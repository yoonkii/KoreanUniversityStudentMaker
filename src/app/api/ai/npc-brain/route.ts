import { NextResponse } from "next/server";
import { generateText } from "../_shared/ai-client";
import { buildNPCSystemPrompt, buildNPCContextPrompt, buildNPCSituationPrompt } from "@/engine/ai/prompt-templates/npc-dialogue";
import type { NPCCharacterSheet, NPCLiveState } from "@/engine/types/npc";
import type { PlayerStats } from "@/engine/types/stats";
import type { ThinkingLevel } from "../_shared/ai-client";

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

    const combinedPrompt = `${systemPrompt}\n\n${contextPrompt}\n\n${situationPrompt}\n\nRespond in JSON format.`;

    const raw = await generateText({
      userPrompt: combinedPrompt,
      thinkingLevel,
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
