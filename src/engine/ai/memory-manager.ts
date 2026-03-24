import type { NPCMemory, NPCMemoryEntry, NPCLongTermMemory } from "../types/npc";
import {
  MAX_SHORT_TERM_MEMORIES,
  MAX_LONG_TERM_MEMORIES,
  MEMORY_PROMOTION_THRESHOLD,
} from "../types/npc";

/**
 * Three-tier memory management for NPCs.
 *
 * Tier 1: Short-term (5 slots, FIFO)
 * Tier 2: Long-term (10 slots, importance-sorted)
 * Tier 3: Impressions (1 sentence per entity, compressed periodically)
 */

export function addShortTermMemory(
  memory: NPCMemory,
  entry: NPCMemoryEntry
): NPCMemory {
  const newShortTerm = [...memory.shortTerm, entry];

  // If over limit, evict oldest and consider promotion
  if (newShortTerm.length > MAX_SHORT_TERM_MEMORIES) {
    const evicted = newShortTerm.shift()!;
    const promoted = shouldPromote(evicted);

    if (promoted) {
      const newLongTerm = addLongTermMemory(memory.longTerm, {
        summary: evicted.event,
        importance: Math.abs(evicted.emotionalImpact) + 2,
        emotionalValence: evicted.emotionalImpact,
        day: evicted.day,
      });

      return {
        ...memory,
        shortTerm: newShortTerm,
        longTerm: newLongTerm,
      };
    }

    return { ...memory, shortTerm: newShortTerm };
  }

  return { ...memory, shortTerm: newShortTerm };
}

function shouldPromote(entry: NPCMemoryEntry): boolean {
  return Math.abs(entry.emotionalImpact) >= MEMORY_PROMOTION_THRESHOLD;
}

function addLongTermMemory(
  longTerm: NPCLongTermMemory[],
  newEntry: NPCLongTermMemory
): NPCLongTermMemory[] {
  const updated = [...longTerm, newEntry];

  // Sort by importance (descending)
  updated.sort((a, b) => b.importance - a.importance);

  // Keep only top N
  if (updated.length > MAX_LONG_TERM_MEMORIES) {
    return updated.slice(0, MAX_LONG_TERM_MEMORIES);
  }

  return updated;
}

/**
 * Update impression of an entity based on recent interactions.
 * In the full version this would use an AI call for compression.
 * For now, we build it deterministically from recent memories.
 */
export function updateImpression(
  memory: NPCMemory,
  entityId: string,
  newImpression: string
): NPCMemory {
  return {
    ...memory,
    impressions: {
      ...memory.impressions,
      [entityId]: newImpression,
    },
  };
}

/**
 * Create empty memory for a new NPC.
 */
export function createEmptyMemory(): NPCMemory {
  return {
    shortTerm: [],
    longTerm: [],
    impressions: {},
  };
}

/**
 * Get the full memory context for prompt injection (bounded size).
 */
export function getMemoryContext(
  memory: NPCMemory,
  entityId: string
): string {
  const parts: string[] = [];

  const impression = memory.impressions[entityId];
  if (impression) {
    parts.push(`전체 인상: ${impression}`);
  }

  // Recent short-term memories involving this entity
  const relevant = memory.shortTerm.filter((m) =>
    m.involvedParties.includes(entityId)
  );
  if (relevant.length > 0) {
    parts.push("최근:");
    for (const m of relevant.slice(-3)) {
      parts.push(`  ${m.day}일차: ${m.event}`);
    }
  }

  // Significant long-term memories
  const longRelevant = memory.longTerm
    .filter((m) => m.summary.includes(entityId) || m.importance >= 7)
    .slice(0, 3);
  if (longRelevant.length > 0) {
    parts.push("중요한 기억:");
    for (const m of longRelevant) {
      parts.push(`  ${m.day}일차: ${m.summary}`);
    }
  }

  return parts.join("\n");
}
