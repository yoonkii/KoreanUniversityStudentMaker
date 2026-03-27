'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PlayerStats } from '@/store/types';

interface ActivityExecution {
  name: string;
  icon: string;
  statEffects: Partial<PlayerStats>;
  timeSlot: string;
}

interface ActionPhaseProps {
  activities: ActivityExecution[];
  currentStats: PlayerStats;
  onComplete: () => void;
  speed?: 1 | 2;
}

const STAT_LABELS: Record<keyof PlayerStats, string> = {
  gpa: '학점',
  money: '재정',
  health: '체력',
  social: '사회성',
  stress: '스트레스',
  charm: '매력',
};

const TIME_LABELS: Record<string, string> = {
  morning: '🌅 오전',
  afternoon: '☀️ 오후',
  evening: '🌙 저녁',
};

// NPC cameos — brief appearances during activities
const NPC_CAMEOS: Record<string, { npc: string; lines: string[] }> = {
  '수업': { npc: '김 교수', lines: ['집중하세요!', '이 부분 시험에 나옵니다.', '질문 있는 사람?'] },
  '도서관': { npc: '한민지', lines: ['...조용히 해.', '여기 자리 있어.', '같이 공부할래?'] },
  '아르바이트': { npc: '이사장님', lines: ['오늘도 고생이야~', '손님 많으니 힘내!', '용돈 좀 보태줄게.'] },
  '동아리': { npc: '정현우', lines: ['오, 왔어? 오늘 합주하자!', '신입 실력이 느는데?', '다음 공연 준비해야지.'] },
  '데이트': { npc: '', lines: ['두근두근...', '오늘 날씨 좋다!', '어디 갈까?'] },
  '운동': { npc: '', lines: ['땀이 시원하다!', '한 세트 더!', '체력이 올라가는 느낌.'] },
  '휴식': { npc: '이재민', lines: ['야 넷플 뭐 봐?', '피자 시킬까?', 'zzz...'] },
  '친구': { npc: '이재민', lines: ['밥 먹으러 가자!', '요즘 뭐 해?', '오늘 재밌었다!'] },
};

function getNPCCameo(activityName: string): { npc: string; line: string } | null {
  for (const [keyword, data] of Object.entries(NPC_CAMEOS)) {
    if (activityName.includes(keyword)) {
      const line = data.lines[Math.floor(Math.random() * data.lines.length)];
      return { npc: data.npc, line };
    }
  }
  return null;
}

// 17% random event chance per activity
const RANDOM_EVENTS = [
  { text: '교수님이 갑자기 퀴즈를 냈다!', effects: { gpa: 3, stress: 5 } },
  { text: '친구가 커피를 사줬다 ☕', effects: { social: 2, stress: -3 } },
  { text: '버스를 놓쳐서 뛰어갔다...', effects: { health: -3, stress: 2 } },
  { text: '도서관에서 예쁜/멋진 사람을 봤다', effects: { charm: 1, stress: -1 } },
  { text: '편의점 세일! 돈을 아꼈다 💰', effects: { money: 5000 } },
  { text: '갑자기 비가 와서 우산을 못 챙겼다 🌧️', effects: { health: -2, stress: 3 } },
  { text: '동아리 선배가 밥을 사줬다 🍚', effects: { social: 3, money: 8000, stress: -2 } },
  { text: '수업 중에 졸다가 들켰다... 😴', effects: { gpa: -2, stress: 5 } },
];

// Map activity names to background images
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

