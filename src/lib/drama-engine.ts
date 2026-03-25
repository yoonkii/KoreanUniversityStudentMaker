import type { PlayerStats, CharacterRelationship } from '@/store/types';

export interface DramaTrigger {
  id: string;
  condition: (
    stats: PlayerStats,
    prevStats: PlayerStats | null,
    relationships: Record<string, CharacterRelationship>,
    week: number,
  ) => boolean;
  event: string;
  emoji: string;
  effect?: Partial<PlayerStats>;
  npcInvolved?: string;
}

export interface DramaEvent {
  id: string;
  event: string;
  emoji: string;
  effect?: Partial<PlayerStats>;
  npcInvolved?: string;
}

export const DRAMA_TRIGGERS: DramaTrigger[] = [
  {
    id: 'burnout',
    condition: (stats, prevStats) =>
      stats.stress > 70 && (prevStats?.stress ?? 0) > 70,
    event: '번아웃 위기! 몸이 말을 듣지 않는다...',
    emoji: '😮‍💨',
    effect: { health: -10, stress: -5 },
  },
  {
    id: 'double_date',
    condition: (_, __, relationships) =>
      (relationships['soyeon']?.affection ?? 0) > 60 &&
      (relationships['jaemin']?.affection ?? 0) > 60,
    event: '소연이와 재민이가 같은 날 약속을 잡았다...',
    emoji: '😅',
    npcInvolved: '소연/재민',
  },
  {
    id: 'broke',
    condition: (stats) => stats.money < 10000,
    event: '통장 잔고가 바닥났다. 이번 달 월세를 어떻게...',
    emoji: '💸',
    effect: { stress: 15, social: -5 },
  },
  {
    id: 'gpa_drop',
    condition: (stats, prevStats) =>
      prevStats !== null && stats.gpa < prevStats.gpa - 5,
    event: '교수님이 면담을 요청했다.',
    emoji: '📝',
    effect: { stress: 10 },
    npcInvolved: 'prof-kim',
  },
  {
    id: 'health_crisis',
    condition: (stats) => stats.health < 20,
    event: '몸이 너무 지쳤다. 학교 보건실에 실려갔다.',
    emoji: '🏥',
    effect: { health: 10, stress: 20, social: -10 },
  },
  {
    id: 'social_isolation',
    condition: (stats, _, __, week) => stats.social < 20 && week > 4,
    event: '아무도 나를 찾지 않는다. 혼자인 게 이렇게 외로울 줄 몰랐다.',
    emoji: '😔',
    effect: { stress: 8, charm: -5 },
  },
  {
    id: 'charm_spike',
    condition: (stats) => stats.charm > 80,
    event: '갑자기 주변에서 시선이 쏟아진다. 소문이 났나...?',
    emoji: '✨',
    npcInvolved: 'soyeon',
  },
  {
    id: 'midterm_pressure',
    condition: (_, __, ___, week) => week === 7,
    event: '중간고사가 다가온다. 도서관에 빈 자리가 없다.',
    emoji: '📚',
    effect: { stress: 10 },
  },
  {
    id: 'finals_approach',
    condition: (_, __, ___, week) => week === 14,
    event: '기말고사 2주 전. 캠퍼스 분위기가 살벌해졌다.',
    emoji: '😰',
    effect: { stress: 15 },
  },
];

/**
 * Check drama triggers and return the first matching event not in excludeIds.
 * Pass the last triggered ID in excludeIds to avoid repeating consecutive events.
 */
export function checkDramaTriggers(
  stats: PlayerStats,
  prevStats: PlayerStats | null,
  relationships: Record<string, CharacterRelationship>,
  week: number,
  excludeIds: string[],
): DramaEvent | null {
  for (const trigger of DRAMA_TRIGGERS) {
    if (excludeIds.includes(trigger.id)) continue;
    if (trigger.condition(stats, prevStats, relationships, week)) {
      return {
        id: trigger.id,
        event: trigger.event,
        emoji: trigger.emoji,
        effect: trigger.effect,
        npcInvolved: trigger.npcInvolved,
      };
    }
  }
  return null;
}

export type DramaLevel = 'low' | 'medium' | 'high';

export function getDramaLevel(
  stress: number,
  health: number,
  money: number,
  week: number,
): { emoji: string; label: string; level: DramaLevel } {
  const score =
    stress * 0.4 +
    (100 - health) * 0.3 +
    week * 2 +
    (money < 50000 ? 20 : 0);

  if (score >= 70) return { emoji: '😱', label: '폭풍전야!', level: 'high' };
  if (score >= 40) return { emoji: '😮', label: '뭔가 일어날 것 같은...', level: 'medium' };
  return { emoji: '😊', label: '평화로운 나날', level: 'low' };
}

export const RELATIONSHIP_MILESTONES: { threshold: number; emoji: string; template: string }[] = [
  { threshold: 30, emoji: '🤝', template: '와(과) 친해졌다!' },
  { threshold: 60, emoji: '💛', template: '이(가) 당신을 특별하게 생각한다' },
  { threshold: 90, emoji: '💕', template: '와(과) 깊은 유대감이 생겼다' },
];

export function checkRelationshipMilestone(
  oldAffection: number,
  newAffection: number,
): { threshold: number; emoji: string; template: string } | null {
  for (const milestone of RELATIONSHIP_MILESTONES) {
    if (oldAffection < milestone.threshold && newAffection >= milestone.threshold) {
      return milestone;
    }
  }
  return null;
}
