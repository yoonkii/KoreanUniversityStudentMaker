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

// ─── Dynamic NPC expressions ───

const NPC_DEFAULT_EXPR: Record<string, string> = {
  jaemin: 'happy', minji: 'neutral', soyeon: 'happy', hyunwoo: 'cool',
};

function getNpcExpression(npcId: string, activity: DayActivity, showingStats: boolean): string {
  if (!showingStats) return NPC_DEFAULT_EXPR[npcId] ?? 'neutral';

  // Date outcome → expression
  if (activity.dateOutcome) {
    const exprMap: Record<string, Record<string, string>> = {
      jaemin:  { success: 'happy', great_chemistry: 'laughing', awkward: 'anxious', gate_fail: 'concerned' },
      minji:   { success: 'friendly', great_chemistry: 'friendly', awkward: 'frustrated', gate_fail: 'competitive' },
      soyeon:  { success: 'happy', great_chemistry: 'blushing', awkward: 'worried', gate_fail: 'sad' },
      hyunwoo: { success: 'cool', great_chemistry: 'surprised', awkward: 'neutral', gate_fail: 'neutral' },
    };
    return exprMap[npcId]?.[activity.dateOutcome.type] ?? 'neutral';
  }

  // Friend outcome → expression
  if (activity.friendOutcome) {
    if (activity.friendOutcome.type === 'great') {
      const happyExpr: Record<string, string> = { jaemin: 'laughing', minji: 'friendly', soyeon: 'teasing', hyunwoo: 'helpful' };
      return happyExpr[npcId] ?? 'happy';
    }
    if (activity.friendOutcome.type === 'awkward') {
      const awkExpr: Record<string, string> = { jaemin: 'anxious', minji: 'frustrated', soyeon: 'worried', hyunwoo: 'neutral' };
      return awkExpr[npcId] ?? 'neutral';
    }
  }

  // Default activity expressions
  const activityExpr: Record<string, Record<string, string>> = {
    jaemin:  { friends: 'supportive', club: 'happy', date: 'happy' },
    minji:   { friends: 'friendly', study: 'competitive', date: 'friendly' },
    soyeon:  { friends: 'teasing', date: 'blushing' },
    hyunwoo: { friends: 'helpful', club: 'cool', date: 'cool' },
  };
  return activityExpr[npcId]?.[activity.activityId ?? ''] ?? NPC_DEFAULT_EXPR[npcId] ?? 'neutral';
}

function getNpcPortraitPath(npcId: string, expression: string): string {
  return `/assets/characters/${npcId}/${expression}.png`;
}

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

// ─── Player Portrait ───

function getPlayerExpression(stats: PlayerStats, activityId: string, activity?: DayActivity, showingStats?: boolean): string {
  // After stats revealed: react to what happened
  if (showingStats && activity) {
    if (activity.dateOutcome?.type === 'great_chemistry') return 'romantic';
    if (activity.dateOutcome?.type === 'success') return 'happy';
    if (activity.dateOutcome?.type === 'awkward') return 'embarrassed';
    if (activity.dateOutcome?.type === 'gate_fail') return 'stressed';
    if (activity.friendOutcome?.type === 'great') return 'happy';
    if (activity.friendOutcome?.type === 'awkward') return 'embarrassed';
  }

  // During activity: expression based on what you're doing
  if (stats.stress >= 80) return 'stressed';
  if (activityId === 'date') return 'romantic';
  if (activityId === 'study' || activityId === 'lecture') return 'determined';
  if (stats.health < 30) return 'stressed';
  if (stats.social >= 60 || activityId === 'friends' || activityId === 'club') return 'happy';
  return 'neutral';
}

// ─── Mid-Activity Random Events (PM-style interruptions) ───

interface MidEvent {
  text: string;
  choices: { label: string; effects: Partial<PlayerStats> }[];
  condition: (activityId: string, week: number, stats: PlayerStats) => boolean;
  probability: number;
}

