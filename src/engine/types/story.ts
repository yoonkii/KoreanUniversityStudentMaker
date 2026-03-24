export type ThreadStatus = "active" | "escalating" | "resolving" | "resolved";

export interface StoryThread {
  id: string;
  title: string; // e.g., "조별과제 갈등"
  summary: string; // 1-2 sentence current state
  status: ThreadStatus;
  startDay: number;
  involvedNPCs: string[];
  relatedStats: string[]; // which stats this thread pressures
}

export interface PlantedSeed {
  id: string;
  description: string;
  plantedOnDay: number;
  payoffReady: boolean; // true after minimum incubation period
  minimumIncubationDays: number;
  relatedNPCs: string[];
  relatedStats: string[];
}

export interface RelationshipTension {
  npc1: string;
  npc2: string;
  type: "rivalry" | "unrequited" | "secret" | "conflict" | "alliance";
  intensity: number; // 1-10
  playerAware: boolean;
}

export interface PendingDiscovery {
  id: string;
  content: string;
  involvedNPCs: string[];
  discoveryMethod: string; // how the player would find out
  createdOnDay: number;
  discovered: boolean;
}

export type StorytellerMode = "cassandra" | "randy" | "phoebe";

export interface StoryDirectorState {
  mode: StorytellerMode;
  tensionLevel: number; // 0-10
  tensionHistory: number[]; // last 14 days
  daysSinceLastChoice: number;
  daysSinceLastCrisis: number;
  daysSinceLastPositiveEvent: number;
  activeThreads: StoryThread[];
  resolvedThreads: StoryThread[];
  plantedSeeds: PlantedSeed[];
  npcDramaScores: Record<string, number>;
  npcRelationshipTensions: RelationshipTension[];
  currentPhase: SemesterPhase;
  phaseTargetTension: number;
}

export type SemesterPhase =
  | "orientation" // weeks 1-2
  | "settling_in" // weeks 3-6
  | "midterms" // weeks 7-8
  | "post_midterm" // weeks 9-12
  | "finals_prep" // weeks 13-14
  | "finals"; // weeks 15-16

export interface DayLogEntry {
  day: number;
  summary: string;
  choiceMade: boolean;
  crisisTriggered: boolean;
  tensionLevel: number;
  npcInteractions: string[]; // NPC IDs who appeared
}

export interface CrisisEvent {
  day: number;
  stat: string;
  type: string;
  description: string;
}

export const MAX_ACTIVE_THREADS = 3;
export const THREAD_ESCALATION_DAYS = 5;
export const THREAD_STAT_EXTREME_LOW = 25;
export const THREAD_STAT_EXTREME_HIGH = 85;
