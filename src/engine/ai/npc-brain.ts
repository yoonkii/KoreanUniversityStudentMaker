import type { NPCCharacterSheet, NPCLiveState } from "../types/npc";
import type { PlayerStats } from "../types/stats";
import type { NPCBrainResponse } from "./schemas/npc-response";
import type { ThinkingLevel } from "@/app/api/ai/_shared/ai-client";

/**
 * Call the NPC brain API to generate dialogue and decisions.
 */
export async function callNPCBrain(params: {
  sheet: NPCCharacterSheet;
  state: NPCLiveState;
  playerName: string;
  playerStats: PlayerStats;
  situation: string;
  directorBias?: string;
  thinkingLevel?: ThinkingLevel;
  forceChoice?: boolean;
}): Promise<NPCBrainResponse> {
  const response = await fetch("/api/ai/npc-brain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`NPC brain API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Determine which NPCs the player encounters today based on activities and locations.
 */
export function determineEncounters(
  activityLocationIds: string[],
  npcSheets: Record<string, NPCCharacterSheet>,
  npcStates: Record<string, NPCLiveState>,
  directorTargetNPCs: string[],
  threadNPCIds: string[]
): string[] {
  const encountered = new Set<string>();

  // Director-forced encounters always happen
  for (const npcId of directorTargetNPCs) {
    if (npcSheets[npcId]) encountered.add(npcId);
  }

  // Location-based encounters
  for (const locationId of activityLocationIds) {
    for (const [npcId, sheet] of Object.entries(npcSheets)) {
      if (sheet.primaryLocationIds.includes(locationId)) {
        // Higher chance if in a story thread
        const isInThread = threadNPCIds.includes(npcId);
        const chance = isInThread ? 0.7 : 0.35;
        if (Math.random() < chance) {
          encountered.add(npcId);
        }
      }
    }
  }

  // Surprise encounter with a random NPC (10% chance)
  const allNPCIds = Object.keys(npcSheets);
  if (Math.random() < 0.1) {
    const randomId = allNPCIds[Math.floor(Math.random() * allNPCIds.length)];
    encountered.add(randomId);
  }

  // Cap at 3 encounters per day
  return Array.from(encountered).slice(0, 3);
}

/**
 * Build a situation description based on the activity and location.
 */
export function buildSituation(
  activityLabel: string,
  locationName: string,
  npcName: string,
  dayOfSemester: number
): string {
  return `${dayOfSemester}일차. 플레이어가 ${locationName}에서 ${activityLabel} 활동을 하는 중, ${npcName}을(를) 만났다.`;
}
