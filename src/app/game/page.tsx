'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { useGameStore as useNewStore } from '@/stores/game-store';
import { simulateWeek } from '@/lib/gameEngine';
import { calculateTension } from '@/lib/tensionFormula';
import HUDBar from '@/components/game/HUDBar';
import StatsSidebar from '@/components/game/StatsSidebar';
import SchedulePlanner from '@/components/game/SchedulePlanner';
import SceneRenderer from '@/components/vn/SceneRenderer';
import WeekSummary from '@/components/game/WeekSummary';
import ActionPhase from '@/components/game/ActionPhase';
import SceneTransition from '@/components/game/SceneTransition';
import { ArtLoadingScreen } from '@/components/game/art-loading-screen';
import { DayResult } from '@/components/game/day-result';
import { NarrativePanel } from '@/components/game/narrative-panel';
import { ACTIVITIES } from '@/data/activities';
import { getActivityVisual } from '@/lib/activityColors';
import type { Choice, PlayerStats, Scene, WeekSchedule, DayKey } from '@/store/types';
import type { PlayerStats as EnginePlayerStats } from '@/engine/types/stats';
import { initializeNPCs } from '@/engine/data/npc-initializer';
import { CORE_NPC_SHEETS } from '@/engine/data/core-npcs';

type ActivityExecItem = { name: string; icon: string; statEffects: Partial<PlayerStats>; timeSlot: string };

/** Convert store PlayerStats → engine PlayerStats for DayResult */
function toEngineStats(s: PlayerStats): EnginePlayerStats {
  return {
    gpa: s.gpa,
    energy: s.health,
    social: s.social,
    finances: Math.min(100, Math.round(s.money / 5000)),
    career: s.charm,
    mental: Math.max(0, 100 - s.stress),
  };
}

/** Map scene location string to a canonical activity ID for SceneTransition */
function locationToActivityId(location: string): string {
  const l = location.toLowerCase();
  if (l.includes('class') || l.includes('campus')) return 'class';
  if (l.includes('library') || l.includes('study')) return 'study';
  if (l.includes('gym') || l.includes('exercise')) return 'exercise';
  if (l.includes('cafe') || l.includes('restaurant')) return 'social';
  if (l.includes('date') || l.includes('park')) return 'date';
  if (l.includes('club')) return 'club';
  if (l.includes('work') || l.includes('part')) return 'work';
  if (l.includes('dorm') || l.includes('home') || l.includes('rest')) return 'rest';
  return 'social';
}

const DAY_ORDER: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/**
 * Fetch an AI-generated scene from the game director API.
 * Returns a Scene on success, or null if the API is unavailable / fails.
 */
