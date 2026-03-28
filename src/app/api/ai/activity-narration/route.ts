import { NextResponse } from "next/server";
import { generateText } from "../_shared/ai-client";

interface ActivityEntry {
  day: string;
  timeSlot: string;
  activityName: string;
  targetNpc?: string;
  relContext?: { friendshipTier: string; romanceTier: string };
  dateResult?: string;
  friendResult?: string;
}

interface ActivityNarrationRequest {
  activities: ActivityEntry[];
  week: number;
  stats: Record<string, number>;
}

export async function POST(request: Request) {
  try {
    const body: ActivityNarrationRequest = await request.json();
    const { activities, week, stats } = body;

    const actList = activities
      .map((a, i) => {
        let line = `${i + 1}. ${a.day} ${a.timeSlot}: ${a.activityName}`;
        if (a.targetNpc) {
          line += ` (with ${a.targetNpc}`;
          if (a.relContext) {
            line += `, 우정: ${a.relContext.friendshipTier}`;
            if (a.relContext.romanceTier !== '없음') line += `, 사랑: ${a.relContext.romanceTier}`;
          }
          line += ')';
          if (a.dateResult) {
            const DR: Record<string, string> = { gate_fail: '→ 어색하게 끝남', awkward: '→ 분위기 어색', success: '→ 좋은 시간', great_chemistry: '→ 환상의 케미!' };
            line += ` ${DR[a.dateResult] ?? ''}`;
          }
          if (a.friendResult === 'great') line += ' → 최고의 시간!';
          if (a.friendResult === 'awkward') line += ' → 어색한 분위기';
        }
        return line;
      })
      .join('\n');

    const prompt = `You are a Korean university life narrator. Write vivid, specific micro-narrations for each activity.

Week ${week}/16 of the semester.
Player: 준비도=${stats.knowledge ?? 30}, 체력=${stats.health ?? 70}, 스트레스=${stats.stress ?? 20}, 인맥=${stats.social ?? 40}

Activities this week:
${actList}

For each activity, write a 1-2 sentence Korean narration describing what SPECIFICALLY happened. Be vivid and concrete — mention professor names, specific subjects, weather, food items, songs, etc.

CRITICAL: When an activity involves an NPC, adapt the tone based on the relationship:
- 모르는 사이/아는 사이: awkward, formal, getting-to-know-you vibes
- 친구: comfortable, fun banter, inside jokes starting to form
- 절친/베프: deep trust, vulnerable moments, real talk
- 관심/설렘 (romance): butterflies, blushing, reading too much into small gestures
- 연인/깊은 사랑: couple activities, pet names, comfortable intimacy
- If a date went awkward (어색), narrate the uncomfortable moment specifically
- If great chemistry (환상의 케미), narrate the magical connection

Also for each pair of consecutive activities in the same day, write a brief connector sentence (how the player moved from one activity to the next).

Respond ONLY in JSON:
{"narrations":["narration1","narration2",...], "connectors":["connector between act 1→2","connector between act 2→3",...]}

IMPORTANT: Write natural, casual Korean. Each narration must be unique and specific to the activity+week+relationship combination.`;

    const raw = await generateText({
      userPrompt: prompt,
      thinkingLevel: "minimal",
      maxRetries: 1,
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
    console.error("[activity-narration] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed" }, { status: 502 });
  }
}
