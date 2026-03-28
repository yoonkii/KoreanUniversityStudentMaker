'use client';

import { useState, useEffect, useRef } from 'react';
import type { Scene, DialogueLine } from '@/store/types';
import { useGameStore } from '@/store/gameStore';
import { logAIThought } from '@/lib/aiThoughtsLog';

interface AIDialogueResult {
  dialogue: DialogueLine[];
  isLoading: boolean;
}

/**
 * Hook that enhances a scene's hardcoded dialogue with AI-generated lines.
 * Falls back to original dialogue on failure or timeout.
 */
export function useAIDialogue(scene: Scene, enabled: boolean = true): AIDialogueResult {
  const [enhancedDialogue, setEnhancedDialogue] = useState<DialogueLine[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const stats = useGameStore((s) => s.stats);
  const relationships = useGameStore((s) => s.relationships);
  const currentWeek = useGameStore((s) => s.currentWeek);

  useEffect(() => {
    if (!enabled || !scene.characters.length) {
      setEnhancedDialogue(null);
      return;
    }

    // Check sessionStorage cache
    const cacheKey = `ai_dialogue_${scene.id}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        setEnhancedDialogue(JSON.parse(cached));
        return;
      } catch { /* ignore parse errors */ }
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);

    // 6-second timeout — don't make the player wait too long
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const characterIds = scene.characters.map(c => c.characterId);
    const originalText = scene.dialogue.map(d => d.text).join('\n');

    fetch('/api/ai/enhance-dialogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        sceneId: scene.id,
        characterIds,
        originalDialogue: originalText,
        playerStats: stats,
        relationships,
        currentWeek,
        location: scene.location,
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        if (data.dialogue && Array.isArray(data.dialogue)) {
          setEnhancedDialogue(data.dialogue);
          sessionStorage.setItem(cacheKey, JSON.stringify(data.dialogue));
          logAIThought('dialogue', `씬 "${scene.id}" 대화 강화`, data.dialogue[0]?.text ?? '(enhanced)');
        }
      })
      .catch(() => {
        // Silently fall back to original
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => { controller.abort(); clearTimeout(timeoutId); };
  }, [scene.id, enabled]); // Only re-run on scene change

  return {
    dialogue: enhancedDialogue ?? scene.dialogue,
    isLoading,
  };
}
