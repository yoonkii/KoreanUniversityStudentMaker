import type { ClockState } from "../types/game-state";
import type { SemesterPhase } from "../types/story";
import { getSemesterPhase, MAX_DAYS, DAYS_PER_WEEK } from "../types/game-state";

export function createInitialClock(): ClockState {
  return {
    currentDay: 1,
    currentWeek: 1,
    currentDayOfWeek: 1, // Monday
    semesterPhase: "orientation",
  };
}

export function advanceDay(clock: ClockState): ClockState {
  const newDay = clock.currentDay + 1;
  const newDayOfWeek = ((newDay - 1) % DAYS_PER_WEEK) + 1;
  const newWeek = Math.ceil(newDay / DAYS_PER_WEEK);
  const newPhase = getSemesterPhase(newWeek);

  return {
    currentDay: newDay,
    currentWeek: newWeek,
    currentDayOfWeek: newDayOfWeek,
    semesterPhase: newPhase,
  };
}

export function isSemesterOver(clock: ClockState): boolean {
  return clock.currentDay > MAX_DAYS;
}

export function isEndOfWeek(day: number): boolean {
  return day % DAYS_PER_WEEK === 0;
}

export function isRentDay(day: number): boolean {
  return [28, 56, 84, 112].includes(day);
}

export function getWeekNumber(day: number): number {
  return Math.ceil(day / DAYS_PER_WEEK);
}

export function getDayName(
  dayOfWeek: number,
  lang: "ko" | "en"
): string {
  const names = {
    ko: ["월", "화", "수", "목", "금", "토", "일"],
    en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  };
  return names[lang][dayOfWeek - 1];
}

export function getPhaseLabel(
  phase: SemesterPhase,
  lang: "ko" | "en"
): string {
  const labels: Record<SemesterPhase, { ko: string; en: string }> = {
    orientation: { ko: "오리엔테이션", en: "Orientation" },
    settling_in: { ko: "학기 초반", en: "Settling In" },
    midterms: { ko: "중간고사", en: "Midterms" },
    post_midterm: { ko: "중간 이후", en: "Post-Midterm" },
    finals_prep: { ko: "기말 준비", en: "Finals Prep" },
    finals: { ko: "기말고사", en: "Finals" },
  };
  return labels[phase][lang];
}
