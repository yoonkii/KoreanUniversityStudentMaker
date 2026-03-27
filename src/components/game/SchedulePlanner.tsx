'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useGameStore } from '@/store/gameStore';
import { ACTIVITIES, ACTIVITY_LIST } from '@/data/activities';
import { CHARACTERS } from '@/data/characters';
import { getWeekCondition, getWeatherForWeek } from '@/lib/gameEngine';
import type { DayKey, TimeSlot, WeekSchedule, ActivitySlot, NpcActivityVariant } from '@/store/types';

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

// Energy costs per activity (higher = more draining)
const ENERGY_COSTS: Record<string, number> = {
  study: 15,      // Intensive
  lecture: 8,     // Passive
  parttime: 18,   // Physical + mental
  club: 10,       // Moderate
  date: 12,       // Social energy
  exercise: 14,   // Physical
  rest: 0,        // Restores energy
  friends: 10,    // Social
  tutoring: 16,   // Teaching is tiring
  networking: 12, // Social energy
  selfcare: 5,    // Light
  explore: 8,     // Walking around
  volunteer: 15,  // Physical + emotional
};

const ACTIVITY_COLOR_HEX: Record<string, string> = {
  teal: '#4ECDC4', gold: '#FFD166', pink: '#F5A0B5',
  coral: '#FF6B6B', lavender: '#A78BFA', 'txt-secondary': '#8B95A8',
};

const STAT_LABELS: Record<string, string> = {
  knowledge: '준비도', money: '돈', health: '체력', social: '인맥', stress: '스트레스', charm: '매력',
};

const TIER_THRESHOLDS: Record<string, number> = {
  stranger: 0,
  acquaintance: 25,
  friend: 50,
  close_friend: 70,
  soulmate: 90,
};

const TIER_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  soulmate: { label: '소울메이트', emoji: '💕', color: 'text-pink' },
  close_friend: { label: '절친', emoji: '💛', color: 'text-gold' },
  friend: { label: '친구', emoji: '😊', color: 'text-teal' },
  acquaintance: { label: '아는 사이', emoji: '🤝', color: 'text-txt-secondary' },
  stranger: { label: '모르는 사이', emoji: '👤', color: 'text-txt-secondary/50' },
};

function getTierForAffection(affection: number): string {
  if (affection >= 90) return 'soulmate';
  if (affection >= 70) return 'close_friend';
  if (affection >= 50) return 'friend';
  if (affection >= 25) return 'acquaintance';
  return 'stranger';
}

type SlotKey = `${DayKey}-${TimeSlot}`;

interface SlotData {
  activityId: string;
  targetNpcId?: string;
}

interface NpcPickerState {
  activityId: string;
  /** The slot key to fill when an NPC is picked, or null for auto-fill */
  slotKey: SlotKey | null;
}

function makeKey(day: DayKey, time: TimeSlot): SlotKey {
  return `${day}-${time}`;
}

