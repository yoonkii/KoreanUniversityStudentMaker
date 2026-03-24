'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { simulateWeek } from '@/lib/gameEngine';
import { calculateTension } from '@/lib/tensionFormula';
import HUDBar from '@/components/game/HUDBar';
import StatsSidebar from '@/components/game/StatsSidebar';
import SchedulePlanner from '@/components/game/SchedulePlanner';
import SceneRenderer from '@/components/vn/SceneRenderer';
import WeekSummary from '@/components/game/WeekSummary';
import type { Choice, PlayerStats, Scene, WeekSchedule } from '@/store/types';

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
    _hasHydrated,
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

  // Wait for localStorage hydration before any redirects
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!player) {
      router.push('/');
    }
  }, [_hasHydrated, player, router]);

  // Show spinner while hydrating
  if (!_hasHydrated) {
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
      // No hardcoded scenes -- try AI game director for week 3+
      setIsLoadingAI(true);
      const tension = calculateTension(stats, relationships, currentWeek);
      const aiScene = await fetchAIScene(stats, relationships, currentWeek, tension);
      setIsLoadingAI(false);

      if (aiScene) {
        setSceneQueue([aiScene]);
        setPhase('simulation');
      } else {
        // AI unavailable -- skip directly to summary with stat deltas only
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

  // Handle week advance
  const handleWeekContinue = useCallback(() => {
    advanceWeek();
  }, [advanceWeek]);

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
