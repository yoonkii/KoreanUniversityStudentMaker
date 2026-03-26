'use client';

import { useGameStore } from '@/store/gameStore';

const SEMESTER_WEEKS = 16;

function getSemesterLabel(week: number): string {
  const semesterIndex = Math.floor((week - 1) / SEMESTER_WEEKS);
  const year = Math.floor(semesterIndex / 2) + 1;
  const semester = (semesterIndex % 2) + 1;
  const weekInSemester = ((week - 1) % SEMESTER_WEEKS) + 1;
  return `${year}학년 ${semester}학기 ${weekInSemester}주차`;
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

export default function HUDBar() {
  const currentWeek = useGameStore((state) => state.currentWeek);
  const stats = useGameStore((state) => state.stats);
  const stress = stats?.stress ?? 0;
  const health = stats?.health ?? 100;
  const money = stats?.money ?? 0;
  const weekInSemester = ((currentWeek - 1) % SEMESTER_WEEKS) + 1;
  const semesterProgress = (weekInSemester / SEMESTER_WEEKS) * 100;

  return (
    <>
      {/* Stress pulse overlay at high stress */}
      {stress >= 80 && (
        <div className="fixed inset-0 z-25 pointer-events-none animate-pulse" style={{ background: `radial-gradient(ellipse at center, transparent 60%, rgba(239,68,68,${(stress - 80) * 0.01}) 100%)` }} />
      )}

      <div className="fixed top-0 left-0 right-0 z-30 glass">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 py-2.5 md:px-6">
          {/* Left: Calendar + semester info */}
          <div className="flex items-center gap-2 text-sm">
            <iconify-icon icon="solar:calendar-bold" width="18" height="18" className="text-teal" />
            <span className="text-txt-primary font-medium">{getSemesterLabel(currentWeek)}</span>
          </div>

          {/* Center: Stress indicator */}
          <div className="flex items-center gap-1.5 text-sm">
            <span className={getStressColor(stress)}>{getStressEmoji(stress)}</span>
            <span className={`font-mono text-xs ${getStressColor(stress)}`}>{Math.round(stress)}</span>
          </div>

          {/* Right: Quick-glance mini stats (mobile only — sidebar hidden on mobile) */}
          <div className="flex items-center gap-3 text-xs text-txt-secondary lg:hidden">
            <div className="flex items-center gap-1" title="체력">
              <span style={{ color: health < 30 ? '#FF6B6B' : '#4ECDC4' }}>♥</span>
              <span className={`font-mono ${health < 30 ? 'text-coral' : ''}`}>{health}</span>
            </div>
            <div className="flex items-center gap-1" title="돈">
              <span style={{ color: '#FFD166' }}>₩</span>
              <span className="font-mono">{money >= 10000 ? `${Math.floor(money / 10000)}만` : money.toLocaleString('ko-KR')}</span>
            </div>
          </div>

          {/* Right: Semester count (desktop — sidebar already shows stats) */}
          <div className="hidden lg:flex items-center gap-2 text-sm text-txt-secondary">
            <span>{weekInSemester}/{SEMESTER_WEEKS}주</span>
          </div>
        </div>

        {/* Semester progress bar (thin line at bottom of HUD) */}
        <div className="w-full h-0.5 bg-white/5">
          <div className="h-full bg-teal/40 transition-all duration-700 ease-out" style={{ width: `${semesterProgress}%` }} />
        </div>
      </div>
    </>
  );
}
