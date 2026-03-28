'use client';

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import type { PlayerStats } from '@/store/types';
import { getNarration } from '@/lib/activityNarrationCache';
import { getActivityFlavorText } from '@/lib/activityFlavor';
import { getActivityResult } from '@/lib/activityResults';
import { getNpcReaction } from '@/lib/npcReactions';
import { getCampusAmbience } from '@/lib/campusAmbience';
import { getInnerMonologue } from '@/lib/innerMonologue';
import { useGameStore } from '@/store/gameStore';
import { getActivityBackground } from '@/lib/activityBackgrounds';
import PMStatBars from './PMStatBars';
import CalendarDisplay from './CalendarDisplay';
import UpcomingPreview from './UpcomingPreview';
import DayTransitionCard from './DayTransitionCard';

// ─── Types (exported for page.tsx) ───

interface DayActivity {
  name: string;
  icon: string;
  timeSlot: string;
  activityId?: string;
  statEffects: Partial<PlayerStats>;
  targetNpcId?: string;
  targetNpcName?: string;
  skipped?: boolean;
  dateOutcome?: {
    type: 'gate_fail' | 'awkward' | 'success' | 'great_chemistry';
    reason?: string;
    romanceGain: number;
  };
  friendOutcome?: {
    type: 'great' | 'normal' | 'awkward';
    friendshipGain: number;
  };
}

export interface DayGroup {
  dayName: string;
  activities: DayActivity[];
}

interface ActionPhaseProps {
  days: DayGroup[];
  currentStats: PlayerStats;
  onComplete: () => void;
  speed?: 1 | 2;
}

// ─── NPC Portraits ───

const NPC_PORTRAITS: Record<string, string> = {
  jaemin: '/assets/characters/jaemin/happy.png',
  minji: '/assets/characters/minji/neutral.png',
  soyeon: '/assets/characters/soyeon/happy.png',
  hyunwoo: '/assets/characters/hyunwoo/cool.png',
};

// ─── Activity ID extraction ───

const ACTIVITY_NAME_TO_ID: Record<string, string> = {
  '수업 듣기': 'lecture', '도서관 공부': 'study', '아르바이트': 'parttime',
  '동아리 활동': 'club', '데이트': 'date', '운동하기': 'exercise',
  '휴식': 'rest', '친구 만나기': 'friends', '과외하기': 'tutoring',
  '네트워킹': 'networking', '자기관리': 'selfcare', '캠퍼스 탐험': 'explore',
  '봉사활동': 'volunteer',
};

// ─── Date/Friend outcome feedback ───

function getOutcomeFeedback(activity: DayActivity): { emoji: string; text: string; color: string } | null {
  if (activity.dateOutcome) {
    const o = activity.dateOutcome;
    const name = activity.targetNpcName ?? '상대';
    const FB: Record<string, { emoji: string; color: string; text: string }> = {
      gate_fail: { emoji: '😅', color: 'text-amber-400/80', text: o.reason ?? '아직 그런 사이는 아닌 것 같아...' },
      awkward: { emoji: '😣', color: 'text-coral/70', text: `${name}과(와)의 데이트... 어색한 침묵이 길었다.` },
      success: { emoji: '💕', color: 'text-pink/80', text: `${name}과(와) 좋은 시간을 보냈다. 마음이 가까워진 느낌.` },
      great_chemistry: { emoji: '💗', color: 'text-pink', text: `${name}과(와) 환상의 케미! 심장이 두근두근...` },
    };
    return FB[o.type] ?? null;
  }
  if (activity.friendOutcome && activity.friendOutcome.type !== 'normal') {
    const name = activity.targetNpcName ?? '친구';
    if (activity.friendOutcome.type === 'great') {
      return { emoji: '😄', color: 'text-sky-400/80', text: `${name}과(와) 환상의 케미! 진짜 재밌는 시간이었다.` };
    }
    return { emoji: '😐', color: 'text-white/40', text: `${name}과(와) 어색한 침묵... 오늘은 대화가 잘 안 통했다.` };
  }
  return null;
}

// ─── Main Component ───

