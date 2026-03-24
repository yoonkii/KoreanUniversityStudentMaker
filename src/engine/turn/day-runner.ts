import type { GameState } from "../types/game-state";
import type { DailySchedule } from "../types/activity";
import type { NPCBrainResponse } from "../ai/schemas/npc-response";
import type { DirectorResponse } from "../ai/schemas/director-response";
import type { SimulationResponse } from "../ai/schemas/simulation-response";
import type { StatDelta } from "../types/stats";
import type { DayLogEntry, StoryThread, PendingDiscovery } from "../types/story";
import { ACTIVITIES } from "../types/activity";
import { resolveScheduleDeltas, getActivityLocationOverlap } from "../systems/activity-resolver";
import { mergeStatDeltas, clampAIModifiers } from "../systems/stat-engine";
import { detectCrisis, isGameOver } from "../systems/crisis-detector";
import { getActiveNPCs } from "../systems/relationship-engine";
import { callStoryDirector, updateDirectorState, calculateTension } from "../ai/story-director";
import { callNPCBrain, determineEncounters, buildSituation } from "../ai/npc-brain";
import { callNPCSimulation } from "../ai/npc-simulator";
import { addShortTermMemory, updateImpression } from "../ai/memory-manager";
import { applyEmotionEvent, decayEmotions } from "../ai/emotion-model";
import { getLocationById } from "../data/locations";
import { STORYTELLER_CONFIGS } from "../data/storyteller-modes";

export interface DayResult {
  narrative: string;
  npcDialogues: Array<{
    npcId: string;
    npcName: string;
    dialogue: string;
    choice?: NPCBrainResponse["choice"];
  }>;
  statDelta: StatDelta;
  crises: string[];
  isGameOver: boolean;
  dayLog: DayLogEntry;
}

/**
 * Run a complete game day — all 9 phases.
 * This is the master orchestrator.
 */
