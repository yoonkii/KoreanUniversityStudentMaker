import type { PlayerStats, CharacterRelationship } from '@/store/types';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  check: (stats: PlayerStats, relationships: Record<string, CharacterRelationship>, week: number) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Academic
  {
    id: 'honor_roll',
    title: '장학생',
    description: '준비도 80 이상 달성',
    emoji: '🏆',
    check: (stats) => stats.knowledge >= 80,
  },
  {
    id: 'perfect_gpa',
    title: '올 A+',
    description: '준비도 95 이상 달성',
    emoji: '💎',
    check: (stats) => stats.knowledge >= 95,
  },
  {
    id: 'academic_probation',
    title: '학사경고',
    description: '준비도 20 이하로 떨어짐',
    emoji: '📉',
    check: (stats) => stats.knowledge <= 20,
  },

  // ─── Friendship Achievements ───
  {
    id: 'social_butterfly',
    title: '인싸',
    description: '모든 NPC와 친구 (우정 40+)',
    emoji: '🦋',
    check: (_, relationships) => {
      const main4 = ['jaemin', 'minji', 'soyeon', 'hyunwoo'];
      return main4.every(id => (relationships[id]?.friendship ?? relationships[id]?.affection ?? 0) >= 40);
    },
  },
  {
    id: 'best_friend',
    title: '베프',
    description: 'NPC 우정 80 달성',
    emoji: '⭐',
    check: (_, relationships) =>
      Object.values(relationships).some(r => (r.friendship ?? r.affection ?? 0) >= 80),
  },
  {
    id: 'loner',
    title: '외톨이',
    description: '사회성 15 이하',
    emoji: '🌑',
    check: (stats) => stats.social <= 15,
  },

  // ─── Romance Achievements ───
  {
    id: 'first_flutter',
    title: '첫 설렘',
    description: 'NPC와 관심 단계 달성 (사랑 10+)',
    emoji: '💭',
    check: (_, relationships) =>
      Object.values(relationships).some(r => (r.romance ?? 0) >= 10),
  },
  {
    id: 'first_crush',
    title: '두근두근',
    description: 'NPC에 대한 설렘 (사랑 25+)',
    emoji: '💓',
    check: (_, relationships) =>
      Object.values(relationships).some(r => (r.romance ?? 0) >= 25),
  },
  {
    id: 'campus_couple',
    title: '캠퍼스 커플',
    description: 'NPC와 연인 관계 달성 (사랑 45+)',
    emoji: '💑',
    check: (_, relationships) =>
      Object.values(relationships).some(r => (r.romance ?? 0) >= 45),
  },
  {
    id: 'deep_love',
    title: '진정한 사랑',
    description: 'NPC와 깊은 사랑 달성 (사랑 70+)',
    emoji: '💗',
    check: (_, relationships) =>
      Object.values(relationships).some(r => (r.romance ?? 0) >= 70),
  },
  {
    id: 'love_triangle',
    title: '삼각관계',
    description: '2명 이상 NPC와 설렘 이상 (사랑 25+)',
    emoji: '💔',
    check: (_, rels) => Object.values(rels).filter(r => (r.romance ?? 0) >= 25).length >= 2,
  },
  {
    id: 'friendzoned',
    title: '프렌드존',
    description: '우정 80+이지만 사랑은 0인 NPC가 있다',
    emoji: '😅',
    check: (_, rels) =>
      Object.values(rels).some(r => (r.friendship ?? r.affection ?? 0) >= 80 && (r.romance ?? 0) === 0),
  },

  // Financial
  {
    id: 'millionaire',
    title: '백만장자',
    description: '₩1,000,000 이상 보유',
    emoji: '💰',
    check: (stats) => stats.money >= 1000000,
  },
  {
    id: 'broke_student',
    title: '무일푼',
    description: '소지금 ₩10,000 이하',
    emoji: '🍜',
    check: (stats) => stats.money <= 10000,
  },

  // Health & Stress
  {
    id: 'burnout',
    title: '번아웃',
    description: '스트레스 90 이상',
    emoji: '🔥',
    check: (stats) => stats.stress >= 90,
  },
  {
    id: 'zen_master',
    title: '마음의 평화',
    description: '스트레스 10 이하 유지',
    emoji: '🧘',
    check: (stats) => stats.stress <= 10,
  },
  {
    id: 'iron_body',
    title: '체력왕',
    description: '체력 90 이상',
    emoji: '💪',
    check: (stats) => stats.health >= 90,
  },

  // Charm
  {
    id: 'campus_star',
    title: '캠퍼스 스타',
    description: '매력 80 이상',
    emoji: '✨',
    check: (stats) => stats.charm >= 80,
  },

  // Progress
  {
    id: 'survivor',
    title: '생존자',
    description: '16주 완주',
    emoji: '🎓',
    check: (_, __, week) => week >= 16,
  },
  {
    id: 'balanced',
    title: '밸런스 마스터',
    description: '모든 능력치 50 이상 (스트레스 50 이하)',
    emoji: '⚖️',
    check: (stats) =>
      stats.knowledge >= 50 && stats.health >= 50 && stats.social >= 50 &&
      stats.charm >= 50 && stats.stress <= 50 && stats.money >= 200000,
  },

  // Extreme stats
  {
    id: 'overachiever',
    title: '갓생러',
    description: '준비도 80+, 인맥 60+, 매력 60+ 동시 달성',
    emoji: '🌟',
    check: (stats) => stats.knowledge >= 80 && stats.social >= 60 && stats.charm >= 60,
  },
  {
    id: 'money_saver',
    title: '절약왕',
    description: '₩2,000,000 이상 보유',
    emoji: '🏦',
    check: (stats) => stats.money >= 2000000,
  },
  {
    id: 'social_climber',
    title: '인맥 부자',
    description: '모든 NPC 우정 60+',
    emoji: '👑',
    check: (_, relationships) => {
      const main4 = ['jaemin', 'minji', 'soyeon', 'hyunwoo'];
      return main4.every(id => (relationships[id]?.friendship ?? relationships[id]?.affection ?? 0) >= 60);
    },
  },
  {
    id: 'midterm_ace',
    title: '중간고사 에이스',
    description: '중간고사 기간에 준비도 70 이상',
    emoji: '📝',
    check: (stats, _, week) => week >= 8 && week <= 9 && stats.knowledge >= 70,
  },

  // Event & journey achievements
  {
    id: 'festival_goer',
    title: '축제의 신',
    description: '축제 주간에 인맥 60+ 달성',
    emoji: '🎉',
    check: (stats, _, week) => week >= 9 && week <= 10 && stats.social >= 60,
  },
  {
    id: 'stress_free',
    title: '무스트레스',
    description: '스트레스 5 이하로 유지',
    emoji: '☁️',
    check: (stats) => stats.stress <= 5,
  },
  {
    id: 'finals_survivor',
    title: '기말 생존자',
    description: '기말고사 기간을 체력 50+ 으로 통과',
    emoji: '🛡️',
    check: (stats, _, week) => week >= 15 && stats.health >= 50,
  },
  {
    id: 'rich_and_smart',
    title: '금수저 학생',
    description: '₩800,000+, 준비도 70+ 동시 달성',
    emoji: '👑',
    check: (stats) => stats.money >= 800000 && stats.knowledge >= 70,
  },

  // ─── Secret Achievements ───
  {
    id: 'social_butterfly_max',
    title: '사교계의 왕',
    description: '모든 주요 NPC와 절친 이상 (우정 60+)',
    emoji: '🦋',
    check: (_, rels) => {
      const main4 = ['jaemin', 'minji', 'soyeon', 'hyunwoo'];
      return main4.every(id => (rels[id]?.friendship ?? rels[id]?.affection ?? 0) >= 60);
    },
  },
  {
    id: 'zero_stress',
    title: '무스트레스 마스터',
    description: '스트레스 0 달성',
    emoji: '🧘',
    check: (stats) => stats.stress === 0,
  },
  {
    id: 'all_stats_60',
    title: '만능인',
    description: '준비도, 체력, 인맥, 매력 모두 60 이상',
    emoji: '🌈',
    check: (stats) => stats.knowledge >= 60 && stats.health >= 60 && stats.social >= 60 && stats.charm >= 60,
  },
  {
    id: 'hermit',
    title: '은둔자',
    description: '인맥 10 이하, 준비도 70 이상',
    emoji: '🏔️',
    check: (stats) => stats.social <= 10 && stats.knowledge >= 70,
  },
  {
    id: 'heartbreaker',
    title: '하트브레이커',
    description: '3명 이상 NPC의 관심을 받다 (사랑 10+)',
    emoji: '💘',
    check: (_, rels) => Object.values(rels).filter(r => (r.romance ?? 0) >= 10).length >= 3,
  },
];

/** Check which achievements are newly unlocked */
export function checkAchievements(
  stats: PlayerStats,
  relationships: Record<string, CharacterRelationship>,
  week: number,
  alreadyUnlocked: string[],
): Achievement[] {
  return ACHIEVEMENTS.filter(
    a => !alreadyUnlocked.includes(a.id) && a.check(stats, relationships, week),
  );
}
