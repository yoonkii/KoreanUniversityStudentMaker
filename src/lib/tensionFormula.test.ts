import { describe, it, expect } from 'vitest';
import { calculateTension } from './tensionFormula';
import type { PlayerStats, CharacterRelationship } from '@/store/types';

const DEFAULT_STATS: PlayerStats = {
  knowledge: 50,
  money: 500000,
  health: 70,
  social: 40,
  stress: 20,
  charm: 40,
};

function makeRelationship(id: string, affection: number): CharacterRelationship {
  return { characterId: id, affection, encounters: 1, lastInteraction: 1 };
}

describe('calculateTension', () => {
  it('should return a reasonable base tension with default stats and no relationships', () => {
    const tension = calculateTension(DEFAULT_STATS, {}, 1);

    // statPressure = (|20-30| + |50-70| + |70-70|) / 3 = (10 + 20 + 0) / 3 = 10
    // relationshipVariance = 0 (no relationships)
    // weekBonus = 0 (not exam week)
    // weekly escalation = 1 * 2 = 2
    // raw = 10 * 0.4 + 0 * 0.3 + 0 + 2 = 6
    expect(tension).toBe(6);
  });

  it('should add exam bonus on midterm week (8)', () => {
    const tension = calculateTension(DEFAULT_STATS, {}, 8);

    // Same stat pressure = 10
    // raw = 10 * 0.4 + 0 + 30 + 8 * 2 = 4 + 30 + 16 = 50
    expect(tension).toBe(50);
  });

  it('should add exam bonus on finals week (15)', () => {
    const tension = calculateTension(DEFAULT_STATS, {}, 15);

    // raw = 10 * 0.4 + 0 + 30 + 15 * 2 = 4 + 30 + 30 = 64
    expect(tension).toBe(64);
  });

  it('should account for relationship variance', () => {
    const relationships: Record<string, CharacterRelationship> = {
      alice: makeRelationship('alice', 90),
      bob: makeRelationship('bob', 20),
    };

    const tension = calculateTension(DEFAULT_STATS, relationships, 1);

    // statPressure = 10 (same as base)
    // relationshipVariance = 90 - 20 = 70
    // raw = 10 * 0.4 + 70 * 0.3 + 0 + 2 = 4 + 21 + 2 = 27
    expect(tension).toBe(27);
  });

  it('should not compute relationship variance with only one relationship', () => {
    const relationships: Record<string, CharacterRelationship> = {
      alice: makeRelationship('alice', 90),
    };

    const tensionWithOne = calculateTension(DEFAULT_STATS, relationships, 1);
    const tensionWithNone = calculateTension(DEFAULT_STATS, {}, 1);

    // With a single relationship, variance is 0, same as no relationships
    expect(tensionWithOne).toBe(tensionWithNone);
  });

  it('should clamp tension to 100 max', () => {
    // Extreme stats to produce very high tension
    const extremeStats: PlayerStats = {
      knowledge: 0,    // distance from 70 = 70
      money: 0,
      health: 0, // distance from 70 = 70
      social: 0,
      stress: 100, // distance from 30 = 70
      charm: 0,
    };
    // statPressure = (70 + 70 + 70) / 3 = 70
    // Give high relationship variance too
    const relationships: Record<string, CharacterRelationship> = {
      a: makeRelationship('a', 100),
      b: makeRelationship('b', 0),
    };
    // relationshipVariance = 100
    // At finals week 15: weekBonus = 30, week * 2 = 30
    // raw = 70 * 0.4 + 100 * 0.3 + 30 + 30 = 28 + 30 + 30 + 30 = 118
    const tension = calculateTension(extremeStats, relationships, 15);
    expect(tension).toBe(100);
  });
});
