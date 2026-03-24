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

export default function ActionPhase({ activities, currentStats, onComplete, speed = 1 }: ActionPhaseProps) {
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 = not started
  const [animatingStats, setAnimatingStats] = useState<Partial<PlayerStats>>({});
  const [randomEvent, setRandomEvent] = useState<string | null>(null);
  const [gameSpeed, setGameSpeed] = useState(speed);
  const [isSkipping, setIsSkipping] = useState(false);
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  const baseDelay = gameSpeed === 2 ? 600 : 1200;

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

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] bg-navy px-4 relative">
      {/* Speed controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-30">
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
        <div className="text-center animate-fade-in">
          {/* Time slot */}
          <div className="text-txt-secondary text-sm mb-2">
            {TIME_LABELS[currentActivity.timeSlot] ?? currentActivity.timeSlot}
          </div>

          {/* Activity icon + name */}
          <div className="text-6xl mb-4 animate-bounce-slow">
            {currentActivity.icon}
          </div>
          <h2 className="text-2xl font-bold text-txt-primary mb-6">
            {currentActivity.name}
          </h2>

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
        <div className="text-center">
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
