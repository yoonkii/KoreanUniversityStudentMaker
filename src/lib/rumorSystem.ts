/**
 * Rumor System — campus reputation based on player actions
 *
 * Player actions generate rumors that spread across campus.
 * Rumors affect how NPCs perceive you and create emergent storytelling.
 * Each rumor has a type, intensity, and decay timer.
 */

import type { PlayerStats, CharacterRelationship } from '@/store/types';

export interface CampusRumor {
  id: string;
  text: string;
  type: 'positive' | 'negative' | 'neutral';
  source: string; // Where the rumor originated
}

/**
 * Generate campus rumors based on player's current stats and actions.
 * Called once per week, returns 0-2 rumors.
 */
export function generateRumors(
  week: number,
  stats: PlayerStats,
  relationships: Record<string, CharacterRelationship>,
): CampusRumor[] {
  const rumors: CampusRumor[] = [];

  // Academic reputation
  if (stats.knowledge >= 75) {
    rumors.push({
      id: 'smart_student',
      text: '"그 학생 진짜 공부 잘한다더라. 교수님도 이름 알아." — 에브리타임',
      type: 'positive',
      source: '에브리타임',
    });
  } else if (stats.knowledge <= 20 && week >= 6) {
    rumors.push({
      id: 'slacker',
      text: '"걔 수업 맨날 빠지던데... 괜찮을까?" — 과 단톡방',
      type: 'negative',
      source: '과 단톡방',
    });
  }

  // Social reputation
  if (stats.social >= 70) {
    rumors.push({
      id: 'popular',
      text: '"어딜 가도 아는 사람이 있대. 인싸 중의 인싸." — 복도에서',
      type: 'positive',
      source: '캠퍼스 복도',
    });
  } else if (stats.social <= 15 && week >= 5) {
    rumors.push({
      id: 'loner',
      text: '"걔 맨날 혼자 다니던데... 좀 걱정돼." — 학식당',
      type: 'neutral',
      source: '학식당',
    });
  }

  // Charm-based rumors
  if (stats.charm >= 65) {
    rumors.push({
      id: 'attractive',
      text: '"요즘 분위기 달라진 사람 있지 않아? 뭐 하는 사람이야?" — 카페',
      type: 'positive',
      source: '학교 앞 카페',
    });
  }

  // Money-based rumors
  if (stats.money >= 1000000) {
    rumors.push({
      id: 'rich',
      text: '"걔 알바 엄청 하더라. 통장 잔고가 대단하대." — 동기들',
      type: 'neutral',
      source: '동기 사이',
    });
  } else if (stats.money <= 20000 && week >= 4) {
    rumors.push({
      id: 'broke',
      text: '"요즘 학식만 먹더라... 용돈 안 오나?" — 학식당',
      type: 'negative',
      source: '학식당',
    });
  }

  // Relationship-based rumors
  const highAffectionNpcs = Object.entries(relationships)
    .filter(([, r]) => r.affection >= 70)
    .map(([id]) => id);

  const NPC_NAMES: Record<string, string> = {
    jaemin: '재민이', minji: '민지', soyeon: '소연 선배', hyunwoo: '현우 선배',
  };

  if (highAffectionNpcs.length >= 2) {
    const names = highAffectionNpcs.slice(0, 2).map(id => NPC_NAMES[id] ?? id).join('이랑 ');
    rumors.push({
      id: 'popular_friend',
      text: `"${names} 진짜 친하더라. 부러워." — 동기들 사이`,
      type: 'positive',
      source: '동기들',
    });
  }

  // Date-related rumors
  const datePartner = Object.entries(relationships).find(([, r]) => r.affection >= 80 && (r.memories ?? []).some(m => m.startsWith('date')));
  if (datePartner) {
    const name = NPC_NAMES[datePartner[0]] ?? datePartner[0];
    rumors.push({
      id: 'dating_rumor',
      text: `"${name}이랑 사귀는 거 아냐? 같이 다니는 거 봤는데..." — 익명 게시판`,
      type: 'neutral',
      source: '에브리타임 익명',
    });
  }

  // Stress-based rumors
  if (stats.stress >= 85) {
    rumors.push({
      id: 'burnout_visible',
      text: '"걔 요즘 얼굴이 안 좋아 보여. 좀 쉬어야 할 것 같은데." — 걱정하는 동기',
      type: 'negative',
      source: '같은 과 동기',
    });
  }

  // Week-specific rumors
  if (week === 8) {
    rumors.push({
      id: 'midterm_reactions',
      text: stats.knowledge >= 60
        ? '"중간고사 잘 봤대! 역시." — 과 단톡방'
        : '"중간고사 어떻게 됐을까... 걱정이다." — 마음속',
      type: stats.knowledge >= 60 ? 'positive' : 'neutral',
      source: '과 단톡방',
    });
  }

  // Return max 2 rumors, prioritizing variety
  const shuffled = rumors.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2);
}
