"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {
  GameState,
  PlayerState,
  ClockState,
  NPCState,
  StoryState,
  GameSettings,
} from "@/engine/types/game-state";
import type { PlayerStats, MajorType, StatDelta } from "@/engine/types/stats";
import type { DailySchedule } from "@/engine/types/activity";
import type { NPCLiveState, NPCCharacterSheet } from "@/engine/types/npc";
import type { StoryThread, DayLogEntry, CrisisEvent, PendingDiscovery, StorytellerMode } from "@/engine/types/story";
import { SCHEMA_VERSION, getSemesterPhase } from "@/engine/types/game-state";
import { createInitialStats, applyStatDelta } from "@/engine/systems/stat-engine";
import { createInitialClock, advanceDay } from "@/engine/systems/semester-clock";
import { applyEconomyDrain } from "@/engine/systems/economy-engine";

interface GameActions {
  // Initialization
  initializeGame: (
    playerName: string,
    university: string,
    major: MajorType,
    storytellerMode: StorytellerMode,
    language: "ko" | "en"
  ) => void;

  // Player actions
  applyStatDelta: (delta: StatDelta) => void;
  setPlayerStats: (stats: PlayerStats) => void;

  // Clock
  advanceDay: () => void;

  // NPC management
  registerNPCs: (
    sheets: Record<string, NPCCharacterSheet>,
    states: Record<string, NPCLiveState>
  ) => void;
  updateNPCState: (npcId: string, update: Partial<NPCLiveState>) => void;

  // Story
  addStoryThread: (thread: StoryThread) => void;
  updateStoryThread: (threadId: string, update: Partial<StoryThread>) => void;
  addDayLog: (entry: DayLogEntry) => void;
  addCrisis: (event: CrisisEvent) => void;
  addDiscovery: (discovery: PendingDiscovery) => void;
  setRollingSummary: (summary: string) => void;
  incrementCrisisesThisWeek: () => void;
  resetWeeklyCrisisCount: () => void;

  // Game phase
  setGamePhase: (phase: GameState["gamePhase"]) => void;
  setArtCacheReady: (ready: boolean) => void;

  // Reset
  resetGame: () => void;
}

const initialGameState: GameState = {
  schemaVersion: SCHEMA_VERSION,
  player: {
    name: "",
    university: "",
    major: "engineering",
    stats: createInitialStats("engineering"),
    enrolledCourses: [],
    lockedSlots: [],
  },
  clock: createInitialClock(),
  npcs: {
    sheets: {},
    states: {},
  },
  story: {
    director: {
      mode: "cassandra",
      tensionLevel: 2,
      tensionHistory: [],
      daysSinceLastChoice: 0,
      daysSinceLastCrisis: 0,
      daysSinceLastPositiveEvent: 0,
      activeThreads: [],
      resolvedThreads: [],
      plantedSeeds: [],
      npcDramaScores: {},
      npcRelationshipTensions: [],
      currentPhase: "orientation",
      phaseTargetTension: 2,
    },
    threads: [],
    rollingSummary: "",
    dayLog: [],
    pendingDiscoveries: [],
    crisisLog: [],
    crisisesThisWeek: 0,
  },
  settings: {
    language: "ko",
    storytellerMode: "cassandra",
    difficulty: "normal",
  },
  artCacheReady: false,
  gamePhase: "creating",
};

export const useGameStore = create<GameState & GameActions>()(
  persist(
    immer((set) => ({
      ...initialGameState,

      initializeGame: (playerName, university, major, storytellerMode, language) =>
        set((state) => {
          state.player.name = playerName;
          state.player.university = university;
          state.player.major = major;
          state.player.stats = createInitialStats(major);
          state.settings.storytellerMode = storytellerMode;
          state.settings.language = language;
          state.story.director.mode = storytellerMode;
          state.clock = createInitialClock();
          state.gamePhase = "registration";
        }),

      applyStatDelta: (delta) =>
        set((state) => {
          state.player.stats = applyStatDelta(state.player.stats, delta);
        }),

      setPlayerStats: (stats) =>
        set((state) => {
          state.player.stats = stats;
        }),

      advanceDay: () =>
        set((state) => {
          const newClock = advanceDay(state.clock);
          state.clock = newClock;

          // Apply economy drain
          state.player.stats = applyEconomyDrain(
            state.player.stats,
            newClock.currentDay
          );

          // Reset weekly crisis count on new week
          if (newClock.currentDayOfWeek === 1) {
            state.story.crisisesThisWeek = 0;
          }

          // Trim day log to last 7 entries
          if (state.story.dayLog.length > 7) {
            state.story.dayLog = state.story.dayLog.slice(-7);
          }
        }),

      registerNPCs: (sheets, states) =>
        set((state) => {
          state.npcs.sheets = sheets;
          state.npcs.states = states;
        }),

      updateNPCState: (npcId, update) =>
        set((state) => {
          if (state.npcs.states[npcId]) {
            Object.assign(state.npcs.states[npcId], update);
          }
        }),

      addStoryThread: (thread) =>
        set((state) => {
          state.story.threads.push(thread);
          state.story.director.activeThreads.push(thread);
        }),

      updateStoryThread: (threadId, update) =>
        set((state) => {
          const thread = state.story.threads.find((t) => t.id === threadId);
          if (thread) Object.assign(thread, update);

          const dirThread = state.story.director.activeThreads.find(
            (t) => t.id === threadId
          );
          if (dirThread) Object.assign(dirThread, update);

          if (update.status === "resolved" && dirThread) {
            state.story.director.resolvedThreads.push({ ...dirThread });
            state.story.director.activeThreads =
              state.story.director.activeThreads.filter(
                (t) => t.id !== threadId
              );
          }
        }),

      addDayLog: (entry) =>
        set((state) => {
          state.story.dayLog.push(entry);
        }),

      addCrisis: (event) =>
        set((state) => {
          state.story.crisisLog.push(event);
          state.story.crisisesThisWeek += 1;
        }),

      addDiscovery: (discovery) =>
        set((state) => {
          state.story.pendingDiscoveries.push(discovery);
        }),

      setRollingSummary: (summary) =>
        set((state) => {
          state.story.rollingSummary = summary;
        }),

      incrementCrisisesThisWeek: () =>
        set((state) => {
          state.story.crisisesThisWeek += 1;
        }),

      resetWeeklyCrisisCount: () =>
        set((state) => {
          state.story.crisisesThisWeek = 0;
        }),

      setGamePhase: (phase) =>
        set((state) => {
          state.gamePhase = phase;
        }),

      setArtCacheReady: (ready) =>
        set((state) => {
          state.artCacheReady = ready;
        }),

      resetGame: () => set(() => ({ ...initialGameState })),
    })),
    {
      name: "kusm-game-state",
      version: SCHEMA_VERSION,
    }
  )
);