export async function runDay(
  state: GameState,
  schedule: DailySchedule
): Promise<DayResult> {
  const { player, clock, npcs, story, settings } = state;
  const lang = settings.language;
  const day = clock.currentDay;

  // ─── Phase 1: Calculate base stat deltas (no AI) ───
  const baseDelta = resolveScheduleDeltas(schedule);

  // Build activity description
  const activities = [schedule.morning, schedule.afternoon, schedule.evening]
    .filter(Boolean)
    .map((a) => ACTIVITIES[a!].label[lang])
    .join(", ");

  // Get location IDs from activities
  const locationIds = [schedule.morning, schedule.afternoon, schedule.evening]
    .filter(Boolean)
    .flatMap((a) => getActivityLocationOverlap(a!));

  // ─── Phase 2: Story Director Evaluation (1 AI call) ───
  let directorResponse: DirectorResponse;
  try {
    directorResponse = await callStoryDirector({
      director: story.director,
      playerStats: player.stats,
      day,
      npcSheets: npcs.sheets,
      npcStates: npcs.states,
      recentDayLogs: story.dayLog.slice(-3).map((d) => d.summary),
      playerActivities: activities,
    });
  } catch {
    directorResponse = {
      tensionAssessment: "평가 실패",
      interventions: [],
      seedsToPlant: [],
      threadGuidance: {},
      choiceRequired: false,
    };
  }

  // Extract director biases for NPCs
  const directorBiases: Record<string, string> = {};
  const directorTargetNPCs: string[] = [];
  for (const intervention of directorResponse.interventions) {
    if (intervention.targetNPC) {
      directorBiases[intervention.targetNPC] = intervention.description;
      directorTargetNPCs.push(intervention.targetNPC);
    }
  }

  // Check if choice is required
  const config = STORYTELLER_CONFIGS[story.director.mode];
  const forceChoice =
    directorResponse.choiceRequired ||
    story.director.daysSinceLastChoice >= config.maxDaysWithoutChoice;

  // ─── Phase 3: NPC Event Generation (1-3 AI calls) ───
  const threadNPCIds = story.director.activeThreads.flatMap((t) => t.involvedNPCs);
  const encounteredNPCIds = determineEncounters(
    locationIds,
    npcs.sheets,
    npcs.states,
    directorTargetNPCs,
    threadNPCIds
  );

  const npcDialogues: DayResult["npcDialogues"] = [];
  let aiStatDelta: StatDelta = {};
  let choiceMade = false;
  let choiceRequested = forceChoice;

  for (const npcId of encounteredNPCIds) {
    const sheet = npcs.sheets[npcId];
    const npcState = npcs.states[npcId];
    if (!sheet || !npcState) continue;

    const locationName =
      getLocationById(npcState.currentLocation)?.name[lang] ??
      npcState.currentLocation;

    const situation = buildSituation(activities, locationName, sheet.name, day);

    // Determine thinking level from director or default
    const intervention = directorResponse.interventions.find(
      (i) => i.targetNPC === npcId
    );
    const thinkingLevel = intervention?.suggestedThinkingLevel ?? "low";

    try {
      const npcResponse = await callNPCBrain({
        sheet,
        state: npcState,
        playerName: player.name,
        playerStats: player.stats,
        situation,
        directorBias: directorBiases[npcId],
        thinkingLevel,
        forceChoice: choiceRequested && !choiceMade,
      });

      npcDialogues.push({
        npcId,
        npcName: sheet.name,
        dialogue: npcResponse.dialogue,
        choice: npcResponse.choice,
      });

      // Accumulate stat modifiers
      const clamped = clampAIModifiers(npcResponse.statModifiers);
      aiStatDelta = mergeStatDeltas(aiStatDelta, clamped);

      if (npcResponse.choice) choiceMade = true;
      choiceRequested = false; // Only force once
    } catch {
      // Fallback: silent encounter
      npcDialogues.push({
        npcId,
        npcName: sheet.name,
        dialogue: `${sheet.name}와(과) 눈인사를 했다.`,
      });
    }
  }

  // ─── Phase 4: Narrative Assembly (no AI) ───
  const narrativeParts: string[] = [];
  if (lang === "ko") {
    narrativeParts.push(`${day}일차. 오늘은 ${activities}을(를) 했다.`);
  } else {
    narrativeParts.push(`Day ${day}. Today: ${activities}.`);
  }

  for (const dialogue of npcDialogues) {
    narrativeParts.push("");
    narrativeParts.push(dialogue.dialogue);
  }

  // ─── Phase 6: Off-Screen NPC Simulation (1 AI call) ───
  const threadNPCSet = new Set(threadNPCIds);
  const activeNPCIds = getActiveNPCs(npcs.states, threadNPCSet);
  let simResponse: SimulationResponse = { interactions: [], npcMoodUpdates: [] };

  try {
    simResponse = await callNPCSimulation({
      activeNPCIds: activeNPCIds.filter((id) => !encounteredNPCIds.includes(id)),
      npcSheets: npcs.sheets,
      npcStates: npcs.states,
      playerActivities: activities,
      directorGuidance: directorResponse.interventions
        .filter((i) => i.type !== "npc_action")
        .map((i) => i.description)
        .join("; ") || undefined,
      activeThreads: story.director.activeThreads.map((t) => `${t.title}: ${t.summary}`),
    });
  } catch {
    // Simulation failure is non-blocking
  }

  // ─── Phase 7: State Reconciliation (no AI) ───
  const totalDelta = mergeStatDeltas(baseDelta, aiStatDelta);

  // Crisis detection
  const crises = detectCrisis(player.stats, day, clock.semesterPhase);
  const crisisDescriptions = crises
    .filter((c) => c.event)
    .map((c) => c.event!.description);

  // Game over check
  const gameOver = isGameOver(story.crisisLog, day);

  // Build day log
  const dayLog: DayLogEntry = {
    day,
    summary: narrativeParts[0],
    choiceMade,
    crisisTriggered: crises.length > 0,
    tensionLevel: calculateTension(
      player.stats,
      story.director.activeThreads.length,
      story.director.daysSinceLastChoice,
      crises.length
    ),
    npcInteractions: encounteredNPCIds,
  };

  return {
    narrative: narrativeParts.join("\n"),
    npcDialogues,
    statDelta: totalDelta,
    crises: crisisDescriptions,
    isGameOver: gameOver,
    dayLog,
  };
}
