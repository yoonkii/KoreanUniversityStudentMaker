import { NextResponse } from "next/server";
import { generateStructured } from "../_shared/ai-client";
import { SimulationResponseSchema } from "@/engine/ai/schemas/simulation-response";
import { buildSimulationSystemPrompt, buildSimulationPrompt } from "@/engine/ai/prompt-templates/npc-simulation";
import { z } from "zod";

interface SimulationRequest {
  npcs: Array<{
    id: string;
    name: string;
    personality: string;
    currentEmotion: string;
    currentGoal: string;
    location: string;
    relationshipsToOthers: Array<{ name: string; level: number; attitude: string }>;
  }>;
  playerActivities: string;
  directorGuidance?: string;
  activeThreads?: string[];
}

export async function POST(request: Request) {
  try {
    const body: SimulationRequest = await request.json();

    const systemPrompt = buildSimulationSystemPrompt();
    const userPrompt = buildSimulationPrompt(
      body.npcs,
      body.playerActivities,
      body.directorGuidance,
      body.activeThreads
    );

    const result = await generateStructured(
      {
        systemPrompt,
        userPrompt,
        jsonSchema: z.toJSONSchema(SimulationResponseSchema) as Record<string, unknown>,
        thinkingLevel: "low",
      },
      SimulationResponseSchema
    );

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("NPC simulation error:", error);
    return NextResponse.json({
      interactions: [],
      npcMoodUpdates: [],
    });
  }
}
