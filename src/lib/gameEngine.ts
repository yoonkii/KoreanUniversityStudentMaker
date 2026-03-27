import type { WeekSchedule, Scene, PlayerStats, DayKey } from '@/store/types';
import { ACTIVITIES } from '@/data/activities';
import { WEEK_1_SCENES } from '@/data/scenes/week1';
import { WEEK_2_SCENES } from '@/data/scenes/week2';
import { WEEK_3_SCENES, WEEK_3_VARIANT_B } from '@/data/scenes/week3';
import { WEEK_4_SCENES } from '@/data/scenes/week4';
import { WEEK_5_SCENES } from '@/data/scenes/week5';
import { WEEK_6_SCENES } from '@/data/scenes/week6';
import { WEEK_7_SCENES } from '@/data/scenes/week7';
import { WEEK_8_SCENES } from '@/data/scenes/week8';
import { WEEK_9_SCENES } from '@/data/scenes/week9';
import { WEEK_10_SCENES, WEEK_10_VARIANT_B } from '@/data/scenes/week10';
import { WEEK_11_SCENES, WEEK_11_VARIANT_B } from '@/data/scenes/week11';
import { WEEK_12_SCENES } from '@/data/scenes/week12';
import { WEEK_13_SCENES } from '@/data/scenes/week13';
import { WEEK_14_SCENES } from '@/data/scenes/week14';
import { WEEK_15_SCENES } from '@/data/scenes/week15';

const STRESS_PENALTY_THRESHOLD = 70;
const STRESS_GAIN_MULTIPLIER = 0.5;

// ─── Random Weekly Events ───
// Each event has a trigger condition, probability, stat effects, and flavor text.
// 0-1 events fire per week, adding unpredictability to the simulation.

export interface WeeklyEvent {
  id: string;
  name: string;
  description: string;
  effects: Partial<PlayerStats>;
}

interface WeeklyEventDef {
  id: string;
  name: string;
  description: string;
  effects: Partial<PlayerStats>;
  probability: number; // 0-1 chance per week
  /** Optional: only triggers when condition is met */
  condition?: (stats: PlayerStats, week: number) => boolean;
}

const WEEKLY_EVENT_POOL: WeeklyEventDef[] = [
  {
    id: 'surprise_quiz',
    name: '깜짝 퀴즈',
    description: '교수님이 예고 없이 퀴즈를 냈다!',
    effects: { stress: 8, gpa: -3 },
    probability: 0.15,
    condition: (_, w) => w >= 3 && w <= 14,
  },
  {
    id: 'allowance',
    name: '용돈 입금',
    description: '부모님이 용돈을 보내주셨다! 💰',
    effects: { money: 100000, stress: -3 },
    probability: 0.12,
  },
  {
    id: 'caught_cold',
    name: '감기 걸림',
    description: '환절기에 감기에 걸렸다... 🤧',
    effects: { health: -12, stress: 5 },
    probability: 0.1,
    condition: (stats) => stats.health < 50,
  },
  {
    id: 'professor_praise',
    name: '교수님 칭찬',
    description: '교수님이 수업 태도를 칭찬해주셨다!',
    effects: { gpa: 5, charm: 3, stress: -2 },
    probability: 0.1,
    condition: (stats) => stats.gpa > 60,
  },
  {
    id: 'group_project_drama',
    name: '조별과제 갈등',
    description: '무임승차하는 조원 때문에 스트레스 폭발 💢',
    effects: { stress: 10, social: -3 },
    probability: 0.12,
    condition: (_, w) => w >= 4 && w <= 14,
  },
  {
    id: 'found_money',
    name: '만원 줍기',
    description: '길에서 만원을 주웠다! 오늘 운수 좋은 날 🍀',
    effects: { money: 10000, stress: -2 },
    probability: 0.05,
  },
  {
    id: 'all_nighter_recovery',
    name: '밤샘 후유증',
    description: '밤새 과제하다 쓰러졌다... 다음 날 수업 결석',
    effects: { health: -8, gpa: -2, stress: 5 },
    probability: 0.1,
    condition: (stats) => stats.stress > 60,
  },
  {
    id: 'viral_post',
    name: 'SNS 인기글',
    description: '에브리타임에 올린 글이 인기글 등극! 📱',
    effects: { charm: 5, social: 4 },
    probability: 0.08,
  },
  {
    id: 'senior_treat',
    name: '선배 밥 사줌',
    description: '착한 선배가 밥을 사줬다! 고기 먹는 날 🍖',
    effects: { money: 15000, social: 3, stress: -3 },
    probability: 0.1,
    condition: (stats) => stats.social > 30,
  },
  {
    id: 'scholarship_notice',
    name: '장학금 안내',
    description: '성적 장학금 대상자로 선정됐다! 🎓',
    effects: { money: 500000, stress: -10, gpa: 3 },
    probability: 0.08,
    condition: (stats, w) => stats.gpa > 75 && w >= 8,
  },
  {
    id: 'phone_broken',
    name: '핸드폰 파손',
    description: '핸드폰 액정이 깨졌다... 수리비 지출 😭',
    effects: { money: -150000, stress: 8 },
    probability: 0.06,
  },
  {
    id: 'cafe_study_buddy',
    name: '카페 스터디',
    description: '카페에서 우연히 같은 과 친구를 만나 같이 공부했다 ☕',
    effects: { gpa: 3, social: 3, money: -5000 },
    probability: 0.1,
  },
];

