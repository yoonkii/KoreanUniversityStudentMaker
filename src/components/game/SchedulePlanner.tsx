'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { ACTIVITIES, ACTIVITY_LIST } from '@/data/activities';
import { getWeekCondition, getWeatherForWeek } from '@/lib/gameEngine';
import type { DayKey, TimeSlot, WeekSchedule, ActivitySlot } from '@/store/types';

interface SchedulePlannerProps {
  onComplete: (schedule: WeekSchedule) => void;
}

const DAY_KEYS: DayKey[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

const DAY_LABELS_SHORT: Record<DayKey, string> = {
  monday: '월', tuesday: '화', wednesday: '수', thursday: '목',
  friday: '금', saturday: '토', sunday: '일',
};

const TIME_SLOTS: TimeSlot[] = ['morning', 'afternoon', 'evening'];

const TIME_LABELS_SHORT: Record<TimeSlot, string> = {
  morning: '오전', afternoon: '오후', evening: '저녁',
};

const ACTIVITY_COLOR_HEX: Record<string, string> = {
  teal: '#4ECDC4', gold: '#FFD166', pink: '#F5A0B5',
  coral: '#FF6B6B', lavender: '#A78BFA', 'txt-secondary': '#8B95A8',
};

const STAT_LABELS: Record<string, string> = {
  gpa: '학점', money: '돈', health: '체력', social: '인맥', stress: '스트레스', charm: '매력',
};

type SlotKey = `${DayKey}-${TimeSlot}`;

function makeKey(day: DayKey, time: TimeSlot): SlotKey {
  return `${day}-${time}`;
}

/** Find the next empty slot key in day-major order */
function getNextEmptySlot(
  slots: Partial<Record<SlotKey, string>>,
  afterKey?: SlotKey,
): SlotKey | null {
  let startDayIdx = 0;
  let startTimeIdx = 0;

  if (afterKey) {
    const [d, t] = afterKey.split('-') as [DayKey, TimeSlot];
    startDayIdx = DAY_KEYS.indexOf(d);
    startTimeIdx = TIME_SLOTS.indexOf(t) + 1;
    if (startTimeIdx >= TIME_SLOTS.length) {
      startDayIdx++;
      startTimeIdx = 0;
    }
  }

  // Search from after the given key to end
  for (let d = startDayIdx; d < DAY_KEYS.length; d++) {
    const tStart = d === startDayIdx ? startTimeIdx : 0;
    for (let t = tStart; t < TIME_SLOTS.length; t++) {
      const key = makeKey(DAY_KEYS[d], TIME_SLOTS[t]);
      if (!slots[key]) return key;
    }
  }
  // Wrap around from beginning
  for (let d = 0; d < DAY_KEYS.length; d++) {
    const tEnd = d === startDayIdx ? startTimeIdx : TIME_SLOTS.length;
    for (let t = 0; t < tEnd; t++) {
      const key = makeKey(DAY_KEYS[d], TIME_SLOTS[t]);
      if (!slots[key]) return key;
    }
  }
  return null;
}

export default function SchedulePlanner({ onComplete }: SchedulePlannerProps) {
  const currentWeek = useGameStore((state) => state.currentWeek);
  const stats = useGameStore((state) => state.stats);
  const setSchedule = useGameStore((state) => state.setSchedule);
  const [slots, setSlots] = useState<Partial<Record<SlotKey, string>>>({});
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  const totalScheduled = useMemo(() => Object.keys(slots).length, [slots]);

  // Live combo preview
  const activeCombos = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const activityId of Object.values(slots)) {
      if (activityId) counts[activityId] = (counts[activityId] || 0) + 1;
    }
    return [
      { name: '효율적 학습', desc: '수업+공부', effect: '학점 +2', active: !!(counts['study'] && counts['lecture']), penalty: false },
      { name: '균형 잡힌 생활', desc: '운동+휴식', effect: '체력 +5', active: !!(counts['exercise'] && counts['rest']), penalty: false },
      { name: '인맥 왕', desc: '동아리+친구', effect: '인맥 +3', active: !!(counts['club'] && counts['friends']), penalty: false },
      { name: '고학생', desc: '알바+공부', effect: '학점 +1, 돈 +₩10K', active: !!(counts['parttime'] && counts['study']), penalty: false },
      { name: '캠퍼스 커플', desc: '데이트+운동', effect: '매력 +4', active: !!(counts['date'] && counts['exercise']), penalty: false },
      { name: '벼락치기', desc: '공부 4회+', effect: '스트레스 +5', active: (counts['study'] || 0) >= 4, penalty: true },
      { name: '알바 중독', desc: '알바 3회+', effect: '체력 -5', active: (counts['parttime'] || 0) >= 3, penalty: true },
    ];
  }, [slots]);

  // Tap an activity card: always fill the next empty slot. Rapid tapping = rapid filling.
  // Long-press or double-tap same activity to deselect (handled via cell tap on filled slot).
  const handleActivityTap = useCallback((activityId: string) => {
    setSelectedActivity(activityId);

    // Always auto-fill next empty slot
    setSlots((prev) => {
      const nextKey = getNextEmptySlot(prev);
      if (nextKey) {
        return { ...prev, [nextKey]: activityId };
      }
      return prev; // all slots full
    });
  }, []);

  // Tap a grid cell
  const handleCellTap = useCallback((day: DayKey, time: TimeSlot) => {
    const key = makeKey(day, time);
    if (slots[key]) {
      // Clear the slot
      setSlots((prev) => { const n = { ...prev }; delete n[key]; return n; });
    } else if (selectedActivity) {
      // Fill with selected activity
      setSlots((prev) => ({ ...prev, [key]: selectedActivity }));
    }
  }, [slots, selectedActivity]);

  const handleConfirm = useCallback(() => {
    const schedule: WeekSchedule = {
      monday: [], tuesday: [], wednesday: [], thursday: [],
      friday: [], saturday: [], sunday: [],
    };
    for (const [key, activityId] of Object.entries(slots)) {
      const [day, time] = key.split('-') as [DayKey, TimeSlot];
      const slot: ActivitySlot = { timeSlot: time, activityId };
      schedule[day].push(slot);
    }
    setSchedule(schedule);
    onComplete(schedule);
  }, [slots, setSchedule, onComplete]);

  const handleSmartFill = useCallback(() => {
    const needs: { activity: string; weight: number }[] = [];
    if (stats.gpa < 50) needs.push({ activity: 'study', weight: 3 });
    else if (stats.gpa < 70) needs.push({ activity: 'study', weight: 2 });
    else needs.push({ activity: 'lecture', weight: 1 });
    if (stats.health < 40) needs.push({ activity: 'exercise', weight: 3 });
    else if (stats.health < 60) needs.push({ activity: 'exercise', weight: 2 });
    if (stats.stress > 70) needs.push({ activity: 'rest', weight: 3 });
    else if (stats.stress > 50) needs.push({ activity: 'rest', weight: 2 });
    if (stats.social < 40) needs.push({ activity: 'friends', weight: 2 });
    else if (stats.social < 60) needs.push({ activity: 'club', weight: 1 });
    if (stats.money < 200000) needs.push({ activity: 'parttime', weight: 2 });
    needs.push({ activity: 'study', weight: 1 });
    needs.push({ activity: 'lecture', weight: 1 });
    needs.push({ activity: 'friends', weight: 1 });
    const pool: string[] = [];
    for (const { activity, weight } of needs) {
      for (let i = 0; i < weight; i++) pool.push(activity);
    }
    const newSlots: Partial<Record<SlotKey, string>> = {};
    let poolIdx = 0;
    for (const day of DAY_KEYS) {
      for (const time of TIME_SLOTS) {
        newSlots[makeKey(day, time)] = pool[poolIdx % pool.length];
        poolIdx++;
      }
    }
    setSlots(newSlots);
  }, [stats]);

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto p-3 sm:p-4 gap-3 sm:gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold text-txt-primary">주간 스케줄</h2>
        <div className="flex items-center gap-3">
          {(() => {
            const weather = getWeatherForWeek(currentWeek);
            if (weather.type === 'normal') return null;
            return (
              <span className="text-xs text-txt-secondary flex items-center gap-1" title={weather.hint}>
                {weather.emoji} {weather.label}
              </span>
            );
          })()}
          <span className="text-xs text-txt-secondary">{totalScheduled}/21</span>
          {totalScheduled > 0 && (
            <button
              onClick={() => setSlots({})}
              className="text-[10px] text-txt-secondary/50 hover:text-coral transition-colors cursor-pointer"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* Week condition banner */}
      {(() => {
        const condition = getWeekCondition(currentWeek);
        if (condition.type === 'normal') return null;
        const colorClass = condition.type === 'festival' ? 'bg-gold/10 border-gold/30 text-gold' : 'bg-coral/10 border-coral/30 text-coral';
        return (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${colorClass}`}>
            <span className="text-base">{condition.emoji}</span>
            <div>
              <span className="font-bold">{condition.label}</span>
              <span className="ml-2 opacity-70">{condition.hint}</span>
            </div>
          </div>
        );
      })()}

      {/* ─── Activity Picker (always visible) ─── */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {ACTIVITY_LIST.map((activity) => {
          const colorHex = ACTIVITY_COLOR_HEX[activity.color] ?? '#8B95A8';
          const isSelected = selectedActivity === activity.id;
          return (
            <button
              key={activity.id}
              onClick={() => handleActivityTap(activity.id)}
              className={`flex flex-col items-center gap-1 px-1.5 py-2.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.95] ${isSelected ? '' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}
              style={isSelected ? { backgroundColor: `${colorHex}20`, border: `2px solid ${colorHex}` } : undefined}
            >
              <span style={{ color: colorHex }}>
                <iconify-icon icon={activity.icon} width="22" height="22" />
              </span>
              <span className="text-[11px] font-medium text-txt-primary leading-tight">{activity.name}</span>
              <span className="text-[9px] text-txt-secondary/60 leading-tight text-center">
                {Object.entries(activity.statEffects)
                  .filter(([, v]) => v !== 0)
                  .slice(0, 2)
                  .map(([k, v]) => `${STAT_LABELS[k] ?? k}${v! > 0 ? '+' : ''}${k === 'money' ? `${(v! / 1000).toFixed(0)}K` : v}`)
                  .join(' ')}
              </span>
            </button>
          );
        })}
      </div>

      {/* Hint */}
      {totalScheduled === 0 && !selectedActivity && (
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-txt-secondary/50">활동을 탭하면 자동으로 빈 슬롯에 배정됩니다</p>
          <button
            onClick={handleSmartFill}
            className="text-[11px] text-lavender/70 hover:text-lavender transition-colors cursor-pointer"
          >
            ✨ 자동 채우기
          </button>
        </div>
      )}

      {/* ─── 7×3 Compact Grid (fixed-height cells) ─── */}
      <div className="grid grid-cols-8 gap-px bg-white/5 rounded-xl overflow-hidden">
        {/* Header row — time labels */}
        <div className="bg-navy" />
        {DAY_KEYS.map((day) => (
          <div key={day} className="bg-navy py-1.5 text-center">
            <span className="text-[10px] font-bold text-txt-secondary">{DAY_LABELS_SHORT[day]}</span>
          </div>
        ))}

        {/* Grid rows — one per time slot */}
        {TIME_SLOTS.map((time) => (
          <React.Fragment key={time}>
            <div className="bg-navy flex items-center justify-center">
              <span className="text-[9px] text-txt-secondary/50">{TIME_LABELS_SHORT[time]}</span>
            </div>
            {DAY_KEYS.map((day) => {
              const key = makeKey(day, time);
              const activityId = slots[key];
              const activity = activityId ? ACTIVITIES[activityId] : null;
              const colorHex = activity ? ACTIVITY_COLOR_HEX[activity.color] ?? '#8B95A8' : undefined;
              const isEmpty = !activity;
              const canFill = isEmpty && selectedActivity;

              return (
                <button
                  key={key}
                  onClick={() => handleCellTap(day, time)}
                  className={`h-10 flex items-center justify-center transition-colors duration-100 cursor-pointer ${isEmpty ? (canFill ? 'bg-white/8 hover:bg-white/15' : 'bg-navy hover:bg-white/5') : 'hover:brightness-125'}`}
                  style={activity ? { backgroundColor: `${colorHex}18` } : undefined}
                  title={activity ? `${activity.name} — 탭하여 제거` : selectedActivity ? `${ACTIVITIES[selectedActivity]?.name} 배정` : '활동을 먼저 선택하세요'}
                >
                  {activity ? (
                    <span style={{ color: colorHex }}>
                      <iconify-icon icon={activity.icon} width="16" height="16" />
                    </span>
                  ) : canFill ? (
                    <span className="w-2 h-2 rounded-full bg-teal/40" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  )}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* ─── Combo Preview ─── */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {activeCombos.map((combo) => (
          <div
            key={combo.name}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-xs transition-all duration-200 ${combo.active ? (combo.penalty ? 'bg-coral/15 text-coral border border-coral/30' : 'bg-teal/15 text-teal border border-teal/30') : 'bg-white/5 text-txt-secondary/40 border border-white/5'}`}
          >
            <span>{combo.active ? (combo.penalty ? '⚠️' : '✨') : '○'}</span>
            <span>{combo.name}</span>
            {combo.active && <span className="font-medium">{combo.effect}</span>}
          </div>
        ))}
      </div>

      {/* Partial fill hint */}
      {totalScheduled > 0 && totalScheduled < 7 && (
        <p className="text-xs text-gold/60 text-center">
          빈 슬롯은 아무것도 안 한 걸로 처리돼요
        </p>
      )}

      {/* ─── Confirm ─── */}
      <div className="mt-auto pt-2 sm:pt-4">
        <button
          onClick={handleConfirm}
          disabled={totalScheduled === 0}
          className="w-full py-3 rounded-xl font-semibold text-base transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-teal/20 text-teal border border-teal/30 hover:bg-teal/30 active:scale-[0.98]"
        >
          스케줄 확정 ({totalScheduled}개 활동)
        </button>
      </div>
    </div>
  );
}