const MID_EVENTS: MidEvent[] = [
  {
    text: '수업 중에 교수님이 갑자기 질문을 던졌다! "이 문제의 답은?"',
    choices: [
      { label: '자신 있게 대답한다', effects: { knowledge: 3, charm: 2, stress: 2 } },
      { label: '모른 척 고개를 숙인다', effects: { stress: -2 } },
    ],
    condition: (a) => a === 'lecture',
    probability: 0.25,
  },
  {
    text: '도서관에서 집중하던 중, 옆자리 사람이 과자를 먹기 시작했다. 바삭바삭...',
    choices: [
      { label: '참고 집중한다', effects: { knowledge: 2, stress: 3 } },
      { label: '자리를 옮긴다', effects: { stress: -1, knowledge: 1 } },
    ],
    condition: (a) => a === 'study',
    probability: 0.2,
  },
  {
    text: '알바 중에 진상 손님이 왔다. "이거 왜 이렇게 느려요?!"',
    choices: [
      { label: '웃으며 대응한다', effects: { charm: 3, stress: 5, money: 5000 } },
      { label: '매뉴얼대로 대응한다', effects: { stress: 2 } },
    ],
    condition: (a) => a === 'parttime',
    probability: 0.3,
  },
  {
    text: '운동하다가 옆 사람이 "같이 할래요?" 하고 말을 걸었다.',
    choices: [
      { label: '좋아요!', effects: { social: 3, health: 2, charm: 1 } },
      { label: '아, 저 혼자 할게요', effects: { health: 1 } },
    ],
    condition: (a) => a === 'exercise',
    probability: 0.2,
  },
  {
    text: '동아리 연습 중에 선배가 "솔로 한 번 해볼래?" 하고 물었다.',
    choices: [
      { label: '도전한다!', effects: { charm: 5, stress: 5, social: 2 } },
      { label: '아직 준비가 안 됐어요...', effects: { stress: -2, social: 1 } },
    ],
    condition: (a) => a === 'club',
    probability: 0.25,
  },
  {
    text: '데이트 중에 갑자기 비가 내리기 시작했다!',
    choices: [
      { label: '우산 없이 뛰어간다 (로맨틱!)', effects: { charm: 4, health: -3, stress: -5 } },
      { label: '가까운 카페로 대피한다', effects: { money: -5000, stress: -3 } },
    ],
    condition: (a) => a === 'date',
    probability: 0.3,
  },
  {
    text: '쉬고 있는데 갑자기 과제 마감이 내일이라는 알림이 왔다!',
    choices: [
      { label: '당장 공부를 시작한다', effects: { knowledge: 4, stress: 8, health: -3 } },
      { label: '내일 아침에 하자...', effects: { stress: 3, knowledge: -1 } },
    ],
    condition: (a) => a === 'rest',
    probability: 0.2,
  },
  {
    text: '과외 학생이 갑자기 "선생님, 왜 이게 이해가 안 될까요?" 하고 울기 시작했다.',
    choices: [
      { label: '천천히 다시 설명해준다', effects: { knowledge: 2, charm: 3, stress: 3 } },
      { label: '잠깐 쉬고 다시 하자고 한다', effects: { stress: -2, social: 2 } },
    ],
    condition: (a) => a === 'tutoring',
    probability: 0.3,
  },
  {
    text: '네트워킹 모임에서 유명한 스타트업 대표가 옆자리에 앉았다!',
    choices: [
      { label: '용기내서 말을 건다', effects: { charm: 5, social: 4, stress: 3 } },
      { label: '명함만 슬쩍 놓는다', effects: { social: 2 } },
    ],
    condition: (a) => a === 'networking',
    probability: 0.25,
  },
  {
    text: '캠퍼스를 탐험하다가 숨겨진 옥상 정원을 발견했다!',
    choices: [
      { label: '여기서 한숨 돌린다', effects: { stress: -8, health: 3, charm: 2 } },
      { label: '사진 찍어서 SNS에 올린다', effects: { social: 4, charm: 3 } },
    ],
    condition: (a) => a === 'explore',
    probability: 0.35,
  },
  {
    text: '친구와 이야기하다가 서로의 고민을 나누게 되었다.',
    choices: [
      { label: '진심으로 들어준다', effects: { social: 4, stress: -3 } },
      { label: '밝은 쪽으로 화제를 돌린다', effects: { charm: 2, stress: -1 } },
    ],
    condition: (a) => a === 'friends',
    probability: 0.2,
  },
];

