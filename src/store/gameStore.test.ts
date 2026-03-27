import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';

describe('gameStore', () => {
  beforeEach(() => {
    // Reset to clean state before each test
    useGameStore.getState().resetGame();
  });

  describe('updateStats', () => {
    it('should apply positive and negative stat changes', () => {
      const { updateStats } = useGameStore.getState();

      updateStats({ gpa: 10, stress: 5, health: -10 });

      const { stats } = useGameStore.getState();
      expect(stats.gpa).toBe(60);      // 50 + 10
      expect(stats.stress).toBe(25);    // 20 + 5
      expect(stats.health).toBe(60);    // 70 - 10
    });

    it('should clamp stats to [0, 100]', () => {
      const { updateStats } = useGameStore.getState();

      // Push gpa beyond 100
      updateStats({ gpa: 200 });
      expect(useGameStore.getState().stats.gpa).toBe(100);

      // Push health below 0
      useGameStore.getState().resetGame();
      updateStats({ health: -200 });
      expect(useGameStore.getState().stats.health).toBe(0);
    });

    it('should not clamp money to 100 (money has no upper bound)', () => {
      const { updateStats } = useGameStore.getState();

      updateStats({ money: 1000000 });
      expect(useGameStore.getState().stats.money).toBe(1500000); // 500000 + 1000000
    });

    it('should clamp money to 0 minimum', () => {
      const { updateStats } = useGameStore.getState();

      updateStats({ money: -999999999 });
      expect(useGameStore.getState().stats.money).toBe(0);
    });
  });

  describe('updateRelationship', () => {
    it('should create a new relationship with base affection of 50 + change', () => {
      const { updateRelationship } = useGameStore.getState();

      updateRelationship('jaemin', 10);

      const { relationships } = useGameStore.getState();
      expect(relationships['jaemin']).toBeDefined();
      expect(relationships['jaemin'].affection).toBe(60);  // 50 + 10
      expect(relationships['jaemin'].encounters).toBe(1);
    });

    it('should update an existing relationship', () => {
      const { updateRelationship } = useGameStore.getState();

      // First encounter
      updateRelationship('soyeon', 5);
      // Second encounter
      updateRelationship('soyeon', 10);

      const { relationships } = useGameStore.getState();
      expect(relationships['soyeon'].affection).toBe(65);   // 50 + 5 + 10
      expect(relationships['soyeon'].encounters).toBe(2);
    });

    it('should clamp affection to [0, 100]', () => {
      const { updateRelationship } = useGameStore.getState();

      // Create with high positive change
      updateRelationship('test-high', 100);
      expect(useGameStore.getState().relationships['test-high'].affection).toBe(100); // clamped

      // Create with very negative change
      updateRelationship('test-low', -100);
      expect(useGameStore.getState().relationships['test-low'].affection).toBe(0); // clamped
    });
  });

  describe('createPlayer', () => {
    it('should set initial stats correctly', () => {
      const { createPlayer } = useGameStore.getState();
      createPlayer({ name: '테스트', gender: 'male', major: 'engineering' });

      const { stats, player, phase } = useGameStore.getState();
      expect(player?.name).toBe('테스트');
      expect(stats.gpa).toBe(50);
      expect(stats.money).toBe(500000);
      expect(stats.health).toBe(70);
      expect(phase).toBe('planning');
    });

    it('should apply dream bonus for scholar dream', () => {
      const { createPlayer } = useGameStore.getState();
      createPlayer({ name: '학자', gender: 'male', major: 'engineering', dream: 'scholar' });

      const { stats } = useGameStore.getState();
      expect(stats.gpa).toBe(60); // 50 + 10 (scholar bonus)
    });

    it('should apply dream bonus for social dream', () => {
      const { createPlayer } = useGameStore.getState();
      createPlayer({ name: '인싸', gender: 'female', major: 'business', dream: 'social' });

      const { stats } = useGameStore.getState();
      expect(stats.social).toBe(50); // 40 + 10
      expect(stats.charm).toBe(45); // 40 + 5
    });

    it('should apply dream bonus for freedom dream (reduces stress)', () => {
      const { createPlayer } = useGameStore.getState();
      createPlayer({ name: '자유', gender: 'male', major: 'humanities', dream: 'freedom' });

      const { stats } = useGameStore.getState();
      expect(stats.stress).toBe(10); // 20 - 10
      expect(stats.charm).toBe(45); // 40 + 5
    });
  });

  describe('advanceWeek', () => {
    it('should increment week and reset schedule', () => {
      const store = useGameStore.getState();
      store.createPlayer({ name: '테스트', gender: 'male', major: 'engineering' });

      expect(useGameStore.getState().currentWeek).toBe(1);
      useGameStore.getState().advanceWeek();
      expect(useGameStore.getState().currentWeek).toBe(2);
      expect(useGameStore.getState().schedule).toBeNull();
      expect(useGameStore.getState().phase).toBe('planning');
    });

    it('should generate goal warnings for critical stats', () => {
      const store = useGameStore.getState();
      store.createPlayer({ name: '위기', gender: 'male', major: 'engineering' });
      store.updateStats({ gpa: -40, stress: 70 }); // gpa=10, stress=90

      store.advanceWeek();
      const { goalWarnings } = useGameStore.getState();
      expect(goalWarnings.length).toBeGreaterThan(0);
      expect(goalWarnings.some(w => w.includes('학점'))).toBe(true);
      expect(goalWarnings.some(w => w.includes('스트레스'))).toBe(true);
    });
  });

  describe('eventHistory', () => {
    it('should add and limit event history to 20 entries', () => {
      const store = useGameStore.getState();
      store.createPlayer({ name: '테스트', gender: 'male', major: 'engineering' });

      for (let i = 0; i < 25; i++) {
        store.addEventHistory({ week: i, summary: `Event ${i}` });
      }

      const { eventHistory } = useGameStore.getState();
      expect(eventHistory.length).toBe(20); // capped at 20
      expect(eventHistory[0].summary).toBe('Event 5'); // oldest kept
    });
  });
});
