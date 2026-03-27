'use client';

import { useState, useCallback, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { PROLOGUE_SCENES } from '@/data/scenes/prologue';
import SceneRenderer from '@/components/vn/SceneRenderer';
import type { Scene } from '@/store/types';

interface PrologueSequenceProps {
  onComplete: () => void;
}

/** Inject player name into prologue dialogue */
function personalizeScenes(scenes: Scene[], playerName: string): Scene[] {
  return scenes.map((scene) => ({
    ...scene,
    dialogue: scene.dialogue.map((line) => ({
      ...line,
      text: line.text
        .replace('발을 들였다.', `발을 들였다. ${playerName}의 대학 생활이 시작된다.`)
        .replace('나에게 달렸다.', `${playerName}, 너에게 달렸다.`),
    })),
  }));
}

export default function PrologueSequence({ onComplete }: PrologueSequenceProps) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const playerName = useGameStore((s) => s.player?.name ?? '학생');

  const scenes = useMemo(() => personalizeScenes(PROLOGUE_SCENES, playerName), [playerName]);

  const handleSceneEnd = useCallback(() => {
    if (sceneIndex < scenes.length - 1) {
      setSceneIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  }, [sceneIndex, scenes.length, onComplete]);

  const currentScene = scenes[sceneIndex];
  if (!currentScene) {
    onComplete();
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <SceneRenderer scene={currentScene} onSceneEnd={handleSceneEnd} enableAIDialogue={false} />

      {/* Skip button */}
      <button
        onClick={onComplete}
        className="fixed top-4 right-4 z-[60] px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/80 bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-all cursor-pointer"
      >
        건너뛰기 →
      </button>
    </div>
  );
}
