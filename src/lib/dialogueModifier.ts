/**
 * Dialogue Modifier — adjusts NPC dialogue tone based on relationship level
 *
 * Instead of writing multiple dialogue variants per scene, this system
 * dynamically adds/replaces small tone markers in dialogue text based
 * on how close the player is to the speaking NPC.
 *
 * VN pattern: same scene, different feel based on relationship.
 */

import type { CharacterRelationship } from '@/store/types';

interface ToneModifier {
  /** Prefix added before NPC's first line (relationship-dependent greeting) */
  greeting: string;
  /** Suffix/reaction text added after key lines */
  reaction: string;
}

const NPC_TONE: Record<string, Record<string, ToneModifier>> = {
  jaemin: {
    stranger: { greeting: '', reaction: '' },
    acquaintance: { greeting: '', reaction: '' },
    friend: { greeting: '(재민이가 반갑게 손을 흔든다) ', reaction: '' },
    close_friend: { greeting: '(재민이가 팔을 두르며 다가온다) ', reaction: ' 재민이가 편하게 웃었다.' },
    soulmate: { greeting: '(재민이가 "야 왔어?" 하며 자연스럽게 옆에 앉는다) ', reaction: ' 말 없이도 통하는 사이다.' },
  },
  minji: {
    stranger: { greeting: '', reaction: '' },
    acquaintance: { greeting: '(민지가 잠깐 눈을 마주친다) ', reaction: '' },
    friend: { greeting: '(민지가 고개를 끄덕이며 인사한다) ', reaction: '' },
    close_friend: { greeting: '(민지가 살짝 미소 짓는다 — 흔한 일이 아니다) ', reaction: ' 민지의 눈이 부드러워졌다.' },
    soulmate: { greeting: '(민지가 "왔어?" 하며 자리를 비켜준다) ', reaction: ' 경쟁자이자 가장 든든한 동료.' },
  },
  soyeon: {
    stranger: { greeting: '', reaction: '' },
    acquaintance: { greeting: '(소연 선배가 가볍게 인사한다) ', reaction: '' },
    friend: { greeting: '(소연 선배가 따뜻하게 웃으며 다가온다) ', reaction: '' },
    close_friend: { greeting: '(소연 선배가 "우리 후배~" 하며 반겨준다) ', reaction: ' 선배의 따뜻함이 전해진다.' },
    soulmate: { greeting: '(소연 선배가 "보고 싶었어" 하며 팔짱을 낀다) ', reaction: ' 선배 이상의 존재.' },
  },
  hyunwoo: {
    stranger: { greeting: '', reaction: '' },
    acquaintance: { greeting: '(현우가 "어, 왔어?" 한다) ', reaction: '' },
    friend: { greeting: '(현우가 쿨하게 인사한다) ', reaction: '' },
    close_friend: { greeting: '(현우가 주먹 인사를 건넨다 👊) ', reaction: ' 현우 특유의 편안함.' },
    soulmate: { greeting: '(현우: "야 기다렸어!") ', reaction: ' 이 형, 진짜 좋은 사람이다.' },
  },
};

function getTier(affection: number): string {
  if (affection >= 90) return 'soulmate';
  if (affection >= 70) return 'close_friend';
  if (affection >= 50) return 'friend';
  if (affection >= 25) return 'acquaintance';
  return 'stranger';
}

/**
 * Get a greeting prefix for an NPC based on relationship level.
 * Returns empty string if no modifier applies.
 */
export function getRelationshipGreeting(
  characterId: string,
  relationships: Record<string, CharacterRelationship>,
): string {
  const rel = relationships[characterId];
  if (!rel) return '';
  const tier = getTier(rel.affection);
  return NPC_TONE[characterId]?.[tier]?.greeting ?? '';
}

/**
 * Get a reaction suffix for an NPC based on relationship level.
 */
export function getRelationshipReaction(
  characterId: string,
  relationships: Record<string, CharacterRelationship>,
): string {
  const rel = relationships[characterId];
  if (!rel) return '';
  const tier = getTier(rel.affection);
  return NPC_TONE[characterId]?.[tier]?.reaction ?? '';
}

/**
 * Get a memory callback insertion — an NPC referencing a shared experience.
 * Returns null 70% of the time to keep it special.
 */
