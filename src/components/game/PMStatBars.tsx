'use client';

import { useEffect, useState } from 'react';
import type { PlayerStats } from '@/store/types';

interface PMStatBarsProps {
  stats: PlayerStats;
  /** Stats from before the current activity — used to show deltas */
  previousStats: PlayerStats;
  /** If true, animate the delta change */
  showDelta?: boolean;
}

const STAT_CONFIG: { key: keyof PlayerStats; label: string; emoji: string; color: string; max: number }[] = [
  { key: 'knowledge', label: '준비도', emoji: '📚', color: '#4EA8DE', max: 100 },
  { key: 'health',    label: '체력',   emoji: '💚', color: '#4ECDC4', max: 100 },
  { key: 'stress',    label: '스트레스', emoji: '🔥', color: '#FF6B6B', max: 100 },
  { key: 'social',    label: '인맥',   emoji: '👥', color: '#FFD166', max: 100 },
  { key: 'charm',     label: '매력',   emoji: '✨', color: '#A78BFA', max: 100 },
  { key: 'money',     label: '돈',     emoji: '💰', color: '#4ECDC4', max: 500000 },
];

export default function PMStatBars({ stats, previousStats, showDelta = false }: PMStatBarsProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (showDelta) {
      const t = setTimeout(() => setAnimated(true), 100);
      return () => clearTimeout(t);
    }
    setAnimated(false);
  }, [showDelta, stats]);

  return (
    <div className="flex flex-col gap-1.5 w-52 sm:w-60 px-3 py-2.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10">
      {STAT_CONFIG.map(({ key, label, emoji, color, max }) => {
        const current = stats[key];
        const prev = previousStats[key];
        const delta = current - prev;
        const percentage = Math.min(100, Math.max(0, (current / max) * 100));
        const prevPercentage = Math.min(100, Math.max(0, (prev / max) * 100));
        const hasDelta = showDelta && delta !== 0;
        const isGood = key === 'stress' ? delta < 0 : delta > 0;

        return (
          <div key={key} className="flex items-center gap-1.5">
            <span className="text-[10px] w-4 text-center">{emoji}</span>
            <span className="text-[9px] text-white/50 w-12 truncate">{label}</span>
            <div className="flex-1 h-3 bg-black/40 rounded-full overflow-hidden relative">
              {/* Delta highlight region */}
              {hasDelta && (
                <div
                  className={`absolute top-0 h-full rounded-full ${isGood ? 'bg-teal/30' : 'bg-coral/30'} ${animated ? 'animate-pulse' : ''}`}
                  style={{
                    left: `${Math.min(prevPercentage, percentage)}%`,
                    width: `${Math.abs(percentage - prevPercentage)}%`,
                  }}
                />
              )}
              {/* Main bar */}
              <div
                className="h-full rounded-full transition-all duration-700 ease-out relative z-10"
                style={{
                  width: animated ? `${percentage}%` : `${prevPercentage}%`,
                  backgroundColor: color,
                }}
              />
            </div>
            {/* Value + delta */}
            <div className="w-14 text-right flex items-center justify-end gap-0.5">
              <span className="text-[10px] text-white/60 font-mono">
                {key === 'money' ? `${Math.round(current / 10000)}만` : current}
              </span>
              {hasDelta && animated && (
                <span className={`text-[9px] font-bold ${isGood ? 'text-teal' : 'text-coral'} animate-fade-in-up`}>
                  {delta > 0 ? '+' : ''}{key === 'money' ? `${Math.round(delta / 1000)}K` : delta}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
