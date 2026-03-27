import { NextResponse } from "next/server";
import { generateText } from "../_shared/ai-client";
import type { PlayerStats, WeekSchedule, CharacterRelationship } from "@/store/types";

interface ContextualSceneRequest {
  schedule: WeekSchedule;
  playerStats: PlayerStats;
  currentWeek: number;
  relationships: Record<string, CharacterRelationship>;
}

export async function POST(request: Request) {
  try {
    const body: ContextualSceneRequest = await request.json();
    const { schedule, playerStats, currentWeek, relationships } = body;

    // Build a simple schedule summary
    const scheduleEntries: string[] = [];
    const DAY_KO: Record<string, string> = { monday: '월', tuesday: '화', wednesday: '수', thursday: '목', friday: '금', saturday: '토', sunday: '일' };
    for (const [day, slots] of Object.entries(schedule)) {
      if (!Array.isArray(slots)) continue;
      for (const slot of slots) {
        scheduleEntries.push(`${DAY_KO[day] ?? day} ${slot.timeSlot}: ${slot.activityId}`);
      }
    }

    const relSummary = Object.entries(relationships)
      .filter(([, r]) => r && typeof r === 'object')
      .map(([id, r]) => `${id}:${r.affection ?? 0}`)
      .join(', ');

    const prompt = `You are a Korean university life game scene writer.

Week ${currentWeek}/16.
Player: 준비도=${playerStats.knowledge ?? 50}, 체력=${playerStats.health ?? 70}, 스트레스=${playerStats.stress ?? 20}, 인맥=${playerStats.social ?? 40}, 돈=${playerStats.money ?? 300000}
Schedule: ${scheduleEntries.slice(0, 10).join(', ')}
Relationships: ${relSummary || 'none'}

Write a short VN scene (4-6 lines of dialogue) about what happened this week, based on the schedule. Use Korean.

Characters available: jaemin (이재민, roommate), minji (한민지, rival), soyeon (박소연, senior), hyunwoo (정현우, club senior), prof-kim (김교수)

Respond ONLY with valid JSON (no markdown, no explanation):
{"id":"ai_w${currentWeek}","location":"campus","backgroundVariant":"day","characters":[{"characterId":"jaemin","expression":"happy","position":"center"}],"dialogue":[{"characterId":null,"text":"나레이션"},{"characterId":"jaemin","text":"대사"}],"choices":[{"id":"c1","text":"선택1","statEffects":{"knowledge":2}},{"id":"c2","text":"선택2","statEffects":{"social":3,"stress":2}}]}`;

    console.log("[contextual-scene] Calling Gemini...");
    const raw = await generateText({
      userPrompt: prompt,
      thinkingLevel: "minimal",
      maxRetries: 1, // Faster failure for better UX
    });
    console.log("[contextual-scene] Got response, length:", raw.length);

    if (!raw.trim()) {
      console.error("[contextual-scene] Empty response");
      return NextResponse.json({ error: "Empty response" }, { status: 502 });
    }

    // Parse JSON
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Try extracting JSON from markdown fences or surrounding text
      const jsonMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/) ?? raw.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
        } catch (e2) {
          console.error("[contextual-scene] JSON parse failed after extraction:", (e2 as Error).message, "raw:", raw.slice(0, 200));
          return NextResponse.json({ error: "Parse failed" }, { status: 502 });
        }
      } else {
        console.error("[contextual-scene] No JSON found in response:", raw.slice(0, 200));
        return NextResponse.json({ error: "No JSON in response" }, { status: 502 });
      }
    }

    console.log("[contextual-scene] Success, scene id:", parsed.id);
    return NextResponse.json(parsed);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[contextual-scene] ERROR:", msg);
    return NextResponse.json(
      { error: msg },
      { status: 502 },
    );
  }
}
