'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import type { PlayerStats, CharacterRelationship } from '@/store/types';
import { generateEncounters, generateGossip, type CampusEncounter } from '@/lib/campusSimulation';
import { getNpcContextualLine } from '@/lib/weeklyDialogueCache';
import { useGameStore } from '@/store/gameStore';

interface DayActivity {
  name: string;
  icon: string;
  timeSlot: string;
  statEffects: Partial<PlayerStats>;
  targetNpcId?: string;
  targetNpcName?: string;
  skipped?: boolean;
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

const STAT_LABELS: Record<keyof PlayerStats, string> = {
  knowledge: '준비도',
  money: '재정',
  health: '체력',
  social: '인맥',
  stress: '스트레스',
  charm: '매력',
};

const TIME_LABELS: Record<string, string> = {
  morning: '🌅 오전',
  afternoon: '☀️ 오후',
  evening: '🌙 저녁',
};

const NPC_PORTRAITS: Record<string, string> = {
  jaemin: '/assets/characters/jaemin/happy.png',
  minji: '/assets/characters/minji/neutral.png',
  soyeon: '/assets/characters/soyeon/neutral.png',
  hyunwoo: '/assets/characters/hyunwoo/neutral.png',
};

// Contextual NPC encounter lines — triggered by activity + NPC presence
const NPC_ENCOUNTER_LINES: Record<string, Record<string, string[]>> = {
  '수업': {
    minji: ['민지가 옆자리에 앉았다. "오늘 교수님 말 잘 들어."', '민지: "여기 필기 빌려줄까?"'],
    jaemin: ['재민이가 뒤에서 졸고 있다... 😴', '재민: "야 이거 시험 나와?"'],
    soyeon: ['소연 선배가 강의실 앞에서 손을 흔들었다.'],
  },
  '도서관': {
    minji: ['민지가 맞은편에서 집중하고 있다. 왠지 경쟁심이 생긴다.', '민지: "...조용히 해."'],
    soyeon: ['소연 선배: "여기서 공부하고 있었어? 나도 같이 할까?"'],
    jaemin: ['재민이가 옆에서 유튜브를 보고 있다. 집중이 안 된다...'],
  },
  '아르바이트': {
    hyunwoo: ['현우 선배가 카페에 손님으로 왔다. "후배 알바 중이었어?"'],
    jaemin: ['재민이가 "야 나도 알바 좀 소개해줘" 라고 카톡을 보냈다.'],
  },
  '동아리': {
    hyunwoo: ['현우: "오늘 합주 좋았어! 실력 늘었다?"', '현우: "다음 공연 준비하자!"'],
    soyeon: ['소연 선배가 동아리 MT 계획을 얘기하고 있다.'],
  },
  '운동': {
    jaemin: ['재민: "같이 뛸래? 1대1 농구!"', '재민이랑 같이 러닝을 했다.'],
    hyunwoo: ['현우 선배가 체육관에서 운동 중이다. "같이 하자!"'],
  },
  '휴식': {
    jaemin: ['재민: "야 치킨 시킬까?" 🍗', '재민이가 넷플릭스 추천을 해줬다.'],
  },
};

// 17% random event chance per activity
const RANDOM_EVENTS = [
  { text: '교수님이 갑자기 퀴즈를 냈다!', effects: { knowledge: 3, stress: 5 } },
  { text: '친구가 커피를 사줬다 ☕', effects: { social: 2, stress: -3 } },
  { text: '버스를 놓쳐서 뛰어갔다...', effects: { health: -3, stress: 2 } },
  { text: '도서관에서 예쁜/멋진 사람을 봤다', effects: { charm: 1, stress: -1 } },
  { text: '편의점 세일! 돈을 아꼈다 💰', effects: { money: 5000 } },
  { text: '갑자기 비가 와서 우산을 못 챙겼다 🌧️', effects: { health: -2, stress: 3 } },
  { text: '동아리 선배가 밥을 사줬다 🍚', effects: { social: 3, money: 8000, stress: -2 } },
  { text: '수업 중에 졸다가 들켰다... 😴', effects: { knowledge: -2, stress: 5 } },
];

function getActivityBackground(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('수업') || n.includes('lecture')) return '/assets/backgrounds/classroom/daytime.png';
  if (n.includes('공부') || n.includes('study') || n.includes('도서관')) return '/assets/backgrounds/library/quiet.png';
  if (n.includes('알바') || n.includes('카페')) return '/assets/backgrounds/cafe/counter.png';
  if (n.includes('동아리') || n.includes('club')) return '/assets/backgrounds/club-room/normal.png';
  if (n.includes('데이트') || n.includes('date')) return '/assets/backgrounds/campus/sunset.png';
  if (n.includes('운동') || n.includes('exercise')) return '/assets/backgrounds/campus/day.png';
  if (n.includes('휴식') || n.includes('rest')) return '/assets/backgrounds/dorm/clean.png';
  if (n.includes('친구') || n.includes('friend')) return '/assets/backgrounds/cafe/seating.png';
  return '/assets/backgrounds/campus/day.png';
}

