import type { NPCCharacterSheet } from "../types/npc";
import type { CharacterArt, BackgroundArt } from "../types/art";
import type { ExpressionVariant } from "../types/emotion";
import { EXPRESSION_VARIANTS } from "../types/emotion";
import { LOCATIONS } from "../data/locations";
import {
  getCachedCharacterArt,
  cacheCharacterArt,
  getCachedBackgroundArt,
  cacheBackgroundArt,
} from "../save/art-cache";

export interface ArtGenerationProgress {
  total: number;
  completed: number;
  currentTask: string;
}

type ProgressCallback = (progress: ArtGenerationProgress) => void;

/**
 * Generate all art assets for the game.
 * Uses pre-generate + cache strategy:
 * - Check cache first
 * - Generate only what's missing
 * - Cache results permanently
 */
export async function generateAllArt(
  npcSheets: Record<string, NPCCharacterSheet>,
  onProgress: ProgressCallback
): Promise<void> {
  const npcIds = Object.keys(npcSheets);
  const locationIds = LOCATIONS.map((l) => l.id);

  // Count total tasks
  const expressionCount = EXPRESSION_VARIANTS.length; // 7 per NPC (including neutral)
  const totalCharacterTasks = npcIds.length * expressionCount;
  const totalBackgroundTasks = locationIds.length * 2; // day + evening
  const total = totalCharacterTasks + totalBackgroundTasks;
  let completed = 0;

  // ─── Generate Character Art ───
  for (const npcId of npcIds) {
    const sheet = npcSheets[npcId];
    const cached = await getCachedCharacterArt(npcId);

    if (cached && cached.basePortrait && Object.keys(cached.expressions).length >= 6) {
      // Already cached
      completed += expressionCount;
      onProgress({ total, completed, currentTask: `${sheet.name} (cached)` });
      continue;
    }

    // Generate base portrait
    onProgress({
      total,
      completed,
      currentTask: `${sheet.name} 기본 초상화 생성 중...`,
    });

    let basePortrait: string;
    try {
      const baseResult = await fetch("/api/art/character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          npcId,
          appearancePrompt: sheet.appearancePrompt,
        }),
      });
      const baseData = await baseResult.json();
      basePortrait = baseData.imageBase64 ?? "";
    } catch {
      basePortrait = "";
    }
    completed++;
    onProgress({ total, completed, currentTask: `${sheet.name} 기본 초상화 완료` });

    // Generate expression variants
    const expressions: Partial<Record<ExpressionVariant, string>> = {
      neutral: basePortrait,
    };

    for (const expression of EXPRESSION_VARIANTS) {
      if (expression === "neutral") continue;

      onProgress({
        total,
        completed,
        currentTask: `${sheet.name} ${expression} 표정 생성 중...`,
      });

      try {
        const result = await fetch("/api/art/character", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            npcId,
            appearancePrompt: sheet.appearancePrompt,
            expression,
            referenceImageBase64: basePortrait || undefined,
          }),
        });
        const data = await result.json();
        expressions[expression] = data.imageBase64 ?? "";
      } catch {
        expressions[expression] = "";
      }

      completed++;
      onProgress({ total, completed, currentTask: `${sheet.name} ${expression} 완료` });

      // Small delay to avoid rate limits
      await new Promise((r) => setTimeout(r, 500));
    }

    // Cache
    const characterArt: CharacterArt = {
      npcId,
      basePortrait,
      expressions,
      generatedAt: Date.now(),
    };
    await cacheCharacterArt(characterArt);
  }

  // ─── Generate Background Art ───
  for (const location of LOCATIONS) {
    const cached = await getCachedBackgroundArt(location.id);
    if (cached && cached.day && cached.evening) {
      completed += 2;
      onProgress({ total, completed, currentTask: `${location.name.ko} (cached)` });
      continue;
    }

    let dayImage = "";
    let eveningImage = "";

    for (const timeOfDay of ["day", "evening"] as const) {
      onProgress({
        total,
        completed,
        currentTask: `${location.name.ko} (${timeOfDay === "day" ? "낮" : "저녁"}) 생성 중...`,
      });

      try {
        const result = await fetch("/api/art/background", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locationId: location.id,
            artPrompt: location.artPrompt,
            timeOfDay,
          }),
        });
        const data = await result.json();
        if (timeOfDay === "day") dayImage = data.imageBase64 ?? "";
        else eveningImage = data.imageBase64 ?? "";
      } catch {
        // Skip on error
      }

      completed++;
      onProgress({ total, completed, currentTask: `${location.name.ko} 완료` });
      await new Promise((r) => setTimeout(r, 500));
    }

    const bgArt: BackgroundArt = {
      locationId: location.id,
      day: dayImage,
      evening: eveningImage,
      generatedAt: Date.now(),
    };
    await cacheBackgroundArt(bgArt);
  }

  onProgress({ total, completed: total, currentTask: "모든 아트 생성 완료!" });
}
