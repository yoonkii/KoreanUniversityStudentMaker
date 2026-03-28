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
- 3 "overheard" conversations — snippets the player might hear walking across campus. Include conversations BETWEEN the NPCs (not just random students). Example: "재민이가 민지한테 '야 노트 좀 빌려줘' 하고 있다. 민지가 한숨을 쉬며 건넸다."
- One "npcDrama" — something interesting happening between 2 NPCs this week (a small story/conflict/bonding moment)
- One "atmosphere" — campus vibe description

Respond in JSON:
{
  "routines": [
    {"npcId": "jaemin", "morning": {"location": "cafeteria", "doing": "specific activity", "dialogue": "specific dialogue"}, "afternoon": {...}, "evening": {...}},
    ...
  ],
  "overheard": ["snippet1", "snippet2", "snippet3"],
  "npcDrama": "재민이와 민지가 조별과제 역할 분담 때문에 복도에서 말다툼을 했다. 결국 민지가 양보했다.",
  "atmosphere": "campus vibe description"
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
