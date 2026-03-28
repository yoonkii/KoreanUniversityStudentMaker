import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PlayerStats,
  PlayerProfile,
  WeekSchedule,
  Scene,
  CharacterRelationship,
  GamePhase,
  ExamResults,
} from './types';
import { calculateNpcMood } from '@/lib/npcEmotions';
import type { ActiveCombo, WeeklyEvent } from '@/lib/gameEngine';

const INITIAL_STATS: PlayerStats = {
  knowledge: 20, // Low — you know nothing on day 1
  money: 300000, // Tight budget forces trade-offs
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
    knowledge: clampStat('knowledge', stats.knowledge),
    money: clampStat('money', stats.money),
    health: clampStat('health', stats.health),
    social: clampStat('social', stats.social),
    stress: clampStat('stress', stats.stress),
    charm: clampStat('charm', stats.charm),
  };
}

/** Friendship tiers (우정) */
export type RelationshipTier = 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'best_friend';
export function getRelationshipTier(friendship: number): RelationshipTier {
  if (friendship >= 80) return 'best_friend';
  if (friendship >= 60) return 'close_friend';
  if (friendship >= 40) return 'friend';
  if (friendship >= 20) return 'acquaintance';
  return 'stranger';
}
const TIER_LABELS: Record<RelationshipTier, string> = { stranger: '모르는 사이', acquaintance: '아는 사이', friend: '친구', close_friend: '절친', best_friend: '베프' };

