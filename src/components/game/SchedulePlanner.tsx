'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useGameStore } from '@/store/gameStore';
import { ACTIVITIES, ACTIVITY_LIST } from '@/data/activities';
import { CHARACTERS } from '@/data/characters';
import { getWeekCondition, getWeatherForWeek } from '@/lib/gameEngine';
import type { DayKey, TimeSlot, WeekSchedule, ActivitySlot, NpcActivityVariant } from '@/store/types';
import { getWeeklyRoutines } from '@/lib/livingCampus';

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

// Friendship tier thresholds (used for NPC picker requirements)
const TIER_THRESHOLDS: Record<string, number> = {
  stranger: 0,
  acquaintance: 20,
  friend: 40,
  close_friend: 60,
  best_friend: 80,
};

const TIER_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  best_friend: { label: '베프', emoji: '⭐', color: 'text-gold' },
  close_friend: { label: '절친', emoji: '💛', color: 'text-teal' },
  friend: { label: '친구', emoji: '😊', color: 'text-sky-400' },
  acquaintance: { label: '아는 사이', emoji: '🤝', color: 'text-txt-secondary' },
  stranger: { label: '모르는 사이', emoji: '👤', color: 'text-txt-secondary/50' },
};

function getTierForFriendship(friendship: number): string {
  if (friendship >= 80) return 'best_friend';
  if (friendship >= 60) return 'close_friend';
  if (friendship >= 40) return 'friend';
  if (friendship >= 20) return 'acquaintance';
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
    // Track discovered combos in localStorage for meta-progression
    const discoveredRaw = typeof window !== 'undefined' ? localStorage.getItem('kusm-discovered-combos') : null;
    const discovered = new Set<string>(discoveredRaw ? JSON.parse(discoveredRaw) : []);

    const combos = [
      { name: '효율적 학습', desc: '수업+공부', effect: '준비도 +2', active: !!(counts['study'] && counts['lecture']), penalty: false },
      { name: '균형 잡힌 생활', desc: '운동+휴식', effect: '체력 +5', active: !!(counts['exercise'] && counts['rest']), penalty: false },
      { name: '인맥 왕', desc: '동아리+친구', effect: '인맥 +3', active: !!(counts['club'] && counts['friends']), penalty: false },
      { name: '고학생', desc: '알바+공부', effect: '준비도 +1, 돈 +₩10K', active: !!(counts['parttime'] && counts['study']), penalty: false },
      { name: '캠퍼스 커플', desc: '데이트+운동', effect: '매력 +4', active: !!(counts['date'] && counts['exercise']), penalty: false },
      { name: '벼락치기', desc: '공부 4회+', effect: '스트레스 +5', active: (counts['study'] || 0) >= 4, penalty: true },
      { name: '알바 중독', desc: '알바 3회+', effect: '체력 -5', active: (counts['parttime'] || 0) >= 3, penalty: true },
    ];

    // Mark newly discovered combos
    for (const combo of combos) {
      if (combo.active && !discovered.has(combo.name)) {
        discovered.add(combo.name);
        if (typeof window !== 'undefined') {
          localStorage.setItem('kusm-discovered-combos', JSON.stringify([...discovered]));
        }
      }
    }

    return combos.map(c => ({ ...c, discovered: discovered.has(c.name) }));
  }, [slots]);

  // Check if an activity requires NPC target
  const activityRequiresNpc = useCallback((activityId: string): boolean => {
    return !!ACTIVITIES[activityId]?.requiresNpcTarget;
  }, []);

  // Get available NPCs for an activity, filtered by relationship tier
  const getAvailableNpcs = useCallback((activityId: string): { variant: NpcActivityVariant; meetsRequirement: boolean; currentFriendship: number; currentTier: string; currentRomance: number; romanceTier: string }[] => {
    const activity = ACTIVITIES[activityId];
    if (!activity?.npcVariants) return [];

    return activity.npcVariants.map((variant) => {
      const rel = relationships[variant.npcId];
      const currentFriendship = rel?.friendship ?? rel?.affection ?? 0;
      const currentTier = getTierForFriendship(currentFriendship);
      const requiredThreshold = TIER_THRESHOLDS[variant.requiredTier] ?? 0;
      const meetsRequirement = currentFriendship >= requiredThreshold;
      const currentRomance = rel?.romance ?? 0;
      const romanceTier = currentRomance >= 70 ? '깊은 사랑' : currentRomance >= 45 ? '연인' : currentRomance >= 25 ? '설렘' : currentRomance >= 10 ? '관심' : '';

      return { variant, meetsRequirement, currentFriendship, currentTier, currentRomance, romanceTier };
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

  // Undo last placement
  const [slotHistory, setSlotHistory] = useState<Partial<Record<SlotKey, SlotData>>[]>([]);
  const handleUndo = useCallback(() => {
    if (slotHistory.length > 0) {
      const prev = slotHistory[slotHistory.length - 1];
      setSlots(prev);
      setSlotHistory(h => h.slice(0, -1));
    }
  }, [slotHistory]);

  // Fill remaining empty slots with rest
  const fillRemainingWithRest = useCallback(() => {
    const newSlots = { ...slots };
    for (const day of DAY_KEYS) {
      for (const time of TIME_SLOTS) {
        const key = makeKey(day, time);
        if (!newSlots[key]) {
          newSlots[key] = { activityId: 'rest' };
        }
      }
    }
    setSlots(newSlots);
  }, [slots]);

  // Wrap the original slot-setting to track history
  const setSlotsWithHistory = useCallback((newSlots: Partial<Record<SlotKey, SlotData>>) => {
    setSlotHistory(h => [...h.slice(-10), slots]); // Keep last 10 states
    setSlots(newSlots);
  }, [slots]);

  // Template presets — one-tap schedules for common playstyles
  const applyTemplate = useCallback((template: string) => {
    const TEMPLATES: Record<string, string[]> = {
      // 21 activities (7 days × 3 slots) for each template
      scholar: ['lecture','study','study', 'lecture','study','study', 'study','lecture','rest', 'lecture','study','study', 'study','study','rest', 'study','rest','exercise', 'rest','study','exercise'],
      social: ['lecture','friends','club', 'lecture','friends','friends', 'club','friends','exercise', 'lecture','date','friends', 'friends','club','rest', 'friends','exercise','friends', 'rest','rest','friends'],
      balanced: ['lecture','study','exercise', 'study','friends','rest', 'lecture','club','exercise', 'study','friends','rest', 'lecture','study','exercise', 'friends','rest','club', 'rest','exercise','friends'],
      hustler: ['lecture','parttime','parttime', 'parttime','study','parttime', 'lecture','parttime','rest', 'parttime','parttime','study', 'parttime','study','rest', 'parttime','rest','exercise', 'rest','parttime','exercise'],
    };
    const activities = TEMPLATES[template];
    if (!activities) return;
    const newSlots: Partial<Record<SlotKey, SlotData>> = {};
    let idx = 0;
    for (const day of DAY_KEYS) {
      for (const time of TIME_SLOTS) {
        const activityId = activities[idx] ?? 'rest';
        if (activityRequiresNpc(activityId)) {
          const available = getAvailableNpcs(activityId).filter((n) => n.meetsRequirement);
          const targetNpcId = available.length > 0 ? available[Math.floor(Math.random() * available.length)].variant.npcId : undefined;
          newSlots[makeKey(day, time)] = { activityId, targetNpcId };
        } else {
          newSlots[makeKey(day, time)] = { activityId };
        }
        idx++;
      }
    }
    setSlots(newSlots);
  }, [activityRequiresNpc, getAvailableNpcs]);

  // First-time tutorial
  const [showTutorial, setShowTutorial] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem('kusm-tutorial-done');
  });

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto p-3 sm:p-4 gap-3 sm:gap-4">
      {/* Campus life ticker — what ALL NPCs are doing right now */}
      {(() => {
        const campus = getWeeklyRoutines(currentWeek);
        const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening';
        const NPC_EMOJI: Record<string, string> = { jaemin: '🏠', minji: '📚', soyeon: '💛', hyunwoo: '🎸' };
        return (
          <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
            <p className="text-[9px] text-txt-secondary/30 mb-1">📍 지금 캠퍼스에서는</p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {campus.routines.map(r => {
                const slot = r[timeOfDay];
                return (
                  <span key={r.npcId} className="text-[9px] text-txt-secondary/40">
                    {NPC_EMOJI[r.npcId] ?? '👤'} <span className="text-txt-secondary/55">{r.npcName}</span> {slot.activity.slice(0, 15)}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* First-time tutorial overlay */}
      {showTutorial && (
        <div className="px-3 py-3 rounded-xl bg-teal/10 border border-teal/20 text-xs text-teal/80 leading-relaxed">
          <p className="font-bold mb-1.5">📋 스케줄 짜는 법</p>
          <ul className="space-y-1 text-[11px]">
            <li>1️⃣ 아래 활동 버튼을 탭하면 자동으로 빈 슬롯에 배정됩니다</li>
            <li>2️⃣ 👥친구/💕데이트는 함께할 NPC를 선택합니다</li>
            <li>3️⃣ ⚡에너지를 초과하면 체력이 떨어져요 — 휴식도 중요!</li>
            <li>4️⃣ 같은 활동 조합으로 콤보 보너스를 발견하세요</li>
          </ul>
          <button
            onClick={() => { setShowTutorial(false); localStorage.setItem('kusm-tutorial-done', '1'); }}
            className="mt-2 text-[10px] text-teal underline cursor-pointer"
          >
            알겠어요! 닫기
          </button>
        </div>
      )}

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
            <div className="flex gap-2">
              {slotHistory.length > 0 && (
                <button onClick={handleUndo} className="text-[10px] text-txt-secondary/50 hover:text-teal transition-colors cursor-pointer" title="실행 취소">↩</button>
              )}
              {totalScheduled < 21 && (
                <button onClick={fillRemainingWithRest} className="text-[10px] text-txt-secondary/50 hover:text-lavender transition-colors cursor-pointer" title="나머지 휴식">💤</button>
              )}
              <button onClick={() => setSlots({})} className="text-[10px] text-txt-secondary/50 hover:text-coral transition-colors cursor-pointer">초기화</button>
            </div>
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
          // Count how many times this activity is already scheduled
          const scheduledCount = Object.values(slots).filter(s => s?.activityId === activity.id).length;
          return (
            <button
              key={activity.id}
              onClick={() => !isLocked && handleActivityTap(activity.id)}
              disabled={isLocked}
              title={isLocked ? lockReason : activity.description}
              className={`flex flex-col items-center gap-1 px-1.5 py-2.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.95] ${isLocked ? 'opacity-40 cursor-not-allowed' : ''} ${isSelected ? '' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}
              style={isSelected ? { backgroundColor: `${colorHex}20`, border: `2px solid ${colorHex}` } : undefined}
            >
              <span className="relative" style={{ color: isLocked ? '#555' : colorHex }}>
                <iconify-icon icon={isLocked ? 'solar:lock-bold' : activity.icon} width="22" height="22" />
                {scheduledCount > 0 && !isLocked && (
                  <span className={`absolute -top-1 -right-2 text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center ${scheduledCount >= 4 ? 'bg-coral text-white' : 'bg-white/20 text-txt-secondary'}`}>
                    {scheduledCount}
                  </span>
                )}
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

      {/* Smart suggestion — what to focus on this week */}
      {totalScheduled === 0 && (() => {
        const tips: { emoji: string; text: string }[] = [];
        if (stats.stress > 65) tips.push({ emoji: '😰', text: '스트레스가 높아요. 휴식이나 운동을 넣어보세요.' });
        else if (stats.health < 35) tips.push({ emoji: '💔', text: '체력이 위험해요. 운동과 휴식을 우선하세요.' });
        else if (stats.money < 80000) tips.push({ emoji: '💸', text: '잔고가 부족해요. 알바를 좀 넣어야 할 것 같아요.' });
        else if (stats.knowledge < 30 && currentWeek >= 5) tips.push({ emoji: '📚', text: '시험 준비가 부족해요. 공부를 늘려보세요.' });
        else if (stats.social < 25 && currentWeek >= 3) tips.push({ emoji: '😔', text: '인맥이 적어요. 친구를 만나보는 건 어때요?' });
        else tips.push({ emoji: '💡', text: '균형 잡힌 스케줄을 짜보세요!' });

        if (currentWeek >= 6 && currentWeek <= 8) tips.push({ emoji: '📝', text: '중간고사 시즌! 준비도를 올릴 마지막 기회.' });
        if (currentWeek >= 13) tips.push({ emoji: '📚', text: '기말이 다가와요. 준비도에 집중하세요.' });

        return tips.length > 0 ? (
          <div className="mb-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
            {tips.slice(0, 1).map((t, i) => (
              <p key={i} className="text-[11px] text-txt-secondary/70">{t.emoji} {t.text}</p>
            ))}
          </div>
        ) : null;
      })()}

      {/* Hint + Quick Templates */}
      {totalScheduled === 0 && !selectedActivity && (
        <div>
          <p className="text-[11px] text-txt-secondary/50 mb-2">활동을 탭하거나 템플릿을 선택하세요</p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={handleSmartFill} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-lavender/10 text-lavender border border-lavender/20 hover:bg-lavender/20 transition-all cursor-pointer">
              ✨ AI 추천
            </button>
            <button onClick={() => applyTemplate('scholar')} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-all cursor-pointer">
              📚 학점러
            </button>
            <button onClick={() => applyTemplate('social')} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-pink/10 text-pink border border-pink/20 hover:bg-pink/20 transition-all cursor-pointer">
              🦋 인싸
            </button>
            <button onClick={() => applyTemplate('balanced')} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-teal/10 text-teal border border-teal/20 hover:bg-teal/20 transition-all cursor-pointer">
              ⚖️ 밸런스
            </button>
            <button onClick={() => applyTemplate('hustler')} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-coral/10 text-coral border border-coral/20 hover:bg-coral/20 transition-all cursor-pointer">
              💰 알바왕
            </button>
          </div>
        </div>
      )}

      {/* ─── 7x3 Compact Grid (fixed-height cells) ─── */}
      <div className="grid grid-cols-8 gap-px bg-white/5 rounded-xl overflow-hidden">
        {/* Header row — time labels */}
        <div className="bg-navy" />
        {DAY_KEYS.map((day) => {
          const isWeekend = day === 'saturday' || day === 'sunday';
          return (
            <div key={day} className={`py-1.5 text-center ${isWeekend ? 'bg-pink/5' : 'bg-navy'}`}>
              <span className={`text-[10px] font-bold ${isWeekend ? 'text-pink/60' : 'text-txt-secondary'}`}>
                {DAY_LABELS_SHORT[day]}
              </span>
              {isWeekend && <div className="text-[7px] text-pink/30">주말</div>}
            </div>
          );
        })}

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
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-xs transition-all duration-200 ${combo.active ? (combo.penalty ? 'bg-coral/15 text-coral border border-coral/30' : 'bg-teal/15 text-teal border border-teal/30') : combo.discovered ? 'bg-white/5 text-txt-secondary/40 border border-white/5' : 'bg-white/[0.02] text-txt-secondary/20 border border-white/[0.03]'}`}
          >
            <span>{combo.active ? (combo.penalty ? '!' : '✦') : combo.discovered ? '-' : '?'}</span>
            <span>{combo.discovered || combo.active ? combo.name : '???'}</span>
            {combo.active && <span className="font-medium">{combo.effect}</span>}
            {!combo.discovered && !combo.active && <span className="text-[8px]">미발견</span>}
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

      {/* ─── Predicted Stat Changes ─── */}
      {totalScheduled >= 3 && (() => {
        // Calculate total predicted stat changes from scheduled activities
        const predicted: Record<string, number> = {};
        for (const slotData of Object.values(slots)) {
          if (!slotData) continue;
          const act = ACTIVITIES[slotData.activityId];
          if (!act) continue;
          let effects = act.statEffects;
          if (slotData.targetNpcId && act.npcVariants) {
            const variant = act.npcVariants.find(v => v.npcId === slotData.targetNpcId);
            if (variant) effects = variant.statEffects;
          }
          for (const [k, v] of Object.entries(effects)) {
            if (v) predicted[k] = (predicted[k] ?? 0) + v;
          }
        }
        // Add weekly baseline drains
        predicted['money'] = (predicted['money'] ?? 0) - 30000;
        predicted['health'] = (predicted['health'] ?? 0) - 3;
        predicted['stress'] = (predicted['stress'] ?? 0) + 5;

        const entries = Object.entries(predicted).filter(([, v]) => v !== 0);
        if (entries.length === 0) return null;

        // Danger alerts — check if stats will cross dangerous thresholds
        const dangers: string[] = [];
        const projStress = stats.stress + (predicted['stress'] ?? 0);
        const projHealth = stats.health + (predicted['health'] ?? 0);
        const projMoney = stats.money + (predicted['money'] ?? 0);
        if (projStress >= 80 && stats.stress < 80) dangers.push('🚨 스트레스 위험 수준 돌파 예상!');
        if (projHealth <= 20 && stats.health > 20) dangers.push('💔 체력 위험! 쓰러질 수 있어요');
        if (projMoney <= 0) dangers.push('💸 돈이 바닥날 예정입니다');

        return (
          <div className="px-2 sm:px-4 mb-2">
            {dangers.length > 0 && (
              <div className="mb-2 flex flex-col gap-1">
                {dangers.map((d, i) => (
                  <p key={i} className="text-[10px] text-coral font-bold animate-pulse">{d}</p>
                ))}
              </div>
            )}
            <p className="text-[10px] text-txt-secondary/50 mb-1">📊 예상 스탯 변화 (생활비 포함)</p>
            <div className="flex flex-wrap gap-1.5">
              {entries.map(([k, v]) => {
                const isGood = k === 'stress' ? v < 0 : v > 0;
                return (
                  <span key={k} className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${isGood ? 'bg-teal/10 text-teal' : 'bg-coral/10 text-coral'}`}>
                    {STAT_LABELS[k] ?? k} {v > 0 ? '+' : ''}{k === 'money' ? `${(v / 1000).toFixed(0)}K` : v}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })()}

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
                  {npcPicker.activityId === 'date' ? '우정 40+ & 매력 40+ 필요 (사랑 감정은 별도)' : '아는 사이 이상만 만날 수 있어요'}
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
                  {npcOptions.map(({ variant, meetsRequirement, currentFriendship, currentTier, currentRomance, romanceTier }) => {
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
                            {/* Friendship bar + decay warning */}
                            <div className="flex items-center gap-1 ml-auto">
                              <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-sky-400/60 rounded-full" style={{ width: `${currentFriendship}%` }} />
                              </div>
                              <span className="text-[8px] text-txt-secondary/40">{currentFriendship}</span>
                              {(() => {
                                const rel = relationships[variant.npcId];
                                const weeksSince = rel?.lastInteraction ? currentWeek - rel.lastInteraction : 99;
                                if (weeksSince >= 3) return <span className="text-[8px] text-coral" title="오래 안 만남">📉</span>;
                                if (weeksSince >= 2) return <span className="text-[8px] text-gold" title="곧 감소">⚠️</span>;
                                return null;
                              })()}
                            </div>
                          </div>
                          {/* Romance bar + chemistry gate — only for date activity */}
                          {npcPicker?.activityId === 'date' && (
                            <div className="mt-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] text-pink/50">♥</span>
                                <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-pink/50 rounded-full" style={{ width: `${currentRomance}%` }} />
                                </div>
                                {romanceTier && <span className="text-[9px] text-pink/60 font-medium">{romanceTier}</span>}
                                {currentRomance === 0 && <span className="text-[9px] text-txt-secondary/30">사랑 없음</span>}
                                {(() => {
                                  const rel = relationships[variant.npcId];
                                  const weeksSinceDate = rel?.lastDateWeek ? currentWeek - rel.lastDateWeek : 99;
                                  if (currentRomance > 0 && weeksSinceDate >= 2) return <span className="text-[8px] text-amber-400/70" title="사랑 감소 중">💔</span>;
                                  return null;
                                })()}
                              </div>
                              {/* Chemistry gate hint */}
                              {(() => {
                                const s = stats;
                                const respect = relationships[variant.npcId]?.respect ?? 50;
                                const GATES: Record<string, { met: boolean; hint: string }> = {
                                  jaemin: { met: s.charm >= 30, hint: '매력 30+' },
                                  minji: { met: s.knowledge >= 50 && respect >= 60, hint: '준비도 50+ & 존경 60+' },
                                  soyeon: { met: s.stress < 40, hint: '스트레스 40 미만' },
                                  hyunwoo: { met: s.charm >= 50, hint: '매력 50+' },
                                };
                                const gate = GATES[variant.npcId];
                                if (!gate) return null;
                                return gate.met
                                  ? <span className="text-[8px] text-pink/40 mt-0.5 block">💕 로맨스 조건 충족</span>
                                  : <span className="text-[8px] text-txt-secondary/30 mt-0.5 block">🔒 {gate.hint} 필요</span>;
                              })()}
                            </div>
                          )}
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
                              우정 {TIER_THRESHOLDS[variant.requiredTier] ?? 0} 이상 필요 (현재 {currentFriendship})
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
