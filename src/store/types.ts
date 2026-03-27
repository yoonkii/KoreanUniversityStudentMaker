export type Gender = 'male' | 'female';
export type TimeSlot = 'morning' | 'afternoon' | 'evening';
export type GamePhase = 'title' | 'creation' | 'planning' | 'simulation' | 'summary';
export type CharacterPosition = 'left' | 'center' | 'right';

export interface PlayerStats {
  knowledge: number; // 0-100, 준비도 (exam preparedness). GPA derived at exams only.
  money: number;     // Won (₩), no upper bound
  health: number;    // 0-100
  social: number;    // 0-100
  stress: number;    // 0-100
  charm: number;     // 0-100
}

export type DreamType = 'scholar' | 'social' | 'balance' | 'freedom';

export interface PlayerProfile {
  name: string;
  gender: Gender;
  major: string;
  dream?: DreamType;
}

export interface CharacterRelationship {
  characterId: string;
  affection: number;    // 0-100
  encounters: number;
  lastInteraction?: number;
}

export interface ActivitySlot {
  timeSlot: TimeSlot;
  activityId: string;
  targetNpcId?: string; // For friends/date: which NPC to spend time with
}

export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type WeekSchedule = Record<DayKey, ActivitySlot[]>;

export interface SceneCharacter {
  characterId: string;
  expression: string;
  position: CharacterPosition;
}

export interface DialogueLine {
  characterId: string | null; // null = narrator
  text: string;
  expression?: string;
}

export interface Choice {
  id: string;
  text: string;
  statEffects: Partial<PlayerStats>;
  relationshipEffects?: { characterId: string; change: number }[];
  requiredRelationship?: { characterId: string; minAffection: number }; // Gray out if not met
}

export interface Scene {
  id: string;
  location: string;
  backgroundVariant: string;
  characters: SceneCharacter[];
  dialogue: DialogueLine[];
  choices?: Choice[];
}

export interface StatChange {
  stat: keyof PlayerStats;
  value: number;
}

export interface NpcActivityVariant {
  npcId: string;
  npcName: string;
  statEffects: Partial<PlayerStats>;
  description: string;
  requiredTier: 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'soulmate';
}

export interface ActivityDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  statEffects: Partial<PlayerStats>;
  description: string;
  requiresNpcTarget?: boolean; // If true, show NPC picker
  npcVariants?: NpcActivityVariant[];
  /** Stat requirements to unlock this activity */
  unlockRequirement?: { stat: keyof PlayerStats; min: number; label: string };
  /** Minimum week to unlock */
  unlockWeek?: number;
}

export interface CharacterDef {
  id: string;
  name: string;
  role: string;
  description: string;
  expressions: string[];
  personality: string;
  color: string;
}

export interface ExamResults {
  midtermGpa?: number;  // 0.0-4.5
  finalsGpa?: number;   // 0.0-4.5
  semesterGpa?: number; // weighted average
}

export interface KakaoReplyOption {
  id: string;
  text: string;
  affectionChange: number;
  statEffects?: Partial<PlayerStats>;
}

export interface KakaoReply {
  npcId: string;
  options: KakaoReplyOption[];
}
