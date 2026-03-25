/**
 * Activity Visual Identity System
 * Strong color coding inspired by Persona 5's bold UI language.
 * Each activity has a unique color, icon, and visual personality.
 */

export interface ActivityVisual {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  color: string;        // hex
  bgClass: string;      // tailwind bg at full
  bgLightClass: string; // tailwind bg at 20% opacity
  textClass: string;    // tailwind text color
  borderClass: string;  // tailwind border color
  ringClass: string;    // tailwind ring color
}

export const ACTIVITY_VISUALS: Record<string, ActivityVisual> = {
  class: {
    id: 'class', name: '수업 듣기', shortName: '수업', icon: '📚',
    color: '#3B82F6',
    bgClass: 'bg-blue-500', bgLightClass: 'bg-blue-500/20',
    textClass: 'text-blue-400', borderClass: 'border-blue-500/40',
    ringClass: 'ring-blue-500/30',
  },
  study: {
    id: 'study', name: '도서관 공부', shortName: '공부', icon: '📖',
    color: '#6366F1',
    bgClass: 'bg-indigo-500', bgLightClass: 'bg-indigo-500/20',
    textClass: 'text-indigo-400', borderClass: 'border-indigo-500/40',
    ringClass: 'ring-indigo-500/30',
  },
  work: {
    id: 'work', name: '아르바이트', shortName: '알바', icon: '💼',
    color: '#F59E0B',
    bgClass: 'bg-amber-500', bgLightClass: 'bg-amber-500/20',
    textClass: 'text-amber-400', borderClass: 'border-amber-500/40',
    ringClass: 'ring-amber-500/30',
  },
  club: {
    id: 'club', name: '동아리 활동', shortName: '동아리', icon: '🎵',
    color: '#8B5CF6',
    bgClass: 'bg-violet-500', bgLightClass: 'bg-violet-500/20',
    textClass: 'text-violet-400', borderClass: 'border-violet-500/40',
    ringClass: 'ring-violet-500/30',
  },
  date: {
    id: 'date', name: '데이트', shortName: '데이트', icon: '💕',
    color: '#EC4899',
    bgClass: 'bg-pink-500', bgLightClass: 'bg-pink-500/20',
    textClass: 'text-pink-400', borderClass: 'border-pink-500/40',
    ringClass: 'ring-pink-500/30',
  },
  exercise: {
    id: 'exercise', name: '운동하기', shortName: '운동', icon: '💪',
    color: '#10B981',
    bgClass: 'bg-emerald-500', bgLightClass: 'bg-emerald-500/20',
    textClass: 'text-emerald-400', borderClass: 'border-emerald-500/40',
    ringClass: 'ring-emerald-500/30',
  },
  rest: {
    id: 'rest', name: '휴식', shortName: '휴식', icon: '🌙',
    color: '#6B7280',
    bgClass: 'bg-gray-500', bgLightClass: 'bg-gray-500/20',
    textClass: 'text-gray-400', borderClass: 'border-gray-500/40',
    ringClass: 'ring-gray-500/30',
  },
  social: {
    id: 'social', name: '친구 만나기', shortName: '친구', icon: '🧡',
    color: '#F97316',
    bgClass: 'bg-orange-500', bgLightClass: 'bg-orange-500/20',
    textClass: 'text-orange-400', borderClass: 'border-orange-500/40',
    ringClass: 'ring-orange-500/30',
  },
  career: {
    id: 'career', name: '취업 준비', shortName: '취준', icon: '💻',
    color: '#06B6D4',
    bgClass: 'bg-cyan-500', bgLightClass: 'bg-cyan-500/20',
    textClass: 'text-cyan-400', borderClass: 'border-cyan-500/40',
    ringClass: 'ring-cyan-500/30',
  },
};

export const ACTIVITY_LIST = Object.values(ACTIVITY_VISUALS);

/** Map legacy activity IDs to our visual system */
export const LEGACY_ID_MAP: Record<string, string> = {
  attend_class: 'class',
  study: 'study',
  part_time_work: 'work',
  club_social: 'club',
  date: 'date',
  exercise: 'exercise',
  rest: 'rest',
  career_prep: 'career',
  // Legacy data/activities.ts IDs
  'attend-class': 'class',
  'library-study': 'study',
  'part-time': 'work',
  'club-activity': 'club',
  'go-on-date': 'date',
  'work-out': 'exercise',
  'take-rest': 'rest',
  'meet-friends': 'social',
};

export function getActivityVisual(id: string): ActivityVisual {
  const mapped = LEGACY_ID_MAP[id] ?? id;
  return ACTIVITY_VISUALS[mapped] ?? ACTIVITY_VISUALS.rest;
}

/** Week balance classification for confirmation preview */
export type WeekBalance = '학업중심' | '사교중심' | '균형잡힌주' | '알바중심' | '힐링주간';

export function classifyWeekBalance(activityIds: string[]): WeekBalance {
  const counts: Record<string, number> = {};
  for (const id of activityIds) {
    const mapped = LEGACY_ID_MAP[id] ?? id;
    counts[mapped] = (counts[mapped] ?? 0) + 1;
  }

  const academic = (counts.class ?? 0) + (counts.study ?? 0) + (counts.career ?? 0);
  const social = (counts.club ?? 0) + (counts.date ?? 0) + (counts.social ?? 0);
  const work = counts.work ?? 0;
  const rest = (counts.rest ?? 0) + (counts.exercise ?? 0);
  const total = activityIds.length || 1;

  if (rest / total > 0.5) return '힐링주간';
  if (work / total > 0.4) return '알바중심';
  if (academic / total > 0.5) return '학업중심';
  if (social / total > 0.4) return '사교중심';
  return '균형잡힌주';
}
