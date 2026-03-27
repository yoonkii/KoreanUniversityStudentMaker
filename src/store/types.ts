export type Gender = 'male' | 'female';
export type TimeSlot = 'morning' | 'afternoon' | 'evening';
export type GamePhase = 'title' | 'creation' | 'planning' | 'simulation' | 'summary';
export type CharacterPosition = 'left' | 'center' | 'right';

export interface PlayerStats {
  gpa: number;      // 0-100 internally, displayed as 0.0-4.5
  money: number;    // Won (₩), no upper bound
  health: number;   // 0-100
  social: number;   // 0-100
  stress: number;   // 0-100
  charm: number;    // 0-100
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

export interface ActivityDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  statEffects: Partial<PlayerStats>;
  description: string;
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
