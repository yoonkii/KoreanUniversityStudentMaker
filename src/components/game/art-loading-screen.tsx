"use client";

import { useEffect, useState, useCallback } from "react";
import { useGameStore } from "@/stores/game-store";
import { generateAllArt, type ArtGenerationProgress } from "@/engine/ai/art-generator";
import { isArtCacheComplete } from "@/engine/save/art-cache";
import { LOCATIONS } from "@/engine/data/locations";

interface ArtLoadingScreenProps {
  onComplete: () => void;
}

export function ArtLoadingScreen({ onComplete }: ArtLoadingScreenProps) {
  const npcs = useGameStore((s) => s.npcs);
  const [progress, setProgress] = useState<ArtGenerationProgress>({
    total: 1,
    completed: 0,
    currentTask: "아트 캐시 확인 중...",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [skipArt, setSkipArt] = useState(false);

  const startGeneration = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    const npcIds = Object.keys(npcs.sheets);
    const locationIds = LOCATIONS.map((l) => l.id);

    // Check if art is already cached
    try {
      const isCached = await isArtCacheComplete(npcIds, locationIds);
      if (isCached) {
        onComplete();
        return;
      }
    } catch {
      // IndexedDB not available, skip
    }

    // Generate art
    try {
      await generateAllArt(npcs.sheets, setProgress);
      onComplete();
    } catch (error) {
      console.error("Art generation failed:", error);
      onComplete(); // Continue without art
    }
  }, [npcs.sheets, isGenerating, onComplete]);

  useEffect(() => {
    if (Object.keys(npcs.sheets).length > 0 && !skipArt) {
      startGeneration();
    }
  }, [npcs.sheets, skipArt, startGeneration]);

  const percent = Math.round((progress.completed / progress.total) * 100);

  if (skipArt) {
    onComplete();
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
      <div className="text-center flex flex-col items-center gap-6 max-w-md px-4">
        <div className="text-6xl animate-bounce">🎨</div>
        <h2 className="text-2xl font-bold text-white">
          블루아카이브 스타일 아트 생성 중
        </h2>
        <p className="text-indigo-200 text-sm">
          캐릭터 초상화와 배경을 생성합니다. 첫 실행 시에만 시간이 걸립니다.
        </p>

        {/* Progress bar */}
        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-400 to-indigo-400 rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="text-indigo-200 text-sm">
          {progress.currentTask}
        </div>
        <div className="text-white/50 text-xs">
          {progress.completed}/{progress.total} ({percent}%)
        </div>

        <button
          onClick={() => setSkipArt(true)}
          className="mt-4 text-indigo-300 hover:text-white text-sm underline transition-colors"
        >
          아트 생성 건너뛰기 (텍스트만)
        </button>
      </div>
    </div>
  );
}
