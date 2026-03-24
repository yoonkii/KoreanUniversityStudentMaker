export type EmotionType =
  | "joy"
  | "sadness"
  | "anger"
  | "fear"
  | "surprise"
  | "disgust"
  | "trust"
  | "anticipation"
  | "stress"
  | "loneliness"
  | "pride"
  | "embarrassment"
  | "jealousy";

export interface EmotionalState {
  primary: EmotionType;
  primaryIntensity: number; // 1-10
  secondary: EmotionType | null;
  secondaryIntensity: number; // 1-10
  mood: number; // -10 to +10 (long-term baseline)
  stressLevel: number; // 0-10 (accumulates, decays slowly)
}

export interface EmotionEvent {
  type: EmotionType;
  intensity: number; // 1-10
  target?: string; // NPC or player ID
  source: string; // what caused it
}

export const DEFAULT_EMOTIONAL_STATE: EmotionalState = {
  primary: "anticipation",
  primaryIntensity: 3,
  secondary: null,
  secondaryIntensity: 0,
  mood: 2,
  stressLevel: 2,
};

// Maps expression to art generation emotion names
export const EXPRESSION_VARIANTS = [
  "neutral",
  "happy",
  "sad",
  "angry",
  "surprised",
  "embarrassed",
  "serious",
] as const;

export type ExpressionVariant = (typeof EXPRESSION_VARIANTS)[number];
