/**
 * Inner Monologue System — VN-style character thoughts
 *
 * Generates contextual first-person thoughts based on current stats,
 * activity, and game state. Creates emotional depth and player
 * identification with their character.
 */

import type { PlayerStats } from '@/store/types';
import { useGameStore } from '@/store/gameStore';

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

  // ─── Romance-reactive thoughts ───
  // These use charm as a proxy — actual romance checks happen in getInnerMonologue()
  { text: '같이 있는 시간이 너무 빨리 간다... 아쉽다.', activityKeyword: '데이트', condition: (s) => s.charm >= 40 },
  { text: '손 잡고 싶은데... 아직 그럴 용기가 안 난다.', activityKeyword: '데이트', condition: (s) => s.charm >= 30 },
  { text: '옆에서 웃는 모습이 너무 예쁘다. 자꾸 쳐다보게 돼.', activityKeyword: '데이트', condition: (s) => s.charm >= 40 },

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

// Memory-based monologues — reference past events
const MEMORY_MONOLOGUES: { trigger: string; text: string; minWeek: number }[] = [
  { trigger: 'MT', text: 'MT에서의 캠프파이어가 그립다. 그때가 좋았는데.', minWeek: 6 },
  { trigger: '축제', text: '축제 때 불꽃놀이, 아직도 눈에 선하다.', minWeek: 11 },
  { trigger: '중간고사', text: '중간고사 때 죽을 뻔했지... 그래도 살아남았다.', minWeek: 10 },
  { trigger: '생일', text: '재민이 생일에 케이크 먹던 거, 벌써 추억이 됐네.', minWeek: 8 },
  { trigger: '공연', text: '현우 선배 공연이 아직도 기억에 남는다.', minWeek: 15 },
];

/**
 * Get a contextual inner monologue line for the current state.
 * Returns null ~50% of the time to avoid being too chatty.
 */
export function getInnerMonologue(
  stats: PlayerStats,
  week: number,
  activityName?: string,
  eventHistory?: { week: number; summary: string }[],
): string | null {
  // 50% chance to show any monologue (keeps it special)
  if (Math.random() > 0.5) return null;

  // 25% chance of romance-aware monologue (when in a romance)
  const rels = useGameStore.getState().relationships;
  const NPC_KO: Record<string, string> = { jaemin: '재민', minji: '민지', soyeon: '소연 선배', hyunwoo: '현우 선배' };
  const romPartner = Object.entries(rels)
    .filter(([id, r]) => (r.romance ?? 0) >= 10 && NPC_KO[id])
    .sort(([, a], [, b]) => (b.romance ?? 0) - (a.romance ?? 0))[0];

  if (romPartner && Math.random() < 0.25) {
    const name = NPC_KO[romPartner[0]];
    const rom = romPartner[1].romance ?? 0;
    const ROMANCE_THOUGHTS: string[] = rom >= 45
      ? [`${name}... 보고 싶다. 빨리 수업 끝났으면.`,
         `${name}이(가) 웃는 얼굴이 자꾸 떠오른다. 집중이 안 돼.`,
         `내일은 ${name}이(가)랑 뭐 하지? 벌써 설레.`]
      : rom >= 25
      ? [`${name} 생각하면 심장이 뛴다. 이게 뭐지...`,
         `자꾸 ${name} 쪽을 보게 된다. 들키면 어쩌지.`,
         `${name}이(가) 나한테 웃어줬는데... 그게 자꾸 생각나.`]
      : [`${name}이(가) 왜 자꾸 신경 쓰이지?`,
         `오늘 ${name}을(를) 마주치면 좋겠다.`];
    const seed = week * 17 + Math.round(stats.charm);
    return ROMANCE_THOUGHTS[seed % ROMANCE_THOUGHTS.length];
  }

  // 20% chance of memory-based monologue (references past events)
  if (eventHistory && eventHistory.length > 0 && Math.random() < 0.2) {
    for (const mem of MEMORY_MONOLOGUES) {
      if (week >= mem.minWeek && eventHistory.some(e => e.summary.includes(mem.trigger))) {
        return mem.text;
      }
    }
  }

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
