import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { checkRelationshipMilestone } from '@/lib/drama-engine';
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

interface RelationshipMilestoneNotification {
  characterId: string;
  threshold: 30 | 60 | 90;
  emoji: string;
  message: string;
}

interface GameStore {
  // --- State ---
  _hasHydrated: boolean;
  phase: GamePhase;
  player: PlayerProfile | null;
  stats: PlayerStats;
  prevStats: PlayerStats | null;
  currentWeek: number;
  currentSceneIndex: number;
  relationships: Record<string, CharacterRelationship>;
  schedule: WeekSchedule | null;
  currentScene: Scene | null;
  sceneQueue: Scene[];
  weekStatDeltas: Partial<PlayerStats>;
  gameStarted: boolean;
  eventHistory: EventHistoryEntry[];
  tierNotification: { characterId: string; newTier: RelationshipTier; label: string } | null;
  relationshipMilestone: RelationshipMilestoneNotification | null;
  lastDramaEventId: string | null;
  goalWarnings: string[];

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
  clearRelationshipMilestone: () => void;
  setLastDramaEventId: (id: string | null) => void;
  getRecentEvents: () => EventHistoryEntry[];
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
      _hasHydrated: false,
      phase: 'title',
      player: null,
      stats: { ...INITIAL_STATS },
      prevStats: null,
      currentWeek: 1,
      currentSceneIndex: 0,
      relationships: {},
      schedule: null,
      currentScene: null,
      sceneQueue: [],
      weekStatDeltas: {},
      gameStarted: false,
      eventHistory: [],
      tierNotification: null,
      relationshipMilestone: null,
      lastDramaEventId: null,
      goalWarnings: [],

      // --- Actions ---

      setHasHydrated(v) {
        set({ _hasHydrated: v });
      },

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

        const milestoneCrossed = checkRelationshipMilestone(oldAffection, newAffection);
        const relationshipMilestone = milestoneCrossed
          ? {
              characterId,
              threshold: milestoneCrossed.threshold as 30 | 60 | 90,
              emoji: milestoneCrossed.emoji,
              message: milestoneCrossed.template,
            }
          : null;

        set({
          relationships: { ...relationships, [characterId]: updated },
          ...(tierNotification ? { tierNotification } : {}),
          ...(relationshipMilestone ? { relationshipMilestone } : {}),
        });
      },

      setSchedule(schedule) {
        set({ schedule });
      },

      advanceWeek() {
        const { stats, currentWeek } = get();
        // Save current stats as prevStats before advancing
        const prevStats = { ...stats };
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
          phase: 'planning',
          goalWarnings: warnings,
          tierNotification: null,
          prevStats,
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

      clearRelationshipMilestone() {
        set({ relationshipMilestone: null });
      },

      setLastDramaEventId(id) {
        set({ lastDramaEventId: id });
      },

      getRecentEvents() {
        return get().eventHistory.slice(-10);
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
          prevStats: null,
          currentWeek: 1,
          currentSceneIndex: 0,
          relationships: {},
          schedule: null,
          currentScene: null,
          sceneQueue: [],
          weekStatDeltas: {},
          gameStarted: false,
          eventHistory: [],
          tierNotification: null,
          relationshipMilestone: null,
          lastDramaEventId: null,
          goalWarnings: [],
        });
      },
    }),
    {
      name: 'kusm-save',
      version: 3,
      migrate(persisted: unknown, version: number) {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          return { ...state, currentSceneIndex: 0 } as unknown as GameStore;
        }
        if (version < 3) {
          return { ...state, prevStats: null, relationshipMilestone: null, lastDramaEventId: null } as unknown as GameStore;
        }
        return persisted as GameStore;
      },
    },
  ),
);

// Hydration is detected in the component via useEffect — see game/page.tsx