function rollMidEvent(activityId: string, week: number, stats: PlayerStats): MidEvent | null {
  const eligible = MID_EVENTS.filter(e => e.condition(activityId, week, stats));
  for (const ev of eligible) {
    if (Math.random() < ev.probability) return ev;
  }
  return null;
}

// ─── Main Component ───

export default function ActionPhase({ days, currentStats, onComplete }: ActionPhaseProps) {
  const [dayIndex, setDayIndex] = useState(0);
  const [activityIndex, setActivityIndex] = useState(0);
  const [phase, setPhase] = useState<'weekStart' | 'activity' | 'midEvent' | 'dayTransition' | 'complete'>('weekStart');
  const [showStats, setShowStats] = useState(false);
  const [currentMidEvent, setCurrentMidEvent] = useState<MidEvent | null>(null);
  const currentWeek = useGameStore((s) => s.currentWeek);
  const playerGender = useGameStore((s) => s.player?.gender ?? 'male');

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
  const bg = getActivityBackground(activityId, activity?.timeSlot, activity?.targetNpcId);

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
    if (phase === 'midEvent') return; // Don't advance during mid-event

    if (!showStats) {
      // First tap: reveal stat changes + check for mid-event
      setShowStats(true);
      // Roll for a random mid-event (PM-style interruption)
      if (activity && !activity.skipped) {
        const midEvt = rollMidEvent(activityId, currentWeek, runningStats);
        if (midEvt) {
          setTimeout(() => {
            setCurrentMidEvent(midEvt);
            setPhase('midEvent');
          }, 800); // Brief delay so player sees stat changes first
        }
      }
      return;
    }

    // Second tap: advance to next
    setShowStats(false);
    setCurrentMidEvent(null);

    if (!currentDay) { onComplete(); return; }

    if (activityIndex < currentDay.activities.length - 1) {
      setActivityIndex(activityIndex + 1);
    } else if (dayIndex < days.length - 1) {
      setPhase('dayTransition');
    } else {
      // All activities done — show week complete splash
      setPhase('complete');
    }
  }, [showStats, phase, currentDay, activityIndex, dayIndex, days, onComplete, activity, activityId, currentWeek, runningStats]);

  // Handle mid-event choice
  const handleMidEventChoice = useCallback((effects: Partial<PlayerStats>) => {
    // Apply effects to running stats by modifying the current activity's statEffects
    // (This is a simplification — in a full implementation we'd track bonus effects separately)
    useGameStore.getState().updateStats(effects);
    setCurrentMidEvent(null);
    setPhase('activity');
  }, []);

  const handleDayTransitionDone = useCallback(() => {
    setDayIndex(dayIndex + 1);
    setActivityIndex(0);
    setPhase('activity');
  }, [dayIndex]);

  // Week start splash — brief "이번 주 시작!" before first activity
  if (phase === 'weekStart') {
    const firstDay = days[0];
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-pointer"
        onClick={() => setPhase('activity')}
      >
        <div className="text-center animate-fade-in-up">
          <p className="text-white/30 text-sm tracking-widest mb-3">{currentWeek}주차</p>
          <h1 className="text-4xl font-black text-white mb-2">{firstDay?.dayName}부터 시작</h1>
          <div className="flex items-center justify-center gap-3 mt-4">
            {firstDay?.activities.slice(0, 3).map((act, i) => (
              <div key={i} className="flex flex-col items-center gap-1 animate-fade-in-up" style={{ animationDelay: `${0.3 + i * 0.15}s` }}>
                <span className="text-2xl">{act.icon}</span>
                <span className="text-[9px] text-white/40">{act.name}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-white/15 mt-6 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>탭하여 시작</p>
        </div>
      </div>
    );
  }

  // Day transition overlay
  if (phase === 'dayTransition' && dayIndex < days.length - 1) {
    const completedToday = currentDay?.activities.filter(a => !a.skipped).map(a => ({ icon: a.icon, name: a.name })) ?? [];
    const nextDayActs = days[dayIndex + 1]?.activities;
    const nextFirst = nextDayActs?.[0] ? { icon: nextDayActs[0].icon, name: nextDayActs[0].name } : null;
    return (
      <DayTransitionCard
        dayName={days[dayIndex + 1].dayName}
        onDone={handleDayTransitionDone}
        completedActivities={completedToday}
        nextDayFirstActivity={nextFirst}
      />
    );
  }

  // Week complete splash
  if (phase === 'complete') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-pointer"
        onClick={onComplete}
      >
        <div className="text-center animate-fade-in-up">
          <span className="text-5xl block mb-4">📋</span>
          <h2 className="text-2xl font-bold text-white mb-2">{currentWeek}주차 완료</h2>
          <p className="text-sm text-white/50">7일간의 일정이 모두 끝났습니다</p>
          <p className="text-[10px] text-white/20 mt-6">탭하여 계속</p>
        </div>
      </div>
    );
  }

  if (!activity) return null;

  const { nextActivity, nextDayName } = getNextInfo();

  return (
    <div className="fixed inset-0 z-40 cursor-pointer" onClick={handleAdvance}>
      {/* Full-screen background — key changes trigger crossfade */}
      <div className="absolute inset-0 animate-fade-in" key={`bg-${dayIndex}-${activityIndex}`}>
        <Image
          src={`/assets/backgrounds/${bg.location}/${bg.variant}.png`}
          alt=""
          fill
          className="object-cover transition-opacity duration-500"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        {/* Ambient location sound indicator — visual substitute for audio */}
        {(() => {
          const AMBIENT: Record<string, string> = {
            classroom: '📢 강의 소리가 울려 퍼진다...',
            library: '📖 페이지 넘기는 소리만 들린다...',
            cafe: '☕ 커피 머신 소리와 잔잔한 대화...',
            'club-room': '🎵 악기 소리가 새어 나온다...',
            campus: '🌿 바람 소리와 학생들의 웃음...',
            dorm: '🛏️ 조용한 방. 시계 소리만 째깍...',
          };
          const text = AMBIENT[bg.location];
          if (!text) return null;
          return (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-5">
              <p className="text-[9px] text-white/15 italic tracking-wider">{text}</p>
            </div>
          );
        })()}
      </div>

      {/* Player character — large semi-transparent display (PM-style full sprite) */}
      {!activity.skipped && (
        <div className="absolute bottom-28 sm:bottom-32 left-2 sm:left-8 z-10 opacity-70" key={`player-${dayIndex}-${activityIndex}`}>
          <Image
            src={`/assets/characters/player/${getPlayerExpression(runningStats, activityId, activity, showStats)}-${playerGender}.png`}
            alt="나"
            width={180}
            height={280}
            className="object-contain object-bottom drop-shadow-[0_0_20px_rgba(0,0,0,0.5)] animate-fade-in"
          />
        </div>
      )}

      {/* NPC character — large display with dynamic expression */}
      {activity.targetNpcId && !activity.skipped && (
        <div className="absolute bottom-28 sm:bottom-32 right-2 sm:right-8 z-10 opacity-80" key={`npc-${dayIndex}-${activityIndex}`}>
          <Image
            src={getNpcPortraitPath(activity.targetNpcId, getNpcExpression(activity.targetNpcId, activity, showStats))}
            alt={activity.targetNpcName ?? ''}
            width={160}
            height={250}
            className="object-contain object-bottom drop-shadow-[0_0_20px_rgba(0,0,0,0.5)] animate-fade-in transition-all duration-300"
          />
          <p className="text-center text-xs text-white/70 mt-1 font-medium drop-shadow-lg">{activity.targetNpcName}</p>
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
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20" key={`act-${dayIndex}-${activityIndex}`}>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/50 backdrop-blur-sm">
          <span className="text-2xl">{activity.icon}</span>
          <span className="text-sm font-bold text-white">{activity.skipped ? '😫 빠짐' : activity.name}</span>
          {activity.targetNpcName && <span className="text-xs text-pink/70">with {activity.targetNpcName}</span>}
        </div>
      </div>

      {/* Money counter — top right (PM3 style) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10">
          <span className="text-sm">💰</span>
          <span className="text-sm font-bold text-gold font-mono">
            ₩{runningStats.money >= 10000 ? `${Math.floor(runningStats.money / 10000)}만` : runningStats.money.toLocaleString()}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onComplete(); }}
          className="px-2 py-1 rounded text-white/20 text-[10px] hover:text-white/50 transition-colors cursor-pointer"
        >
          ▸▸
        </button>
      </div>

      {/* Background NPC presence — shows who else is at this location */}
      {!activity.skipped && (() => {
        // Determine which NPCs would be at this location
        const LOCATION_NPCS: Record<string, { id: string; name: string; emoji: string }[]> = {
          classroom: [
            { id: 'minji', name: '민지', emoji: '📚' },
            { id: 'prof-kim', name: '김교수', emoji: '👨‍🏫' },
          ],
          'club-room': [
            { id: 'hyunwoo', name: '현우', emoji: '🎸' },
          ],
          library: [
            { id: 'minji', name: '민지', emoji: '📖' },
          ],
          cafe: [
            { id: 'soyeon', name: '소연', emoji: '☕' },
          ],
          campus: [
            { id: 'jaemin', name: '재민', emoji: '🏃' },
          ],
        };
        const locationNpcs = LOCATION_NPCS[bg.location] ?? [];
        // Don't show the targeted NPC again (they're already displayed as portrait)
        const bgNpcs = locationNpcs.filter(n => n.id !== activity.targetNpcId);
        if (bgNpcs.length === 0) return null;
        // Only show 30% of the time per NPC to feel natural
        const visibleNpcs = bgNpcs.filter((_, i) => ((dayIndex * 7 + activityIndex * 3 + i) % 3) === 0);
        if (visibleNpcs.length === 0) return null;
        return (
          <div className="absolute top-16 right-4 z-15 flex flex-col gap-1">
            {visibleNpcs.map(npc => (
              <div key={npc.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/30 backdrop-blur-sm animate-fade-in">
                <span className="text-[10px]">{npc.emoji}</span>
                <span className="text-[9px] text-white/40">{npc.name} 근처에 있다</span>
              </div>
            ))}
          </div>
        );
      })()}

      {/* PM-style stat bars — bottom left, always visible */}
      <div className="absolute bottom-20 sm:bottom-24 left-4 sm:left-6 z-20">
        <PMStatBars stats={runningStats} previousStats={previousStats} showDelta={showStats} />
      </div>

      {/* Upcoming preview — bottom right above narration */}
      <div className="absolute bottom-20 sm:bottom-24 right-4 sm:right-6 z-20">
        <UpcomingPreview nextActivity={nextActivity} nextDayName={nextDayName ?? undefined} />
      </div>

      {/* Day schedule strip — shows all activities for today with current highlighted */}
      {currentDay && (
        <div className="absolute bottom-[72px] sm:bottom-[80px] left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm">
            {currentDay.activities.map((act, i) => {
              const isCurrent = i === activityIndex;
              const isDone = i < activityIndex;
              const TIME_ICONS: Record<string, string> = { morning: '🌅', afternoon: '☀️', evening: '🌙' };
              return (
                <div
                  key={i}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
                    isCurrent ? 'bg-white/15 scale-110 border border-white/20' :
                    isDone ? 'opacity-40' : 'opacity-60'
                  }`}
                >
                  <span className="text-[9px]">{TIME_ICONS[act.timeSlot] ?? '📋'}</span>
                  <span className="text-lg">{act.icon}</span>
                  {isCurrent && <span className="text-[8px] text-white/60 hidden sm:inline">{act.name}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom narration area — compact, VN-style */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {/* Outcome/reaction row — appears above narration when stats shown */}
        {showStats && (outcome || npcReaction || thought) && (
          <div className="px-4 sm:px-6 mb-1 animate-fade-in-up">
            {outcome && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm">
                <span>{outcome.emoji}</span>
                <span className={`text-xs ${outcome.color}`}>{outcome.text}</span>
                {activity.dateOutcome && activity.dateOutcome.romanceGain > 0 && (
                  <span className="text-[9px] text-pink/60">♥+{activity.dateOutcome.romanceGain}</span>
                )}
              </div>
            )}
            {!outcome && npcReaction && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40">
                <span className="text-[10px]">💬</span>
                {npcReaction.npcName && <span className="text-[10px] text-pink/50 font-medium">{npcReaction.npcName}:</span>}
                <span className="text-xs text-white/50 italic">{npcReaction.text}</span>
              </div>
            )}
            {!outcome && !npcReaction && thought && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30">
                <span className="text-[10px]">💭</span>
                <span className="text-xs text-white/40 italic">{thought}</span>
              </div>
            )}
          </div>
        )}

        {/* Main narration box — full width, compact */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-black/70 backdrop-blur-md border-t border-white/10">
          <p className="text-sm sm:text-base text-white/90 leading-relaxed max-w-3xl">{narration}</p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-1.5">
              {days.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === dayIndex ? 'bg-teal scale-125' : i < dayIndex ? 'bg-teal/40' : 'bg-white/15'
                  }`}
                />
              ))}
            </div>
            <p className="text-[9px] text-white/20">
              {showStats ? '탭 → 다음' : '탭 → 결과'}
            </p>
          </div>
        </div>
      </div>

      {/* Mid-activity event overlay (PM-style random interruption) */}
      {phase === 'midEvent' && currentMidEvent && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-md px-6 animate-fade-in-up">
            <div className="bg-black/80 backdrop-blur-md rounded-2xl border border-white/15 p-6">
              <p className="text-[10px] text-teal/60 tracking-wider mb-2">⚡ 이벤트 발생!</p>
              <p className="text-sm sm:text-base text-white/90 leading-relaxed mb-5">{currentMidEvent.text}</p>
              <div className="flex flex-col gap-2">
                {currentMidEvent.choices.map((choice, i) => (
                  <button
                    key={i}
                    onClick={() => handleMidEventChoice(choice.effects)}
                    className="w-full text-left px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <p className="text-sm text-white font-medium">{choice.label}</p>
                    <div className="flex gap-1.5 mt-1.5">
                      {Object.entries(choice.effects).filter(([,v]) => v !== 0).map(([k, v]) => {
                        const labels: Record<string, string> = { knowledge: '준비도', money: '돈', health: '체력', social: '인맥', stress: '스트레스', charm: '매력' };
                        const isGood = k === 'stress' ? (v ?? 0) < 0 : (v ?? 0) > 0;
                        return (
                          <span key={k} className={`text-[9px] px-1.5 py-0.5 rounded-full ${isGood ? 'bg-teal/15 text-teal' : 'bg-coral/15 text-coral'}`}>
                            {labels[k]}{(v ?? 0) > 0 ? '+' : ''}{k === 'money' ? `${((v ?? 0)/1000).toFixed(0)}K` : v}
                          </span>
                        );
                      })}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
