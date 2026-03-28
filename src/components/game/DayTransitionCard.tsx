'use client';

import { useEffect, useState } from 'react';

interface DayTransitionCardProps {
  dayName: string;
  onDone: () => void;
  /** Activities completed today — for the summary */
  completedActivities?: { icon: string; name: string }[];
  /** First activity of the next day — preview */
  nextDayFirstActivity?: { icon: string; name: string } | null;
}

export default function DayTransitionCard({ dayName, onDone, completedActivities, nextDayFirstActivity }: DayTransitionCardProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 400);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 transition-opacity duration-400 cursor-pointer ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={() => { setVisible(false); setTimeout(onDone, 200); }}
    >
      <div className="text-center max-w-sm px-6">
        {/* Today's activities summary */}
        {completedActivities && completedActivities.length > 0 && (
          <div className="flex items-center justify-center gap-3 mb-6 animate-fade-in-up">
            {completedActivities.map((act, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-2xl">{act.icon}</span>
                <span className="text-[8px] text-white/30">{act.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Day transition text */}
        <p className="text-sm text-white/30 tracking-widest mb-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          다음 날
        </p>
        <h2 className="text-3xl font-bold text-white animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          {dayName}
        </h2>

        {/* Tomorrow's first activity preview */}
        {nextDayFirstActivity && (
          <div className="mt-4 flex items-center justify-center gap-2 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <span className="text-lg">{nextDayFirstActivity.icon}</span>
            <span className="text-xs text-white/40">{nextDayFirstActivity.name}부터 시작</span>
          </div>
        )}
      </div>
    </div>
  );
}
