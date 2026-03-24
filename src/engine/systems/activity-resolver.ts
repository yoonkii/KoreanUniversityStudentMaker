import type { ActivityId, DailySchedule } from "../types/activity";
import type { StatDelta } from "../types/stats";
import { ACTIVITIES } from "../types/activity";
import { mergeStatDeltas } from "./stat-engine";

export function getActivityBaseDelta(activityId: ActivityId): StatDelta {
  return ACTIVITIES[activityId].baseDelta;
}

export function resolveScheduleDeltas(schedule: DailySchedule): StatDelta {
  const deltas: StatDelta[] = [];

  if (schedule.morning) {
    deltas.push(getActivityBaseDelta(schedule.morning));
  }
  if (schedule.afternoon) {
    deltas.push(getActivityBaseDelta(schedule.afternoon));
  }
  if (schedule.evening) {
    deltas.push(getActivityBaseDelta(schedule.evening));
  }

  return mergeStatDeltas(...deltas);
}

export function getActivitiesForSlot(
  slot: "morning" | "afternoon" | "evening",
  isLocked: boolean
): ActivityId[] {
  if (isLocked) return ["attend_class"];

  // Evening has all options; morning/afternoon exclude rest (rest is an evening thing)
  const all: ActivityId[] = [
    "attend_class",
    "study",
    "part_time_work",
    "club_social",
    "exercise",
    "rest",
    "career_prep",
    "date",
  ];

  return all;
}

export function getActivityLocationOverlap(
  activityId: ActivityId
): string[] {
  return ACTIVITIES[activityId].locationIds;
}
