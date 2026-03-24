import type { NPCLiveState, NPCRelationshipState } from "../types/npc";
import {
  RELATIONSHIP_DECAY_PER_WEEK,
  NPC_INITIATE_EVENT_THRESHOLD,
} from "../types/npc";

export function updateRelationship(
  current: NPCRelationshipState,
  delta: number,
  newAttitude?: string
): NPCRelationshipState {
  return {
    level: Math.max(0, Math.min(100, current.level + delta)),
    attitude: newAttitude ?? current.attitude,
    trust: current.trust,
  };
}

export function updateTrust(
  current: NPCRelationshipState,
  delta: number
): NPCRelationshipState {
  return {
    ...current,
    trust: Math.max(0, Math.min(100, current.trust + delta)),
  };
}

/**
 * Apply weekly relationship decay to all NPCs that weren't interacted with.
 * Called daily, applies fractional decay (1/7 per day).
 */
export function applyRelationshipDecay(
  states: Record<string, NPCLiveState>,
  interactedNPCIds: Set<string>
): Record<string, NPCLiveState> {
  const updated: Record<string, NPCLiveState> = {};

  for (const [id, state] of Object.entries(states)) {
    if (interactedNPCIds.has(id)) {
      updated[id] = state;
      continue;
    }

    const dailyDecay = RELATIONSHIP_DECAY_PER_WEEK / 7;
    const newLevel = Math.max(
      0,
      state.relationshipToPlayer.level - dailyDecay
    );

    updated[id] = {
      ...state,
      relationshipToPlayer: {
        ...state.relationshipToPlayer,
        level: newLevel,
      },
    };
  }

  return updated;
}

/**
 * Get NPCs that might initiate events based on their relationship level.
 */
export function getNPCsWhoMightInitiate(
  states: Record<string, NPCLiveState>
): string[] {
  return Object.entries(states)
    .filter(
      ([, state]) =>
        state.relationshipToPlayer.level >= NPC_INITIATE_EVENT_THRESHOLD
    )
    .map(([id]) => id);
}

/**
 * Get NPCs that are "active" — relationship > threshold or in a story thread.
 */
export function getActiveNPCs(
  states: Record<string, NPCLiveState>,
  threadNPCIds: Set<string>,
  threshold: number = 20
): string[] {
  return Object.entries(states)
    .filter(
      ([id, state]) =>
        state.relationshipToPlayer.level > threshold ||
        threadNPCIds.has(id)
    )
    .map(([id]) => id);
}
