import { NextResponse } from "next/server";
import { generateText } from "../_shared/ai-client";
import { buildSimulationSystemPrompt, buildSimulationPrompt } from "@/engine/ai/prompt-templates/npc-simulation";

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

    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}\n\nRespond in JSON format.`;

    const raw = await generateText({
      userPrompt: combinedPrompt,
      thinkingLevel: "low",
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
    console.error("NPC simulation error:", error);
    return NextResponse.json({
      interactions: [],
      npcMoodUpdates: [],
    });
  }
}
