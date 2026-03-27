'use client';

import { useState, useCallback } from 'react';
import { getActivityVisual, ACTIVITY_LIST, classifyWeekBalance, type ActivityVisual } from '@/lib/activityColors';
import type { PlayerStats } from '@/store/types';

type TimeSlot = 'morning' | 'afternoon' | 'evening';
type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const DAYS = ['월', '화', '수', '목', '금', '토', '일'] as const;
const SLOTS: { key: TimeSlot; label: string; icon: string }[] = [
  { key: 'morning', label: '오전', icon: '🌅' },
  { key: 'afternoon', label: '오후', icon: '☀️' },
  { key: 'evening', label: '저녁', icon: '🌙' },
];

interface CellData {
  activityId: string | null;
}

interface WeeklyGridProps {
  /** Pre-locked cells (from 수강신청 — courses with fixed time slots) */
  lockedCells?: Map<string, string>; // "day-slot" -> activityId
  /** Current player stats for projection */
  stats: PlayerStats;
  /** Callback when schedule is confirmed */
  onConfirm: (schedule: Record<string, string[]>) => void;
}

function cellKey(day: DayIndex, slot: TimeSlot): string {
  return `${day}-${slot}`;
}

/** Calculate projected stat changes from selected activities */
function projectStats(cells: Map<string, string>): Partial<PlayerStats> {
  const EFFECTS: Record<string, Partial<PlayerStats>> = {
    class:    { knowledge: 3, stress: 2, health: -2 },
    study:    { knowledge: 5, stress: 3, health: -3 },
    work:     { money: 45000, stress: 3, health: -5, social: 2 },
    club:     { social: 8, charm: 3, stress: -2, health: -2, money: -10000 },
    date:     { social: 5, charm: 5, stress: -3, money: -30000 },
    exercise: { health: 10, stress: -5 },
    rest:     { health: 10, stress: -8 },
    social:   { social: 6, charm: 2, stress: -2, money: -15000 },
    career:   { knowledge: 2, charm: 2, stress: 2, health: -3 },
  };

  const totals: Partial<PlayerStats> = {};
  for (const actId of cells.values()) {
    const effects = EFFECTS[actId];
    if (!effects) continue;
    for (const [k, v] of Object.entries(effects)) {
      const key = k as keyof PlayerStats;
      totals[key] = ((totals[key] ?? 0) as number) + (v as number);
    }
  }
  return totals;
}

