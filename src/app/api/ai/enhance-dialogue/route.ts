import { NextResponse } from "next/server";
import { generateText } from "../_shared/ai-client";
import { CHARACTERS } from "@/data/characters";
import type { PlayerStats, CharacterRelationship } from "@/store/types";

interface EnhanceDialogueRequest {
  sceneId: string;
  characterIds: string[];
  originalDialogue: string;
  playerStats: PlayerStats;
  relationships: Record<string, CharacterRelationship>;
  currentWeek: number;
  location: string;
}

export async function POST(request: Request) {
  try {
    const body: EnhanceDialogueRequest = await request.json();
    const { characterIds, originalDialogue, playerStats, relationships, currentWeek, location } = body;

    const charContext = characterIds
      .map((id) => {
        const char = CHARACTERS[id];
        if (!char) return null;
        const rel = relationships[id];
        const affection = rel?.affection ?? 50;
        return `- ${char.name} (${char.id}): ${char.description}. 호감도: ${affection}`;
      })
      .filter(Boolean)
      .join("\n");

    const prompt = `You are a Korean university life game dialogue writer.

Week ${currentWeek}/16, Location: ${location}

Characters:
${charContext}

Player stats: 준비도=${playerStats.knowledge}, 체력=${playerStats.health}, 스트레스=${playerStats.stress}, 인맥=${playerStats.social}

Original dialogue:
${originalDialogue}

Rewrite the dialogue more naturally in Korean. Keep the same flow and meaning, but make it more vivid and character-appropriate. Use casual Korean university student speech.

Respond in JSON format:
{"dialogue": [{"characterId": "jaemin" or null for narrator, "text": "dialogue text", "expression": "happy/neutral/etc"}]}

IMPORTANT: Keep similar number of lines. Write natural Korean.`;

    const raw = await generateText({
      userPrompt: prompt,
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
    console.error("Dialogue enhancement error:", error);
    return NextResponse.json(
      { error: "Failed to enhance dialogue" },
      { status: 502 },
    );
  }
}
