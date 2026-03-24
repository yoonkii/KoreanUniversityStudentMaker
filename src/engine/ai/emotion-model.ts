import type { EmotionalState, EmotionEvent, EmotionType } from "../types/emotion";
import type { NPCPersonality } from "../types/npc";
import { DEFAULT_EMOTIONAL_STATE } from "../types/emotion";

/**
 * Deterministic emotion model. The AI interprets emotions; this system determines them.
 *
 * Key principle: emotions are NOT computed by the LLM. They are computed by game systems
 * and then injected into the LLM prompt for expressive interpretation.
 */

/** Personality modulates emotional impact */
function getPersonalityMultiplier(
  personality: NPCPersonality,
  emotion: EmotionType
): number {
  const { neuroticism, agreeableness, extraversion } = personality;

  // High neuroticism amplifies negative emotions
  const negativeEmotions: EmotionType[] = [
    "sadness", "anger", "fear", "disgust", "stress", "loneliness", "jealousy",
  ];
  if (negativeEmotions.includes(emotion)) {
    return 0.7 + (neuroticism / 100) * 0.8; // 0.7x to 1.5x
  }

  // High agreeableness dampens anger
  if (emotion === "anger") {
    return 1.3 - (agreeableness / 100) * 0.6; // 0.7x to 1.3x
  }

  // High extraversion amplifies social emotions
  const socialEmotions: EmotionType[] = ["joy", "pride", "embarrassment"];
  if (socialEmotions.includes(emotion)) {
    return 0.8 + (extraversion / 100) * 0.4; // 0.8x to 1.2x
  }

  return 1.0;
}

/** Apply an emotion event to an NPC's emotional state */
export function applyEmotionEvent(
  state: EmotionalState,
  event: EmotionEvent,
  personality: NPCPersonality
): EmotionalState {
  const multiplier = getPersonalityMultiplier(personality, event.type);
  const adjustedIntensity = Math.round(event.intensity * multiplier);
  const clampedIntensity = Math.max(1, Math.min(10, adjustedIntensity));

  // If the event intensity is stronger than current primary, it takes over
  if (clampedIntensity >= state.primaryIntensity) {
    return {
      primary: event.type,
      primaryIntensity: clampedIntensity,
      secondary: state.primary !== event.type ? state.primary : state.secondary,
      secondaryIntensity:
        state.primary !== event.type
          ? Math.max(1, state.primaryIntensity - 1)
          : state.secondaryIntensity,
      mood: updateMood(state.mood, event.type, clampedIntensity),
      stressLevel: updateStress(state.stressLevel, event.type, clampedIntensity),
    };
  }

  // Otherwise it becomes secondary (if stronger than current secondary)
  if (clampedIntensity > state.secondaryIntensity) {
    return {
      ...state,
      secondary: event.type,
      secondaryIntensity: clampedIntensity,
      mood: updateMood(state.mood, event.type, clampedIntensity),
      stressLevel: updateStress(state.stressLevel, event.type, clampedIntensity),
    };
  }

  return {
    ...state,
    mood: updateMood(state.mood, event.type, clampedIntensity),
    stressLevel: updateStress(state.stressLevel, event.type, clampedIntensity),
  };
}

/** Mood drifts based on emotion type */
function updateMood(
  currentMood: number,
  emotionType: EmotionType,
  intensity: number
): number {
  const moodImpact: Record<EmotionType, number> = {
    joy: 0.5,
    sadness: -0.4,
    anger: -0.3,
    fear: -0.3,
    surprise: 0.1,
    disgust: -0.2,
    trust: 0.3,
    anticipation: 0.2,
    stress: -0.4,
    loneliness: -0.5,
    pride: 0.4,
    embarrassment: -0.2,
    jealousy: -0.3,
  };

  const impact = (moodImpact[emotionType] ?? 0) * (intensity / 10);
  return Math.max(-10, Math.min(10, currentMood + impact));
}

/** Stress accumulates from negative events, decays slowly */
function updateStress(
  currentStress: number,
  emotionType: EmotionType,
  intensity: number
): number {
  const stressors: EmotionType[] = [
    "anger", "fear", "stress", "sadness", "jealousy",
  ];
  const relievers: EmotionType[] = ["joy", "trust", "pride"];

  if (stressors.includes(emotionType)) {
    return Math.min(10, currentStress + intensity * 0.2);
  }

  if (relievers.includes(emotionType)) {
    return Math.max(0, currentStress - intensity * 0.1);
  }

  return currentStress;
}

/** Daily passive emotion decay — emotions fade, mood drifts toward baseline */
export function decayEmotions(state: EmotionalState): EmotionalState {
  return {
    ...state,
    primaryIntensity: Math.max(1, state.primaryIntensity - 1),
    secondaryIntensity: Math.max(0, state.secondaryIntensity - 1),
    secondary: state.secondaryIntensity <= 1 ? null : state.secondary,
    // Mood drifts 0.1 toward 0
    mood: state.mood > 0
      ? Math.max(0, state.mood - 0.1)
      : state.mood < 0
        ? Math.min(0, state.mood + 0.1)
        : 0,
    // Stress decays by 0.5 on restful days (caller decides if restful)
    stressLevel: state.stressLevel,
  };
}

/** Reduce stress (called when player/NPC rests) */
export function reduceStress(
  state: EmotionalState,
  amount: number = 0.5
): EmotionalState {
  return {
    ...state,
    stressLevel: Math.max(0, state.stressLevel - amount),
  };
}

export function createInitialEmotionalState(): EmotionalState {
  return { ...DEFAULT_EMOTIONAL_STATE };
}