export function getMemoryCallback(
  characterId: string,
  relationships: Record<string, CharacterRelationship>,
): string | null {
  const rel = relationships[characterId];
  if (!rel || !rel.memories || rel.memories.length === 0) return null;
  // Only trigger 30% of the time
  if (Math.random() > 0.3) return null;

  const lastMemory = rel.memories[rel.memories.length - 1];
  const MEMORY_CALLBACKS: Record<string, Record<string, string>> = {
    jaemin: {
      hangout: '(재민이가 웃으며) 저번에 같이 놀았던 거 진짜 재밌었어!',
      date: '(재민이가 눈을 피하며) 그... 저번에 둘이 갔던 거... 또 가자.',
      studied: '(재민이) 같이 공부했던 거 도움 많이 됐어, 고마워.',
      club: '(재민이) 동아리에서 같이한 거 기억나? 좋았어.',
    },
    minji: {
      hangout: '(민지가 약간 웃으며) ...저번에 같이 있었던 거, 나쁘지 않았어.',
      date: '(민지가 살짝 붉어지며) 그때... 좋았어. 솔직히.',
      studied: '(민지) 같이 공부할 때 집중이 잘 됐어. 또 하자.',
      club: '(민지) 동아리에서 봤을 때 의외였어. 그런 면도 있구나.',
    },
    soyeon: {
      hangout: '(소연 선배가 미소 지으며) 저번에 같이 밥 먹은 거 즐거웠어~',
      date: '(소연 선배가 부드럽게) 그때 같이 걸었던 거... 기억나.',
      studied: '(소연 선배) 같이 공부하니까 효율 좋더라? 후배가 열심히 하니 기특해.',
      club: '(소연 선배) 동아리에서 열심히 하는 모습 보기 좋았어.',
    },
    hyunwoo: {
      hangout: '(현우가 주먹을 내밀며) 저번에 같이 논 거 최고였어!',
      date: '(현우가 쿨하게) 다음에 또 가자. 좋은 데 알아.',
      studied: '(현우) 너 공부도 잘하더라. 의외인데?',
      club: '(현우) 합주할 때 호흡 잘 맞았어. 역시!',
    },
  };

  const npcCallbacks = MEMORY_CALLBACKS[characterId];
  if (!npcCallbacks) return null;

  // Extract memory type from tag (e.g., "hangout_w5" → "hangout")
  const memType = lastMemory.split('_')[0];
  return npcCallbacks[memType] ?? null;
}

/**
 * Get a bonus affection line — extra dialogue only for high-affection NPCs.
 * These create an exclusive "deep relationship" experience.
 */
export function getAffectionBonusLine(
  characterId: string,
  relationships: Record<string, CharacterRelationship>,
): string | null {
  const rel = relationships[characterId];
  if (!rel) return null;

  // Only for close friends (70+) or soulmates (90+)
  if (rel.affection < 70) return null;

  // 25% chance to trigger
  if (Math.random() > 0.25) return null;

  const BONUS_LINES: Record<string, Record<string, string[]>> = {
    jaemin: {
      close_friend: [
        '(재민이가 조용히) 야... 너 옆에 있으면 편해. 진짜야.',
        '(재민이) 솔직히 너 없으면 이 학기 못 버텼을 거야.',
      ],
      soulmate: [
        '(재민이가 진지하게) 졸업해도 우리 연락하자. 약속.',
        '(재민이) 네가 내 대학 생활 최고의 선택이야.',
      ],
    },
    minji: {
      close_friend: [
        '(민지가 작게) ...고마워. 네가 있어서 외롭지 않았어.',
        '(민지) 너 아니었으면 공부만 했을 텐데. 다행이야.',
      ],
      soulmate: [
        '(민지가 진심으로) 처음엔 라이벌인 줄 알았는데... 지금은 달라.',
        '(민지) 앞으로도... 계속 곁에 있어 줄 거지?',
      ],
    },
    soyeon: {
      close_friend: [
        '(소연 선배) 이런 후배 만나서 선배 생활이 행복해.',
        '(소연 선배가 웃으며) 너를 가르치는 건 내 대학 생활 최고의 경험이야.',
      ],
      soulmate: [
        '(소연 선배가 눈가를 훔치며) 졸업하면... 정말 보고 싶을 거야.',
        '(소연 선배) 후배가 아니라 동생 같아. 진짜 소중해.',
      ],
    },
    hyunwoo: {
      close_friend: [
        '(현우가 진지하게) 너 때문에 동아리가 더 재밌어졌어.',
        '(현우) 졸업 공연, 너한테 꼭 보여주고 싶어.',
      ],
      soulmate: [
        '(현우가 기타를 내려놓으며) 너를 위한 곡을 쓰고 있어.',
        '(현우) 네가 없는 동아리는 상상이 안 돼.',
      ],
    },
  };

  const tier = rel.affection >= 90 ? 'soulmate' : 'close_friend';
  const lines = BONUS_LINES[characterId]?.[tier];
  if (!lines || lines.length === 0) return null;
  return lines[Math.floor(Math.random() * lines.length)];
}
