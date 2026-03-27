import type { PlayerStats, StatDelta, StatKey, MajorType } from "../types/stats";
import {
  STAT_MIN,
  STAT_MAX,
  BASE_STATS,
  MAJOR_STAT_OVERRIDES,
  STAT_KEYS,
} from "../types/stats";

export function clampStat(value: number): number {
  return Math.max(STAT_MIN, Math.min(STAT_MAX, Math.round(value)));
}

export function createInitialStats(major: MajorType): PlayerStats {
  const overrides = MAJOR_STAT_OVERRIDES[major];
  return {
    ...BASE_STATS,
    ...overrides,
  };
}

export function applyStatDelta(
  stats: PlayerStats,
  delta: StatDelta
): PlayerStats {
  const newStats = { ...stats };
  for (const key of STAT_KEYS) {
    if (delta[key] !== undefined) {
      newStats[key] = clampStat(newStats[key] + delta[key]!);
    }
  }
  return newStats;
}

export function mergeStatDeltas(...deltas: StatDelta[]): StatDelta {
  const merged: StatDelta = {};
  for (const delta of deltas) {
    for (const key of STAT_KEYS) {
      if (delta[key] !== undefined) {
        merged[key] = (merged[key] ?? 0) + delta[key]!;
      }
    }
  }
  return merged;
}

export function clampAIModifiers(delta: StatDelta): StatDelta {
  const clamped: StatDelta = {};
  for (const key of STAT_KEYS) {
    if (delta[key] !== undefined) {
      clamped[key] = Math.max(-5, Math.min(5, delta[key]!));
    }
  }
  return clamped;
}

export function getStatDiffDescription(
  before: PlayerStats,
  after: PlayerStats,
  lang: "ko" | "en"
): string[] {
  const changes: string[] = [];
  for (const key of STAT_KEYS) {
    const diff = after[key] - before[key];
    if (diff !== 0) {
      const sign = diff > 0 ? "+" : "";
      const label =
        lang === "ko"
          ? { knowledge: "준비도", energy: "체력", social: "사회성", finances: "재정", career: "스펙", mental: "멘탈" }[key]
          : key.charAt(0).toUpperCase() + key.slice(1);
      changes.push(`${label} ${sign}${diff}`);
    }
  }
  return changes;
}
