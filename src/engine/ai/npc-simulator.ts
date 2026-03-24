import type { NPCCharacterSheet, NPCLiveState } from "../types/npc";
import type { SimulationResponse } from "./schemas/simulation-response";
import { buildNPCSimContext } from "./prompt-templates/npc-simulation";

/**
 * Call the off-screen NPC simulation API.
 */
export async function callNPCSimulation(params: {
  activeNPCIds: string[];
  npcSheets: Record<string, NPCCharacterSheet>;
  npcStates: Record<string, NPCLiveState>;
  playerActivities: string;
  directorGuidance?: string;
  activeThreads?: string[];
}): Promise<SimulationResponse> {
  const npcs = params.activeNPCIds
    .filter((id) => params.npcSheets[id] && params.npcStates[id])
    .map((id) =>
      buildNPCSimContext(
        params.npcSheets[id],
        params.npcStates[id],
        params.npcSheets
      )
    );

  if (npcs.length < 2) {
    // Need at least 2 NPCs for interaction
    return { interactions: [], npcMoodUpdates: [] };
  }

  const response = await fetch("/api/ai/npc-simulation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      npcs,
      playerActivities: params.playerActivities,
      directorGuidance: params.directorGuidance,
      activeThreads: params.activeThreads,
    }),
  });

  if (!response.ok) {
    return { interactions: [], npcMoodUpdates: [] };
  }

  return response.json();
}
