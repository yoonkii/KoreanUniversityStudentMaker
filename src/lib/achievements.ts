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
    description: '학점 80 이상 달성',
    emoji: '🏆',
    check: (stats) => stats.gpa >= 80,
  },
  {
    id: 'perfect_gpa',
    title: '올 A+',
    description: '학점 95 이상 달성',
    emoji: '💎',
    check: (stats) => stats.gpa >= 95,
  },
  {
    id: 'academic_probation',
    title: '학사경고',
    description: '학점 20 이하로 떨어짐',
    emoji: '📉',
    check: (stats) => stats.gpa <= 20,
  },

  // Social
  {
    id: 'social_butterfly',
    title: '인싸',
    description: '모든 NPC와 친구 (호감 50+)',
    emoji: '🦋',
    check: (_, relationships) => {
      const vals = Object.values(relationships);
      return vals.length >= 4 && vals.every(r => r.affection >= 50);
    },
  },
  {
    id: 'best_friend',
    title: '소울메이트',
    description: 'NPC 호감도 90 달성',
    emoji: '💕',
    check: (_, relationships) =>
      Object.values(relationships).some(r => r.affection >= 90),
  },
  {
    id: 'loner',
    title: '외톨이',
    description: '사회성 15 이하',
    emoji: '🌑',
    check: (stats) => stats.social <= 15,
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
    description: '스트레스 95 이상',
    emoji: '🔥',
    check: (stats) => stats.stress >= 95,
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
    emoji: '⭐',
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
      stats.gpa >= 50 && stats.health >= 50 && stats.social >= 50 &&
      stats.charm >= 50 && stats.stress <= 50 && stats.money >= 200000,
  },

  // Extreme stats
  {
    id: 'overachiever',
    title: '갓생러',
    description: '학점 80+, 인맥 60+, 매력 60+ 동시 달성',
    emoji: '🌟',
    check: (stats) => stats.gpa >= 80 && stats.social >= 60 && stats.charm >= 60,
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
    description: '모든 NPC 호감 70+',
    emoji: '👑',
    check: (_, relationships) => {
      const vals = Object.values(relationships);
      return vals.length >= 4 && vals.every(r => r.affection >= 70);
    },
  },
  {
    id: 'midterm_ace',
    title: '중간고사 에이스',
    description: '중간고사 기간에 학점 70 이상',
    emoji: '📝',
    check: (stats, _, week) => week >= 8 && week <= 9 && stats.gpa >= 70,
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
    description: '₩800,000+, 학점 70+ 동시 달성',
    emoji: '👑',
    check: (stats) => stats.money >= 800000 && stats.gpa >= 70,
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
