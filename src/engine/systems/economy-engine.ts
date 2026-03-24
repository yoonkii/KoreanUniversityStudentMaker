import type { PlayerStats } from "../types/stats";

// Economy constants
export const WEEKLY_DRAIN = 5; // food, transport, misc
export const MONTHLY_RENT = 10; // every 4 weeks (day 28, 56, 84, 112)
export const RENT_DAYS = [28, 56, 84, 112];

/**
 * Calculate economy drain for a given day.
 * Weekly drain applies on every 7th day.
 * Monthly rent applies on days 28, 56, 84, 112.
 */
export function getEconomyDrain(day: number): number {
  let drain = 0;

  // Weekly drain on every 7th day
  if (day % 7 === 0) {
    drain += WEEKLY_DRAIN;
  }

  // Monthly rent
  if (RENT_DAYS.includes(day)) {
    drain += MONTHLY_RENT;
  }

  return drain;
}

/**
 * Apply economy drain to finances stat.
 */
export function applyEconomyDrain(
  stats: PlayerStats,
  day: number
): PlayerStats {
  const drain = getEconomyDrain(day);
  if (drain === 0) return stats;

  return {
    ...stats,
    finances: Math.max(0, stats.finances - drain),
  };
}

/**
 * Project when finances will hit crisis level if no income.
 * Returns the day number, or -1 if never within the semester.
 */
export function projectFinancialCrisis(
  currentFinances: number,
  currentDay: number,
  maxDay: number = 112
): number {
  let finances = currentFinances;
  for (let day = currentDay + 1; day <= maxDay; day++) {
    finances -= getEconomyDrain(day);
    if (finances < 10) return day;
  }
  return -1;
}
