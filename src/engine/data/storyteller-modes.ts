import type { StorytellerMode } from "../types/story";

export interface StorytellerConfig {
  mode: StorytellerMode;
  label: { ko: string; en: string };
  description: { ko: string; en: string };
  tensionCurve: (day: number) => number;
  maxDaysWithoutChoice: number;
  maxDaysWithoutCrisis: number;
  reliefProbabilityWhenOverTarget: number;
}

/**
 * Cassandra (캐산드라): Classic rising tension. Follows the semester arc.
 * Never lets tension stay flat for more than 3 days.
 */
const cassandra: StorytellerConfig = {
  mode: "cassandra",
  label: { ko: "캐산드라", en: "Cassandra" },
  description: {
    ko: "전통적인 서사 곡선. 점점 고조되는 긴장감.",
    en: "Classic rising tension following the semester arc.",
  },
  tensionCurve: (day: number) => {
    if (day <= 14) return 2 + (day / 14) * 2; // 2 -> 4
    if (day <= 56) return 4 + ((day - 14) / 42) * 4; // 4 -> 8
    if (day <= 70) return 8 - ((day - 56) / 14) * 3; // 8 -> 5
    if (day <= 98) return 5 + ((day - 70) / 28) * 3; // 5 -> 8
    return 8 + ((day - 98) / 14) * 2; // 8 -> 10
  },
  maxDaysWithoutChoice: 4,
  maxDaysWithoutCrisis: 14,
  reliefProbabilityWhenOverTarget: 0.7,
};

/**
 * Randy (랜디): Chaotic. Tension target rerolled every 3 days.
 * Can pile crises or give weeks of peace.
 */
const randy: StorytellerConfig = {
  mode: "randy",
  label: { ko: "랜디", en: "Randy" },
  description: {
    ko: "혼돈의 카오스. 예측 불가능한 사건들.",
    en: "Pure chaos. Unpredictable events.",
  },
  tensionCurve: (day: number) => {
    // Pseudo-random but deterministic based on day
    // Changes every 3 days
    const seed = Math.floor(day / 3);
    const hash = ((seed * 2654435761) >>> 0) % 100;
    return 1 + (hash / 100) * 9; // 1-10 uniform
  },
  maxDaysWithoutChoice: 3,
  maxDaysWithoutCrisis: Math.floor(Math.random() * 25) + 5, // 5-30
  reliefProbabilityWhenOverTarget: 0.3,
};

/**
 * Phoebe (피비): Chill with spikes. Base tension is 3.
 * Every 10-15 days, a dramatic spike to 8-9 for 2-3 days.
 */
const phoebe: StorytellerConfig = {
  mode: "phoebe",
  label: { ko: "피비", en: "Phoebe" },
  description: {
    ko: "일상 위주, 가끔 드라마. 슬라이스 오브 라이프.",
    en: "Slice-of-life with occasional dramatic spikes.",
  },
  tensionCurve: (day: number) => {
    // Spikes roughly every 12 days, lasting 2 days
    const cycleLength = 12;
    const spikeDuration = 2;
    const posInCycle = day % cycleLength;

    if (posInCycle >= cycleLength - spikeDuration) {
      return 8 + Math.random(); // 8-9 during spike
    }
    return 3; // base chill
  },
  maxDaysWithoutChoice: 6,
  maxDaysWithoutCrisis: 20,
  reliefProbabilityWhenOverTarget: 0.9,
};

export const STORYTELLER_CONFIGS: Record<StorytellerMode, StorytellerConfig> = {
  cassandra,
  randy,
  phoebe,
};

export function getTargetTension(
  mode: StorytellerMode,
  day: number
): number {
  return STORYTELLER_CONFIGS[mode].tensionCurve(day);
}
