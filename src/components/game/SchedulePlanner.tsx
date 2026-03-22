'use client';

import { useState, useCallback, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { ACTIVITIES, ACTIVITY_LIST } from '@/data/activities';
import GlassPanel from '@/components/ui/GlassPanel';
import type { DayKey, TimeSlot, WeekSchedule, ActivitySlot } from '@/store/types';

interface SchedulePlannerProps {
  onComplete: (schedule: WeekSchedule) => void;
}

const DAY_KEYS: DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const DAY_LABELS: Record<DayKey, string> = {
  monday: '월',
  tuesday: '화',
  wednesday: '수',
  thursday: '목',
  friday: '금',
  saturday: '토',
  sunday: '일',
};

const TIME_SLOTS: TimeSlot[] = ['morning', 'afternoon', 'evening'];

const TIME_LABELS: Record<TimeSlot, string> = {
  morning: '오전',
  afternoon: '오후',
  evening: '저녁',
};

/** Map activity color names to hex values for inline styles */
const ACTIVITY_COLOR_HEX: Record<string, string> = {
  teal: '#4ECDC4',
  gold: '#FFD166',
  pink: '#F5A0B5',
  coral: '#FF6B6B',
  lavender: '#A78BFA',
  'txt-secondary': '#8B95A8',
};

type SlotKey = `${DayKey}-${TimeSlot}`;

function makeKey(day: DayKey, time: TimeSlot): SlotKey {
  return `${day}-${time}`;
}

export default function SchedulePlanner({ onComplete }: SchedulePlannerProps) {
  const setSchedule = useGameStore((state) => state.setSchedule);
  const [selectedDay, setSelectedDay] = useState<DayKey>('monday');
  const [slots, setSlots] = useState<Partial<Record<SlotKey, string>>>({});

  const assignActivity = useCallback((day: DayKey, time: TimeSlot, activityId: string) => {
    setSlots((prev) => ({
      ...prev,
      [makeKey(day, time)]: activityId,
    }));
  }, []);

  const clearSlot = useCallback((day: DayKey, time: TimeSlot) => {
    setSlots((prev) => {
      const next = { ...prev };
      delete next[makeKey(day, time)];
      return next;
    });
  }, []);

  const totalScheduled = useMemo(() => Object.keys(slots).length, [slots]);

  const handleConfirm = useCallback(() => {
    // Build WeekSchedule from slots
    const schedule: WeekSchedule = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    };

    for (const [key, activityId] of Object.entries(slots)) {
      const [day, time] = key.split('-') as [DayKey, TimeSlot];
      const slot: ActivitySlot = { timeSlot: time, activityId };
      schedule[day].push(slot);
    }

    setSchedule(schedule);
    onComplete(schedule);
  }, [slots, setSchedule, onComplete]);

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 gap-4">
      {/* Header */}
      <h2 className="text-xl font-bold text-txt-primary">주간 스케줄 계획</h2>

      {/* Day tabs */}
      <div className="flex gap-1">
        {DAY_KEYS.map((day) => {
          const isActive = day === selectedDay;
          const hasSlots = TIME_SLOTS.some((t) => slots[makeKey(day, t)]);
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-teal/20 text-teal border border-teal/30'
                  : 'glass text-txt-secondary hover:text-txt-primary'
              }`}
            >
              {DAY_LABELS[day]}
              {hasSlots && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal ml-1 align-middle" />
              )}
            </button>
          );
        })}
      </div>

      {/* Time slots for selected day */}
      <div className="flex flex-col gap-3">
        {TIME_SLOTS.map((time) => {
          const key = makeKey(selectedDay, time);
          const activityId = slots[key];
          const activity = activityId ? ACTIVITIES[activityId] : null;
          const colorHex = activity ? ACTIVITY_COLOR_HEX[activity.color] ?? '#8B95A8' : undefined;

          return (
            <GlassPanel key={time} variant="standard" className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-txt-secondary">
                  {TIME_LABELS[time]}
                </span>
                {activity && (
                  <button
                    onClick={() => clearSlot(selectedDay, time)}
                    className="text-xs text-coral hover:text-coral/80 transition-colors cursor-pointer"
                  >
                    취소
                  </button>
                )}
              </div>

              {activity ? (
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ backgroundColor: `${colorHex}15`, borderLeft: `3px solid ${colorHex}` }}
                >
                  <iconify-icon icon={activity.icon} width="22" height="22" />
                  <div>
                    <p className="text-sm font-medium text-txt-primary">{activity.name}</p>
                    <p className="text-xs text-txt-secondary mt-0.5">{activity.description}</p>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-txt-secondary italic py-2">
                  아래에서 활동을 선택하세요
                </div>
              )}
            </GlassPanel>
          );
        })}
      </div>

      {/* Activity picker */}
      <div>
        <p className="text-sm text-txt-secondary mb-2">활동 목록</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {ACTIVITY_LIST.map((activity) => {
            const colorHex = ACTIVITY_COLOR_HEX[activity.color] ?? '#8B95A8';
            // Find first empty slot for selected day to assign into
            const emptyTime = TIME_SLOTS.find((t) => !slots[makeKey(selectedDay, t)]);

            return (
              <button
                key={activity.id}
                disabled={!emptyTime}
                onClick={() => {
                  if (emptyTime) {
                    assignActivity(selectedDay, emptyTime, activity.id);
                  }
                }}
                className="glass rounded-xl px-3 py-3 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span style={{ color: colorHex }}>
                    <iconify-icon icon={activity.icon} width="20" height="20" />
                  </span>
                  <span className="text-sm text-txt-primary font-medium">{activity.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirm button */}
      <div className="mt-auto pt-4">
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
