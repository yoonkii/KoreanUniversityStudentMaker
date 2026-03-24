import type { EmotionalState, ExpressionVariant } from "./emotion";

export type NPCRole =
  | "roommate"
  | "classmate"
  | "senior"
  | "professor"
  | "work_colleague"
  | "club_member"
  | "romantic_interest"
  | "rival";

export interface NPCPersonality {
  openness: number; // 0-100: 보수적 ↔ 진취적
  conscientiousness: number; // 0-100: 자유로운 ↔ 성실한
  extraversion: number; // 0-100: 내향적 ↔ 외향적
  agreeableness: number; // 0-100: 직설적 ↔ 따뜻한
  neuroticism: number; // 0-100: 안정적 ↔ 예민한
}

export interface NPCCharacterSheet {
  id: string;
  name: string;
  role: NPCRole;
  personality: NPCPersonality;
  values: string[]; // max 3, ordered by priority
  speechPattern: string; // e.g., "반말 위주, 은어 많이 씀"
  backstory: string; // 2-3 sentences
  quirks: string[];
  goals: string[]; // personal goals driving autonomous behavior
  appearancePrompt: string; // prompt fragment for art generation
  major: string;
  year: number; // 1-4학년
  sharedCourseIds: string[];
  primaryLocationIds: string[];
}

export interface NPCRelationshipState {
  level: number; // 0-100
  attitude: string; // 1-sentence current feeling
  trust: number; // 0-100 (separate from liking)
}

export interface NPCMemoryEntry {
  day: number;
  event: string; // 1-2 sentences
  emotionalImpact: number; // -5 to +5
  involvedParties: string[]; // player ID or NPC IDs
}

export interface NPCLongTermMemory {
  summary: string; // 1 sentence
  importance: number; // 1-10
  emotionalValence: number; // -5 to +5
  day: number;
}

export interface NPCMemory {
  shortTerm: NPCMemoryEntry[]; // last 5
  longTerm: NPCLongTermMemory[]; // max 10, sorted by importance
  impressions: Record<string, string>; // entityId -> 1-sentence impression
}

export interface NPCLiveState {
  npcId: string;
  emotion: EmotionalState;
  relationshipToPlayer: NPCRelationshipState;
  npcRelationships: Record<string, { level: number; attitude: string }>;
  memory: NPCMemory;
  currentGoal: string;
  currentLocation: string;
  recentDecisions: string[]; // last 3 decisions for consistency
  secretKnowledge: string[]; // things this NPC knows that player doesn't
}

export interface NPCArtAssets {
  basePortrait: string; // base64
  expressions: Partial<Record<ExpressionVariant, string>>; // base64 per expression
}

export interface NPCFull {
  sheet: NPCCharacterSheet;
  state: NPCLiveState;
  art?: NPCArtAssets;
}

// Constants
export const MAX_SHORT_TERM_MEMORIES = 5;
export const MAX_LONG_TERM_MEMORIES = 10;
export const MEMORY_PROMOTION_THRESHOLD = 3; // abs(emotionalImpact) >= this to promote
export const RELATIONSHIP_DECAY_PER_WEEK = 1;
export const RELATIONSHIP_DISCOVERY_THRESHOLD = 20;
export const NPC_INITIATE_EVENT_THRESHOLD = 60;
