import type { StoryDirectorState } from "../types/story";
import type { PlayerStats } from "../types/stats";
import type { NPCCharacterSheet, NPCLiveState } from "../types/npc";
import type { DirectorResponse } from "./schemas/director-response";
import { getTargetTension, STORYTELLER_CONFIGS } from "../data/storyteller-modes";

/**
 * Call the story director API to evaluate game state and produce interventions.
 */
export async function callStoryDirector(params: {
  director: StoryDirectorState;
  playerStats: PlayerStats;
  day: number;
  npcSheets: Record<string, NPCCharacterSheet>;
  npcStates: Record<string, NPCLiveState>;
  recentDayLogs: string[];
  playerActivities: string;
}): Promise<DirectorResponse> {
  const npcSummaries = Object.entries(params.npcStates).map(([id, state]) => ({
    id,
    name: params.npcSheets[id]?.name ?? id,
    emotion: `${state.emotion.primary} (${state.emotion.primaryIntensity}/10)`,
    goal: state.currentGoal,
    playerRel: Math.round(state.relationshipToPlayer.level),
  }));

  const response = await fetch("/api/ai/story-director", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      director: params.director,
      playerStats: params.playerStats,
      day: params.day,
      npcSummaries,
      recentDayLogs: params.recentDayLogs,
      playerActivities: params.playerActivities,
    }),
  });

  if (!response.ok) {
    throw new Error(`Story director API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Update director state after a day completes.
 */
export function updateDirectorState(
  director: StoryDirectorState,
  day: number,
  choiceMade: boolean,
  crisisTriggered: boolean,
  positiveEvent: boolean
): StoryDirectorState {
  const targetTension = getTargetTension(director.mode, day);
  const config = STORYTELLER_CONFIGS[director.mode];

  // Update tension history
  const tensionHistory = [...director.tensionHistory, director.tensionLevel].slice(-14);

  return {
    ...director,
    tensionHistory,
    phaseTargetTension: targetTension,
    daysSinceLastChoice: choiceMade ? 0 : director.daysSinceLastChoice + 1,
    daysSinceLastCrisis: crisisTriggered ? 0 : director.daysSinceLastCrisis + 1,
    daysSinceLastPositiveEvent: positiveEvent ? 0 : director.daysSinceLastPositiveEvent + 1,
  };
}

/**
 * Calculate current tension from game metrics.
 */
export function calculateTension(
  playerStats: PlayerStats,
  activeThreadCount: number,
  daysSinceChoice: number,
  recentCrisisCount: number
): number {
  let tension = 0;

  // Low stats increase tension
  const statValues = Object.values(playerStats);
  const avgStat = statValues.reduce((a, b) => a + b, 0) / statValues.length;
  tension += Math.max(0, (50 - avgStat) / 10); // 0-5 from low stats

  // Active threads increase tension
  tension += activeThreadCount * 1.5;

  // Long time without choices increases tension
  tension += Math.min(2, daysSinceChoice * 0.3);

  // Recent crises increase tension
  tension += recentCrisisCount;

  return Math.max(0, Math.min(10, tension));
}
