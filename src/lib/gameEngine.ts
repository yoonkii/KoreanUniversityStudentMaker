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

  // Apply stress penalty: if current stress is high, halve positive gains
  const isOverstressed = currentStats.stress > STRESS_PENALTY_THRESHOLD;
  if (isOverstressed) {
    for (const key of Object.keys(deltas) as (keyof PlayerStats)[]) {
      // Money gains are not penalised (you still get paid)
      if (key === 'money') continue;
      // Only reduce positive gains; negative values (stat losses) stay as-is
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
