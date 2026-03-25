import type { WeekSchedule, Scene, PlayerStats, DayKey } from '@/store/types';
import { ACTIVITIES } from '@/data/activities';
import { WEEK_1_SCENES } from '@/data/scenes/week1';
import { WEEK_2_SCENES } from '@/data/scenes/week2';

const STRESS_PENALTY_THRESHOLD = 70;
const STRESS_GAIN_MULTIPLIER = 0.5;

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
export function simulateWeek(
  schedule: WeekSchedule,
  currentWeek: number,
  currentStats: PlayerStats,
): { statDeltas: Partial<PlayerStats>; scenes: Scene[] } {
  const deltas: Record<keyof PlayerStats, number> = {
    gpa: 0,
    money: 0,
    health: 0,
    social: 0,
    stress: 0,
    charm: 0,
  };

  // Accumulate raw stat changes from every scheduled activity slot
  for (const day of DAY_KEYS) {
    const slots = schedule[day];
    if (!slots) continue;

    for (const slot of slots) {
      const activity = ACTIVITIES[slot.activityId];
      if (!activity) continue;

      for (const [stat, value] of Object.entries(activity.statEffects)) {
        if (value !== undefined) {
          deltas[stat as keyof PlayerStats] += value;
        }
      }
    }
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

  // 5. Apply stress penalty: if current stress is high, halve positive gains
  const isOverstressed = currentStats.stress > STRESS_PENALTY_THRESHOLD;
  if (isOverstressed) {
    for (const key of Object.keys(deltas) as (keyof PlayerStats)[]) {
      if (key === 'money') continue;
      if (deltas[key] > 0) {
        deltas[key] = Math.round(deltas[key] * STRESS_GAIN_MULTIPLIER);
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

  return { statDeltas: trimmedDeltas, scenes };
}