// ─── Weather System ───
// Each week gets a weather condition that slightly modifies activity effects.

export interface WeatherCondition {
  type: 'sunny' | 'rainy' | 'cold' | 'hot' | 'normal';
  label: string;
  emoji: string;
  hint: string;
}

const WEATHER_POOL: WeatherCondition[] = [
  { type: 'sunny', label: '맑음', emoji: '☀️', hint: '운동·외출 효과 +20%' },
  { type: 'rainy', label: '비', emoji: '🌧️', hint: '실내 활동 효과 +20%, 외출 스트레스 +2' },
  { type: 'cold', label: '추움', emoji: '❄️', hint: '체력 소모 +20%, 휴식 효과 +20%' },
  { type: 'hot', label: '더움', emoji: '🌡️', hint: '스트레스 +2, 아이스 커피 -₩3,000' },
  { type: 'normal', label: '보통', emoji: '🌤️', hint: '특이사항 없음' },
];

export function getWeatherForWeek(week: number): WeatherCondition {
  // Deterministic pseudo-random per week (so same week always gets same weather)
  const hash = ((week * 2654435761) >>> 0) % WEATHER_POOL.length;
  return WEATHER_POOL[hash];
}

/**
 * Roll for a random weekly event. Returns at most one event.
 * Uses a simple linear scan — first event whose condition passes AND
 * probability check succeeds wins (shuffled to avoid positional bias).
 */
function rollWeeklyEvent(stats: PlayerStats, week: number): WeeklyEvent | null {
  // Shuffle pool to avoid positional bias
  const shuffled = [...WEEKLY_EVENT_POOL].sort(() => Math.random() - 0.5);

  for (const def of shuffled) {
    if (def.condition && !def.condition(stats, week)) continue;
    if (Math.random() < def.probability) {
      return { id: def.id, name: def.name, description: def.description, effects: { ...def.effects } };
    }
  }
  return null;
}

// Exam week definitions (Korean university calendar)
const MIDTERM_WEEKS = [7, 8];      // 중간고사
const FINALS_WEEKS = [14, 15];     // 기말고사
const FESTIVAL_WEEK = 9;           // 축제 주간

function isExamWeek(week: number): boolean {
  return MIDTERM_WEEKS.includes(week) || FINALS_WEEKS.includes(week);
}

function isFestivalWeek(week: number): boolean {
  return week === FESTIVAL_WEEK;
}

/** Public: returns the week's special condition for display in the planner */
export interface WeekCondition {
  type: 'midterm' | 'finals' | 'festival' | 'normal';
  label: string;
  hint: string;
  emoji: string;
}

export function getWeekCondition(week: number): WeekCondition {
  if (MIDTERM_WEEKS.includes(week)) {
    return { type: 'midterm', label: '중간고사 기간', hint: '공부 효과 2배, 스트레스 +5', emoji: '📝' };
  }
  if (FINALS_WEEKS.includes(week)) {
    return { type: 'finals', label: '기말고사 기간', hint: '공부 효과 2배, 스트레스 +5', emoji: '📚' };
  }
  if (week === FESTIVAL_WEEK) {
    return { type: 'festival', label: '축제 주간', hint: '인맥·매력 효과 1.5배, 스트레스 -3', emoji: '🎉' };
  }
  return { type: 'normal', label: '', hint: '', emoji: '' };
}