/** Find the next empty slot key in day-major order */
function getNextEmptySlot(
  slots: Partial<Record<SlotKey, SlotData>>,
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
  const relationships = useGameStore((state) => state.relationships);
  const setSchedule = useGameStore((state) => state.setSchedule);
  const [slots, setSlots] = useState<Partial<Record<SlotKey, SlotData>>>({});
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [npcPicker, setNpcPicker] = useState<NpcPickerState | null>(null);

  const totalScheduled = useMemo(() => Object.keys(slots).length, [slots]);

  // Energy system: max energy based on health, activities cost energy
  const maxEnergy = useMemo(() => Math.max(50, Math.round(stats.health * 1.5 + 30)), [stats.health]);
  const usedEnergy = useMemo(() => {
    let total = 0;
    for (const slotData of Object.values(slots)) {
      if (slotData) total += ENERGY_COSTS[slotData.activityId] ?? 10;
    }
    return total;
  }, [slots]);
  const energyPercent = Math.min(100, (usedEnergy / maxEnergy) * 100);
  const isOverworked = usedEnergy > maxEnergy;

  // Live combo preview
  const activeCombos = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const slotData of Object.values(slots)) {
      if (slotData) counts[slotData.activityId] = (counts[slotData.activityId] || 0) + 1;
    }
    return [
      { name: '효율적 학습', desc: '수업+공부', effect: '준비도 +2', active: !!(counts['study'] && counts['lecture']), penalty: false },
      { name: '균형 잡힌 생활', desc: '운동+휴식', effect: '체력 +5', active: !!(counts['exercise'] && counts['rest']), penalty: false },
      { name: '인맥 왕', desc: '동아리+친구', effect: '인맥 +3', active: !!(counts['club'] && counts['friends']), penalty: false },
      { name: '고학생', desc: '알바+공부', effect: '준비도 +1, 돈 +₩10K', active: !!(counts['parttime'] && counts['study']), penalty: false },
      { name: '캠퍼스 커플', desc: '데이트+운동', effect: '매력 +4', active: !!(counts['date'] && counts['exercise']), penalty: false },
      { name: '벼락치기', desc: '공부 4회+', effect: '스트레스 +5', active: (counts['study'] || 0) >= 4, penalty: true },
      { name: '알바 중독', desc: '알바 3회+', effect: '체력 -5', active: (counts['parttime'] || 0) >= 3, penalty: true },
    ];
  }, [slots]);

  // Check if an activity requires NPC target
  const activityRequiresNpc = useCallback((activityId: string): boolean => {
    return !!ACTIVITIES[activityId]?.requiresNpcTarget;
  }, []);

  // Get available NPCs for an activity, filtered by relationship tier
  const getAvailableNpcs = useCallback((activityId: string): { variant: NpcActivityVariant; meetsRequirement: boolean; currentAffection: number; currentTier: string }[] => {
    const activity = ACTIVITIES[activityId];
    if (!activity?.npcVariants) return [];

    return activity.npcVariants.map((variant) => {
      const rel = relationships[variant.npcId];
      const currentAffection = rel?.affection ?? 0;
      const currentTier = getTierForAffection(currentAffection);
      const requiredThreshold = TIER_THRESHOLDS[variant.requiredTier] ?? 0;
      const meetsRequirement = currentAffection >= requiredThreshold;

      return { variant, meetsRequirement, currentAffection, currentTier };
    });
  }, [relationships]);

  // Tap an activity card: for NPC activities, open picker instead of filling directly
  const handleActivityTap = useCallback((activityId: string) => {
    setSelectedActivity(activityId);

    if (activityRequiresNpc(activityId)) {
      // Open NPC picker overlay (auto-fill mode, slotKey=null)
      setNpcPicker({ activityId, slotKey: null });
    } else {
      // Auto-fill next empty slot
      setSlots((prev) => {
        const nextKey = getNextEmptySlot(prev);
        if (nextKey) {
          return { ...prev, [nextKey]: { activityId } };
        }
        return prev; // all slots full
      });
    }
  }, [activityRequiresNpc]);

  // NPC selected from picker
  const handleNpcSelect = useCallback((npcId: string) => {
    if (!npcPicker) return;

    const { activityId, slotKey } = npcPicker;

    setSlots((prev) => {
      const targetKey = slotKey ?? getNextEmptySlot(prev);
      if (targetKey) {
        return { ...prev, [targetKey]: { activityId, targetNpcId: npcId } };
      }
      return prev;
    });

    setNpcPicker(null);
  }, [npcPicker]);

  // Tap a grid cell
  const handleCellTap = useCallback((day: DayKey, time: TimeSlot) => {
    const key = makeKey(day, time);
    if (slots[key]) {
      // Clear the slot
      setSlots((prev) => { const n = { ...prev }; delete n[key]; return n; });
    } else if (selectedActivity) {
      if (activityRequiresNpc(selectedActivity)) {
        // Open NPC picker for this specific slot
        setNpcPicker({ activityId: selectedActivity, slotKey: key });
      } else {
        // Fill with selected activity
        setSlots((prev) => ({ ...prev, [key]: { activityId: selectedActivity } }));
      }
    }
  }, [slots, selectedActivity, activityRequiresNpc]);

  const handleConfirm = useCallback(() => {
    const schedule: WeekSchedule = {
      monday: [], tuesday: [], wednesday: [], thursday: [],
      friday: [], saturday: [], sunday: [],
    };
    for (const [key, slotData] of Object.entries(slots)) {
      const [day, time] = key.split('-') as [DayKey, TimeSlot];
      const slot: ActivitySlot = {
        timeSlot: time,
        activityId: slotData.activityId,
        ...(slotData.targetNpcId ? { targetNpcId: slotData.targetNpcId } : {}),
      };
      schedule[day].push(slot);
    }
    setSchedule(schedule);
    onComplete(schedule);
  }, [slots, setSchedule, onComplete]);

  const handleSmartFill = useCallback(() => {
    const needs: { activity: string; weight: number }[] = [];
    if (stats.knowledge < 50) needs.push({ activity: 'study', weight: 3 });
    else if (stats.knowledge < 70) needs.push({ activity: 'study', weight: 2 });
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
    const newSlots: Partial<Record<SlotKey, SlotData>> = {};
    let poolIdx = 0;
    for (const day of DAY_KEYS) {
      for (const time of TIME_SLOTS) {
        const activityId = pool[poolIdx % pool.length];
        // For NPC activities in smart fill, pick the first available NPC
        if (activityRequiresNpc(activityId)) {
          const available = getAvailableNpcs(activityId).filter((n) => n.meetsRequirement);
          const targetNpcId = available.length > 0 ? available[Math.floor(Math.random() * available.length)].variant.npcId : undefined;
          newSlots[makeKey(day, time)] = { activityId, targetNpcId };
        } else {
          newSlots[makeKey(day, time)] = { activityId };
        }
        poolIdx++;
      }
    }
    setSlots(newSlots);
  }, [stats, activityRequiresNpc, getAvailableNpcs]);

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
          // Check unlock requirements
          const statLocked = activity.unlockRequirement && stats[activity.unlockRequirement.stat] < activity.unlockRequirement.min;
          const weekLocked = activity.unlockWeek && currentWeek < activity.unlockWeek;
          const isLocked = !!(statLocked || weekLocked);
          const lockReason = statLocked ? `🔒 ${activity.unlockRequirement!.label}` : weekLocked ? `🔒 ${activity.unlockWeek}주차부터` : '';
          return (
            <button
              key={activity.id}
              onClick={() => !isLocked && handleActivityTap(activity.id)}
              disabled={isLocked}
              title={isLocked ? lockReason : activity.description}
              className={`flex flex-col items-center gap-1 px-1.5 py-2.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.95] ${isLocked ? 'opacity-40 cursor-not-allowed' : ''} ${isSelected ? '' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}
              style={isSelected ? { backgroundColor: `${colorHex}20`, border: `2px solid ${colorHex}` } : undefined}
            >
              <span style={{ color: isLocked ? '#555' : colorHex }}>
                <iconify-icon icon={isLocked ? 'solar:lock-bold' : activity.icon} width="22" height="22" />
              </span>
              <span className={`text-[11px] font-medium leading-tight ${isLocked ? 'text-txt-secondary/40' : 'text-txt-primary'}`}>
                {isLocked ? '???' : activity.name}
              </span>
              <span className="text-[9px] text-txt-secondary/60 leading-tight text-center">
                {isLocked ? lockReason : Object.entries(activity.statEffects)
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
            자동 채우기
          </button>
        </div>
      )}

      {/* ─── 7x3 Compact Grid (fixed-height cells) ─── */}
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
              const slotData = slots[key];
              const activity = slotData ? ACTIVITIES[slotData.activityId] : null;
              const colorHex = activity ? ACTIVITY_COLOR_HEX[activity.color] ?? '#8B95A8' : undefined;
              const isEmpty = !activity;
              const canFill = isEmpty && selectedActivity;
              const npcName = slotData?.targetNpcId ? CHARACTERS[slotData.targetNpcId]?.name : null;

              return (
                <button
                  key={key}
                  onClick={() => handleCellTap(day, time)}
                  className={`h-10 flex flex-col items-center justify-center transition-colors duration-100 cursor-pointer ${isEmpty ? (canFill ? 'bg-white/8 hover:bg-white/15' : 'bg-navy hover:bg-white/5') : 'hover:brightness-125'}`}
                  style={activity ? { backgroundColor: `${colorHex}18` } : undefined}
                  title={activity ? `${activity.name}${npcName ? ` (${npcName})` : ''} — 탭하여 제거` : selectedActivity ? `${ACTIVITIES[selectedActivity]?.name} 배정` : '활동을 먼저 선택하세요'}
                >
                  {activity ? (
                    <>
                      <span style={{ color: colorHex }}>
                        <iconify-icon icon={activity.icon} width="14" height="14" />
                      </span>
                      {npcName && (
                        <span className="text-[7px] text-txt-secondary/70 leading-none mt-0.5 truncate max-w-full px-0.5">
                          {npcName.slice(-2)}
                        </span>
                      )}
                    </>
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
            <span>{combo.active ? (combo.penalty ? '!' : '*') : '-'}</span>
            <span>{combo.name}</span>
            {combo.active && <span className="font-medium">{combo.effect}</span>}
          </div>
        ))}
      </div>

      {/* Energy bar — PM-style constraint visualization */}
      {totalScheduled > 0 && (
        <div className="px-2 sm:px-4">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-txt-secondary">⚡ 에너지</span>
            <span className={`font-mono font-bold ${isOverworked ? 'text-coral' : usedEnergy > maxEnergy * 0.8 ? 'text-gold' : 'text-teal'}`}>
              {usedEnergy} / {maxEnergy}
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${isOverworked ? 'bg-coral' : usedEnergy > maxEnergy * 0.8 ? 'bg-gold' : 'bg-teal'}`}
              style={{ width: `${Math.min(100, energyPercent)}%` }}
            />
          </div>
          {isOverworked && (
            <p className="text-[10px] text-coral mt-1">
              ⚠️ 과로 주의! 체력이 크게 떨어질 수 있어요
            </p>
          )}
        </div>
      )}

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

      {/* ─── NPC Picker Overlay ─── */}
      {npcPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 animate-fade-in"
          onClick={() => setNpcPicker(null)}
        >
          <div
            className="w-full max-w-md mx-auto bg-navy-light border border-white/10 rounded-t-2xl sm:rounded-2xl p-4 pb-6 sm:p-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Picker Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-txt-primary">
                  {ACTIVITIES[npcPicker.activityId]?.name} - 누구와?
                </h3>
                <p className="text-[10px] text-txt-secondary/60 mt-0.5">
                  {npcPicker.activityId === 'date' ? '친구 이상만 데이트 가능' : '아는 사이 이상만 만날 수 있어요'}
                </p>
              </div>
              <button
                onClick={() => setNpcPicker(null)}
                className="text-xs text-txt-secondary hover:text-txt-primary cursor-pointer px-2 py-1"
              >
                닫기
              </button>
            </div>

            {/* NPC Cards */}
            {(() => {
              const npcOptions = getAvailableNpcs(npcPicker.activityId);
              const qualifiedNpcs = npcOptions.filter((n) => n.meetsRequirement);

              if (qualifiedNpcs.length === 0) {
                return (
                  <div className="text-center py-8">
                    <p className="text-sm text-txt-secondary/70">
                      {npcPicker.activityId === 'date'
                        ? '먼저 친해져야 데이트할 수 있어요'
                        : '먼저 만나야 친구가 될 수 있어요'}
                    </p>
                    <p className="text-[10px] text-txt-secondary/40 mt-2">
                      {npcPicker.activityId === 'date'
                        ? '호감도 50 이상 (친구 등급) 필요'
                        : '호감도 25 이상 (아는 사이 등급) 필요'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                  {npcOptions.map(({ variant, meetsRequirement, currentAffection, currentTier }) => {
                    const character = CHARACTERS[variant.npcId];
                    if (!character) return null;
                    const tierInfo = TIER_LABELS[currentTier] ?? TIER_LABELS.stranger;

                    return (
                      <button
                        key={variant.npcId}
                        onClick={() => meetsRequirement && handleNpcSelect(variant.npcId)}
                        disabled={!meetsRequirement}
                        className={`flex items-start gap-3 px-3 py-3 rounded-xl transition-all duration-150 text-left ${meetsRequirement
                          ? 'bg-white/5 hover:bg-white/10 cursor-pointer active:scale-[0.98]'
                          : 'bg-white/[0.02] opacity-40 cursor-not-allowed'
                        }`}
                      >
                        {/* Portrait */}
                        <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-white/10 border-2"
                          style={{ borderColor: meetsRequirement ? (ACTIVITY_COLOR_HEX[character.color] ?? '#8B95A8') : 'transparent' }}
                        >
                          <Image
                            src={`/assets/characters/${variant.npcId}/neutral.png`}
                            alt={variant.npcName}
                            width={44}
                            height={44}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-txt-primary">{variant.npcName}</span>
                            <span className={`text-[10px] font-medium ${tierInfo.color}`}>
                              {tierInfo.emoji} {tierInfo.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-txt-secondary/70 mt-0.5">{variant.description}</p>

                          {/* Stat effects */}
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {Object.entries(variant.statEffects)
                              .filter(([, v]) => v !== 0)
                              .map(([k, v]) => (
                                <span
                                  key={k}
                                  className={`text-[9px] px-1.5 py-0.5 rounded-full ${v! > 0 ? 'bg-teal/10 text-teal' : 'bg-coral/10 text-coral'}`}
                                >
                                  {STAT_LABELS[k] ?? k} {v! > 0 ? '+' : ''}{k === 'money' ? `${(v! / 1000).toFixed(0)}K` : v}
                                </span>
                              ))}
                          </div>

                          {/* Locked message */}
                          {!meetsRequirement && (
                            <p className="text-[9px] text-coral/60 mt-1">
                              호감도 {TIER_THRESHOLDS[variant.requiredTier] ?? 0} 이상 필요 (현재 {currentAffection})
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
