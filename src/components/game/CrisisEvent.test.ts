import { describe, it, expect } from 'vitest';
import { detectCrisis } from './CrisisEvent';
import type { PlayerStats } from '@/store/types';

const DEFAULT_STATS: PlayerStats = {
  knowledge: 50, money: 500000, health: 70, social: 40, stress: 20, charm: 40,
};

describe('detectCrisis', () => {
  it('should return null for healthy stats', () => {
    expect(detectCrisis(DEFAULT_STATS, 5)).toBeNull();
  });

  it('should detect health collapse when health <= 10', () => {
    const stats = { ...DEFAULT_STATS, health: 10 };
    const crisis = detectCrisis(stats, 5);
    expect(crisis).not.toBeNull();
    expect(crisis!.id).toBe('health_collapse');
  });

  it('should detect mental breakdown when stress >= 90', () => {
    const stats = { ...DEFAULT_STATS, stress: 90 };
    const crisis = detectCrisis(stats, 5);
    expect(crisis).not.toBeNull();
    expect(crisis!.id).toBe('mental_breakdown');
  });

  it('should detect broke crisis when money <= 0 and week > 2', () => {
    const stats = { ...DEFAULT_STATS, money: 0 };
    expect(detectCrisis(stats, 1)).toBeNull(); // too early
    expect(detectCrisis(stats, 3)?.id).toBe('broke_crisis');
  });

  it('should detect academic warning when knowledge <= 15 and week >= 8', () => {
    const stats = { ...DEFAULT_STATS, knowledge: 15 };
    expect(detectCrisis(stats, 5)).toBeNull(); // too early
    expect(detectCrisis(stats, 8)?.id).toBe('academic_warning');
  });

  it('should detect isolation when social <= 5 and week >= 6', () => {
    const stats = { ...DEFAULT_STATS, social: 5 };
    expect(detectCrisis(stats, 3)).toBeNull(); // too early
    expect(detectCrisis(stats, 6)?.id).toBe('isolation');
  });

  it('should prioritize health collapse over other crises', () => {
    const stats = { ...DEFAULT_STATS, health: 5, stress: 99 };
    const crisis = detectCrisis(stats, 10);
    expect(crisis!.id).toBe('health_collapse'); // health checked first
  });

  it('should have interactive choices for each crisis', () => {
    const healthCrisis = detectCrisis({ ...DEFAULT_STATS, health: 5 }, 5);
    expect(healthCrisis!.choices.length).toBeGreaterThanOrEqual(2);

    const stressCrisis = detectCrisis({ ...DEFAULT_STATS, stress: 95 }, 5);
    expect(stressCrisis!.choices.length).toBeGreaterThanOrEqual(2);

    const brokeCrisis = detectCrisis({ ...DEFAULT_STATS, money: 0 }, 5);
    expect(brokeCrisis!.choices.length).toBe(3);
  });

  it('should add NPC choices when friendship is high enough', () => {
    const rels = {
      soyeon: { characterId: 'soyeon', affection: 50, friendship: 50, romance: 0, encounters: 5 },
    };
    const crisis = detectCrisis({ ...DEFAULT_STATS, health: 5 }, 5, rels);
    const npcChoice = crisis!.choices.find(c => c.requiredNpc?.id === 'soyeon');
    expect(npcChoice).toBeDefined();
  });
});
