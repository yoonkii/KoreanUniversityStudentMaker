'use client';

import { useGameStore } from '@/store/gameStore';
import { getDramaLevel } from '@/lib/drama-engine';

const SEMESTER_WEEKS = 16;

function getSemesterLabel(week: number): string {
  // Year and semester derived from week number
  // Each semester is 16 weeks, 2 semesters per year
  const semesterIndex = Math.floor((week - 1) / SEMESTER_WEEKS);
  const year = Math.floor(semesterIndex / 2) + 1;
  const semester = (semesterIndex % 2) + 1;
  const weekInSemester = ((week - 1) % SEMESTER_WEEKS) + 1;
  return `${year}학년 ${semester}학기 ${weekInSemester}주차`;
}

function getDayOfWeek(_week: number): string {
  // Each in-game week maps to days; for display we show "월~일"
  return '월 ~ 일';
}

function getStressEmoji(stress: number): string {
  if (stress >= 90) return '🤯';
  if (stress >= 70) return '😰';
  if (stress >= 50) return '😓';
  if (stress >= 30) return '😐';
  return '😊';
}

function getStressColor(stress: number): string {
  if (stress >= 80) return 'text-red-400 animate-pulse';
  if (stress >= 60) return 'text-orange-400';
  if (stress >= 40) return 'text-yellow-400';
  return 'text-green-400';
}

const DRAMA_LEVEL_COLORS: Record<'low' | 'medium' | 'high', string> = {
  low: 'text-teal',
  medium: 'text-gold',
  high: 'text-coral animate-pulse',
};

export default function HUDBar() {
  const currentWeek = useGameStore((state) => state.currentWeek);
  const stats = useGameStore((state) => state.stats);
  const stress = stats?.stress ?? 0;

  const drama = getDramaLevel(stress, stats?.health ?? 100, stats?.money ?? 999999, currentWeek);

  return (
    <>
      {/* Stress pulse overlay at high stress */}
      {stress >= 80 && (
        <div
          className="fixed inset-0 z-25 pointer-events-none animate-pulse"
          style={{
            background: `radial-gradient(ellipse at center, transparent 60%, rgba(239,68,68,${(stress - 80) * 0.01}) 100%)`,
          }}
        />
      )}

      <div className="fixed top-0 left-0 right-0 z-30 glass px-4 py-2.5 md:px-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left: Calendar + semester info */}
          <div className="flex items-center gap-2 text-sm">
            <iconify-icon icon="solar:calendar-bold" width="18" height="18" className="text-teal" />
            <span key={currentWeek} className="text-txt-primary font-medium animate-week-in">
              {getSemesterLabel(currentWeek)}
            </span>
          </div>

          {/* Center: Drama / tension meter */}
          <div className={`flex items-center gap-1.5 text-sm ${DRAMA_LEVEL_COLORS[drama.level]}`}>
            <span>{drama.emoji}</span>
            <span className="text-xs font-medium hidden sm:inline">{drama.label}</span>
          </div>

          {/* Right: Stress indicator */}
          <div className="flex items-center gap-1.5 text-sm">
            <span className={getStressColor(stress)}>{getStressEmoji(stress)}</span>
            <span className={`font-mono text-xs ${getStressColor(stress)}`}>
              {Math.round(stress)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
