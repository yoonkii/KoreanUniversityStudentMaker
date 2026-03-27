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