export default function ActionPhase({ activities, currentStats, onComplete, speed = 1 }: ActionPhaseProps) {
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 = not started
  const [animatingStats, setAnimatingStats] = useState<Partial<PlayerStats>>({});
  const [randomEvent, setRandomEvent] = useState<string | null>(null);
  const [gameSpeed, setGameSpeed] = useState(2); // default to 2x for snappy pacing
  const [isSkipping, setIsSkipping] = useState(false);
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  const baseDelay = gameSpeed === 2 ? 400 : 800; // faster: 400ms at ×2, 800ms at ×1

  const processActivity = useCallback((index: number) => {
    if (index >= activities.length) {
      onComplete();
      return;
    }

    setCurrentIndex(index);
    setRandomEvent(null);
    setAnimatingStats({});

    // Animate stat changes one by one
    const activity = activities[index];
    const statEntries = Object.entries(activity.statEffects).filter(([, v]) => v !== 0);
    let delay = baseDelay;

    statEntries.forEach(([key, value], i) => {
      setTimeout(() => {
        setAnimatingStats(prev => ({ ...prev, [key]: value }));
      }, delay * (i + 1));
    });

    // Random event check (17% chance)
    const totalStatDelay = delay * (statEntries.length + 1);
    setTimeout(() => {
      if (Math.random() < 0.17) {
        const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
        setRandomEvent(event.text);
        // Apply event effects
        setTimeout(() => {
          setAnimatingStats(prev => {
            const merged = { ...prev };
            for (const [k, v] of Object.entries(event.effects)) {
              merged[k as keyof PlayerStats] = ((merged[k as keyof PlayerStats] ?? 0) as number) + (v as number);
            }
            return merged;
          });
        }, baseDelay / 2);
      }
    }, totalStatDelay);

    // Move to next activity
    setTimeout(() => {
      processActivity(index + 1);
    }, totalStatDelay + baseDelay * 1.5);
  }, [activities, baseDelay, onComplete]);

  useEffect(() => {
    if (isSkipping) {
      onComplete();
      return;
    }
    // Start after a brief pause
    const timer = setTimeout(() => processActivity(0), 500);
    return () => clearTimeout(timer);
  }, [isSkipping]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentActivity = currentIndex >= 0 && currentIndex < activities.length
    ? activities[currentIndex]
    : null;

  const bgSrc = currentActivity ? getActivityBackground(currentActivity.name) : '/assets/backgrounds/campus/day.png';

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] bg-navy px-4 relative overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 opacity-30"
        style={{ backgroundImage: `url(${bgSrc})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/40" />
      {/* Speed controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-30 relative">
        <button
          onClick={() => setGameSpeed(gameSpeed === 1 ? 2 : 1)}
          className="px-3 py-1.5 text-sm glass rounded-lg text-txt-secondary hover:text-txt-primary transition-colors"
        >
          {gameSpeed === 1 ? '×1' : '×2'} ⏩
        </button>
        <button
          onClick={() => setIsSkipping(true)}
          className="px-3 py-1.5 text-sm glass rounded-lg text-txt-secondary hover:text-txt-primary transition-colors"
        >
          건너뛰기 ⏭️
        </button>
      </div>

      {/* Activity display */}
      {currentActivity && (
        <div className="text-center animate-fade-in relative z-10">
          {/* Time slot */}
          <div className="text-txt-secondary text-sm mb-2">
            {TIME_LABELS[currentActivity.timeSlot] ?? currentActivity.timeSlot}
          </div>

          {/* Activity icon + name */}
          <div className="text-6xl mb-4 animate-bounce-slow">
            {currentActivity.icon}
          </div>
          <h2 className="text-2xl font-bold text-txt-primary mb-2">
            {currentActivity.name}
          </h2>

          {/* NPC cameo */}
          {(() => {
            const cameo = getNPCCameo(currentActivity.name);
            if (!cameo) return <div className="mb-4" />;
            return (
              <p className="text-sm text-txt-secondary/60 italic mb-4">
                {cameo.npc ? `${cameo.npc}: ` : ''}&ldquo;{cameo.line}&rdquo;
              </p>
            );
          })()}

          {/* Stat changes ticking in */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {Object.entries(animatingStats).map(([key, value]) => (
              <div
                key={key}
                className={`px-3 py-1.5 rounded-full text-sm font-mono font-bold animate-pop-in ${
                  (value as number) > 0
                    ? 'bg-teal/20 text-teal'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {STAT_LABELS[key as keyof PlayerStats]} {(value as number) > 0 ? '+' : ''}{value}
              </div>
            ))}
          </div>

          {/* Random event */}
          {randomEvent && (
            <div className="mt-4 px-6 py-3 glass-strong rounded-xl text-txt-primary animate-shake max-w-md mx-auto">
              ⚡ {randomEvent}
            </div>
          )}

          {/* Progress dots */}
          <div className="flex gap-2 justify-center mt-8">
            {activities.map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'bg-teal scale-125'
                    : i < currentIndex
                      ? 'bg-teal/40'
                      : 'bg-txt-secondary/20'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Starting state */}
      {currentIndex === -1 && (
        <div className="text-center relative z-10">
          <div className="text-4xl mb-4 animate-pulse">📋</div>
          <p className="text-txt-secondary">일과 시작 중...</p>
        </div>
      )}

      <style jsx>{`
        @keyframes pop-in {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-pop-in { animation: pop-in 0.3s ease-out forwards; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
      `}</style>
    </div>
  );
}