async function fetchAIScene(
  playerStats: PlayerStats,
  relationships: Record<string, unknown>,
  currentWeek: number,
  tension: number,
): Promise<Scene | null> {
  try {
    const response = await fetch('/api/game-director', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerStats,
        relationships,
        currentWeek,
        tension,
        recentEvents: [],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();

    // Construct a Scene from the API response
    const scene: Scene = {
      id: `ai_week${currentWeek}_${Date.now()}`,
      location: data.location ?? 'campus',
      backgroundVariant: data.backgroundVariant ?? 'day',
      characters: Array.isArray(data.characters) ? data.characters : [],
      dialogue: Array.isArray(data.dialogue)
        ? data.dialogue.map((line: { characterId?: string | null; text: string; expression?: string }) => ({
            characterId: line.characterId ?? null,
            text: line.text,
            expression: line.expression,
          }))
        : [],
      choices: Array.isArray(data.choices)
        ? data.choices.map((choice: { id: string; text: string; statEffects: Record<string, number>; relationshipEffects?: { characterId: string; change: number }[] }) => ({
            id: choice.id,
            text: choice.text,
            statEffects: choice.statEffects ?? {},
            relationshipEffects: choice.relationshipEffects,
          }))
        : undefined,
    };

    // Validate the scene has at least some dialogue
    if (scene.dialogue.length === 0) return null;

    return scene;
  } catch {
    return null;
  }
}

export default function GameScreen() {
  const router = useRouter();
  const {
    phase,
    setPhase,
    player,
    stats,
    currentWeek,
    currentSceneIndex,
    setCurrentSceneIndex,
    sceneQueue,
    setSceneQueue,
    setWeekStatDeltas,
    updateStats,
    updateRelationship,
    relationships,
    advanceWeek,
  } = useGameStore();

  // ── local UI state ──────────────────────────────────────────────────────────
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  /** Activities shown in ActionPhase; null = ActionPhase hidden */
  const [actionActivities, setActionActivities] = useState<ActivityExecItem[] | null>(null);

  /** Narrative intro text shown at the start of each simulation */
  const [showNarrative, setShowNarrative] = useState(false);
  const [narrativeText, setNarrativeText] = useState('');

  /** Scene-to-scene transition */
  const [showTransition, setShowTransition] = useState(false);
  const [transitionNextIdx, setTransitionNextIdx] = useState(0);

  /** Day/week result overlay */
  const [showDayResult, setShowDayResult] = useState(false);
  const [weekResultStats, setWeekResultStats] = useState<{ before: PlayerStats; after: PlayerStats } | null>(null);

  // Resolves the promise that handleScheduleComplete awaits while ActionPhase plays
  const actionDoneRef = useRef<(() => void) | null>(null);

  // ── effects ─────────────────────────────────────────────────────────────────

  // Detect hydration
  useEffect(() => {
    const timer = setTimeout(() => setHydrated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Redirect if no player (only after hydration)
  useEffect(() => {
    if (!hydrated) return;
    if (!player) {
      router.push('/');
    }
  }, [hydrated, player, router]);

  // ── early returns (all hooks above this line) ────────────────────────────────

  // Show spinner while hydrating
  if (!hydrated) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-navy">
        <div className="animate-spin w-12 h-12 border-4 border-teal border-t-transparent rounded-full" />
      </div>
    );
  }

  // ── callbacks ────────────────────────────────────────────────────────────────

  // Called by ActionPhase when it finishes (or is skipped)
  const handleActionPhaseComplete = useCallback(() => {
    actionDoneRef.current?.();
    actionDoneRef.current = null;
  }, []);

  // Called by SceneTransition when the wipe animation finishes
  const handleTransitionEnd = useCallback(() => {
    setShowTransition(false);
    setCurrentSceneIndex(transitionNextIdx);
  }, [transitionNextIdx, setCurrentSceneIndex]);

  // Called by DayResult continue button
  const handleDayResultContinue = useCallback(() => {
    setShowDayResult(false);
    setWeekResultStats(null);
    setPhase('summary');
  }, [setPhase]);

  // Handle schedule confirmation — shows ActionPhase first, then simulates week
  const handleScheduleComplete = useCallback(async (confirmedSchedule: WeekSchedule) => {
    // Build activity list for ActionPhase
    const activities: ActivityExecItem[] = [];
    for (const day of DAY_ORDER) {
      for (const slot of confirmedSchedule[day]) {
        const act = ACTIVITIES[slot.activityId];
        const vis = getActivityVisual(slot.activityId);
        activities.push({
          name: vis.name,
          icon: vis.icon,
          statEffects: act?.statEffects ?? {},
          timeSlot: slot.timeSlot,
        });
      }
    }

    // Show ActionPhase and wait for the player to watch / skip it
    if (activities.length > 0) {
      setActionActivities(activities);
      await new Promise<void>(resolve => { actionDoneRef.current = resolve; });
      setActionActivities(null);
    }

    // Simulate the week (uses stats/currentWeek captured at call time — correct)
    const { statDeltas, scenes } = simulateWeek(confirmedSchedule, currentWeek, stats);
    setWeekStatDeltas(statDeltas);
    setCurrentSceneIndex(0);

    // Build a narrative intro for the simulation phase
    const topNames = activities.slice(0, 3).map(a => a.name).join(', ');
    setNarrativeText(`${currentWeek}주차. ${topNames}${activities.length > 3 ? ' 외 활동' : ''}을 마쳤다. 이번 주는 어떤 일이 기다리고 있을까?`);

    if (scenes.length > 0) {
      // Hardcoded scenes available (weeks 1–2)
      setSceneQueue(scenes);
      setPhase('simulation');
      setShowNarrative(true);
    } else {
      // No hardcoded scenes — try 3-tier AI engine first, fall back to legacy
      setIsLoadingAI(true);

      // Initialize NPCs in the new store if not already done
      const newState = useNewStore.getState();
      if (Object.keys(newState.npcs.sheets).length === 0) {
        const { sheets, states } = initializeNPCs();
        useNewStore.getState().registerNPCs(sheets, states);
      }

      let aiScene: Scene | null = null;
      try {
        const directorRes = await fetch('/api/ai/story-director', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            director: useNewStore.getState().story.director,
            playerStats: stats,
            day: currentWeek * 7,
            npcSummaries: CORE_NPC_SHEETS.slice(0, 4).map(npc => ({
              id: npc.id, name: npc.name,
              emotion: 'anticipation (3/10)',
              goal: npc.goals[0], playerRel: 30,
            })),
            recentDayLogs: [],
            playerActivities: topNames,
          }),
        });

        if (directorRes.ok) {
          const director = await directorRes.json();

          const targetNPC = director.interventions?.[0]?.targetNPC
            ? CORE_NPC_SHEETS.find(n => n.id === director.interventions[0].targetNPC)
            : CORE_NPC_SHEETS[Math.floor(Math.random() * CORE_NPC_SHEETS.length)];

          if (targetNPC) {
            const npcRes = await fetch('/api/ai/npc-brain', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sheet: targetNPC,
                state: useNewStore.getState().npcs.states[targetNPC.id] ?? {
                  npcId: targetNPC.id,
                  emotion: { primary: 'anticipation', primaryIntensity: 3, secondary: null, secondaryIntensity: 0, mood: 2, stressLevel: 2 },
                  relationshipToPlayer: { level: 30, attitude: '아직 잘 모르는 사이.', trust: 30 },
                  npcRelationships: {}, memory: { shortTerm: [], longTerm: [], impressions: {} },
                  currentGoal: targetNPC.goals[0], currentLocation: targetNPC.primaryLocationIds[0],
                  recentDecisions: [], secretKnowledge: [],
                },
                playerName: player?.name ?? '학생',
                playerStats: stats,
                situation: `${currentWeek}주차. 캠퍼스에서 ${targetNPC.name}을(를) 만났다.`,
                directorBias: director.interventions?.[0]?.description,
                thinkingLevel: director.interventions?.[0]?.suggestedThinkingLevel ?? 'low',
                forceChoice: director.choiceRequired,
              }),
            });

            if (npcRes.ok) {
              const npcData = await npcRes.json();
              aiScene = {
                id: `ai_3tier_w${currentWeek}_${Date.now()}`,
                location: targetNPC.primaryLocationIds[0] ?? 'campus',
                backgroundVariant: 'day',
                characters: [{
                  characterId: targetNPC.id.replace('npc_', ''),
                  expression: npcData.emotion?.type === 'joy' ? 'happy' : 'neutral',
                  position: 'center' as const,
                }],
                dialogue: [{
                  characterId: targetNPC.id.replace('npc_', ''),
                  text: npcData.dialogue ?? '...',
                }],
                choices: npcData.choice ? npcData.choice.options.map((opt: { label: string; consequences: string }, i: number) => ({
                  id: `choice_${i}`,
                  text: opt.label,
                  statEffects: npcData.statModifiers ?? {},
                  relationshipEffects: [{ characterId: targetNPC.id.replace('npc_', ''), change: npcData.relationshipDelta ?? 0 }],
                })) : undefined,
              };
            }
          }
        }
      } catch (e) {
        console.warn('3-tier AI engine failed, falling back to legacy:', e);
      }

      // Fall back to legacy AI director if 3-tier failed
      if (!aiScene) {
        const tension = calculateTension(stats, relationships, currentWeek);
        aiScene = await fetchAIScene(stats, relationships, currentWeek, tension);
      }

      setIsLoadingAI(false);

      if (aiScene) {
        setSceneQueue([aiScene]);
        setPhase('simulation');
        setShowNarrative(true);
      } else {
        updateStats(statDeltas);
        setPhase('summary');
      }
    }
  }, [currentWeek, stats, relationships, setWeekStatDeltas, setSceneQueue, setCurrentSceneIndex, setPhase, updateStats, player]);

  // Handle scene end — transition to next scene or show day result
  const handleSceneEnd = useCallback((choice?: Choice) => {
    // Apply choice effects
    if (choice) {
      updateStats(choice.statEffects);
      choice.relationshipEffects?.forEach(({ characterId, change }) => {
        updateRelationship(characterId, change);
      });
    }

    const nextIndex = currentSceneIndex + 1;
    if (nextIndex < sceneQueue.length) {
      // Show wipe transition before next scene
      setTransitionNextIdx(nextIndex);
      setShowTransition(true);
    } else {
      // All scenes done — compute before/after stats for DayResult
      const currentStats = useGameStore.getState().stats;
      const weekDeltas = useGameStore.getState().weekStatDeltas;
      const afterStats: PlayerStats = {
        gpa: Math.max(0, Math.min(100, currentStats.gpa + (weekDeltas.gpa ?? 0))),
        money: Math.max(0, currentStats.money + (weekDeltas.money ?? 0)),
        health: Math.max(0, Math.min(100, currentStats.health + (weekDeltas.health ?? 0))),
        social: Math.max(0, Math.min(100, currentStats.social + (weekDeltas.social ?? 0))),
        stress: Math.max(0, Math.min(100, currentStats.stress + (weekDeltas.stress ?? 0))),
        charm: Math.max(0, Math.min(100, currentStats.charm + (weekDeltas.charm ?? 0))),
      };
      updateStats(weekDeltas);
      setWeekResultStats({ before: currentStats, after: afterStats });
      setShowDayResult(true);
    }
  }, [currentSceneIndex, sceneQueue.length, updateStats, updateRelationship]);

  // Handle week advance
  const handleWeekContinue = useCallback(() => {
    advanceWeek();
  }, [advanceWeek]);

  if (!player) return null;

  const currentScene = sceneQueue[currentSceneIndex];
  const nextSceneForTransition = sceneQueue[transitionNextIdx];

  return (
    <div className="min-h-[100dvh] bg-navy relative">
      {/* HUD — always visible except during simulation / overlays */}
      {phase !== 'simulation' && !actionActivities && <HUDBar />}

      {/* Stats sidebar — visible during planning and summary */}
      {(phase === 'planning' || phase === 'summary') && !actionActivities && <StatsSidebar />}

      {/* Planning phase */}
      {phase === 'planning' && !actionActivities && (
        <div className="lg:ml-72 pt-16">
          <SchedulePlanner onComplete={handleScheduleComplete} />
        </div>
      )}

      {/* ActionPhase: full-screen activity playback between planning and simulation */}
      {actionActivities && (
        <ActionPhase activities={actionActivities} currentStats={stats} onComplete={handleActionPhaseComplete} />
      )}

      {/* ArtLoadingScreen: shown while AI is generating the scene */}
      {isLoadingAI && <ArtLoadingScreen onComplete={() => {}} />}

      {/* NarrativePanel: story intro before the first VN scene each week */}
      {phase === 'simulation' && showNarrative && (
        <div className="fixed inset-0 z-40 bg-navy flex items-end justify-center pb-16 px-4">
          <div className="w-full max-w-2xl">
            <NarrativePanel narrative={narrativeText} onContinue={() => setShowNarrative(false)} lang="ko" />
          </div>
        </div>
      )}

      {/* VN Scene — hidden while narrative or transition is showing */}
      {phase === 'simulation' && currentScene && !showNarrative && !showTransition && (
        <SceneRenderer key={currentScene.id} scene={currentScene} onSceneEnd={handleSceneEnd} />
      )}

      {/* SceneTransition: wipe between consecutive VN scenes */}
      {showTransition && nextSceneForTransition && (
        <SceneTransition activityId={locationToActivityId(nextSceneForTransition.location)} dayLabel={`${currentWeek}주차`} timeLabel="" current={transitionNextIdx} total={sceneQueue.length} onTransitionEnd={handleTransitionEnd} />
      )}

      {/* DayResult: stat summary after all scenes finish */}
      {showDayResult && weekResultStats && (
        <div className="fixed inset-0 z-50 bg-navy/95 p-4 overflow-y-auto flex items-center justify-center">
          <div className="w-full max-w-md">
            <DayResult beforeStats={toEngineStats(weekResultStats.before)} afterStats={toEngineStats(weekResultStats.after)} narrative={`${currentWeek}주차가 끝났습니다.`} onContinue={handleDayResultContinue} lang="ko" />
          </div>
        </div>
      )}

      {/* Weekly summary */}
      {phase === 'summary' && (
        <div className="lg:ml-72 pt-16">
          <WeekSummary onContinue={handleWeekContinue} />
        </div>
      )}
    </div>
  );
}
