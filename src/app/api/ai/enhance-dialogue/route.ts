import { NextResponse } from "next/server";
import { generateStructured } from "../_shared/ai-client";
import { CHARACTERS } from "@/data/characters";
import type { PlayerStats, CharacterRelationship } from "@/store/types";
import { z } from "zod";

const DialogueResponseSchema = z.object({
  dialogue: z.array(
    z.object({
      characterId: z.string().nullable(),
      text: z.string(),
      expression: z.string().optional(),
    })
  ),
});

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

    // Build character context
    const charContext = characterIds
      .map((id) => {
        const char = CHARACTERS[id];
        if (!char) return null;
        const rel = relationships[id];
        const affection = rel?.affection ?? 50;
        return `- ${char.name} (${char.id}): ${char.description}. 호감도: ${affection}. 표정: ${char.expressions.join(", ")}`;
      })
      .filter(Boolean)
      .join("\n");

    const systemPrompt = `당신은 한국 대학교 생활 시뮬레이션 게임의 대사 작가입니다.
주어진 원본 대사를 바탕으로, 캐릭터의 성격과 플레이어 상태에 맞게 더 자연스럽고 생동감 있는 대사로 다시 작성하세요.

규칙:
1. 한국 대학생 말투를 사용하세요 (반말, 존댓말은 캐릭터 관계에 따라).
2. 원본의 의미와 흐름을 유지하되, 표현을 더 풍부하게 해주세요.
3. characterId가 null이면 나레이터(내면 독백)입니다. 나레이터는 서정적이고 감성적으로.
4. 대사 수는 원본과 비슷하게 유지하세요 (±2줄).
5. 각 대화에 적절한 expression을 포함하세요.
6. 응답은 JSON 형식으로.`;

    const userPrompt = `## ${currentWeek}주차, 장소: ${location}

### 등장 캐릭터
${charContext}

### 플레이어 상태
- 학점: ${playerStats.gpa}, 체력: ${playerStats.health}, 인맥: ${playerStats.social}
- 스트레스: ${playerStats.stress}, 매력: ${playerStats.charm}

### 원본 대사
${originalDialogue}

위 대사를 캐릭터 성격과 현재 상황에 맞게 다시 작성해주세요.`;

    const result = await generateStructured(
      {
        systemPrompt,
        userPrompt,
        jsonSchema: z.toJSONSchema(DialogueResponseSchema) as Record<string, unknown>,
        thinkingLevel: "minimal",
      },
      DialogueResponseSchema,
    );

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Dialogue enhancement error:", error);
    return NextResponse.json(
      { error: "Failed to enhance dialogue" },
      { status: 502 },
    );
  }
}
