import { describe, it, expect } from 'vitest';
import { simulateWeek, getWeekCondition, getWeatherForWeek } from './gameEngine';
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
  knowledge: 50,
  money: 500000,
  health: 70,
  social: 40,
  stress: 20,
  charm: 40,
};

describe('simulateWeek', () => {
  it('should return correct stat deltas for a simple schedule (including baseline drains)', () => {
    const schedule = makeEmptySchedule();
    // Schedule one "study" slot on Monday (knowledge: 5, stress: 10, health: -5, social: -2)
    schedule.monday = [{ timeSlot: 'morning', activityId: 'study' }];

    const { statDeltas } = simulateWeek(schedule, 4, DEFAULT_STATS, { disableRandomEvents: true });

    // knowledge: 5 (study)
    expect(statDeltas.knowledge).toBe(5);
    // stress: 10 (study) + 5 (baseline) = 15
    expect(statDeltas.stress).toBe(15);
    // health: -5 (study) + -3 (baseline) = -8
    expect(statDeltas.health).toBe(-8);
    // money: -30000 (baseline)
    expect(statDeltas.money).toBe(-30000);
    // social: -2 (study isolation)
    expect(statDeltas.social).toBe(-2);
  });

  it('should halve positive gains (except money) when stress > 70', () => {
    const highStressStats: PlayerStats = { ...DEFAULT_STATS, stress: 80 };
    const schedule = makeEmptySchedule();
    // "club" gives: money: -15000, social: 7, stress: -2, charm: 3
    schedule.monday = [{ timeSlot: 'morning', activityId: 'club' }];

    const { statDeltas } = simulateWeek(schedule, 4, highStressStats, { disableRandomEvents: true });

    // Positive gains halved AFTER stat interactions apply.
    // Charm=40 → charmBonus=0.4 → social: round(7*1.4)=10 → halved: round(10*0.5)=5
    expect(statDeltas.social).toBe(5);
    expect(statDeltas.charm).toBe(Math.round(3 * 0.5)); // 3 -> 2

    // Money: -15000 (club) + -30000 (baseline) = -45000, then social>60 discount doesn't apply
    expect(statDeltas.money).toBe(-45000);

    // stress: -2 (club) + 5 (baseline) + knowledge decay(-2 for stress>=70) = stress 3, knowledge -2
    // But stress is net positive (3), so it gets halved: round(3*0.5)=2
    expect(statDeltas.stress).toBe(2);
  });

  it('should apply baseline drains even for an empty schedule', () => {
    const schedule = makeEmptySchedule();

    const { statDeltas } = simulateWeek(schedule, 1, DEFAULT_STATS, { disableRandomEvents: true });

    // Baseline drains: money -30000, health -3, stress +5
    expect(statDeltas.money).toBe(-30000);
    expect(statDeltas.health).toBe(-3);
    expect(statDeltas.stress).toBe(5);
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

  it('should return no scenes for non-scripted weeks', () => {
    const schedule = makeEmptySchedule();
    // Week 16 is the ending redirect, no scenes
    expect(simulateWeek(schedule, 16, DEFAULT_STATS).scenes).toHaveLength(0);
  });

  it('should return MT scenes for week 4', () => {
    const schedule = makeEmptySchedule();
    const { scenes } = simulateWeek(schedule, 4, DEFAULT_STATS);

    expect(scenes.length).toBeGreaterThan(0);
    expect(scenes[0].id).toBe('mt_announcement');
  });

  it('should double knowledge gains and add stress during exam weeks (7, 8, 14, 15)', () => {
    const schedule = makeEmptySchedule();
    // "study" gives knowledge: 5 normally
    schedule.monday = [{ timeSlot: 'morning', activityId: 'study' }];

    // Week 4 (normal): knowledge should be 5
    const normal = simulateWeek(schedule, 4, DEFAULT_STATS, { disableRandomEvents: true });
    expect(normal.statDeltas.knowledge).toBe(5);

    // Week 7 (midterms): knowledge should be doubled → 10, stress gets +5 exam anxiety
    const midterm = simulateWeek(schedule, 7, DEFAULT_STATS, { disableRandomEvents: true });
    expect(midterm.statDeltas.knowledge).toBe(10);
    // stress: 10 (study) + 5 (baseline) + 5 (exam) = 20
    expect(midterm.statDeltas.stress).toBe(20);
  });

  it('should boost social and charm during festival week (9)', () => {
    const schedule = makeEmptySchedule();
    // "club" gives social: 7, charm: 3, stress: -2, money: -15000
    schedule.monday = [{ timeSlot: 'morning', activityId: 'club' }];

    // Week 9 (festival): social ×1.5, charm ×1.5, stress -3
    const festival = simulateWeek(schedule, 9, DEFAULT_STATS, { disableRandomEvents: true });
    // social: 7 → charm-boosted to round(7*1.4)=10 → festival: round(10*1.5)=15
    expect(festival.statDeltas.social).toBe(15);
    // charm: 3 → festival: round(3*1.5)=5
    expect(festival.statDeltas.charm).toBe(5);
    // stress: -2 (club) + 5 (baseline) -3 (festival) = 0 → trimmed
    expect(festival.statDeltas.stress).toBeUndefined(); // stress is 0, trimmed
  });

  it('should give combo bonus when study + lecture are in the same week', () => {
    const schedule = makeEmptySchedule();
    schedule.monday = [{ timeSlot: 'morning', activityId: 'study' }];
    schedule.tuesday = [{ timeSlot: 'morning', activityId: 'lecture' }];

    const { statDeltas } = simulateWeek(schedule, 3, DEFAULT_STATS, { disableRandomEvents: true });
    // study knowledge(5) + lecture knowledge(3) + combo(2) = 10. Lecture also gives knowledge:3.
    expect(statDeltas.knowledge).toBe(10); // 5+3+2
  });

  it('should give exercise + rest combo health bonus', () => {
    const schedule = makeEmptySchedule();
    schedule.monday = [{ timeSlot: 'morning', activityId: 'exercise' }];
    schedule.tuesday = [{ timeSlot: 'morning', activityId: 'rest' }];

    const { statDeltas } = simulateWeek(schedule, 3, DEFAULT_STATS, { disableRandomEvents: true });
    // exercise health(8) + rest health(8) + combo(5) + baseline(-3) = 18
    expect(statDeltas.health).toBe(18);
  });

  it('should apply diminishing returns on 4+ repeated activities', () => {
    const schedule = makeEmptySchedule();
    // 4 study slots — 4th one at 50% effectiveness
    schedule.monday = [{ timeSlot: 'morning', activityId: 'study' }];
    schedule.tuesday = [{ timeSlot: 'morning', activityId: 'study' }];
    schedule.wednesday = [{ timeSlot: 'morning', activityId: 'study' }];
    schedule.thursday = [{ timeSlot: 'morning', activityId: 'study' }];

    const { statDeltas } = simulateWeek(schedule, 3, DEFAULT_STATS, { disableRandomEvents: true });
    // study knowledge: 5+5+5+round(5*0.5)=3 = 18
    // stress: 10+10+10+round(10*0.5)=5 = 35 + 5 (벼락치기) + 5 (baseline) = 45
    expect(statDeltas.knowledge).toBe(18);
    expect(statDeltas.stress).toBe(45);
  });

  it('should give parttime + study combo bonus', () => {
    const schedule = makeEmptySchedule();
    schedule.monday = [{ timeSlot: 'morning', activityId: 'parttime' }];
    schedule.tuesday = [{ timeSlot: 'morning', activityId: 'study' }];

    const { combos } = simulateWeek(schedule, 3, DEFAULT_STATS, { disableRandomEvents: true });
    const hardworker = combos.find(c => c.name === '고학생');
    expect(hardworker).toBeDefined();
  });

  it('should penalize 3+ parttime slots with health loss', () => {
    const schedule = makeEmptySchedule();
    schedule.monday = [{ timeSlot: 'morning', activityId: 'parttime' }];
    schedule.tuesday = [{ timeSlot: 'morning', activityId: 'parttime' }];
    schedule.wednesday = [{ timeSlot: 'morning', activityId: 'parttime' }];

    const { combos } = simulateWeek(schedule, 3, DEFAULT_STATS, { disableRandomEvents: true });
    const overwork = combos.find(c => c.name === '알바 중독');
    expect(overwork).toBeDefined();
  });

  it('should return scenes for week 10 (variant A or B)', () => {
    const schedule = makeEmptySchedule();
    const { scenes } = simulateWeek(schedule, 10, DEFAULT_STATS, { disableRandomEvents: true });

    expect(scenes.length).toBeGreaterThan(0);
    expect(['midterm_slump', 'campus_discovery']).toContain(scenes[0].id);
  });

  it('should return weeklyEvent field (may be null due to randomness)', () => {
    const schedule = makeEmptySchedule();
    schedule.monday = [{ timeSlot: 'morning', activityId: 'study' }];

    const result = simulateWeek(schedule, 5, DEFAULT_STATS);
    expect(result).toHaveProperty('weeklyEvent');
    if (result.weeklyEvent) {
      expect(result.weeklyEvent).toHaveProperty('id');
      expect(result.weeklyEvent).toHaveProperty('name');
      expect(result.weeklyEvent).toHaveProperty('description');
      expect(result.weeklyEvent).toHaveProperty('effects');
    }
  });

  it('should return getWeekCondition for special weeks', () => {
    expect(getWeekCondition(7).type).toBe('midterm');
    expect(getWeekCondition(8).type).toBe('midterm');
    expect(getWeekCondition(9).type).toBe('festival');
    expect(getWeekCondition(14).type).toBe('finals');
    expect(getWeekCondition(3).type).toBe('normal');
  });

  it('should return weather for any week', () => {
    for (let w = 1; w <= 16; w++) {
      const weather = getWeatherForWeek(w);
      expect(weather).toHaveProperty('type');
      expect(weather).toHaveProperty('label');
      expect(weather).toHaveProperty('emoji');
      expect(['sunny', 'rainy', 'cold', 'hot', 'normal']).toContain(weather.type);
    }
  });
});