export default function ActionPhase({ days, currentStats, onComplete }: ActionPhaseProps) {
  const [dayIndex, setDayIndex] = useState(0);
  const [activityIndex, setActivityIndex] = useState(0);
  const [phase, setPhase] = useState<'activity' | 'dayTransition' | 'complete'>('activity');
  const [showStats, setShowStats] = useState(false);
  const currentWeek = useGameStore((s) => s.currentWeek);

  // Flatten all activities for global indexing (needed for narration cache)
  const allActivities = useMemo(() => days.flatMap(d => d.activities), [days]);
  const globalActivityIndex = useMemo(() => {
    let idx = 0;
    for (let d = 0; d < dayIndex; d++) idx += days[d].activities.length;
    return idx + activityIndex;
  }, [days, dayIndex, activityIndex]);

  // Running stats: accumulate stat effects up to current activity
  const runningStats = useMemo(() => {
    const s = { ...currentStats };
    for (let i = 0; i <= globalActivityIndex && i < allActivities.length; i++) {
      if (!showStats && i === globalActivityIndex) break; // Don't apply current until stats revealed
      for (const [k, v] of Object.entries(allActivities[i].statEffects)) {
        if (v !== undefined) s[k as keyof PlayerStats] += v;
      }
    }
    // Clamp
    s.knowledge = Math.max(0, Math.min(100, s.knowledge));
    s.health = Math.max(0, Math.min(100, s.health));
    s.social = Math.max(0, Math.min(100, s.social));
    s.stress = Math.max(0, Math.min(100, s.stress));
    s.charm = Math.max(0, Math.min(100, s.charm));
    s.money = Math.max(0, s.money);
    return s;
  }, [currentStats, allActivities, globalActivityIndex, showStats]);

  // Previous stats (before current activity)
  const previousStats = useMemo(() => {
    const s = { ...currentStats };
    for (let i = 0; i < globalActivityIndex && i < allActivities.length; i++) {
      for (const [k, v] of Object.entries(allActivities[i].statEffects)) {
        if (v !== undefined) s[k as keyof PlayerStats] += v;
      }
    }
    s.knowledge = Math.max(0, Math.min(100, s.knowledge));
    s.health = Math.max(0, Math.min(100, s.health));
    s.social = Math.max(0, Math.min(100, s.social));
    s.stress = Math.max(0, Math.min(100, s.stress));
    s.charm = Math.max(0, Math.min(100, s.charm));
    s.money = Math.max(0, s.money);
    return s;
  }, [currentStats, allActivities, globalActivityIndex]);

  // Current activity and day
  const currentDay = days[dayIndex];
  const activity = currentDay?.activities[activityIndex];

  // Get narration text (Gemini or fallback)
  const narration = useMemo(() => {
    if (!activity) return '';
    const aiNarration = getNarration(currentWeek, globalActivityIndex);
    if (aiNarration) return aiNarration;
    const flavor = getActivityFlavorText(activity.name, currentWeek);
    if (flavor) return flavor;
    const result = getActivityResult(activity.name, currentWeek, activityIndex);
    if (result) return result;
    return getCampusAmbience(activity.name, currentWeek, activityIndex) ?? `${activity.name}을(를) 했다.`;
  }, [activity, currentWeek, globalActivityIndex]);

  // NPC reaction
  const npcReaction = useMemo(() => {
    if (!activity) return null;
    return getNpcReaction(activity.name, currentWeek, activityIndex);
  }, [activity, currentWeek, activityIndex]);

  // Inner monologue
  const thought = useMemo(() => {
    if (!activity) return null;
    const evHistory = useGameStore.getState().eventHistory;
    return getInnerMonologue(runningStats, currentWeek, activity.name, evHistory);
  }, [activity, currentWeek, runningStats]);

  // Outcome feedback
  const outcome = activity ? getOutcomeFeedback(activity) : null;

  // Background for current activity
  const activityId = activity ? (activity.activityId ?? ACTIVITY_NAME_TO_ID[activity.name] ?? 'rest') : 'rest';
  const bg = getActivityBackground(activityId, activity?.timeSlot);

  // Next activity preview
  const getNextInfo = useCallback(() => {
    if (!currentDay) return { nextActivity: null, nextDayName: null };
    if (activityIndex < currentDay.activities.length - 1) {
      const next = currentDay.activities[activityIndex + 1];
      return { nextActivity: { icon: next.icon, name: next.name, targetNpcName: next.targetNpcName }, nextDayName: null };
    }
    if (dayIndex < days.length - 1) {
      return { nextActivity: null, nextDayName: days[dayIndex + 1].dayName };
    }
    return { nextActivity: null, nextDayName: null };
  }, [currentDay, activityIndex, dayIndex, days]);

  // Advance to next activity
  const handleAdvance = useCallback(() => {
    if (!showStats) {
      // First tap: reveal stat changes
      setShowStats(true);
      return;
    }

    // Second tap: advance to next
    setShowStats(false);

    if (!currentDay) { onComplete(); return; }

    if (activityIndex < currentDay.activities.length - 1) {
      // Next activity in same day
      setActivityIndex(activityIndex + 1);
    } else if (dayIndex < days.length - 1) {
      // Next day — show transition
      setPhase('dayTransition');
    } else {
      // All done
      setPhase('complete');
      onComplete();
    }
  }, [showStats, currentDay, activityIndex, dayIndex, days, onComplete]);

  const handleDayTransitionDone = useCallback(() => {
    setDayIndex(dayIndex + 1);
    setActivityIndex(0);
    setPhase('activity');
  }, [dayIndex]);

  // Day transition overlay
  if (phase === 'dayTransition' && dayIndex < days.length - 1) {
    return <DayTransitionCard dayName={days[dayIndex + 1].dayName} onDone={handleDayTransitionDone} />;
  }

  if (!activity || phase === 'complete') return null;

  const { nextActivity, nextDayName } = getNextInfo();

  return (
    <div className="fixed inset-0 z-40 cursor-pointer" onClick={handleAdvance}>
      {/* Full-screen background */}
      <div className="absolute inset-0">
        <Image
          src={`/assets/backgrounds/${bg.location}/${bg.variant}.png`}
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
      </div>

      {/* NPC portrait (if targeted activity) */}
      {activity.targetNpcId && NPC_PORTRAITS[activity.targetNpcId] && !activity.skipped && (
        <div className="absolute bottom-32 sm:bottom-40 right-8 sm:right-16 z-10 animate-fade-in-up">
          <div className="w-28 h-28 sm:w-40 sm:h-40 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl">
            <Image
              src={NPC_PORTRAITS[activity.targetNpcId]}
              alt={activity.targetNpcName ?? ''}
              width={160}
              height={160}
              className="object-cover object-top w-full h-full"
            />
          </div>
          <p className="text-center text-xs text-white/60 mt-1.5 font-medium">{activity.targetNpcName}</p>
        </div>
      )}

      {/* Calendar display — top left */}
      <div className="absolute top-4 left-4 z-20">
        <CalendarDisplay
          week={currentWeek}
          dayName={currentDay.dayName}
          timeSlot={activity.timeSlot}
          dayIndex={dayIndex}
          totalDays={days.length}
        />
      </div>

      {/* Activity icon + name — top center */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/50 backdrop-blur-sm">
          <span className="text-2xl">{activity.icon}</span>
          <span className="text-sm font-bold text-white">{activity.skipped ? '😫 빠짐' : activity.name}</span>
          {activity.targetNpcName && <span className="text-xs text-pink/70">with {activity.targetNpcName}</span>}
        </div>
      </div>

      {/* Skip button — top right */}
      <button
        onClick={(e) => { e.stopPropagation(); onComplete(); }}
        className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-lg bg-black/40 text-white/40 text-xs hover:bg-black/60 transition-colors cursor-pointer"
      >
        건너뛰기 ▸▸
      </button>

      {/* Bottom area: stat bars + narration */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-6">
        <div className="flex gap-4 items-end max-w-4xl mx-auto">
          {/* PM-style stat bars — left side */}
          <div className="flex-shrink-0">
            <PMStatBars stats={runningStats} previousStats={previousStats} showDelta={showStats} />
          </div>

          {/* Narration + outcome — right side */}
          <div className="flex-1 min-w-0">
            {/* Outcome feedback (date/friend result) */}
            {showStats && outcome && (
              <div className={`mb-2 px-3 py-2 rounded-lg bg-black/40 backdrop-blur-sm animate-fade-in-up`}>
                <span>{outcome.emoji} </span>
                <span className={`text-sm ${outcome.color}`}>{outcome.text}</span>
                {activity.dateOutcome && activity.dateOutcome.romanceGain > 0 && (
                  <span className="text-[10px] text-pink/60 ml-2">♥ +{activity.dateOutcome.romanceGain}</span>
                )}
              </div>
            )}

            {/* NPC reaction */}
            {showStats && npcReaction && (
              <div className="mb-2 px-3 py-1.5 rounded-lg bg-black/30 animate-fade-in-up">
                <span className="text-[10px] text-white/30">💬 </span>
                {npcReaction.npcName && <span className="text-[11px] text-pink/50 font-medium">{npcReaction.npcName}: </span>}
                <span className="text-xs text-white/50 italic">{npcReaction.text}</span>
              </div>
            )}

            {/* Inner monologue */}
            {showStats && thought && !npcReaction && (
              <div className="mb-2 px-3 py-1.5 rounded-lg bg-black/20 animate-fade-in-up">
                <span className="text-[10px] text-white/30">💭 </span>
                <span className="text-xs text-white/40 italic">{thought}</span>
              </div>
            )}

            {/* Main narration text box */}
            <div className="px-4 py-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
              <p className="text-sm sm:text-base text-white/90 leading-relaxed">{narration}</p>
            </div>

            {/* Tap hint */}
            <p className="text-[9px] text-white/20 text-center mt-1.5">
              {showStats ? '탭하여 다음으로' : '탭하여 결과 확인'}
            </p>
          </div>
        </div>

        {/* Upcoming preview — bottom right */}
        <div className="absolute bottom-2 right-4">
          <UpcomingPreview nextActivity={nextActivity} nextDayName={nextDayName ?? undefined} />
        </div>

        {/* Day progress dots */}
        <div className="flex gap-1.5 justify-center mt-3">
          {days.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === dayIndex ? 'bg-teal scale-125' : i < dayIndex ? 'bg-teal/40' : 'bg-white/15'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
