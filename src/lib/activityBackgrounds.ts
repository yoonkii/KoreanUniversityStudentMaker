/**
 * Maps activity IDs + time slot to BackgroundLayer-compatible location + variant.
 * Used by the PM-style ActionPhase for full-screen backgrounds per activity.
 *
 * Time-of-day creates visual variety: same activity looks different at
 * morning vs afternoon vs evening, making the 21 weekly activities feel unique.
 */

interface ActivityScene {
  location: string;
  variant: string;
}

// ─── Base backgrounds (morning/default) ───
const BASE: Record<string, ActivityScene> = {
  lecture:    { location: 'classroom', variant: 'daytime' },
  study:      { location: 'library',   variant: 'quiet' },
  parttime:   { location: 'cafe',      variant: 'counter' },
  club:       { location: 'club-room', variant: 'normal' },
  date:       { location: 'cafe',      variant: 'seating' },
  exercise:   { location: 'campus',    variant: 'day' },
  rest:       { location: 'dorm',      variant: 'clean' },
  friends:    { location: 'cafe',      variant: 'seating' },
  tutoring:   { location: 'classroom', variant: 'daytime' },
  networking: { location: 'cafe',      variant: 'seating' },
  selfcare:   { location: 'dorm',      variant: 'clean' },
  explore:    { location: 'campus',    variant: 'day' },
  volunteer:  { location: 'campus',    variant: 'day' },
};

// ─── Afternoon overrides ───
const AFTERNOON: Record<string, ActivityScene> = {
  study:    { location: 'library',   variant: 'crowded' },   // 오후 도서관은 붐빈다
  exercise: { location: 'campus',    variant: 'day' },
  date:     { location: 'campus',    variant: 'day' },        // 낮 데이트 = 캠퍼스 산책
  friends:  { location: 'campus',    variant: 'day' },        // 낮 친구 = 캠퍼스에서
  club:     { location: 'club-room', variant: 'meeting' },
};

// ─── Evening overrides ───
const EVENING: Record<string, ActivityScene> = {
  study:    { location: 'library',   variant: 'quiet' },      // 밤 도서관은 조용하다
  date:     { location: 'campus',    variant: 'sunset' },     // 저녁 데이트 = 석양
  friends:  { location: 'campus',    variant: 'night' },      // 밤 친구 = 캠퍼스 야경
  club:     { location: 'club-room', variant: 'meeting' },    // 밤 동아리 = 연습
  rest:     { location: 'dorm',      variant: 'messy' },      // 밤 휴식 = 편한 방
  exercise: { location: 'campus',    variant: 'sunset' },     // 저녁 운동 = 석양
  parttime: { location: 'cafe',      variant: 'seating' },    // 밤 알바 = 카페 홀
  explore:  { location: 'campus',    variant: 'night' },      // 밤 탐험 = 야경
};

// ─── NPC-specific date backgrounds ───
const DATE_NPC_OVERRIDES: Record<string, ActivityScene> = {
  jaemin:  { location: 'campus',     variant: 'day' },        // 재민 = 캠퍼스 걷기
  minji:   { location: 'library',    variant: 'quiet' },      // 민지 = 조용한 스터디 데이트
  soyeon:  { location: 'cafe',       variant: 'seating' },    // 소연 = 카페 데이트
  hyunwoo: { location: 'club-room',  variant: 'normal' },     // 현우 = 음악 데이트
};

export function getActivityBackground(
  activityId: string,
  timeSlot?: string,
  targetNpcId?: string,
): ActivityScene {
  // NPC-specific date backgrounds
  if (activityId === 'date' && targetNpcId && DATE_NPC_OVERRIDES[targetNpcId]) {
    // Evening dates always get sunset
    if (timeSlot === 'evening') return { location: 'campus', variant: 'sunset' };
    return DATE_NPC_OVERRIDES[targetNpcId];
  }

  // Time-of-day overrides
  if (timeSlot === 'evening' && EVENING[activityId]) return EVENING[activityId];
  if (timeSlot === 'afternoon' && AFTERNOON[activityId]) return AFTERNOON[activityId];

  return BASE[activityId] ?? { location: 'campus', variant: 'day' };
}
