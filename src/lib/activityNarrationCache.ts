/**
 * Activity Narration Cache — Gemini generates vivid micro-stories
 * for each activity slot. One API call per week, cached.
 */

import type { PlayerStats, CharacterRelationship } from '@/store/types';
import type { DayGroup } from '@/components/game/ActionPhase';
import { logAIThought } from './aiThoughtsLog';

export interface AIEvent {
  activityIndex: number;
  text: string;
  choices: { label: string; effects: Record<string, number> }[];
}

interface NarrationData {
  narrations: string[];
  connectors: string[];
  events?: AIEvent[];
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
  relationships?: Record<string, CharacterRelationship>,
): void {
  if (cache?.week === week) return;
  if (fetching) return;
  fetching = true;

  const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일'];
  const TIME_KO: Record<string, string> = { morning: '오전', afternoon: '오후', evening: '저녁' };

  // Friendship/romance tier labels for Gemini context
  const FRIEND_TIERS = ['모르는 사이', '아는 사이', '친구', '절친', '베프'];
  const ROMANCE_TIERS = ['없음', '관심', '설렘', '연인', '깊은 사랑'];
  function getFTier(f: number) { return FRIEND_TIERS[f >= 80 ? 4 : f >= 60 ? 3 : f >= 40 ? 2 : f >= 20 ? 1 : 0]; }
  function getRTier(r: number) { return ROMANCE_TIERS[r >= 70 ? 4 : r >= 45 ? 3 : r >= 25 ? 2 : r >= 10 ? 1 : 0]; }

  const activities = days.flatMap((day, di) =>
    day.activities.map(act => {
      const rel = act.targetNpcId && relationships ? relationships[act.targetNpcId] : undefined;
      const dateOutcome = act.dateOutcome;
      const friendOutcome = act.friendOutcome;
      return {
        day: DAY_NAMES[di] ?? day.dayName,
        timeSlot: TIME_KO[act.timeSlot] ?? act.timeSlot,
        activityName: act.name,
        targetNpc: act.targetNpcName,
        // Relationship context for Gemini
        relContext: rel ? {
          friendshipTier: getFTier(rel.friendship ?? rel.affection ?? 0),
          romanceTier: getRTier(rel.romance ?? 0),
        } : undefined,
        dateResult: dateOutcome?.type,
        friendResult: friendOutcome?.type,
      };
    })
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
        // Log to AI thoughts
        const sampleNarration = data.narrations?.[0] ?? '(no narration)';
        logAIThought('narration', `${week}주차 활동 나레이션 생성 (${data.narrations?.length ?? 0}개)`, sampleNarration);
        if (data.events?.length) {
          logAIThought('director', `${week}주차 AI 이벤트 생성 (${data.events.length}개)`, data.events[0]?.text ?? '(event)');
        }
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
 * Get AI-generated event for a specific activity index.
 * Returns null if no event was generated for this activity.
 */
export function getAIEvent(week: number, activityIndex: number): AIEvent | null {
  const data = getCachedNarrations(week);
  return data?.events?.find(e => e.activityIndex === activityIndex) ?? null;
}

/**
 * Get connector text between two activities.
 */
export function getConnector(week: number, connectorIndex: number): string | null {
  const data = getCachedNarrations(week);
  return data?.connectors?.[connectorIndex] ?? null;
}
