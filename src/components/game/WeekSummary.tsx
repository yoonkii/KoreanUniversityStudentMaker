'use client';

import { useGameStore } from '@/store/gameStore';
import GlassPanel from '@/components/ui/GlassPanel';
import ProgressBar from '@/components/ui/ProgressBar';
import type { PlayerStats } from '@/store/types';

interface WeekSummaryProps {
  onContinue: () => void;
}

const STAT_CONFIG: {
  key: keyof PlayerStats;
  label: string;
  icon: string;
  color: 'teal' | 'gold' | 'pink' | 'coral' | 'lavender';
  isMoney?: boolean;
  isGpa?: boolean;
}[] = [
  { key: 'gpa', label: '학점', icon: 'solar:star-bold', color: 'gold', isGpa: true },
  { key: 'health', label: '체력', icon: 'solar:heart-pulse-bold', color: 'teal' },
  { key: 'social', label: '인맥', icon: 'solar:users-group-rounded-bold', color: 'pink' },
  { key: 'money', label: '돈', icon: 'solar:wallet-bold', color: 'teal', isMoney: true },
  { key: 'stress', label: '스트레스', icon: 'solar:fire-bold', color: 'coral' },
  { key: 'charm', label: '매력', icon: 'solar:star-shine-bold', color: 'lavender' },
];

function formatDelta(key: keyof PlayerStats, delta: number): string {
  if (key === 'money') {
    const prefix = delta >= 0 ? '+' : '';
    return `${prefix}${delta.toLocaleString('ko-KR')}원`;
  }
  if (key === 'gpa') {
    const gpaDelta = (delta / 100) * 4.5;
    const prefix = gpaDelta >= 0 ? '+' : '';
    return `${prefix}${gpaDelta.toFixed(1)}`;
  }
  const prefix = delta > 0 ? '+' : '';
  return `${prefix}${delta}`;
}

function formatStatDisplay(key: keyof PlayerStats, value: number): string {
  if (key === 'money') {
    return `\u20A9${value.toLocaleString('ko-KR')}`;
  }
  if (key === 'gpa') {
    return `${((value / 100) * 4.5).toFixed(1)} / 4.5`;
  }
  return `${value} / 100`;
}

export default function WeekSummary({ onContinue }: WeekSummaryProps) {
  const currentWeek = useGameStore((state) => state.currentWeek);
  const stats = useGameStore((state) => state.stats);
  const weekStatDeltas = useGameStore((state) => state.weekStatDeltas);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40">
      <GlassPanel variant="strong" className="w-full max-w-lg p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-sm text-txt-secondary mb-1">주간 결산</p>
          <h2 className="text-2xl font-bold text-txt-primary">{currentWeek}주차 완료</h2>
        </div>

        {/* Stat changes */}
        <div className="flex flex-col gap-4 mb-6">
          {STAT_CONFIG.map(({ key, label, icon, color, isMoney, isGpa }) => {
            const delta = weekStatDeltas[key];

            return (
              <div key={key} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <iconify-icon icon={icon} width="16" height="16" />
                    <span className="text-sm text-txt-secondary">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {delta !== undefined && delta !== 0 && (
                      <span
                        className={`text-xs font-medium ${
                          // For stress, positive delta is bad (coral), negative is good (teal)
                          key === 'stress'
                            ? delta > 0
                              ? 'text-coral'
                              : 'text-teal'
                            : delta > 0
                              ? 'text-teal'
                              : 'text-coral'
                        }`}
                      >
                        {delta > 0 ? '\u25B2' : '\u25BC'} {formatDelta(key, delta)}
                      </span>
                    )}
                    <span className="text-sm text-txt-primary font-medium">
                      {formatStatDisplay(key, stats[key])}
                    </span>
                  </div>
                </div>
                {!isMoney && (
                  <ProgressBar
                    value={isGpa ? stats.gpa : stats[key]}
                    color={color}
                    size="sm"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Continue button */}
        <button
          onClick={onContinue}
          className="w-full py-3 rounded-xl font-semibold text-base transition-all duration-300 cursor-pointer bg-teal/20 text-teal border border-teal/30 hover:bg-teal/30 active:scale-[0.98]"
        >
          다음 주 시작
        </button>
      </GlassPanel>
    </div>
  );
}
