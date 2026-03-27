import { NextResponse } from "next/server";
import { generateText } from "../_shared/ai-client";

interface ActivityNarrationRequest {
  activities: { day: string; timeSlot: string; activityName: string; targetNpc?: string }[];
  week: number;
  stats: Record<string, number>;
}

export async function POST(request: Request) {
  try {
    const body: ActivityNarrationRequest = await request.json();
    const { activities, week, stats } = body;

    const actList = activities
      .map((a, i) => `${i + 1}. ${a.day} ${a.timeSlot}: ${a.activityName}${a.targetNpc ? ` (with ${a.targetNpc})` : ''}`)
      .join('\n');

    const prompt = `You are a Korean university life narrator. Write vivid, specific micro-narrations for each activity.

Week ${week}/16 of the semester.
Player: 준비도=${stats.knowledge ?? 30}, 체력=${stats.health ?? 70}, 스트레스=${stats.stress ?? 20}, 인맥=${stats.social ?? 40}

Activities this week:
${actList}

For each activity, write a 1-2 sentence Korean narration describing what SPECIFICALLY happened. Be vivid and concrete — mention professor names, specific subjects, weather, food items, songs, etc.

Also for each pair of consecutive activities in the same day, write a brief connector sentence (how the player moved from one activity to the next).

Respond ONLY in JSON:
{"narrations":["narration1","narration2",...], "connectors":["connector between act 1→2","connector between act 2→3",...]}

IMPORTANT: Write natural, casual Korean. Each narration must be unique and specific to the activity+week combination.`;

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