/** Romance tiers (사랑) */
export type RomanceTier = 'none' | 'interest' | 'crush' | 'dating' | 'deep_love';
export function getRomanceTier(romance: number): RomanceTier {
  if (romance >= 70) return 'deep_love';
  if (romance >= 45) return 'dating';
  if (romance >= 25) return 'crush';
  if (romance >= 10) return 'interest';
  return 'none';
}
const ROMANCE_LABELS: Record<RomanceTier, string> = { none: '그냥 친구', interest: '관심', crush: '설렘', dating: '연인', deep_love: '사랑' };

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
  previousRelationships: Record<string, CharacterRelationship>;
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
  examResults: ExamResults;
  startingStats: PlayerStats | null;
  diaryEntries: { week: number; text: string }[];
  activityStreaks: Record<string, number>; // activity → consecutive weeks count

  // --- Actions ---
  setHasHydrated: (v: boolean) => void;
  setPhase: (phase: GamePhase) => void;
  createPlayer: (profile: PlayerProfile) => void;
  updateStats: (changes: Partial<PlayerStats>) => void;
  updateRelationship: (characterId: string, change: number, type?: 'friendship' | 'romance') => void;
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
  setExamResults: (results: Partial<ExamResults>) => void;
  addNpcMemory: (characterId: string, memory: string) => void;
  addDiaryEntry: (week: number, text: string) => void;
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
      previousRelationships: {},
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
      examResults: {},
      startingStats: null,
      diaryEntries: [],
      activityStreaks: {},

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
          scholar: { knowledge: 10 },
          social: { social: 10, charm: 5 },
          balance: { health: 5, knowledge: 3, social: 3 },
          freedom: { stress: -10, charm: 5 },
        };
        const bonus = profile.dream ? dreamBonus[profile.dream] ?? {} : {};
        const startStats = { ...INITIAL_STATS };
        for (const [key, val] of Object.entries(bonus)) {
          if (val !== undefined) startStats[key as keyof PlayerStats] += val;
        }
        // New Game+ bonus: +3 to relevant stats per completion (max +15)
        if (typeof window !== 'undefined') {
          const ngPlus = Math.min(5, parseInt(localStorage.getItem('kusm-completions') ?? '0', 10));
          if (ngPlus > 0) {
            startStats.knowledge += ngPlus * 3;
            startStats.health += ngPlus * 3;
            startStats.social += ngPlus * 3;
            startStats.charm += ngPlus * 3;
          }
        }
        const clampedStart = clampAllStats(startStats);
        set({
          player: profile,
          stats: clampedStart,
          startingStats: { ...clampedStart },
          currentWeek: 1,
          currentSceneIndex: 0,
          relationships: {},
          previousRelationships: {},
          schedule: null,
          currentScene: null,
          sceneQueue: [],
          weekStatDeltas: {},
          weekCombos: [],
          weeklyEvent: null,
          gameStarted: true,
          phase: 'planning',
          examResults: {},
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

      updateRelationship(characterId, change, type: 'friendship' | 'romance' = 'friendship') {
        const { relationships, currentWeek } = get();
        const existing = relationships[characterId];
        const oldFriendship = existing?.friendship ?? 0;
        const oldRomance = existing?.romance ?? 0;

        let newFriendship = oldFriendship;
        let newRomance = oldRomance;

        if (type === 'romance') {
          newRomance = Math.max(0, Math.min(100, oldRomance + change));
        } else {
          // Friendship only gains if 3+ encounters (can't instant-befriend)
          const encounters = existing?.encounters ?? 0;
          if (change > 0 && encounters < 3) {
            newFriendship = Math.max(0, Math.min(100, oldFriendship + Math.round(change * 0.5)));
          } else {
            newFriendship = Math.max(0, Math.min(100, oldFriendship + change));
          }
        }

        // affection = max(friendship, romance) for backward compat
        const newAffection = Math.max(newFriendship, newRomance);
        const oldTier = getRelationshipTier(oldFriendship);
        const newTier = getRelationshipTier(newFriendship);

        const updated: CharacterRelationship = existing
          ? { ...existing, friendship: newFriendship, romance: newRomance, affection: newAffection, encounters: existing.encounters + 1, lastInteraction: currentWeek, ...(type === 'romance' ? { lastDateWeek: currentWeek } : {}) }
          : { characterId, friendship: newFriendship, romance: newRomance, affection: newAffection, encounters: 1, lastInteraction: currentWeek, ...(type === 'romance' ? { lastDateWeek: currentWeek } : {}) };

        const tierNotification = oldTier !== newTier && newTier !== 'stranger'
          ? { characterId, newTier, label: TIER_LABELS[newTier] }
          : null;

        // Tier-up bonus
        if (tierNotification && oldTier !== newTier) {
          const { stats } = get();
          const TIER_BONUSES: Record<string, Partial<PlayerStats>> = {
            acquaintance: { social: 2 },
            friend: { social: 3, stress: -3 },
            close_friend: { social: 5, charm: 3, stress: -5 },
            best_friend: { social: 8, charm: 5, stress: -10, health: 5 },
          };
          const bonus = TIER_BONUSES[newTier];
          if (bonus) {
            const updated2 = { ...stats };
            for (const [k, v] of Object.entries(bonus)) {
              if (v !== undefined) updated2[k as keyof PlayerStats] = clampStat(k as keyof PlayerStats, updated2[k as keyof PlayerStats] + v);
            }
            set({ stats: updated2 });
          }
        }

        set({ relationships: { ...relationships, [characterId]: updated }, ...(tierNotification ? { tierNotification } : {}) });
      },

      setSchedule(schedule) {
        set({ schedule });
      },

      advanceWeek() {
        const { stats, currentWeek, relationships, schedule, activityStreaks } = get();

        // Snapshot relationships before changes for tier milestone detection
        const prevRels: Record<string, CharacterRelationship> = {};
        for (const [id, rel] of Object.entries(relationships)) {
          prevRels[id] = { ...rel };
        }

        // Update activity streaks based on completed schedule
        const newStreaks: Record<string, number> = {};
        const thisWeekActivities = new Set<string>();
        if (schedule) {
          for (const slots of Object.values(schedule)) {
            for (const slot of slots) {
              thisWeekActivities.add(slot.activityId);
            }
          }
        }
        // Activities done this week: increment streak. Others: reset to 0.
        const STREAK_ACTIVITIES = ['study', 'exercise', 'parttime', 'club'];
        for (const act of STREAK_ACTIVITIES) {
          if (thisWeekActivities.has(act)) {
            newStreaks[act] = (activityStreaks[act] ?? 0) + 1;
          } else {
            newStreaks[act] = 0;
          }
        }

        // Relationship decay + NPC mood updates
        const decayedRelationships = { ...relationships };
        for (const [charId, rel] of Object.entries(decayedRelationships)) {
          const weeksSinceInteraction = rel.lastInteraction ? currentWeek - rel.lastInteraction : currentWeek;
          const weeksSinceDate = rel.lastDateWeek ? currentWeek - rel.lastDateWeek : 99;

          // Friendship decay: -3 for 2+ weeks no interaction
          let newFriendship = rel.friendship ?? rel.affection ?? 0;
          if (weeksSinceInteraction >= 2) {
            const decayAmount = getRelationshipTier(newFriendship) === 'best_friend' ? 1 : 3;
            newFriendship = Math.max(0, newFriendship - decayAmount);
          }

          // Romance decay: -2 for 2+ weeks no date (romance is FRAGILE)
          let newRomance = rel.romance ?? 0;
          if (weeksSinceDate >= 2 && newRomance > 0) {
            newRomance = Math.max(0, newRomance - 2);
          }

          const newAffection = Math.max(newFriendship, newRomance);

          // Update NPC mood and opinion based on player stats + relationship
          const moodUpdate = calculateNpcMood(charId, stats, { ...rel, affection: newAffection }, currentWeek);
          const newRespect = Math.max(0, Math.min(100, (rel.respect ?? 50) + moodUpdate.respectDelta));

          decayedRelationships[charId] = {
            ...rel,
            affection: newAffection,
            mood: moodUpdate.mood,
            opinion: moodUpdate.opinion,
            respect: newRespect,
          };
        }

        // Generate goal warnings based on current stats
        const warnings: string[] = [];
        if (stats.knowledge < 30) warnings.push('⚠️ 준비도가 위험합니다! 시험에 대비하세요.');
        if (stats.stress > 80) warnings.push('🔴 스트레스가 극심합니다. 번아웃 직전!');
        if (stats.health < 25) warnings.push('💔 체력이 바닥입니다. 쓰러질 수 있어요.');
        if (stats.money < 50000) warnings.push('💸 잔고가 부족합니다. 알바를 늘려야 해요.');
        if (stats.social < 20 && currentWeek > 4) warnings.push('😔 외톨이가 되어가고 있어요...');
        if (currentWeek >= 7 && currentWeek <= 8) warnings.push('📝 중간고사 기간입니다! 준비도에 주의하세요.');
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
          previousRelationships: prevRels,
          phase: 'planning',
          goalWarnings: warnings,
          activityStreaks: newStreaks,
          tierNotification: null,
          relationships: decayedRelationships,
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

      setExamResults(results) {
        set((state) => ({
          examResults: { ...state.examResults, ...results },
        }));
      },

      addDiaryEntry(week, text) {
        set((state) => ({
          diaryEntries: [...state.diaryEntries, { week, text }],
        }));
      },

      addNpcMemory(characterId, memory) {
        const { relationships } = get();
        const rel = relationships[characterId];
        if (!rel) return;
        const existing = rel.memories ?? [];
        if (existing.includes(memory)) return; // No duplicates
        set({
          relationships: {
            ...relationships,
            [characterId]: { ...rel, memories: [...existing.slice(-9), memory] }, // Max 10 memories
          },
        });
      },

      resetGame() {
        set({
          phase: 'title',
          player: null,
          stats: { ...INITIAL_STATS },
          currentWeek: 1,
          currentSceneIndex: 0,
          relationships: {},
          previousRelationships: {},
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
          examResults: {},
          startingStats: null,
          diaryEntries: [],
          activityStreaks: {},
        });
      },
    }),
    {
      name: 'kusm-save',
      version: 3,
      migrate(persisted: unknown, version: number) {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          return { ...state, currentSceneIndex: 0, examResults: {} } as unknown as GameStore;
        }
        if (version < 3) {
          // Migrate gpa → knowledge
          const stats = state.stats as Record<string, number> | undefined;
          if (stats && 'gpa' in stats) {
            stats.knowledge = stats.gpa;
            delete stats.gpa;
          }
          return { ...state, stats, examResults: {} } as unknown as GameStore;
        }
        return persisted as GameStore;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
