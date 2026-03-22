'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { simulateWeek } from '@/lib/gameEngine';
import HUDBar from '@/components/game/HUDBar';
import StatsSidebar from '@/components/game/StatsSidebar';
import SchedulePlanner from '@/components/game/SchedulePlanner';
import SceneRenderer from '@/components/vn/SceneRenderer';
import WeekSummary from '@/components/game/WeekSummary';
import type { Choice, WeekSchedule } from '@/store/types';

export default function GameScreen() {
  const router = useRouter();
  const {
    phase,
    setPhase,
    player,
    stats,
    currentWeek,
    sceneQueue,
    setSceneQueue,
    setWeekStatDeltas,
    updateStats,
    updateRelationship,
    advanceWeek,
  } = useGameStore();

  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

  // Redirect if no player
  useEffect(() => {
    if (!player) {
      router.push('/');
    }
  }, [player, router]);

  // Handle schedule completion — simulate the week
  const handleScheduleComplete = useCallback((confirmedSchedule: WeekSchedule) => {
    const { statDeltas, scenes } = simulateWeek(confirmedSchedule, currentWeek, stats);
    setWeekStatDeltas(statDeltas);
    setSceneQueue(scenes);
    setCurrentSceneIndex(0);

    if (scenes.length > 0) {
      setPhase('simulation');
    } else {
      // No scenes — go straight to summary
      updateStats(statDeltas);
      setPhase('summary');
    }
  }, [currentWeek, stats, setWeekStatDeltas, setSceneQueue, setPhase, updateStats]);

  // Handle scene end — move to next scene or summary
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
      // All scenes done — apply weekly stat deltas and show summary
      const weekDeltas = useGameStore.getState().weekStatDeltas;
      updateStats(weekDeltas);
      setPhase('summary');
    }
  }, [currentSceneIndex, sceneQueue.length, updateStats, updateRelationship, setPhase]);

  // Handle week advance
  const handleWeekContinue = useCallback(() => {
    advanceWeek();
    setPhase('planning');
    setCurrentSceneIndex(0);
  }, [advanceWeek, setPhase]);

  if (!player) return null;

  const currentScene = sceneQueue[currentSceneIndex];

  return (
    <div className="min-h-[100dvh] bg-navy relative">
      {/* HUD — always visible except during scenes */}
      {phase !== 'simulation' && <HUDBar />}

      {/* Stats sidebar — visible during planning and summary */}
      {(phase === 'planning' || phase === 'summary') && <StatsSidebar />}

      {/* Main content */}
      {phase === 'planning' && (
        <div className="lg:ml-72 pt-16">
          <SchedulePlanner onComplete={handleScheduleComplete} />
        </div>
      )}

      {phase === 'simulation' && currentScene && (
        <SceneRenderer
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
