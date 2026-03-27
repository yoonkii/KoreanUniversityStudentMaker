/**
 * Inner Monologue System — VN-style character thoughts
 *
 * Generates contextual first-person thoughts based on current stats,
 * activity, and game state. Creates emotional depth and player
 * identification with their character.
 */

import type { PlayerStats } from '@/store/types';

interface MonologueEntry {
  text: string;
  condition: (stats: PlayerStats, week: number) => boolean;
  activityKeyword?: string; // Only show during matching activities
}

const MONOLOGUE_POOL: MonologueEntry[] = [
  // ─── Activity-specific thoughts ───
  { text: '집중... 집중... 이 공식만 이해하면 된다.', activityKeyword: '공부', condition: (s) => s.knowledge < 50 },
  { text: '요즘 공부가 좀 재밌어졌다. 이해되는 느낌이 좋아.', activityKeyword: '공부', condition: (s) => s.knowledge >= 60 },
  { text: '눈이 감긴다... 커피 한 잔 더 마셔야 하나.', activityKeyword: '공부', condition: (s) => s.stress > 60 },
  { text: '오늘 수업 진짜 재밌었다. 이런 날도 있구나.', activityKeyword: '수업', condition: (s) => s.knowledge > 40 },
  { text: '교수님 말씀이 하나도 안 들어온다... 졸리다.', activityKeyword: '수업', condition: (s) => s.stress > 50 },
  { text: '일하는 게 이렇게 힘든 줄 몰랐다.', activityKeyword: '알바', condition: (s) => s.health < 50 },
  { text: '오늘 팁 좀 받았다. 기분 좋다!', activityKeyword: '알바', condition: (s) => s.money < 200000 },
  { text: '운동 후에는 머리가 맑아지는 기분이다.', activityKeyword: '운동', condition: (s) => s.health >= 50 },
  { text: '힘들지만... 몸이 가벼워지는 느낌.', activityKeyword: '운동', condition: (s) => s.health < 40 },
  { text: '아무것도 안 하는 게 이렇게 행복할 줄이야.', activityKeyword: '휴식', condition: (s) => s.stress > 50 },
  { text: '좀 쉬니까 살 것 같다.', activityKeyword: '휴식', condition: (s) => s.health < 40 },
  { text: '같이 있으니까 즐겁다. 혼자였으면 우울했을 텐데.', activityKeyword: '친구', condition: (s) => s.social >= 30 },
  { text: '사람들이랑 있으면 에너지를 받는 것 같아.', activityKeyword: '친구', condition: (s) => s.social >= 50 },
  { text: '두근두근... 오늘 뭘 하면 좋을까.', activityKeyword: '데이트', condition: () => true },
  { text: '합주하니까 스트레스가 확 풀린다.', activityKeyword: '동아리', condition: (s) => s.stress > 30 },

  // ─── Stat-reactive thoughts (no activity keyword — can appear anytime) ───
  { text: '통장 잔고가 걱정이다... 이번 달 버틸 수 있을까.', condition: (s) => s.money < 50000 },
  { text: '요즘 너무 무리하는 건 아닌지...', condition: (s) => s.stress > 75 },
  { text: '건강이 안 좋다. 좀 쉬어야 하는데.', condition: (s) => s.health < 25 },
  { text: '요즘 혼자인 시간이 많다. 누군가 말 걸어줬으면.', condition: (s) => s.social < 20 },
  { text: '나름 잘 해나가고 있는 것 같다. 힘내자!', condition: (s) => s.knowledge >= 50 && s.stress < 50 },
  { text: '대학 생활, 생각보다 나쁘지 않다.', condition: (s) => s.social >= 40 && s.health >= 40 },

  // ─── Week-specific thoughts ───
  { text: '벌써 중간고사라니... 시간 진짜 빠르다.', condition: (_, w) => w === 7 },
  { text: '축제다! 오늘만큼은 즐기자.', condition: (_, w) => w === 9 },
  { text: '기말고사... 마지막 전투다. 할 수 있다.', condition: (_, w) => w === 14 },
  { text: '이번 학기도 거의 끝이구나. 참 빨랐다.', condition: (_, w) => w === 15 },
  { text: '첫 주... 다 새롭고 설레고 어색하다.', condition: (_, w) => w === 1 },
];

/**
 * Get a contextual inner monologue line for the current state.
 * Returns null ~50% of the time to avoid being too chatty.
 */
export function getInnerMonologue(
  stats: PlayerStats,
  week: number,
  activityName?: string,
): string | null {
  // 50% chance to show any monologue (keeps it special)
  if (Math.random() > 0.5) return null;

  // Filter eligible monologues
  const eligible = MONOLOGUE_POOL.filter(m => {
    if (!m.condition(stats, week)) return false;
    if (m.activityKeyword && activityName && !activityName.includes(m.activityKeyword)) return false;
    if (m.activityKeyword && !activityName) return false;
    return true;
  });

  if (eligible.length === 0) return null;

  // Pick one deterministically based on week + stats to avoid repeats
  const seed = week * 31 + Math.round(stats.stress) * 7 + (activityName?.length ?? 0);
  const idx = ((seed * 2654435761) >>> 0) % eligible.length;
  return eligible[idx].text;
}