export default function ActionPhase({ days, currentStats, onComplete, speed = 1 }: ActionPhaseProps) {
  const [currentDayIndex, setCurrentDayIndex] = useState(-1);
  const [revealedActivities, setRevealedActivities] = useState(0);
  const [randomEvent, setRandomEvent] = useState<string | null>(null);
  const [npcEncounter, setNpcEncounter] = useState<string | null>(null);
  const [campusEncounter, setCampusEncounter] = useState<CampusEncounter | null>(null);
  const [gossip, setGossip] = useState<string | null>(null);
  const [runningStats, setRunningStats] = useState<PlayerStats>({ ...currentStats });
  const currentWeek = useGameStore((s) => s.currentWeek);
  const relationships = useGameStore((s) => s.relationships);
  const [gameSpeed, setGameSpeed] = useState(2);
  const [isSkipping, setIsSkipping] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Slower pacing: 2.5s per day at 2x, 4s at 1x — gives time to observe
  const dayDelay = gameSpeed === 2 ? 2500 : 4000;
  const actRevealDelay = gameSpeed === 2 ? 500 : 800;

  const processDay = useCallback((dayIdx: number) => {
    if (dayIdx >= days.length) {
      onComplete();
      return;
    }

    setCurrentDayIndex(dayIdx);
    setRevealedActivities(0);
    setRandomEvent(null);
    setNpcEncounter(null);
    setCampusEncounter(null);

    const day = days[dayIdx];
    const actCount = day.activities.length;

    // Reveal activities one by one with stat ticking
    for (let i = 0; i < actCount; i++) {
      setTimeout(() => {
        setRevealedActivities(i + 1);
        // Tick running stats as each activity reveals
        const act = day.activities[i];
        if (act && !act.skipped) {
          setRunningStats(prev => {
            const next = { ...prev };
            for (const [k, v] of Object.entries(act.statEffects)) {
              if (v !== undefined) {
                const key = k as keyof PlayerStats;
                next[key] = key === 'money'
                  ? Math.max(0, next[key] + v)
                  : Math.max(0, Math.min(100, next[key] + v));
              }
            }
            return next;
          });
        }
      }, (i + 1) * actRevealDelay);
    }

    // NPC encounter check — contextual based on activity type
    const encounterTime = actCount * actRevealDelay + 300;
    setTimeout(() => {
      // Pick a random activity from today for encounter context
      const mainAct = day.activities.find(a => !a.skipped);
      if (mainAct) {
        // Try Gemini-generated contextual line first (from weekly cache)
        if (mainAct.targetNpcId) {
          const aiLine = getNpcContextualLine(mainAct.targetNpcId, currentWeek, mainAct.name);
          if (aiLine) {
            setNpcEncounter(`💬 ${aiLine}`);
          }
        }

        // Fallback to hardcoded NPC encounter lines
        if (!mainAct.targetNpcId || !getNpcContextualLine(mainAct.targetNpcId ?? '', currentWeek, mainAct.name)) {
          for (const [keyword, npcLines] of Object.entries(NPC_ENCOUNTER_LINES)) {
            if (mainAct.name.includes(keyword)) {
              const npcIds = Object.keys(npcLines);
              const eligible = npcIds.filter(() => Math.random() < 0.3);
              if (eligible.length > 0) {
                const npcId = eligible[0];
                const lines = npcLines[npcId];
                setNpcEncounter(lines[Math.floor(Math.random() * lines.length)]);
              }
              break;
            }
          }
        }
      }
      // Campus background NPC encounters (living campus)
      if (mainAct) {
        const campusEnc = generateEncounters(mainAct.name, currentWeek + dayIdx, runningStats, relationships);
        if (campusEnc.length > 0) {
          setCampusEncounter(campusEnc[0]);
        }
      }

      // Also check for random event (lower chance since we have encounters)
      if (Math.random() < 0.08) {
        const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
        setRandomEvent(event.text);
      }

      // Show gossip on first day only
      if (dayIdx === 0) {
        const g = generateGossip(currentWeek, runningStats);
        if (g) setGossip(g.text);
      }
    }, encounterTime);

    // Move to next day
    timerRef.current = setTimeout(() => processDay(dayIdx + 1), dayDelay);
  }, [days, dayDelay, actRevealDelay, onComplete]);

  useEffect(() => {
    if (isSkipping) {
      if (timerRef.current) clearTimeout(timerRef.current);
      onComplete();
      return;
    }
    const timer = setTimeout(() => processDay(0), 400);
    return () => {
      clearTimeout(timer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isSkipping]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentDay = currentDayIndex >= 0 && currentDayIndex < days.length ? days[currentDayIndex] : null;
  const bgSrc = currentDay && currentDay.activities[0]
    ? getActivityBackground(currentDay.activities[0].name)
    : '/assets/backgrounds/campus/day.png';

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] bg-navy px-4 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 opacity-20"
        style={{ backgroundImage: `url(${bgSrc})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/40" />

      {/* Speed controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-30">
        <button
          onClick={() => setGameSpeed(gameSpeed === 1 ? 2 : 1)}
          className="px-3 py-1.5 text-sm glass rounded-lg text-txt-secondary hover:text-txt-primary transition-colors"
        >
          {gameSpeed === 1 ? '×1' : '×2'}
        </button>
        <button
          onClick={() => setIsSkipping(true)}
          className="px-3 py-1.5 text-sm glass rounded-lg text-txt-secondary hover:text-txt-primary transition-colors"
        >
          건너뛰기 ⏭️
        </button>
      </div>

      {/* Day display */}
      {currentDay && (
        <div className="w-full max-w-md relative z-10 animate-fade-in">
          {/* Day header */}
          <h2 className="text-xl font-bold text-txt-primary text-center mb-4">
            {currentDay.dayName}
          </h2>

          {/* 3 activity rows */}
          <div className="flex flex-col gap-2">
            {currentDay.activities.map((activity, i) => (
              <div
                key={i}
                className={`glass-strong rounded-xl px-4 py-3 flex items-center gap-3 transition-all duration-300 ${
                  i < revealedActivities ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                } ${activity.skipped ? 'opacity-50 line-through' : ''}`}
              >
                {/* Time slot */}
                <span className="text-xs text-txt-secondary w-14 flex-shrink-0">
                  {TIME_LABELS[activity.timeSlot] ?? activity.timeSlot}
                </span>

                {/* Activity icon + name */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-lg">{activity.icon}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-txt-primary truncate">
                      {activity.skipped ? '😫 빠짐' : activity.name}
                    </span>
                    {activity.targetNpcName && !activity.skipped && (
                      <span className="text-[10px] text-pink">with {activity.targetNpcName}</span>
                    )}
                  </div>
                </div>

                {/* NPC portrait (if targeted) */}
                {activity.targetNpcId && NPC_PORTRAITS[activity.targetNpcId] && !activity.skipped && (
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
                    <Image
                      src={NPC_PORTRAITS[activity.targetNpcId]}
                      alt={activity.targetNpcName ?? ''}
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Stat chips */}
                {!activity.skipped && i < revealedActivities && (
                  <div className="flex gap-1 flex-shrink-0">
                    {Object.entries(activity.statEffects)
                      .filter(([, v]) => v !== 0)
                      .slice(0, 3)
                      .map(([key, value]) => (
                        <span
                          key={key}
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                            (key === 'stress' ? (value as number) < 0 : (value as number) > 0)
                              ? 'bg-teal/20 text-teal'
                              : 'bg-coral/20 text-coral'
                          }`}
                        >
                          {STAT_LABELS[key as keyof PlayerStats]?.[0]}{(value as number) > 0 ? '+' : ''}{value}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* NPC encounter */}
          {npcEncounter && (
            <div className="mt-3 px-4 py-2.5 glass-strong rounded-xl text-sm text-pink/90 border border-pink/20 animate-fade-in">
              💬 {npcEncounter}
            </div>
          )}

          {/* Campus background NPC encounter */}
          {campusEncounter && !npcEncounter && (
            <div className="mt-2 px-4 py-2 glass rounded-xl text-xs text-txt-secondary/70 border border-white/5 animate-fade-in">
              <span className="text-txt-secondary/40 mr-1">[{campusEncounter.npcRole}]</span>
              {campusEncounter.dialogue}
            </div>
          )}

          {/* Gossip — campus atmosphere */}
          {gossip && currentDayIndex === 0 && (
            <div className="mt-2 px-3 py-1.5 rounded-lg text-[10px] text-txt-secondary/50 italic">
              📢 {gossip}
            </div>
          )}

          {/* Random event */}
          {randomEvent && (
            <div className="mt-2 px-4 py-2 glass-strong rounded-xl text-sm text-txt-primary text-center animate-shake">
              ⚡ {randomEvent}
            </div>
          )}

          {/* Mini stat bar — shows real-time stat changes */}
          <div className="mt-4 grid grid-cols-3 gap-2 px-2">
            {([
              { key: 'knowledge' as const, label: '준비도', emoji: '📚' },
              { key: 'health' as const, label: '체력', emoji: '💚' },
              { key: 'stress' as const, label: '스트레스', emoji: '🔥' },
              { key: 'social' as const, label: '인맥', emoji: '👥' },
              { key: 'money' as const, label: '돈', emoji: '💰' },
              { key: 'charm' as const, label: '매력', emoji: '✨' },
            ]).map(({ key, label, emoji }) => {
              const val = runningStats[key];
              const prev = currentStats[key];
              const delta = val - prev;
              return (
                <div key={key} className="flex items-center gap-1 text-[10px]">
                  <span>{emoji}</span>
                  <span className="text-txt-secondary">{label}</span>
                  <span className={`font-mono font-bold ml-auto transition-all duration-300 ${
                    key === 'money'
                      ? (delta >= 0 ? 'text-teal' : 'text-coral')
                      : key === 'stress'
                        ? (delta <= 0 ? 'text-teal' : 'text-coral')
                        : (delta >= 0 ? 'text-teal' : 'text-coral')
                  }`}>
                    {key === 'money' ? `${Math.round(val / 1000)}K` : val}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Starting state */}
      {currentDayIndex === -1 && (
        <div className="text-center relative z-10">
          <div className="text-4xl mb-4 animate-pulse">📋</div>
          <p className="text-txt-secondary">일과 시작 중...</p>
        </div>
      )}

      {/* Progress dots (7 days) */}
      <div className="absolute bottom-8 flex gap-2 justify-center z-10">
        {days.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              i === currentDayIndex
                ? 'bg-teal scale-125'
                : i < currentDayIndex
                  ? 'bg-teal/40'
                  : 'bg-txt-secondary/20'
            }`}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
      `}</style>
    </div>
  );
}