export default function WeeklyGrid({ lockedCells, stats, onConfirm }: WeeklyGridProps) {
  const [cells, setCells] = useState<Map<string, string>>(() => {
    const initial = new Map<string, string>();
    lockedCells?.forEach((v, k) => initial.set(k, v));
    return initial;
  });
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [dragSource, setDragSource] = useState<string | null>(null);

  const filledCount = cells.size;
  const totalCells = 21;
  const allActivityIds = Array.from(cells.values());
  const projected = projectStats(cells);
  const balance = classifyWeekBalance(allActivityIds);

  const isLocked = (key: string) => lockedCells?.has(key) ?? false;

  const handleCellClick = useCallback((key: string) => {
    if (isLocked(key)) return;

    if (cells.has(key)) {
      // Show cancel option for filled cells
      setSelectedCell(key);
      setShowPicker(false);
    } else {
      // Show activity picker for empty cells
      setSelectedCell(key);
      setShowPicker(true);
    }
  }, [cells, lockedCells]);

  const handleActivitySelect = useCallback((actId: string) => {
    if (!selectedCell) return;
    setCells(prev => {
      const next = new Map(prev);
      next.set(selectedCell, actId);
      return next;
    });
    setShowPicker(false);
    setSelectedCell(null);
  }, [selectedCell]);

  const handleClearCell = useCallback(() => {
    if (!selectedCell || isLocked(selectedCell)) return;
    setCells(prev => {
      const next = new Map(prev);
      next.delete(selectedCell);
      return next;
    });
    setSelectedCell(null);
  }, [selectedCell, lockedCells]);

  const handleDragStart = (key: string) => {
    if (isLocked(key)) return;
    setDragSource(key);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetKey: string) => {
    if (!dragSource || isLocked(targetKey) || isLocked(dragSource)) return;
    setCells(prev => {
      const next = new Map(prev);
      const sourceVal = next.get(dragSource);
      const targetVal = next.get(targetKey);
      if (sourceVal) next.set(targetKey, sourceVal); else next.delete(targetKey);
      if (targetVal) next.set(dragSource, targetVal); else next.delete(dragSource);
      return next;
    });
    setDragSource(null);
  };

  const handleConfirm = () => {
    // Convert to legacy WeekSchedule format
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const schedule: Record<string, string[]> = {};
    for (let d = 0; d < 7; d++) {
      const dayActivities: string[] = [];
      for (const slot of SLOTS) {
        const key = cellKey(d as DayIndex, slot.key);
        const actId = cells.get(key);
        if (actId) dayActivities.push(actId);
      }
      schedule[dayKeys[d]] = dayActivities;
    }
    onConfirm(schedule);
  };

  // Stress forecast
  const projectedStress = (stats.stress ?? 0) + ((projected.stress ?? 0) as number);
  const stressForecast = projectedStress > 80 ? '🔴 위험' : projectedStress > 60 ? '🟠 주의' : projectedStress > 40 ? '🟡 보통' : '🟢 좋음';

  return (
    <div className="flex flex-col gap-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-txt-primary">주간 스케줄</h2>
        <div className="text-sm text-txt-secondary">
          {filledCount}/{totalCells} 슬롯
        </div>
      </div>

      {/* 7x3 Grid */}
      <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-1 animate-grid-in">
        {/* Header row — day names */}
        <div /> {/* corner spacer */}
        {DAYS.map((day, i) => (
          <div key={day} className="text-center text-xs font-bold text-txt-secondary py-1.5">
            <span className={i >= 5 ? 'text-pink-400' : ''}>{day}</span>
          </div>
        ))}

        {/* Data rows */}
        {SLOTS.map(slot => (
          <>
            {/* Row label */}
            <div key={`label-${slot.key}`} className="flex items-center justify-center text-xs text-txt-secondary px-1.5">
              <span>{slot.icon}</span>
            </div>

            {/* Cells */}
            {DAYS.map((_, dayIdx) => {
              const key = cellKey(dayIdx as DayIndex, slot.key);
              const actId = cells.get(key);
              const visual = actId ? getActivityVisual(actId) : null;
              const locked = isLocked(key);
              const isSelected = selectedCell === key;

              return (
                <button
                  key={key}
                  onClick={() => handleCellClick(key)}
                  draggable={!!actId && !locked}
                  onDragStart={() => handleDragStart(key)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(key)}
                  className={`
                    relative h-16 md:h-20 rounded-lg border transition-all duration-200
                    flex flex-col items-center justify-center gap-0.5
                    ${locked
                      ? 'border-blue-500/30 bg-blue-500/10 cursor-default'
                      : visual
                        ? `${visual.bgLightClass} ${visual.borderClass} hover:scale-[1.03] active:scale-[0.97] cursor-grab`
                        : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 cursor-pointer'
                    }
                    ${isSelected ? 'ring-2 ring-teal scale-[1.05]' : ''}
                    ${dragSource === key ? 'opacity-50' : ''}
                  `}
                >
                  {visual ? (
                    <>
                      <span className="text-lg md:text-xl">{visual.icon}</span>
                      <span className={`text-[10px] md:text-xs font-medium ${visual.textClass} leading-none`}>
                        {visual.shortName}
                      </span>
                    </>
                  ) : (
                    <span className="text-white/20 text-xl">+</span>
                  )}
                  {locked && (
                    <div className="absolute top-0.5 right-0.5 text-[8px] text-blue-400">🔒</div>
                  )}
                </button>
              );
            })}
          </>
        ))}
      </div>

      {/* Activity Picker — horizontal scrollable strip */}
      {showPicker && (
        <div className="animate-slide-up">
          <div className="text-xs text-txt-secondary mb-2">활동 선택:</div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
            {ACTIVITY_LIST.map(act => (
              <button
                key={act.id}
                onClick={() => handleActivitySelect(act.id)}
                className={`
                  flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl
                  ${act.bgLightClass} ${act.borderClass} border
                  hover:scale-[1.05] active:scale-[0.95] transition-all
                  min-w-[120px]
                `}
              >
                <span className="text-xl">{act.icon}</span>
                <span className={`text-sm font-bold ${act.textClass}`}>{act.shortName}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected cell detail (cancel option) */}
      {selectedCell && cells.has(selectedCell) && !showPicker && (
        <div className="flex items-center justify-between glass rounded-xl px-4 py-3 animate-slide-up">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getActivityVisual(cells.get(selectedCell)!).icon}</span>
            <span className="text-txt-primary font-medium">
              {getActivityVisual(cells.get(selectedCell)!).name}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowPicker(true); }}
              className="px-3 py-1.5 text-xs bg-white/10 rounded-lg text-txt-secondary hover:text-txt-primary transition-colors"
            >
              변경
            </button>
            <button
              onClick={handleClearCell}
              className="px-3 py-1.5 text-xs bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Preview */}
      {filledCount >= 3 && (
        <div className="glass rounded-xl p-4 animate-slide-up">
          <div className="text-xs font-bold text-txt-secondary mb-3">📊 주간 전망</div>

          {/* Week balance tag */}
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal/20 text-teal">
              {balance}
            </span>
            <span className="text-xs text-txt-secondary">
              스트레스 전망: {stressForecast}
            </span>
          </div>

          {/* Projected stat changes */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(projected)
              .filter(([, v]) => v !== 0)
              .sort(([, a], [, b]) => Math.abs(b as number) - Math.abs(a as number))
              .map(([key, value]) => {
                const labels: Record<string, string> = {
                  knowledge: '준비도', money: '재정', health: '체력',
                  social: '사회성', stress: '스트레스', charm: '매력',
                };
                const v = value as number;
                return (
                  <span
                    key={key}
                    className={`px-2 py-1 rounded-full text-xs font-mono font-bold ${
                      key === 'stress'
                        ? v > 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                        : v > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {labels[key] ?? key} {v > 0 ? '+' : ''}{key === 'money' ? `₩${v.toLocaleString()}` : v}
                  </span>
                );
              })}
          </div>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            className="w-full py-3 bg-teal text-white rounded-xl font-bold text-lg hover:bg-teal/90 transition-all active:scale-[0.97] shadow-[0_4px_20px_rgba(20,184,166,0.3)]"
          >
            스케줄 확정 ({filledCount}개 활동)
          </button>
        </div>
      )}

      {/* Hotkey hints */}
      <div className="flex justify-center gap-4 text-[10px] text-txt-secondary/50">
        <span>Space: 다음</span>
        <span>Esc: 메뉴</span>
        <span>S: 스킵</span>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes grid-in {
          from { opacity: 0; transform: translateY(30px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        .animate-grid-in { animation: grid-in 0.5s cubic-bezier(0.16,1,0.3,1); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
