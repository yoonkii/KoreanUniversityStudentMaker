import type { PlayerStats, StatKey } from "../types/stats";
import type { CrisisEvent, SemesterPhase } from "../types/story";
import { CRISIS_THRESHOLD, GPA_PROBATION_THRESHOLD } from "../types/stats";

export interface CrisisResult {
  crisisTriggered: boolean;
  event: CrisisEvent | null;
  statOverride?: Partial<PlayerStats>;
  forcedSchedule?: {
    days: number;
    description: string;
    type: string;
  };
}

export function detectCrisis(
  stats: PlayerStats,
  day: number,
  phase: SemesterPhase
): CrisisResult[] {
  const crises: CrisisResult[] = [];

  // Energy < 10: Collapse
  if (stats.energy < CRISIS_THRESHOLD) {
    crises.push({
      crisisTriggered: true,
      event: {
        day,
        stat: "energy",
        type: "collapse",
        description: "체력이 바닥나서 쓰러졌다. 하루 동안 강제 휴식.",
      },
      statOverride: { energy: 30 },
      forcedSchedule: {
        days: 1,
        description: "강제 휴식 (쓰러짐)",
        type: "forced_rest",
      },
    });
  }

  // Mental < 10: Burnout
  if (stats.mental < CRISIS_THRESHOLD) {
    crises.push({
      crisisTriggered: true,
      event: {
        day,
        stat: "mental",
        type: "burnout",
        description: "번아웃이 왔다. 모든 것이 의미없게 느껴진다.",
      },
      statOverride: { mental: 25, social: Math.max(0, stats.social - 5), knowledge: Math.max(0, stats.knowledge - 5) },
    });
  }

  // Finances < 10: Can't pay rent
  if (stats.finances < CRISIS_THRESHOLD) {
    crises.push({
      crisisTriggered: true,
      event: {
        day,
        stat: "finances",
        type: "broke",
        description: "돈이 없다. 당분간 알바에 집중해야 한다.",
      },
      forcedSchedule: {
        days: 3,
        description: "강제 알바 (재정 위기)",
        type: "forced_work",
      },
    });
  }

  // Social < 10: Isolation spiral
  if (stats.social < CRISIS_THRESHOLD) {
    crises.push({
      crisisTriggered: true,
      event: {
        day,
        stat: "social",
        type: "isolation",
        description: "완전히 고립됐다. 외로움이 멘탈을 갉아먹는다.",
      },
      // Ongoing: mental drains -2 extra per day until social > 20
      // This is handled in the night phase
    });
  }

  // Knowledge < 20 at midterms or finals: Academic probation
  if (
    stats.knowledge < GPA_PROBATION_THRESHOLD &&
    (phase === "midterms" || phase === "finals")
  ) {
    crises.push({
      crisisTriggered: true,
      event: {
        day,
        stat: "knowledge",
        type: "probation",
        description: "학사경고! 준비도가 너무 낮아 경고를 받았다.",
      },
    });
  }

  return crises;
}

/**
 * Check if game over condition is met:
 * 3 different crisis events in a single week
 */
export function isGameOver(
  crisisLog: CrisisEvent[],
  currentDay: number
): boolean {
  const weekStart = Math.floor((currentDay - 1) / 7) * 7 + 1;
  const weekEnd = weekStart + 6;

  const crisisesThisWeek = crisisLog.filter(
    (c) => c.day >= weekStart && c.day <= weekEnd
  );

  // Count unique crisis types this week
  const uniqueTypes = new Set(crisisesThisWeek.map((c) => c.type));
  return uniqueTypes.size >= 3;
}
