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
import type { ActiveCombo, WeeklyEvent } from '@/lib/gameEngine';

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

/** Relationship tiers with thresholds */
type RelationshipTier = 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'soulmate';
function getRelationshipTier(affection: number): RelationshipTier {
  if (affection >= 90) return 'soulmate';
  if (affection >= 70) return 'close_friend';
  if (affection >= 50) return 'friend';
  if (affection >= 25) return 'acquaintance';
  return 'stranger';
}
const TIER_LABELS: Record<RelationshipTier, string> = { stranger: '모르는 사이', acquaintance: '아는 사이', friend: '친구', close_friend: '절친', soulmate: '소울메이트' };

/** Event history entry for AI context */
interface EventHistoryEntry {
  week: number;
  summary: string;
  npcInvolved?: string;
  choiceMade?: string;
}

interface GameStore {
  // --- State ---
  _hasHydrated: boolean;
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
  weekCombos: ActiveCombo[];
  weeklyEvent: WeeklyEvent | null;
  gameStarted: boolean;
  eventHistory: EventHistoryEntry[];
  tierNotification: { characterId: string; newTier: RelationshipTier; label: string } | null;
  goalWarnings: string[];
  unlockedAchievements: string[];
  newAchievements: { id: string; title: string; emoji: string }[];

  // --- Actions ---
  setHasHydrated: (v: boolean) => void;
  setPhase: (phase: GamePhase) => void;
  createPlayer: (profile: PlayerProfile) => void;
  updateStats: (changes: Partial<PlayerStats>) => void;
  updateRelationship: (characterId: string, change: number) => void;
  setSchedule: (schedule: WeekSchedule) => void;
  advanceWeek: () => void;
  addEventHistory: (entry: EventHistoryEntry) => void;
  clearTierNotification: () => void;
  getRecentEvents: () => EventHistoryEntry[];
  addUnlockedAchievement: (id: string, title: string, emoji: string) => void;
  clearNewAchievements: () => void;
  loadScene: (scene: Scene) => void;
  nextScene: () => void;
  setSceneQueue: (scenes: Scene[]) => void;
  setCurrentSceneIndex: (index: number) => void;
  setWeekStatDeltas: (deltas: Partial<PlayerStats>) => void;
  setWeekCombos: (combos: ActiveCombo[]) => void;
  setWeeklyEvent: (event: WeeklyEvent | null) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // --- Initial state ---
      _hasHydrated: false,
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
          weekCombos: [],
      weeklyEvent: null,
      gameStarted: false,
      eventHistory: [],
      tierNotification: null,
      goalWarnings: [],
      unlockedAchievements: [],
      newAchievements: [],

      // --- Actions ---

      setHasHydrated(v) {
        set({ _hasHydrated: v });
      },

      setPhase(phase) {
        set({ phase });
      },

      createPlayer(profile) {
        // Dream affects starting stats
        const dreamBonus: Record<string, Partial<PlayerStats>> = {
          scholar: { gpa: 10 },
          social: { social: 10, charm: 5 },
          balance: { health: 5, gpa: 3, social: 3 },
          freedom: { stress: -10, charm: 5 },
        };
        const bonus = profile.dream ? dreamBonus[profile.dream] ?? {} : {};
        const startStats = { ...INITIAL_STATS };
        for (const [key, val] of Object.entries(bonus)) {
          if (val !== undefined) startStats[key as keyof PlayerStats] += val;
        }
        // New Game+ bonus: +3 to all stats per completion (max +15)
        if (typeof window !== 'undefined') {
          const ngPlus = Math.min(5, parseInt(localStorage.getItem('kusm-completions') ?? '0', 10));
          if (ngPlus > 0) {
            startStats.gpa += ngPlus * 3;
            startStats.health += ngPlus * 3;
            startStats.social += ngPlus * 3;
            startStats.charm += ngPlus * 3;
          }
        }
        set({
          player: profile,
          stats: startStats,
          currentWeek: 1,
          currentSceneIndex: 0,
          relationships: {},
          schedule: null,
          currentScene: null,
          sceneQueue: [],
          weekStatDeltas: {},
          weekCombos: [],
          weeklyEvent: null,
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
        const oldAffection = existing?.affection ?? 50;
        const newAffection = Math.max(0, Math.min(100, oldAffection + change));
        const oldTier = getRelationshipTier(oldAffection);
        const newTier = getRelationshipTier(newAffection);

        const updated: CharacterRelationship = existing
          ? { ...existing, affection: newAffection, encounters: existing.encounters + 1, lastInteraction: currentWeek }
          : { characterId, affection: newAffection, encounters: 1, lastInteraction: currentWeek };

        const tierNotification = oldTier !== newTier
          ? { characterId, newTier, label: TIER_LABELS[newTier] }
          : null;

        set({ relationships: { ...relationships, [characterId]: updated }, ...(tierNotification ? { tierNotification } : {}) });
      },

      setSchedule(schedule) {
        set({ schedule });
      },

      advanceWeek() {
        const { stats, currentWeek } = get();
        // Generate goal warnings based on current stats
        const warnings: string[] = [];
        if (stats.gpa < 30) warnings.push('⚠️ 학점이 위험합니다! 장학금을 잃을 수 있어요.');
        if (stats.stress > 80) warnings.push('🔴 스트레스가 극심합니다. 번아웃 직전!');
        if (stats.health < 25) warnings.push('💔 체력이 바닥입니다. 쓰러질 수 있어요.');
        if (stats.money < 50000) warnings.push('💸 잔고가 부족합니다. 알바를 늘려야 해요.');
        if (stats.social < 20 && currentWeek > 4) warnings.push('😔 외톨이가 되어가고 있어요...');
        if (currentWeek >= 7 && currentWeek <= 8) warnings.push('📝 중간고사 기간입니다! 학점에 주의하세요.');
        if (currentWeek >= 15) warnings.push('📝 기말고사가 코앞입니다!');

        set((state) => ({
          currentWeek: state.currentWeek + 1,
          currentSceneIndex: 0,
          schedule: null,
          currentScene: null,
          sceneQueue: [],
          weekStatDeltas: {},
          weekCombos: [],
          weeklyEvent: null,
          phase: 'planning',
          goalWarnings: warnings,
          tierNotification: null,
        }));
      },

      addEventHistory(entry: EventHistoryEntry) {
        set((state) => ({
          eventHistory: [...state.eventHistory.slice(-19), entry],
        }));
      },

      clearTierNotification() {
        set({ tierNotification: null });
      },

      getRecentEvents() {
        return get().eventHistory.slice(-10);
      },

      addUnlockedAchievement(id: string, title: string, emoji: string) {
        const { unlockedAchievements } = get();
        if (unlockedAchievements.includes(id)) return;
        set({
          unlockedAchievements: [...unlockedAchievements, id],
          newAchievements: [...get().newAchievements, { id, title, emoji }],
        });
      },

      clearNewAchievements() {
        set({ newAchievements: [] });
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

      setWeekCombos(combos) {
        set({ weekCombos: combos });
      },

      setWeeklyEvent(event) {
        set({ weeklyEvent: event });
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
          weekCombos: [],
          weeklyEvent: null,
          gameStarted: false,
          eventHistory: [],
          tierNotification: null,
          goalWarnings: [],
          unlockedAchievements: [],
          newAchievements: [],
        });
      },
    }),
    {
      name: 'kusm-save',
      version: 2,
      migrate(persisted: unknown, version: number) {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          return { ...state, currentSceneIndex: 0 } as unknown as GameStore;
        }
        return persisted as GameStore;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
