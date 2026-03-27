'use client';

import AnimatedStat from './AnimatedStat';
import type { PlayerStats } from '@/store/types';

interface GameStatsSidebarProps {
  stats: PlayerStats;
  previousStats?: PlayerStats;
  currentWeek: number;
  /** Trend data: stat values from last 3 weeks for trend arrows */
  statHistory?: PlayerStats[];
}

const STAT_CONFIG: Array<{
  key: keyof PlayerStats;
  label: string;
  icon: string;
  color: string;
  isMoney?: boolean;
}> = [
  { key: 'knowledge', label: '준비도', icon: '📚', color: 'blue' },
  { key: 'health', label: '체력', icon: '💪', color: 'emerald' },
  { key: 'social', label: '사회성', icon: '👥', color: 'orange' },
  { key: 'money', label: '재정', icon: '💰', color: 'amber', isMoney: true },
  { key: 'charm', label: '매력', icon: '✨', color: 'pink' },
  { key: 'stress', label: '스트레스', icon: '😰', color: 'red' },
];

function getTrend(current: number, history: number[]): 'up' | 'down' | 'stable' {
  if (history.length < 2) return 'stable';
  const recent = history.slice(-2);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  if (current > avg + 3) return 'up';
  if (current < avg - 3) return 'down';
  return 'stable';
}

function getSemesterLabel(week: number): string {
  const year = Math.floor((week - 1) / 32) + 1;
  const semester = Math.floor(((week - 1) % 32) / 16) + 1;
  const weekInSem = ((week - 1) % 16) + 1;
  return `${year}학년 ${semester}학기 ${weekInSem}주차`;
}

export default function GameStatsSidebar({
  stats,
  previousStats,
  currentWeek,
  statHistory = [],
}: GameStatsSidebarProps) {
  const semesterWeek = ((currentWeek - 1) % 16) + 1;

  return (
    <div className="w-full h-full flex flex-col glass-strong rounded-2xl p-4 gap-4 overflow-hidden">
      {/* Week header */}
      <div className="text-center pb-3 border-b border-white/10">
        <div className="text-2xl font-black text-txt-primary tabular-nums">
          {semesterWeek}주차
        </div>
        <div className="text-xs text-txt-secondary mt-0.5">
          {getSemesterLabel(currentWeek)}
        </div>
        {/* Semester progress */}
        <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal rounded-full transition-all duration-500"
            style={{ width: `${(semesterWeek / 16) * 100}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-3 flex-1">
        {STAT_CONFIG.map(({ key, label, icon, color, isMoney }) => (
          <AnimatedStat
            key={key}
            label={label}
            icon={icon}
            value={stats[key]}
            previousValue={previousStats?.[key]}
            color={color}
            isMoney={isMoney}
            trend={getTrend(
              stats[key],
              statHistory.map(s => s[key])
            )}
          />
        ))}
      </div>

      {/* Hotkey hints */}
      <div className="text-center text-[10px] text-txt-secondary/40 pt-2 border-t border-white/5">
        Space: 다음 · Esc: 메뉴 · S: 스킵
      </div>
    </div>
  );
}
