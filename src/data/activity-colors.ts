export const ACTIVITY_COLORS = {
  class:    { color: '#3B82F6', bg: 'rgba(59,130,246,0.2)',  icon: '📚', label: '수업' },
  study:    { color: '#6366F1', bg: 'rgba(99,102,241,0.2)',  icon: '📖', label: '공부' },
  parttime: { color: '#F59E0B', bg: 'rgba(245,158,11,0.2)',  icon: '💼', label: '알바' },
  club:     { color: '#8B5CF6', bg: 'rgba(139,92,246,0.2)',  icon: '🎵', label: '동아리' },
  date:     { color: '#EC4899', bg: 'rgba(236,72,153,0.2)',  icon: '💕', label: '데이트' },
  exercise: { color: '#10B981', bg: 'rgba(16,185,129,0.2)', icon: '💪', label: '운동' },
  rest:     { color: '#6B7280', bg: 'rgba(107,114,128,0.2)', icon: '🌙', label: '휴식' },
  social:   { color: '#F97316', bg: 'rgba(249,115,22,0.2)',  icon: '👥', label: '친구' },
} as const;

export type ActivityColorKey = keyof typeof ACTIVITY_COLORS;
