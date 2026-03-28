/**
 * AI Thoughts Log — collects all Gemini API interactions for display.
 * This creates a "behind the scenes" view of how AI drives the game.
 *
 * Each API call logs: source, prompt summary, response summary, timestamp.
 * The UI can display these as a scrollable "AI mind" panel.
 */

export interface AIThought {
  id: string;
  source: 'narration' | 'dialogue' | 'scene' | 'npc-brain' | 'campus' | 'director' | 'ending';
  label: string;
  detail: string;
  timestamp: number;
}

const MAX_THOUGHTS = 50;
let thoughts: AIThought[] = [];
let listeners: Set<() => void> = new Set();

export function logAIThought(source: AIThought['source'], label: string, detail: string) {
  const thought: AIThought = {
    id: `${source}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    source,
    label,
    detail: detail.length > 200 ? detail.slice(0, 200) + '...' : detail,
    timestamp: Date.now(),
  };
  thoughts = [thought, ...thoughts].slice(0, MAX_THOUGHTS);
  listeners.forEach(fn => fn());
}

export function getAIThoughts(): AIThought[] {
  return thoughts;
}

export function subscribeAIThoughts(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function clearAIThoughts() {
  thoughts = [];
  listeners.forEach(fn => fn());
}

// Source display names and emojis
export const SOURCE_INFO: Record<string, { emoji: string; label: string; color: string }> = {
  narration: { emoji: '📝', label: '나레이션', color: 'text-teal' },
  dialogue: { emoji: '💬', label: '대화 강화', color: 'text-sky-400' },
  scene: { emoji: '🎬', label: '씬 생성', color: 'text-lavender' },
  'npc-brain': { emoji: '🧠', label: 'NPC 사고', color: 'text-pink' },
  campus: { emoji: '🏫', label: '캠퍼스', color: 'text-gold' },
  director: { emoji: '🎭', label: '스토리 감독', color: 'text-coral' },
  ending: { emoji: '📖', label: '엔딩', color: 'text-white' },
};
