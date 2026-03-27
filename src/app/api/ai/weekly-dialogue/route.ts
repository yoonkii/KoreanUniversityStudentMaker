import { NextResponse } from "next/server";
import { generateText } from "../_shared/ai-client";

interface WeeklyDialogueRequest {
  week: number;
  stats: Record<string, number>;
  relationships: string;
}

export async function POST(request: Request) {
  try {
    const body: WeeklyDialogueRequest = await request.json();
    const { week, stats, relationships } = body;

    const prompt = `You are a Korean university life simulator's NPC dialogue writer.

Week ${week}/16 of the semester. Player stats: 준비도=${stats.knowledge}, 체력=${stats.health}, 스트레스=${stats.stress}, 인맥=${stats.social}, 돈=${stats.money}, 매력=${stats.charm}.
NPC relationships: ${relationships || 'none yet'}.

Generate contextual Korean dialogue lines for these NPCs for this week. Each NPC should have 3-4 short lines (1-2 sentences each) that reference the current week, player stats, or semester context. Lines should feel natural, not generic.

NPCs:
- jaemin (이재민, roommate, 밝고 사교적)
- minji (한민지, rival, 겉으로 차갑지만 인정 많음)
- soyeon (박소연, caring senior, 따뜻한 3학년)
- hyunwoo (정현우, club senior, 카리스마 있는 자유로운 영혼)

Also write one "campusAtmosphere" line describing the campus mood this week.

Respond in JSON format:
{
  "npcLines": {
    "jaemin": ["line1", "line2", "line3"],
    "minji": ["line1", "line2", "line3"],
    "soyeon": ["line1", "line2", "line3"],
    "hyunwoo": ["line1", "line2", "line3"]
  },
  "campusAtmosphere": "one-line campus mood description"
}

IMPORTANT: Write in natural Korean. Reference specific things about the current week (exam season, festival, early semester, etc). Make each line unique and character-consistent.`;

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
    console.error("Weekly dialogue generation error:", error);
    return NextResponse.json({ error: "Failed to generate dialogue" }, { status: 502 });
  }
}
