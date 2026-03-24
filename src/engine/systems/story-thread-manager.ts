import type { StoryThread, PlantedSeed, PendingDiscovery, StoryDirectorState } from "../types/story";
import { MAX_ACTIVE_THREADS, THREAD_ESCALATION_DAYS, THREAD_STAT_EXTREME_LOW, THREAD_STAT_EXTREME_HIGH } from "../types/story";
import type { PlayerStats, StatKey } from "../types/stats";

let threadCounter = 0;

export function createThread(
  title: string,
  summary: string,
  involvedNPCs: string[],
  relatedStats: string[],
  startDay: number
): StoryThread {
  threadCounter++;
  return {
    id: `thread_${threadCounter}_${Date.now()}`,
    title,
    summary,
    status: "active",
    startDay,
    involvedNPCs,
    relatedStats,
  };
}

/**
 * Check if any active threads should escalate based on:
 * - Time (active for 5+ days)
 * - Stat extremes (related stat < 25 or > 85)
 *
 * Returns IDs of threads that should escalate (OR conditions).
 */
export function checkThreadEscalation(
  threads: StoryThread[],
  currentDay: number,
  playerStats: PlayerStats
): string[] {
  const shouldEscalate: string[] = [];

  for (const thread of threads) {
    if (thread.status !== "active") continue;

    // Time-based escalation
    const daysActive = currentDay - thread.startDay;
    if (daysActive >= THREAD_ESCALATION_DAYS) {
      shouldEscalate.push(thread.id);
      continue;
    }

    // Stat-based escalation
    for (const statKey of thread.relatedStats) {
      const value = playerStats[statKey as StatKey];
      if (value !== undefined && (value < THREAD_STAT_EXTREME_LOW || value > THREAD_STAT_EXTREME_HIGH)) {
        shouldEscalate.push(thread.id);
        break;
      }
    }
  }

  return shouldEscalate;
}

/**
 * Check if planted seeds are ready for payoff.
 */
export function checkSeedPayoff(
  seeds: PlantedSeed[],
  currentDay: number
): PlantedSeed[] {
  return seeds.map((seed) => ({
    ...seed,
    payoffReady: currentDay - seed.plantedOnDay >= seed.minimumIncubationDays,
  }));
}

/**
 * Create a planted seed for future payoff.
 */
export function createSeed(
  description: string,
  relatedNPCs: string[],
  minimumIncubationDays: number,
  currentDay: number,
  relatedStats: string[] = []
): PlantedSeed {
  return {
    id: `seed_${Date.now()}`,
    description,
    plantedOnDay: currentDay,
    payoffReady: false,
    minimumIncubationDays,
    relatedNPCs,
    relatedStats,
  };
}

/**
 * Create a pending discovery for the player to find later.
 */
export function createDiscovery(
  content: string,
  involvedNPCs: string[],
  discoveryMethod: string,
  currentDay: number
): PendingDiscovery {
  return {
    id: `disc_${Date.now()}`,
    content,
    involvedNPCs,
    discoveryMethod,
    createdOnDay: currentDay,
    discovered: false,
  };
}

/**
 * Get discoveries that should be surfaced to the player during NPC interaction.
 */
export function getRelevantDiscoveries(
  discoveries: PendingDiscovery[],
  interactingNPCId: string
): PendingDiscovery[] {
  return discoveries.filter(
    (d) =>
      !d.discovered &&
      d.involvedNPCs.includes(interactingNPCId)
  );
}

/**
 * Apply director thread guidance to the story state.
 */
export function applyThreadGuidance(
  director: StoryDirectorState,
  guidance: {
    shouldEscalate?: string;
    shouldResolve?: string;
    newThreadSuggestion?: string;
    newThreadNPCs?: string[];
    newThreadStats?: string[];
  },
  currentDay: number
): StoryDirectorState {
  const updated = { ...director };
  let threads = [...updated.activeThreads];

  // Escalate thread
  if (guidance.shouldEscalate) {
    threads = threads.map((t) =>
      t.id === guidance.shouldEscalate
        ? { ...t, status: "escalating" as const }
        : t
    );
  }

  // Resolve thread
  if (guidance.shouldResolve) {
    const resolving = threads.find((t) => t.id === guidance.shouldResolve);
    if (resolving) {
      threads = threads.filter((t) => t.id !== guidance.shouldResolve);
      updated.resolvedThreads = [
        ...updated.resolvedThreads,
        { ...resolving, status: "resolved" as const },
      ];
    }
  }

  // New thread
  if (
    guidance.newThreadSuggestion &&
    threads.length < MAX_ACTIVE_THREADS
  ) {
    const newThread = createThread(
      guidance.newThreadSuggestion,
      guidance.newThreadSuggestion,
      guidance.newThreadNPCs ?? [],
      guidance.newThreadStats ?? [],
      currentDay
    );
    threads.push(newThread);
  }

  updated.activeThreads = threads;
  return updated;
}