const DAY_KEYS: DayKey[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

/** Map week number to hardcoded scene arrays. */
function getScenesForWeek(week: number): Scene[] {
  switch (week) {
    case 1:
      return [...WEEK_1_SCENES];
    case 2:
      return [...WEEK_2_SCENES];
    case 3:
      return Math.random() < 0.5 ? [...WEEK_3_SCENES] : [...WEEK_3_VARIANT_B];
    case 4:
      return [...WEEK_4_SCENES];
    case 5:
      return [...WEEK_5_SCENES];
    case 6:
      return [...WEEK_6_SCENES];
    case 7:
      return [...WEEK_7_SCENES];
    case 8:
      return [...WEEK_8_SCENES];
    case 9:
      return [...WEEK_9_SCENES];
    case 10:
      return Math.random() < 0.5 ? [...WEEK_10_SCENES] : [...WEEK_10_VARIANT_B];
    case 11:
      return Math.random() < 0.5 ? [...WEEK_11_SCENES] : [...WEEK_11_VARIANT_B];
    case 12:
      return [...WEEK_12_SCENES];
    case 13:
      return [...WEEK_13_SCENES];
    case 14:
      return [...WEEK_14_SCENES];
    case 15:
      return [...WEEK_15_SCENES];
    default:
      return [];
  }
}

/**
 * Simulate a full week of scheduled activities and return the cumulative
 * stat deltas along with any narrative scenes triggered by the week.
 *
 * Stress penalty: when the player's current stress exceeds 70, all
 * *positive* stat gains (except money) are halved for that week, modeling
 * burnout and diminishing returns.
 */
export interface ActiveCombo {
  name: string;
  description: string;
  effect: string;
}

export function simulateWeek(
  schedule: WeekSchedule,
  currentWeek: number,
  currentStats: PlayerStats,
  options?: { disableRandomEvents?: boolean },
): { statDeltas: Partial<PlayerStats>; scenes: Scene[]; combos: ActiveCombo[]; weeklyEvent: WeeklyEvent | null } {
  const deltas: Record<keyof PlayerStats, number> = {
    gpa: 0,
    money: 0,
    health: 0,
    social: 0,
    stress: 0,
    charm: 0,
  };

  // Count activity occurrences for combo detection
  const activityCounts: Record<string, number> = {};
  for (const day of DAY_KEYS) {
    const slots = schedule[day];
    if (!slots) continue;
    for (const slot of slots) {
      activityCounts[slot.activityId] = (activityCounts[slot.activityId] || 0) + 1;
    }
  }

  // Accumulate raw stat changes, applying diminishing returns for 4+ repeats
  const activitySeen: Record<string, number> = {};
  for (const day of DAY_KEYS) {
    const slots = schedule[day];
    if (!slots) continue;

    for (const slot of slots) {
      const activity = ACTIVITIES[slot.activityId];
      if (!activity) continue;

      activitySeen[slot.activityId] = (activitySeen[slot.activityId] || 0) + 1;
      const count = activitySeen[slot.activityId];
      // 4th+ slot of same activity → 50% effectiveness (diminishing returns)
      const diminish = count >= 4 ? 0.5 : 1;

      for (const [stat, value] of Object.entries(activity.statEffects)) {
        if (value !== undefined) {
          deltas[stat as keyof PlayerStats] += Math.round(value * diminish);
        }
      }
    }
  }

  // ─── Activity Combo Bonuses ───
  const combos: ActiveCombo[] = [];

  // Study + Lecture in same week → synergy GPA boost
  if (activityCounts['study'] && activityCounts['lecture']) {
    deltas.gpa += 2;
    combos.push({ name: '효율적 학습', description: '수업 + 공부 시너지', effect: '학점 +2' });
  }
  // Exercise + Rest → recovery synergy
  if (activityCounts['exercise'] && activityCounts['rest']) {
    deltas.health += 5;
    combos.push({ name: '균형 잡힌 생활', description: '운동 + 휴식 시너지', effect: '체력 +5' });
  }
  // Club + Friends → social network effect
  if (activityCounts['club'] && activityCounts['friends']) {
    deltas.social += 3;
    combos.push({ name: '인맥 왕', description: '동아리 + 친구 시너지', effect: '인맥 +3' });
  }
  // Part-time + Study → hardworking student
  if (activityCounts['parttime'] && activityCounts['study']) {
    deltas.gpa += 1;
    deltas.money += 10000;
    combos.push({ name: '고학생', description: '알바 + 공부 병행', effect: '학점 +1, 돈 +₩10,000' });
  }
  // Date + Exercise → campus couple fitness
  if (activityCounts['date'] && activityCounts['exercise']) {
    deltas.charm += 4;
    combos.push({ name: '캠퍼스 커플', description: '데이트 + 운동 시너지', effect: '매력 +4' });
  }
  // Cramming penalty: study 4+ times → extra stress
  if ((activityCounts['study'] || 0) >= 4) {
    deltas.stress += 5;
    combos.push({ name: '벼락치기', description: '공부 4회 이상 반복', effect: '스트레스 +5' });
  }
  // Part-time overwork: 3+ part-time slots → health penalty
  if ((activityCounts['parttime'] || 0) >= 3) {
    deltas.health -= 5;
    combos.push({ name: '알바 중독', description: '알바 3회 이상 반복', effect: '체력 -5' });
  }

  // ─── Weather Effects ───
  const weather = options?.disableRandomEvents ? { type: 'normal' as const } : getWeatherForWeek(currentWeek);
  if (weather.type === 'sunny') {
    // Outdoor activities boosted: exercise, club, friends
    if (activityCounts['exercise']) deltas.health += Math.round((activityCounts['exercise']) * 2);
    if (activityCounts['friends']) deltas.social += Math.round((activityCounts['friends']) * 1);
  } else if (weather.type === 'rainy') {
    // Indoor activities boosted: study, lecture, rest
    if (activityCounts['study']) deltas.gpa += Math.round((activityCounts['study']) * 1);
    if (activityCounts['rest']) deltas.health += Math.round((activityCounts['rest']) * 2);
    deltas.stress += 2; // gloomy weather
  } else if (weather.type === 'cold') {
    // Health drain, rest boosted
    deltas.health -= 2;
    if (activityCounts['rest']) deltas.health += Math.round((activityCounts['rest']) * 2);
  } else if (weather.type === 'hot') {
    // Stress increase, small money drain (ice coffee)
    deltas.stress += 2;
    deltas.money -= 3000;
  }

  // ─── Stat Interactions ───
  // 1. Charm boosts social gains (+10% per 10 charm points, max +50%)
  const charmBonus = Math.min(0.5, Math.floor(currentStats.charm / 10) * 0.1);
  if (deltas.social > 0) {
    deltas.social = Math.round(deltas.social * (1 + charmBonus));
  }

  // 2. High GPA reduces study stress (study stress penalty halved if GPA > 70)
  if (currentStats.gpa > 70 && deltas.stress > 0) {
    // Only reduce stress from academic activities
    deltas.stress = Math.round(deltas.stress * 0.75);
  }

  // 3. High social makes club/date cheaper
  if (currentStats.social > 60 && deltas.money < 0) {
    deltas.money = Math.round(deltas.money * 0.8); // 20% discount
  }

  // 4. Low health amplifies stress gains
  if (currentStats.health < 30 && deltas.stress > 0) {
    deltas.stress = Math.round(deltas.stress * 1.3);
  }

  // ─── Semester Calendar Effects ───
  // 5. Exam weeks: study/lecture GPA gains ×2, +5 passive stress
  if (isExamWeek(currentWeek)) {
    if (deltas.gpa > 0) {
      deltas.gpa = Math.round(deltas.gpa * 2);
    }
    deltas.stress += 5; // exam anxiety baseline
  }

  // 6. Festival week: social gains ×1.5, stress reduced, charm boosted
  if (isFestivalWeek(currentWeek)) {
    if (deltas.social > 0) {
      deltas.social = Math.round(deltas.social * 1.5);
    }
    if (deltas.charm > 0) {
      deltas.charm = Math.round(deltas.charm * 1.5);
    }
    deltas.stress -= 3; // festival vibes reduce stress
  }

  // Apply stress penalty: if current stress is high, halve positive gains
  const isOverstressed = currentStats.stress > STRESS_PENALTY_THRESHOLD;
  if (isOverstressed) {
    for (const key of Object.keys(deltas) as (keyof PlayerStats)[]) {
      if (key === 'money') continue;
      if (deltas[key] > 0) {
        deltas[key] = Math.round(deltas[key] * STRESS_GAIN_MULTIPLIER);
      }
    }
  }

  // ─── Random Weekly Event ───
  const weeklyEvent = options?.disableRandomEvents ? null : rollWeeklyEvent(currentStats, currentWeek);
  if (weeklyEvent) {
    for (const [stat, value] of Object.entries(weeklyEvent.effects)) {
      if (value !== undefined) {
        deltas[stat as keyof PlayerStats] += value;
      }
    }
  }

  // Convert to Partial — strip zero entries to keep it clean
  const trimmedDeltas: Partial<PlayerStats> = {};
  for (const [key, value] of Object.entries(deltas)) {
    if (value !== 0) {
      trimmedDeltas[key as keyof PlayerStats] = value;
    }
  }

  const scenes = getScenesForWeek(currentWeek);

  return { statDeltas: trimmedDeltas, scenes, combos, weeklyEvent };
}
