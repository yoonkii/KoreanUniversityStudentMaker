'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAIThoughts, subscribeAIThoughts, clearAIThoughts, SOURCE_INFO, type AIThought } from '@/lib/aiThoughtsLog';

interface AIThoughtsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIThoughtsPanel({ isOpen, onClose }: AIThoughtsPanelProps) {
  const [thoughts, setThoughts] = useState<AIThought[]>([]);

  useEffect(() => {
    setThoughts(getAIThoughts());
    return subscribeAIThoughts(() => setThoughts([...getAIThoughts()]));
  }, []);

  const handleClear = useCallback(() => {
    clearAIThoughts();
    setThoughts([]);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 sm:w-96 z-50 bg-black/90 backdrop-blur-md border-l border-white/10 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <h3 className="text-sm font-bold text-white">AI Thoughts</h3>
          <span className="text-[9px] text-teal px-1.5 py-0.5 rounded bg-teal/10">LIVE</span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleClear} className="text-[10px] text-white/30 hover:text-white/60 cursor-pointer">지우기</button>
          <button onClick={onClose} className="text-white/40 hover:text-white cursor-pointer text-lg">×</button>
        </div>
      </div>

      {/* Thoughts list */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {thoughts.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-3xl block mb-3">🧠</span>
            <p className="text-sm text-white/30">아직 AI 사고가 없습니다</p>
            <p className="text-[10px] text-white/15 mt-1">게임을 진행하면 Gemini의 생각이 여기에 표시됩니다</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {thoughts.map((thought) => {
              const info = SOURCE_INFO[thought.source] ?? { emoji: '❓', label: thought.source, color: 'text-white/50' };
              const timeAgo = Math.floor((Date.now() - thought.timestamp) / 1000);
              const timeStr = timeAgo < 60 ? `${timeAgo}초 전` : `${Math.floor(timeAgo / 60)}분 전`;
              return (
                <div key={thought.id} className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{info.emoji}</span>
                    <span className={`text-[10px] font-bold ${info.color}`}>{info.label}</span>
                    <span className="text-[8px] text-white/20 ml-auto">{timeStr}</span>
                  </div>
                  <p className="text-[10px] text-white/50 font-medium mb-0.5">{thought.label}</p>
                  <p className="text-[11px] text-white/70 leading-relaxed">{thought.detail}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/5 text-center">
        <p className="text-[8px] text-white/15">Powered by Gemini 3.1 Flash Lite · {thoughts.length} thoughts logged</p>
      </div>
    </div>
  );
}
