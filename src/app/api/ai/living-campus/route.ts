import { NextResponse } from "next/server";
import { generateText } from "../_shared/ai-client";

interface LivingCampusRequest {
  week: number;
  stats: Record<string, number>;
  relationships: string;
  recentEvents: string;
}

export async function POST(request: Request) {
  try {
    const body: LivingCampusRequest = await request.json();
    const { week, stats, relationships, recentEvents } = body;

    const prompt = `You are the campus life director for a Korean university simulator game.

Week ${week}/16. Player stats: 준비도=${stats.knowledge}, 체력=${stats.health}, 스트레스=${stats.stress}, 인맥=${stats.social}, 돈=${stats.money}.
NPC relationships: ${relationships || 'none yet'}.
Recent events: ${recentEvents || 'none'}.

Generate what each NPC is doing TODAY at different times. Make it feel ALIVE — they should be doing specific, interesting things, not just "studying" or "eating". Reference the current week context (exam season, festival, early semester, etc).

NPCs:
- jaemin (이재민): roommate, cheerful, loves gaming and chicken, sometimes lazy
- minji (한민지): competitive, studies hard, secretly kind, always has her notes
- soyeon (박소연): warm 3rd-year senior, mentoring, preparing for graduation
- hyunwoo (정현우): cool band club senior, free spirit, always has guitar

For each NPC, write specific activities and ONE line of natural Korean dialogue they'd say if the player bumped into them. Make dialogue feel real — not generic.

Also write:
- One "overheard conversation" — a snippet the player might hear walking across campus
- One "campus atmosphere" line describing the vibe today

Respond in JSON:
{
  "routines": [
    {"npcId": "jaemin", "morning": {"location": "cafeteria", "doing": "학식 줄 서있는 중. 핸드폰으로 게임 하면서 대기", "dialogue": "야 여기서 만나네ㅋㅋ 돈까스 나왔대!"}, "afternoon": {...}, "evening": {...}},
    ...
  ],
  "overheard": "두 학생이 시험 범위 얘기하며 지나간다. '이번에 50페이지라던데...' '미쳤어 진짜?'",
  "atmosphere": "도서관 앞 벤치에서 학생들이 봄 햇살을 즐기고 있다."
}

IMPORTANT: Write in natural, casual Korean. Each dialogue should feel like something a real Korean university student would actually say. Reference SPECIFIC things (menu items, game names, song names, etc).`;

    const raw = await generateText({
      userPrompt: prompt,
      thinkingLevel: "minimal",
    });

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
    console.error("Living campus generation error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 502 });
  }
}
