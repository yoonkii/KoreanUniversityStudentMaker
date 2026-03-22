import { describe, it, expect } from 'vitest';
import { simulateWeek } from './gameEngine';
import type { WeekSchedule, PlayerStats } from '@/store/types';

function makeEmptySchedule(): WeekSchedule {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  const schedule = {} as WeekSchedule;
  for (const day of days) {
    schedule[day] = [];
  }
  return schedule;
}

const DEFAULT_STATS: PlayerStats = {
  gpa: 50,
  money: 500000,
  health: 70,
  social: 40,
  stress: 20,
  charm: 40,
};

describe('simulateWeek', () => {
  it('should return correct stat deltas for a simple schedule', () => {
    const schedule = makeEmptySchedule();
    // Schedule one "study" slot on Monday (gpa: 5, stress: 8, health: -3)
    schedule.monday = [{ timeSlot: 'morning', activityId: 'study' }];

    const { statDeltas } = simulateWeek(schedule, 4, DEFAULT_STATS);

    expect(statDeltas.gpa).toBe(5);
    expect(statDeltas.stress).toBe(8);
    expect(statDeltas.health).toBe(-3);
    // Unaffected stats should not be present (trimmed)
    expect(statDeltas.money).toBeUndefined();
    expect(statDeltas.social).toBeUndefined();
    expect(statDeltas.charm).toBeUndefined();
  });

  it('should halve positive gains (except money) when stress > 70', () => {
    const highStressStats: PlayerStats = { ...DEFAULT_STATS, stress: 80 };
    const schedule = makeEmptySchedule();
    // "club" gives: gpa: 1, money: -10000, social: 8, stress: -3, charm: 3
    schedule.monday = [{ timeSlot: 'morning', activityId: 'club' }];

    const { statDeltas } = simulateWeek(schedule, 4, highStressStats);

    // Positive gains should be halved (Math.round)
    expect(statDeltas.gpa).toBe(Math.round(1 * 0.5)); // 1 -> 1 (rounded from 0.5)
    expect(statDeltas.social).toBe(Math.round(8 * 0.5)); // 8 -> 4
    expect(statDeltas.charm).toBe(Math.round(3 * 0.5)); // 3 -> 2

    // Money is exempt from halving
    expect(statDeltas.money).toBe(-10000);

    // Negative values (stress: -3) stay as-is
    expect(statDeltas.stress).toBe(-3);
  });

  it('should return zero deltas for an empty schedule', () => {
    const schedule = makeEmptySchedule();

    const { statDeltas } = simulateWeek(schedule, 1, DEFAULT_STATS);

    // All deltas should be trimmed (no non-zero entries)
    expect(Object.keys(statDeltas)).toHaveLength(0);
  });

  it('should return week 1 scenes for week 1', () => {
    const schedule = makeEmptySchedule();
    const { scenes } = simulateWeek(schedule, 1, DEFAULT_STATS);

    expect(scenes.length).toBeGreaterThan(0);
    expect(scenes[0].id).toBe('orientation');
  });

  it('should return week 2 scenes for week 2', () => {
    const schedule = makeEmptySchedule();
    const { scenes } = simulateWeek(schedule, 2, DEFAULT_STATS);

    expect(scenes.length).toBeGreaterThan(0);
    expect(scenes[0].id).toBe('study_group');
  });

  it('should return no scenes for week 3+', () => {
    const schedule = makeEmptySchedule();
    const { scenes } = simulateWeek(schedule, 3, DEFAULT_STATS);

    expect(scenes).toHaveLength(0);
  });
});
