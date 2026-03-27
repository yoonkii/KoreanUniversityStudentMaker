'use client';

import { useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import GlassPanel from '@/components/ui/GlassPanel';
import type { PlayerStats } from '@/store/types';

interface CrisisEventProps {
  onDismiss: () => void;
}

interface Crisis {
  id: string;
  title: string;
  emoji: string;
  description: string;
  consequence: string;
  statEffects: Partial<PlayerStats>;
}

function detectCrisis(stats: PlayerStats, week: number): Crisis | null {
  // Health collapse — forced rest
  if (stats.health <= 10) {
    return {
      id: 'health_collapse',
      title: '쓰러졌다',
      emoji: '🏥',
      description: '체력이 바닥나서 수업 중에 쓰러졌다. 보건실에서 하루를 보냈다.',
      consequence: '이번 주는 강제로 쉬어야 한다. 체력이 회복되지만 학점에 영향이 있다.',
      statEffects: { health: 20, knowledge: -5, stress: -10 },
    };
  }

  // Mental breakdown — forced counseling
  if (stats.stress >= 95) {
    return {
      id: 'mental_breakdown',
      title: '번아웃',
      emoji: '💔',
      description: '스트레스가 극에 달했다. 아무것도 할 수 없는 상태가 되었다.',
      consequence: '학교 상담센터를 방문했다. 스트레스가 크게 줄지만 시간을 잃었다.',
      statEffects: { stress: -30, health: -5, knowledge: -3 },
    };
  }

  // Broke — can't afford food
  if (stats.money <= 0 && week > 2) {
    return {
      id: 'broke_crisis',
      title: '무일푼',
      emoji: '💸',
      description: '통장 잔고가 0원이다. 편의점 도시락도 못 사는 상황.',
      consequence: '급하게 단기 알바를 뛰었다. 돈은 벌었지만 체력과 시간을 잃었다.',
      statEffects: { money: 100000, health: -10, stress: 10, knowledge: -2 },
    };
  }

  // Academic probation warning
  if (stats.knowledge <= 15 && week >= 8) {
    return {
      id: 'academic_warning',
      title: '학사경고 위기',
      emoji: '⚠️',
      description: '학과 사무실에서 연락이 왔다. 이대로면 학사경고를 받게 된다.',
      consequence: '교수님과 상담을 했다. 충격은 크지만 정신이 번쩍 든다.',
      statEffects: { stress: 10, knowledge: 5, charm: -3 },
    };
  }

  // Social isolation
  if (stats.social <= 5 && week >= 6) {
    return {
      id: 'isolation',
      title: '완전한 고립',
      emoji: '🌑',
      description: '아무에게도 연락이 오지 않는다. 캠퍼스에서 투명인간이 된 기분이다.',
      consequence: '학과 멘토링 프로그램에 신청했다. 누군가와 대화를 나눌 기회가 생겼다.',
      statEffects: { social: 10, stress: 5, charm: 2 },
    };
  }

  return null;
}

export default function CrisisEvent({ onDismiss }: CrisisEventProps) {
  const stats = useGameStore((s) => s.stats);
  const currentWeek = useGameStore((s) => s.currentWeek);
  const updateStats = useGameStore((s) => s.updateStats);
  const addEventHistory = useGameStore((s) => s.addEventHistory);

  const crisis = detectCrisis(stats, currentWeek);

  const handleAcknowledge = useCallback(() => {
    if (!crisis) { onDismiss(); return; }
    updateStats(crisis.statEffects);
    addEventHistory({
      week: currentWeek,
      summary: `위기 — ${crisis.title}`,
      choiceMade: crisis.consequence.split('.')[0],
    });
    onDismiss();
  }, [crisis, updateStats, addEventHistory, currentWeek, onDismiss]);

  if (!crisis) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <GlassPanel variant="strong" className="w-full max-w-md p-6 text-center animate-modal-enter border border-coral/30">
        <span className="text-5xl block mb-3">{crisis.emoji}</span>
        <h2 className="text-xl font-bold text-coral mb-2">{crisis.title}</h2>
        <p className="text-sm text-txt-primary/80 mb-3">{crisis.description}</p>
        <p className="text-xs text-txt-secondary italic mb-5">{crisis.consequence}</p>

        <div className="flex flex-wrap justify-center gap-2 mb-5">
          {Object.entries(crisis.statEffects).map(([k, v]) => {
            if (!v) return null;
            const labels: Record<string, string> = { knowledge: '준비도', money: '돈', health: '체력', social: '인맥', stress: '스트레스', charm: '매력' };
            const isGood = k === 'stress' ? v < 0 : v > 0;
            return (
              <span key={k} className={`px-3 py-1 rounded-full text-xs font-bold ${isGood ? 'bg-teal/15 text-teal' : 'bg-coral/15 text-coral'}`}>
                {labels[k] ?? k} {v > 0 ? '+' : ''}{k === 'money' ? `${(v/1000).toFixed(0)}K` : v}
              </span>
            );
          })}
        </div>

        <button
          onClick={handleAcknowledge}
          className="w-full py-3 rounded-xl font-semibold text-base bg-white/10 text-txt-primary border border-white/20 hover:bg-white/20 transition-all cursor-pointer active:scale-[0.98]"
        >
          알겠다...
        </button>
      </GlassPanel>
    </div>
  );
}

export { detectCrisis };
