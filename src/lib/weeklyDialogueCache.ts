/**
 * Weekly Dialogue Cache — generates contextual NPC dialogue via a single
 * Gemini API call per week, then caches for the entire week.
 *
 * Cost: ~1 API call per week (not per activity or per NPC).
 * Fallback: hardcoded dialogue if API unavailable.
 */

import type { PlayerStats, CharacterRelationship } from '@/store/types';
import { logAIThought } from './aiThoughtsLog';

export interface WeeklyDialogue {
  week: number;
  npcLines: Record<string, string[]>; // npcId → array of contextual lines
  campusAtmosphere: string; // One-line description of campus mood this week
  generatedAt: number;
}

let cachedDialogue: WeeklyDialogue | null = null;
let fetchPromise: Promise<WeeklyDialogue | null> | null = null;

/**
 * Get cached weekly dialogue, or trigger generation if needed.
 * Returns immediately with cached data or null (non-blocking).
 */
export function getCachedDialogue(week: number): WeeklyDialogue | null {
  if (cachedDialogue && cachedDialogue.week === week) {
    return cachedDialogue;
  }
  return null;
}

/**
 * Trigger background generation of weekly dialogue via Gemini.
 * Only one request in flight at a time.
 */
export function triggerDialogueGeneration(
  week: number,
  stats: PlayerStats,
  relationships: Record<string, CharacterRelationship>,
): void {
  if (cachedDialogue?.week === week) return; // Already have this week
  if (fetchPromise) return; // Already fetching

  fetchPromise = generateWeeklyDialogue(week, stats, relationships)
    .then((result) => {
      if (result) {
        cachedDialogue = result;
        const npcCount = Object.keys(result.npcLines).length;
        const sample = Object.values(result.npcLines)[0]?.[0] ?? '';
        logAIThought('dialogue', `${week}주차 NPC 대화 생성 (${npcCount}명)`, sample);
        if (result.campusAtmosphere) logAIThought('campus', '주간 캠퍼스 분위기', result.campusAtmosphere);
      }
      fetchPromise = null;
      return result;
    })
    .catch(() => {
      fetchPromise = null;
      return null;
    });
}

/**
 * Get a contextual NPC line for a specific NPC.
 * Uses cached Gemini dialogue if available, falls back to hardcoded.
 */
export function getNpcContextualLine(
  npcId: string,
  week: number,
  activityName: string,
): string | null {
  const cache = getCachedDialogue(week);
  if (!cache) return null;

  const lines = cache.npcLines[npcId];
  if (!lines || lines.length === 0) return null;

  // Pick a line based on activity for variety
  const idx = (activityName.length + week) % lines.length;
  return lines[idx];
}

async function generateWeeklyDialogue(
  week: number,
  stats: PlayerStats,
  relationships: Record<string, CharacterRelationship>,
): Promise<WeeklyDialogue | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const relSummary = Object.entries(relationships)
      .map(([id, r]) => `${id}: 호감도 ${r.affection}, 만남 ${r.encounters}회`)
      .join(', ');

    const response = await fetch('/api/ai/weekly-dialogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        week,
        stats: {
          knowledge: stats.knowledge,
          health: stats.health,
          stress: stats.stress,
          social: stats.social,
          money: stats.money,
          charm: stats.charm,
        },
        relationships: relSummary,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    return {
      week,
      npcLines: data.npcLines ?? {},
      campusAtmosphere: data.campusAtmosphere ?? '',
      generatedAt: Date.now(),
    };
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}
