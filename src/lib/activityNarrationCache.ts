/**
 * Activity Narration Cache — Gemini generates vivid micro-stories
 * for each activity slot. One API call per week, cached.
 */

import type { PlayerStats } from '@/store/types';
import type { DayGroup } from '@/components/game/ActionPhase';

interface NarrationData {
  narrations: string[];
  connectors: string[];
}

let cache: { week: number; data: NarrationData } | null = null;
let fetching = false;

export function getCachedNarrations(week: number): NarrationData | null {
  return cache?.week === week ? cache.data : null;
}

export function triggerNarrationGeneration(
  days: DayGroup[],
  week: number,
  stats: PlayerStats,
): void {
  if (cache?.week === week) return;
  if (fetching) return;
  fetching = true;

  const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일'];
  const TIME_KO: Record<string, string> = { morning: '오전', afternoon: '오후', evening: '저녁' };

  const activities = days.flatMap((day, di) =>
    day.activities.map(act => ({
      day: DAY_NAMES[di] ?? day.dayName,
      timeSlot: TIME_KO[act.timeSlot] ?? act.timeSlot,
      activityName: act.name,
      targetNpc: act.targetNpcName,
    }))
  );

  fetch('/api/ai/activity-narration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activities, week, stats: { knowledge: stats.knowledge, health: stats.health, stress: stats.stress, social: stats.social } }),
    signal: AbortSignal.timeout(10000),
  })
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (data?.narrations) {
        cache = { week, data };
      }
    })
    .catch(() => {})
    .finally(() => { fetching = false; });
}

/**
 * Get narration for a specific activity index.
 */
export function getNarration(week: number, activityIndex: number): string | null {
  const data = getCachedNarrations(week);
  return data?.narrations?.[activityIndex] ?? null;
}

/**
 * Get connector text between two activities.
 */
export function getConnector(week: number, connectorIndex: number): string | null {
  const data = getCachedNarrations(week);
  return data?.connectors?.[connectorIndex] ?? null;
}
