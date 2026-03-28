/**
 * AI-Generated Weekly Challenges — Gemini creates personalized goals.
 *
 * Each week, the "AI director" sets 1-2 challenges based on the player's
 * current stats and relationships. Completing a challenge gives bonus
 * stats. This creates dynamic replayability — every playthrough gets
 * different goals based on the player's unique trajectory.
 *
 * Examples:
 * - "이번 주 재민이랑 2번 이상 만나기" (relationship-focused)
 * - "스트레스 40 이하로 유지하기" (stat-maintenance)
 * - "데이트 성공하기" (romance challenge)
 * - "도서관 3회 이상 방문" (consistency challenge)
 */

import type { PlayerStats, CharacterRelationship } from '@/store/types';
import { logAIThought } from './aiThoughtsLog';

export interface WeeklyChallenge {
  id: string;
  text: string;
  emoji: string;
  type: 'stat' | 'relationship' | 'activity' | 'romance';
  reward: Partial<PlayerStats>;
  // Completion check function — called at end of week
  check: (stats: PlayerStats, prevStats: PlayerStats, rels: Record<string, CharacterRelationship>, prevRels: Record<string, CharacterRelationship>) => boolean;
}

const NPC_KO: Record<string, string> = { jaemin: '재민', minji: '민지', soyeon: '소연 선배', hyunwoo: '현우 선배' };

/**
 * Generate 1-2 challenges for the upcoming week.
 * Deterministic based on week + stats (so they don't change on re-render).
 */
export function generateWeeklyChallenges(
  week: number,
  stats: PlayerStats,
  relationships: Record<string, CharacterRelationship>,
): WeeklyChallenge[] {
  const challenges: WeeklyChallenge[] = [];
  const seed = week * 31 + Math.round(stats.knowledge) * 7;

  // ─── Stat challenges ───
  if (stats.stress > 60) {
    challenges.push({
      id: `w${week}_stress`,
      text: '이번 주 스트레스 50 이하로 유지하기',
      emoji: '🧘',
      type: 'stat',
      reward: { stress: -5, health: 3 },
      check: (s) => s.stress <= 50,
    });
  } else if (stats.knowledge < 40 && week >= 5) {
    challenges.push({
      id: `w${week}_study`,
      text: '준비도 5 이상 올리기',
      emoji: '📚',
      type: 'stat',
      reward: { knowledge: 3 },
      check: (s, prev) => s.knowledge >= prev.knowledge + 5,
    });
  } else if (stats.health < 40) {
    challenges.push({
      id: `w${week}_health`,
      text: '체력 50 이상으로 회복하기',
      emoji: '💪',
      type: 'stat',
      reward: { health: 5, stress: -3 },
      check: (s) => s.health >= 50,
    });
  } else if (stats.charm < 30 && week >= 3) {
    challenges.push({
      id: `w${week}_charm`,
      text: '매력 3 이상 올리기',
      emoji: '✨',
      type: 'stat',
      reward: { charm: 3, social: 2 },
      check: (s, prev) => s.charm >= prev.charm + 3,
    });
  }

  // ─── Relationship challenges ───
  const lowestFriendNpc = Object.entries(relationships)
    .filter(([id]) => NPC_KO[id])
    .sort(([, a], [, b]) => (a.friendship ?? a.affection ?? 0) - (b.friendship ?? b.affection ?? 0))[0];

  if (lowestFriendNpc && (lowestFriendNpc[1].friendship ?? lowestFriendNpc[1].affection ?? 0) < 30 && seed % 3 === 0) {
    const name = NPC_KO[lowestFriendNpc[0]];
    challenges.push({
      id: `w${week}_friend_${lowestFriendNpc[0]}`,
      text: `${name}과(와) 우정 높이기`,
      emoji: '🤝',
      type: 'relationship',
      reward: { social: 3, stress: -2 },
      check: (_s, _ps, rels, prevRels) => {
        const curr = rels[lowestFriendNpc[0]]?.friendship ?? rels[lowestFriendNpc[0]]?.affection ?? 0;
        const prev = prevRels[lowestFriendNpc[0]]?.friendship ?? prevRels[lowestFriendNpc[0]]?.affection ?? 0;
        return curr > prev;
      },
    });
  }

  // ─── Romance challenges ───
  const romanceNpc = Object.entries(relationships)
    .find(([, r]) => (r.romance ?? 0) >= 10 && (r.romance ?? 0) < 45);

  if (romanceNpc && seed % 2 === 0) {
    const name = NPC_KO[romanceNpc[0]];
    challenges.push({
      id: `w${week}_romance`,
      text: `${name}과(와) 데이트 성공하기`,
      emoji: '💕',
      type: 'romance',
      reward: { charm: 3, stress: -5 },
      check: (_s, _ps, rels, prevRels) => {
        const curr = rels[romanceNpc[0]]?.romance ?? 0;
        const prev = prevRels[romanceNpc[0]]?.romance ?? 0;
        return curr > prev;
      },
    });
  }

  // Max 2 challenges per week
  const selected = challenges.slice(0, 2);
  if (selected.length > 0) {
    logAIThought('director', `${week}주차 챌린지 생성`, selected.map(c => `${c.emoji} ${c.text}`).join(' | '));
  }
  return selected;
}

/**
 * Check which challenges were completed and return rewards.
 */
export function checkChallengeCompletion(
  challenges: WeeklyChallenge[],
  stats: PlayerStats,
  prevStats: PlayerStats,
  rels: Record<string, CharacterRelationship>,
  prevRels: Record<string, CharacterRelationship>,
): { completed: WeeklyChallenge[]; totalReward: Partial<PlayerStats> } {
  const completed = challenges.filter(c => c.check(stats, prevStats, rels, prevRels));
  const totalReward: Partial<PlayerStats> = {};

  for (const c of completed) {
    for (const [k, v] of Object.entries(c.reward)) {
      if (v !== undefined) {
        totalReward[k as keyof PlayerStats] = (totalReward[k as keyof PlayerStats] ?? 0) + v;
      }
    }
  }

  if (completed.length > 0) {
    logAIThought('director', '챌린지 완료!', completed.map(c => `${c.emoji} ${c.text}`).join(' | '));
  }

  return { completed, totalReward };
}
