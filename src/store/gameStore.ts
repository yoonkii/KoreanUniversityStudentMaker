import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PlayerStats,
  PlayerProfile,
  WeekSchedule,
  Scene,
  CharacterRelationship,
  GamePhase,
} from './types';

const INITIAL_STATS: PlayerStats = {
  gpa: 50,
  money: 500000,
  health: 70,
  social: 40,
  stress: 20,
  charm: 40,
};

/** Clamp a stat value to [0, 100]. Money is exempt from the upper bound. */
function clampStat(key: keyof PlayerStats, value: number): number {
  if (key === 'money') {
    return Math.max(0, value);
  }
  return Math.max(0, Math.min(100, value));
}

function clampAllStats(stats: PlayerStats): PlayerStats {
  return {
    gpa: clampStat('gpa', stats.gpa),
    money: clampStat('money', stats.money),
    health: clampStat('health', stats.health),
    social: clampStat('social', stats.social),
    stress: clampStat('stress', stats.stress),
    charm: clampStat('charm', stats.charm),
  };
}

interface GameStore {
  // --- State ---
  phase: GamePhase;
  player: PlayerProfile | null;
  stats: PlayerStats;
  currentWeek: number;
  currentSceneIndex: number;
  relationships: Record<string, CharacterRelationship>;
  schedule: WeekSchedule | null;
  currentScene: Scene | null;
  sceneQueue: Scene[];
  weekStatDeltas: Partial<PlayerStats>;
  gameStarted: boolean;

  // --- Actions ---
  setPhase: (phase: GamePhase) => void;
  createPlayer: (profile: PlayerProfile) => void;
  updateStats: (changes: Partial<PlayerStats>) => void;
  updateRelationship: (characterId: string, change: number) => void;
  setSchedule: (schedule: WeekSchedule) => void;
  advanceWeek: () => void;
  loadScene: (scene: Scene) => void;
  nextScene: () => void;
  setSceneQueue: (scenes: Scene[]) => void;
  setCurrentSceneIndex: (index: number) => void;
  setWeekStatDeltas: (deltas: Partial<PlayerStats>) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // --- Initial state ---
      phase: 'title',
      player: null,
      stats: { ...INITIAL_STATS },
      currentWeek: 1,
      currentSceneIndex: 0,
      relationships: {},
      schedule: null,
      currentScene: null,
      sceneQueue: [],
      weekStatDeltas: {},
      gameStarted: false,

      // --- Actions ---

      setPhase(phase) {
        set({ phase });
      },

      createPlayer(profile) {
        set({
          player: profile,
          stats: { ...INITIAL_STATS },
          currentWeek: 1,
          currentSceneIndex: 0,
          relationships: {},
          schedule: null,
          currentScene: null,
          sceneQueue: [],
          weekStatDeltas: {},
          gameStarted: true,
          phase: 'planning',
        });
      },

      updateStats(changes) {
        const { stats } = get();
        const updated: PlayerStats = { ...stats };

        for (const [key, value] of Object.entries(changes)) {
          const statKey = key as keyof PlayerStats;
          if (value !== undefined) {
            updated[statKey] = stats[statKey] + value;
          }
        }

        set({ stats: clampAllStats(updated) });
      },

      updateRelationship(characterId, change) {
        const { relationships, currentWeek } = get();
        const existing = relationships[characterId];

        const updated: CharacterRelationship = existing
          ? {
              ...existing,
              affection: Math.max(0, Math.min(100, existing.affection + change)),
              encounters: existing.encounters + 1,
              lastInteraction: currentWeek,
            }
          : {
              characterId,
              affection: Math.max(0, Math.min(100, 50 + change)),
              encounters: 1,
              lastInteraction: currentWeek,
            };

        set({
          relationships: { ...relationships, [characterId]: updated },
        });
      },

      setSchedule(schedule) {
        set({ schedule });
      },

      advanceWeek() {
        set((state) => ({
          currentWeek: state.currentWeek + 1,
          currentSceneIndex: 0,
          schedule: null,
          currentScene: null,
          sceneQueue: [],
          weekStatDeltas: {},
          phase: 'planning',
        }));
      },

      loadScene(scene) {
        set({ currentScene: scene, phase: 'simulation' });
      },

      nextScene() {
        const { sceneQueue } = get();
        if (sceneQueue.length > 0) {
          const [next, ...remaining] = sceneQueue;
          set({ currentScene: next, sceneQueue: remaining });
        } else {
          set({ currentScene: null, phase: 'summary' });
        }
      },

      setSceneQueue(scenes) {
        set({ sceneQueue: scenes });
      },

      setCurrentSceneIndex(index) {
        set({ currentSceneIndex: index });
      },

      setWeekStatDeltas(deltas) {
        set({ weekStatDeltas: deltas });
      },

      resetGame() {
        set({
          phase: 'title',
          player: null,
          stats: { ...INITIAL_STATS },
          currentWeek: 1,
          currentSceneIndex: 0,
          relationships: {},
          schedule: null,
          currentScene: null,
          sceneQueue: [],
          weekStatDeltas: {},
          gameStarted: false,
        });
      },
    }),
    {
      name: 'kusm-save',
      version: 2,
      migrate(persisted: unknown, version: number) {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          // v1 → v2: add currentSceneIndex to persisted state
          return { ...state, currentSceneIndex: 0 } as unknown as GameStore;
        }
        return persisted as GameStore;
      },
    },
  ),
);
