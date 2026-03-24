import type { PlayerStats, MajorType } from "./stats";
import type { Course } from "./course";
import type { LockedSlot, DailySchedule } from "./activity";
import type {
  StoryDirectorState,
  StoryThread,
  DayLogEntry,
  PendingDiscovery,
  CrisisEvent,
  SemesterPhase,
  StorytellerMode,
} from "./story";
import type { NPCCharacterSheet, NPCLiveState } from "./npc";

export interface PlayerState {
  name: string;
  university: string;
  major: MajorType;
  stats: PlayerStats;
  enrolledCourses: Course[];
  lockedSlots: LockedSlot[]; // derived from enrolled courses + current day
}

export interface ClockState {
  currentDay: number; // 1-112
  currentWeek: number; // 1-16
  currentDayOfWeek: number; // 1-7 (Mon-Sun)
  semesterPhase: SemesterPhase;
}

export interface NPCState {
  sheets: Record<string, NPCCharacterSheet>;
  states: Record<string, NPCLiveState>;
}

export interface StoryState {
  director: StoryDirectorState;
  threads: StoryThread[];
  rollingSummary: string;
  dayLog: DayLogEntry[]; // last 7 days
  pendingDiscoveries: PendingDiscovery[];
  crisisLog: CrisisEvent[];
  crisisesThisWeek: number;
}

export interface GameSettings {
  language: "ko" | "en";
  storytellerMode: StorytellerMode;
  difficulty: "casual" | "normal" | "hardcore";
}

export interface GameState {
  schemaVersion: number;
  player: PlayerState;
  clock: ClockState;
  npcs: NPCState;
  story: StoryState;
  settings: GameSettings;
  artCacheReady: boolean;
  gamePhase: "creating" | "registration" | "playing" | "ended";
}

export const SCHEMA_VERSION = 1;
export const MAX_DAYS = 112;
export const DAYS_PER_WEEK = 7;

export function getSemesterPhase(week: number): SemesterPhase {
  if (week <= 2) return "orientation";
  if (week <= 6) return "settling_in";
  if (week <= 8) return "midterms";
  if (week <= 12) return "post_midterm";
  if (week <= 14) return "finals_prep";
  return "finals";
}
