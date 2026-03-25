'use client';

import { useState, useEffect } from 'react';
import { getActivityVisual } from '@/lib/activityColors';

interface SceneTransitionProps {
  /** Activity being shown, e.g., "class" */
  activityId: string;
  /** Day label, e.g., "월요일" */
  dayLabel: string;
  /** Time slot label, e.g., "오전" */
  timeLabel: string;
  /** Progress: "3/21 activities completed" */
  current: number;
  total: number;
  /** Callback after transition finishes */
  onTransitionEnd: () => void;
  /** Transition style */
  style?: 'slide-left' | 'slide-right' | 'fade' | 'wipe';
}

export default function SceneTransition({
  activityId,
  dayLabel,
  timeLabel,
  current,
  total,
  onTransitionEnd,
  style = 'wipe',
}: SceneTransitionProps) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');
  const visual = getActivityVisual(activityId);

  useEffect(() => {
    // in (0.4s) → hold (1.2s) → out (0.4s) → callback
    const holdTimer = setTimeout(() => setPhase('hold'), 400);
    const outTimer = setTimeout(() => setPhase('out'), 1600);
    const endTimer = setTimeout(onTransitionEnd, 2000);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(outTimer);
      clearTimeout(endTimer);
    };
  }, [onTransitionEnd]);

  const animClass = {
    'slide-left': {
      in: 'translate-x-full',
      hold: 'translate-x-0',
      out: '-translate-x-full',
    },
    'slide-right': {
      in: '-translate-x-full',
      hold: 'translate-x-0',
      out: 'translate-x-full',
    },
    'fade': {
      in: 'opacity-0',
      hold: 'opacity-100',
      out: 'opacity-0',
    },
    'wipe': {
      in: 'clip-path-in',
      hold: 'clip-path-full',
      out: 'clip-path-out',
    },
  }[style];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {/* Slide wipe background */}
      <div
        className={`absolute inset-0 transition-all duration-400 ease-[cubic-bezier(0.76,0,0.24,1)]`}
        style={{
          backgroundColor: visual.color,
          transform: style === 'wipe'
            ? phase === 'in' ? 'translateX(-100%)'
              : phase === 'hold' ? 'translateX(0)'
              : 'translateX(100%)'
            : undefined,
          opacity: style === 'fade'
            ? phase === 'hold' ? 0.9 : 0
            : 0.92,
        }}
      />

      {/* Content */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 ${
          phase === 'hold' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Activity icon */}
        <div className="text-6xl mb-3">{visual.icon}</div>

        {/* Activity name */}
        <h2 className="text-3xl font-black text-white tracking-tight mb-1">
          {visual.name}
        </h2>

        {/* Day + time */}
        <div className="text-lg text-white/70 font-medium">
          {dayLabel} {timeLabel}
        </div>

        {/* Progress bar */}
        <div className="mt-6 flex items-center gap-3">
          <div className="w-40 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/80 rounded-full transition-all duration-500"
              style={{ width: `${(current / total) * 100}%` }}
            />
          </div>
          <span className="text-sm text-white/60 font-mono">
            {current}/{total}
          </span>
        </div>
      </div>
    </div>
  );
}
