'use client';

import { useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import SceneRenderer from '@/components/vn/SceneRenderer';
import { ORIENTATION_SCENES, ORIENTATION_INTRO, ORIENTATION_OUTRO } from '@/data/orientation-scenes';
import type { Choice } from '@/store/types';

interface OrientationEventProps {
  onComplete: () => void;
}

/**
 * Orientation Event — meet each NPC individually in their own location.
 *
 * Flow: intro scene → meet jaemin → meet minji → meet hyunwoo → meet soyeon → outro → done
 * Each NPC gets a full VN scene with background, portrait, dialogue, and player choice.
 */
export default function OrientationEvent({ onComplete }: OrientationEventProps) {
  // -1 = intro, 0-3 = NPC scenes, 4 = outro
  const [sceneIndex, setSceneIndex] = useState(-1);
  const updateRelationship = useGameStore((s) => s.updateRelationship);
  const updateStats = useGameStore((s) => s.updateStats);
  const addEventHistory = useGameStore((s) => s.addEventHistory);

  const handleSceneEnd = useCallback((choice?: Choice) => {
    // Apply choice effects (relationship + stats)
    if (choice) {
      if (choice.statEffects) updateStats(choice.statEffects);
      choice.relationshipEffects?.forEach(({ characterId, change, type }) => {
        updateRelationship(characterId, change, type ?? 'friendship');
      });
    }

    const nextIndex = sceneIndex + 1;

    if (nextIndex > ORIENTATION_SCENES.length) {
      // All scenes + outro done
      addEventHistory({
        week: 1,
        summary: '신입생 OT — 재민, 민지, 현우, 소연을 만났다',
        choiceMade: 'OT 완료',
      });
      onComplete();
    } else {
      setSceneIndex(nextIndex);
    }
  }, [sceneIndex, updateRelationship, updateStats, addEventHistory, onComplete]);

  // Determine current scene
  const currentScene = sceneIndex === -1
    ? ORIENTATION_INTRO
    : sceneIndex < ORIENTATION_SCENES.length
      ? ORIENTATION_SCENES[sceneIndex]
      : ORIENTATION_OUTRO;

  const NPC_NAMES = ['이재민', '한민지', '정현우', '박소연'];
  const progressText = sceneIndex >= 0 && sceneIndex < ORIENTATION_SCENES.length
    ? `${sceneIndex + 1}/4 — ${NPC_NAMES[sceneIndex]} 만남`
    : sceneIndex === -1 ? '오리엔테이션 시작' : '오리엔테이션 마무리';

  return (
    <div className="fixed inset-0 z-50">
      {/* Progress indicator */}
      <div className="absolute top-4 right-4 z-50 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm">
        <p className="text-[10px] text-white/60">{progressText}</p>
        <div className="flex gap-1 mt-1">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-6 h-1 rounded-full transition-all ${
                i < sceneIndex ? 'bg-teal' : i === sceneIndex ? 'bg-teal animate-pulse' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      <SceneRenderer
        scene={currentScene}
        onSceneEnd={handleSceneEnd}
        enableAIDialogue={false}
      />
    </div>
  );
}
