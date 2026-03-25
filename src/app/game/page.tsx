'use client';

import { useEffect, useState, useCallback } from 'react';
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
import type { Choice, PlayerStats, Scene, WeekSchedule } from '@/store/types';
import { initializeNPCs } from '@/engine/data/npc-initializer';
import { CORE_NPC_SHEETS } from '@/engine/data/core-npcs';

/**
 * Fetch an AI-generated scene from the game director API.
 * Returns a Scene on success, or null if the API is unavailable / fails.
 */
async function fetchAIScene(
  playerStats: PlayerStats,
  relationships: Record<string, unknown>,
  currentWeek: number,
  tension: number,
  recentEvents: string[],
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
        recentEvents,
        npcPersonalities: CORE_NPC_SHEETS.slice(0, 4).map(npc => ({ name: npc.name, role: npc.role, speechPattern: npc.speechPattern, goals: npc.goals })),
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

  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Detect hydration: once component mounts on client, Zustand has loaded from localStorage
  useEffect(() => {
    // Small delay to ensure Zustand persist has finished rehydrating
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

  // Show spinner while hydrating
  if (!hydrated) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-navy">
        <div className="animate-spin w-12 h-12 border-4 border-teal border-t-transparent rounded-full" />
      </div>
    );
  }

  // Handle schedule completion -- simulate the week
  const handleScheduleComplete = useCallback(async (confirmedSchedule: WeekSchedule) => {
    const { statDeltas, scenes } = simulateWeek(confirmedSchedule, currentWeek, stats);
    setWeekStatDeltas(statDeltas);
    setCurrentSceneIndex(0);

    if (scenes.length > 0) {
      // Hardcoded scenes available (weeks 1-2)
      setSceneQueue(scenes);
      setPhase('simulation');
    } else {
      // No hardcoded scenes -- try 3-tier AI engine (Sprint 3-6) first, fall back to legacy
      setIsLoadingAI(true);

      // Initialize NPCs in the new store if not already done
      const newState = useNewStore.getState();
      if (Object.keys(newState.npcs.sheets).length === 0) {
        const { sheets, states } = initializeNPCs();
        useNewStore.getState().registerNPCs(sheets, states);
      }

      // Pull real event history from the new store (last 3 day log entries)
      const newStoreState = useNewStore.getState();
      const recentDayLogs = newStoreState.story.dayLog.slice(-3).map((log: { summary: string }) => log.summary);

      // Try the 3-tier AI engine: story director → NPC brains → simulation
      let aiScene: Scene | null = null;
      try {

        // Call story director for tension evaluation
        const directorRes = await fetch('/api/ai/story-director', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            director: newStoreState.story.director,
            playerStats: stats,
            day: currentWeek * 7,
            npcSummaries: CORE_NPC_SHEETS.slice(0, 4).map(npc => ({
              id: npc.id, name: npc.name,
              emotion: 'anticipation (3/10)',
              goal: npc.goals[0], playerRel: relationships[npc.id.replace('npc_', '')]?.affection ?? 30,
            })),
            recentDayLogs,
            playerActivities: '수업, 공부, 동아리',
          }),
        });

        if (directorRes.ok) {
          const director = await directorRes.json();

          // Pick an NPC to encounter based on director intervention
          const targetNPC = director.interventions?.[0]?.targetNPC
            ? CORE_NPC_SHEETS.find(n => n.id === director.interventions[0].targetNPC)
            : CORE_NPC_SHEETS[Math.floor(Math.random() * CORE_NPC_SHEETS.length)];

          if (targetNPC) {
            // Build a rich situation string with semester phase + player danger context
            const semesterPhase = currentWeek <= 2 ? '오리엔테이션' : currentWeek <= 6 ? '적응기' : currentWeek <= 8 ? '중간고사 시즌' : currentWeek <= 12 ? '후반기' : '기말고사 시즌';
            const dangerFlags: string[] = [];
            if (stats.health < 25) dangerFlags.push('체력이 바닥');
            if (stats.stress > 75) dangerFlags.push('스트레스가 한계');
            if (stats.money < 50000) dangerFlags.push('돈이 거의 없음');
            if (stats.social < 25) dangerFlags.push('인간관계가 소원');
            const relAffection = relationships[targetNPC.id.replace('npc_', '')]?.affection ?? 30;
            const relDesc = relAffection >= 70 ? '친밀한 사이' : relAffection >= 40 ? '아는 사이' : '아직 잘 모르는 사이';
            const situationParts = [`${currentWeek}주차 (${semesterPhase}).`, `캠퍼스에서 ${targetNPC.name}을(를) 만났다.`, `관계: ${relDesc} (${relAffection}/100).`];
            if (dangerFlags.length > 0) situationParts.push(`플레이어 상태: ${dangerFlags.join(', ')} — 이 긴장감이 대화에 배어나야 한다.`);
            if (recentDayLogs.length > 0) situationParts.push(`최근 있었던 일: ${recentDayLogs[recentDayLogs.length - 1]}`);
            const richSituation = situationParts.join(' ');

            // Call NPC brain with director bias
            const npcRes = await fetch('/api/ai/npc-brain', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sheet: targetNPC,
                state: newStoreState.npcs.states[targetNPC.id] ?? {
                  npcId: targetNPC.id,
                  emotion: { primary: 'anticipation', primaryIntensity: 3, secondary: null, secondaryIntensity: 0, mood: 2, stressLevel: 2 },
                  relationshipToPlayer: { level: relAffection, attitude: relDesc, trust: relAffection },
                  npcRelationships: {}, memory: { shortTerm: [], longTerm: [], impressions: {} },
                  currentGoal: targetNPC.goals[0], currentLocation: targetNPC.primaryLocationIds[0],
                  recentDecisions: [], secretKnowledge: [],
                },
                playerName: player?.name ?? '학생',
                playerStats: stats,
                situation: richSituation,
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
        aiScene = await fetchAIScene(stats, relationships, currentWeek, tension, recentDayLogs);
      }

      setIsLoadingAI(false);

      if (aiScene) {
        setSceneQueue([aiScene]);
        setPhase('simulation');
      } else {
        updateStats(statDeltas);
        setPhase('summary');
      }
    }
  }, [currentWeek, stats, relationships, setWeekStatDeltas, setSceneQueue, setCurrentSceneIndex, setPhase, updateStats]);

  // Handle scene end -- move to next scene or summary
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
      setCurrentSceneIndex(nextIndex);
    } else {
      // All scenes done -- apply weekly stat deltas and show summary
      const weekDeltas = useGameStore.getState().weekStatDeltas;
      updateStats(weekDeltas);
      setPhase('summary');
    }
  }, [currentSceneIndex, sceneQueue.length, setCurrentSceneIndex, updateStats, updateRelationship, setPhase]);

  // Handle week advance — after week 16 navigate to ending screen
  const handleWeekContinue = useCallback(() => {
    if (currentWeek >= 16) {
      router.push('/game/ending');
    } else {
      advanceWeek();
    }
  }, [advanceWeek, currentWeek, router]);

  if (!player) return null;

  const currentScene = sceneQueue[currentSceneIndex];

  return (
    <div className="min-h-[100dvh] bg-navy relative">
      {/* HUD -- always visible except during scenes */}
      {phase !== 'simulation' && <HUDBar />}

      {/* Stats sidebar -- visible during planning and summary */}
      {(phase === 'planning' || phase === 'summary') && <StatsSidebar />}

      {/* Main content */}
      {phase === 'planning' && (
        <div className="lg:ml-72 pt-16">
          <SchedulePlanner onComplete={handleScheduleComplete} />
        </div>
      )}

      {/* AI loading indicator */}
      {isLoadingAI && (
        <div className="flex items-center justify-center h-[100dvh]">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-teal border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-txt-secondary text-lg">AI Game Director is creating your story...</p>
          </div>
        </div>
      )}

      {phase === 'simulation' && currentScene && (
        <SceneRenderer
          key={currentScene.id}
          scene={currentScene}
          onSceneEnd={handleSceneEnd}
        />
      )}

      {phase === 'summary' && (
        <div className="lg:ml-72 pt-16">
          <WeekSummary onContinue={handleWeekContinue} />
        </div>
      )}
    </div>
  );
}
