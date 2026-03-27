'use client';

import { useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { calculateExamGpa } from '@/lib/gameEngine';
import GlassPanel from '@/components/ui/GlassPanel';

interface ExamEventProps {
  type: 'midterm' | 'finals';
  onComplete: (statEffects: Record<string, number>) => void;
}

interface ExamStrategy {
  id: string;
  title: string;
  emoji: string;
  description: string;
  multiplier: number; // Multiplies knowledge → GPA conversion
  statEffects: Record<string, number>; // Side effects (stress, health)
  resultText: string;
}

const EXAM_STRATEGIES: ExamStrategy[] = [
  {
    id: 'cram',
    title: '벼락치기',
    emoji: '🔥',
    description: '밤새 공부한다. 효과는 높지만 체력이 크게 떨어진다.',
    multiplier: 1.15,
    statEffects: { health: -15, stress: 12 },
    resultText: '밤새 노트를 달달 외웠다. 시험장에서 떨리는 손으로 답안을 적었다.',
  },
  {
    id: 'steady',
    title: '꾸준한 준비',
    emoji: '📖',
    description: '계획적으로 공부한다. 안정적이지만 특별히 높지 않다.',
    multiplier: 1.0,
    statEffects: { stress: 5, health: -3 },
    resultText: '차근차근 준비한 만큼 편안한 마음으로 시험에 임했다.',
  },
  {
    id: 'group_study',
    title: '스터디 그룹',
    emoji: '👥',
    description: '친구들과 함께 공부한다. 효율은 좀 낮지만 인맥이 올라간다.',
    multiplier: 0.9,
    statEffects: { social: 6, stress: 3, charm: 2 },
    resultText: '서로 모르는 부분을 알려주며 공부했다. 혼자였으면 못 풀었을 문제도 있었다.',
  },
  {
    id: 'jokbo',
    title: '족보 활용',
    emoji: '📋',
    description: '선배에게 받은 족보로 시험을 준비한다. 편하지만 변형 문제에 약하다.',
    multiplier: 1.05,
    statEffects: { social: 2, stress: -2 },
    resultText: '족보 덕분에 출제 경향을 파악했다. 전부 맞지는 않았지만 도움이 됐다.',
  },
  {
    id: 'give_up',
    title: '포기하고 쉬기',
    emoji: '😴',
    description: '이번 시험은 포기한다. 스트레스는 줄지만 학점이 크게 떨어진다.',
    multiplier: 0.3,
    statEffects: { stress: -10, health: 5 },
    resultText: '시험을 포기하고 푹 쉬었다. 마음은 편하지만 성적표가 걱정된다...',
  },
];

export default function ExamEvent({ type, onComplete }: ExamEventProps) {
  const [phase, setPhase] = useState<'intro' | 'choosing' | 'result'>('intro');
  const [selectedStrategy, setSelectedStrategy] = useState<ExamStrategy | null>(null);
  const [examGpa, setExamGpa] = useState<number>(0);
  const stats = useGameStore((s) => s.stats);
  const relationships = useGameStore((s) => s.relationships);
  const updateStats = useGameStore((s) => s.updateStats);
  const setExamResults = useGameStore((s) => s.setExamResults);
  const addEventHistory = useGameStore((s) => s.addEventHistory);
  const currentWeek = useGameStore((s) => s.currentWeek);

  const examLabel = type === 'midterm' ? '중간고사' : '기말고사';
  const examEmoji = type === 'midterm' ? '📝' : '📚';

  // Minji soulmate bonus: +0.3 GPA
  const minjiBonusGpa = (relationships['minji']?.affection ?? 0) >= 90 ? 0.3 : 0;

  const handleChoose = useCallback((strategy: ExamStrategy) => {
    const gpa = calculateExamGpa(stats.knowledge, strategy.multiplier, minjiBonusGpa);
    setExamGpa(gpa);
    setSelectedStrategy(strategy);

    // Apply side effects (stress, health, social — NOT knowledge/gpa)
    updateStats(strategy.statEffects);

    // Store exam result
    if (type === 'midterm') {
      setExamResults({ midtermGpa: gpa });
    } else {
      const midtermGpa = useGameStore.getState().examResults.midtermGpa;
      const semesterGpa = midtermGpa
        ? Math.round(((midtermGpa * 0.4 + gpa * 0.6) + Number.EPSILON) * 100) / 100
        : gpa;
      setExamResults({ finalsGpa: gpa, semesterGpa });
    }

    addEventHistory({
      week: currentWeek,
      summary: `${examLabel} — ${strategy.title} (${gpa.toFixed(2)})`,
      choiceMade: strategy.title,
    });
    setPhase('result');
  }, [stats.knowledge, minjiBonusGpa, updateStats, setExamResults, addEventHistory, currentWeek, examLabel, type]);

  const knowledgePercent = Math.min(100, Math.max(0, stats.knowledge));

  function getGpaGrade(gpa: number): { label: string; color: string } {
    if (gpa >= 4.0) return { label: 'A+', color: 'text-teal' };
    if (gpa >= 3.5) return { label: 'A', color: 'text-teal' };
    if (gpa >= 3.0) return { label: 'B+', color: 'text-gold' };
    if (gpa >= 2.5) return { label: 'B', color: 'text-gold' };
    if (gpa >= 2.0) return { label: 'C+', color: 'text-coral' };
    if (gpa >= 1.5) return { label: 'C', color: 'text-coral' };
    return { label: 'F', color: 'text-red-500' };
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
      <div className="w-full max-w-lg px-4">
        {/* Intro */}
        {phase === 'intro' && (
          <GlassPanel variant="strong" className="p-6 text-center animate-modal-enter">
            <span className="text-5xl block mb-3">{examEmoji}</span>
            <h2 className="text-2xl font-bold text-txt-primary mb-2">{examLabel} 주간</h2>
            <p className="text-sm text-txt-secondary mb-4">시험이 시작됐다. 교실에 긴장감이 감돈다.</p>

            {/* Knowledge bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-txt-secondary mb-1">
                <span>📚 준비 상태</span>
                <span>{knowledgePercent}%</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    knowledgePercent >= 60 ? 'bg-teal' : knowledgePercent >= 35 ? 'bg-gold' : 'bg-coral'
                  }`}
                  style={{ width: `${knowledgePercent}%` }}
                />
              </div>
              <p className="text-xs text-txt-secondary/60 mt-1">
                {knowledgePercent >= 70 ? '충분히 준비됐다! 자신감이 넘친다.' :
                 knowledgePercent >= 45 ? '어느 정도 준비는 됐지만 불안하다...' :
                 knowledgePercent >= 25 ? '준비가 부족하다. 전략이 중요하다.' :
                 '거의 준비를 못 했다... 기적이 필요하다.'}
              </p>
            </div>

            {minjiBonusGpa > 0 && (
              <p className="text-xs text-pink mb-3">💕 민지의 노트 공유 — GPA +{minjiBonusGpa.toFixed(1)} 보너스</p>
            )}

            <button
              onClick={() => setPhase('choosing')}
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-coral/20 text-coral border border-coral/30 hover:bg-coral/30 transition-all cursor-pointer active:scale-[0.97]"
            >
              시험 전략 선택
            </button>
          </GlassPanel>
        )}

        {/* Strategy selection */}
        {phase === 'choosing' && (
          <div className="flex flex-col gap-3 animate-fade-in-up">
            <div className="text-center mb-1">
              <h3 className="text-lg font-bold text-txt-primary">시험 전략을 선택하세요</h3>
              <p className="text-xs text-txt-secondary">준비도 {knowledgePercent}% — 전략이 성적을 좌우합니다</p>
            </div>
            {EXAM_STRATEGIES.map((strategy) => {
              const estimatedGpa = calculateExamGpa(stats.knowledge, strategy.multiplier, minjiBonusGpa);
              const grade = getGpaGrade(estimatedGpa);
              return (
                <button
                  key={strategy.id}
                  onClick={() => handleChoose(strategy)}
                  className="glass-strong px-4 py-4 rounded-xl text-left hover:bg-white/10 transition-all cursor-pointer active:scale-[0.98] group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0 mt-0.5">{strategy.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-txt-primary group-hover:text-teal transition-colors">{strategy.title}</div>
                        <span className={`text-xs font-bold ${grade.color}`}>~{estimatedGpa.toFixed(1)} ({grade.label})</span>
                      </div>
                      <div className="text-xs text-txt-secondary mt-0.5">{strategy.description}</div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {Object.entries(strategy.statEffects).map(([k, v]) => {
                          const labels: Record<string, string> = { knowledge: '준비도', money: '돈', health: '체력', social: '인맥', stress: '스트레스', charm: '매력' };
                          const isGood = k === 'stress' ? v < 0 : v > 0;
                          return (
                            <span key={k} className={`text-[10px] px-1.5 py-0.5 rounded ${isGood ? 'bg-teal/10 text-teal' : 'bg-coral/10 text-coral'}`}>
                              {labels[k] ?? k} {v > 0 ? '+' : ''}{v}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Result */}
        {phase === 'result' && selectedStrategy && (
          <GlassPanel variant="strong" className="p-6 text-center animate-modal-enter">
            <span className="text-5xl block mb-3">{selectedStrategy.emoji}</span>
            <h2 className="text-xl font-bold text-txt-primary mb-1">{selectedStrategy.title}</h2>
            <p className="text-sm text-txt-secondary/80 italic mb-4">{selectedStrategy.resultText}</p>

            {/* GPA Result */}
            <div className="mb-4 p-4 glass rounded-xl">
              <p className="text-xs text-txt-secondary mb-1">{examLabel} 성적</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className={`text-4xl font-bold ${getGpaGrade(examGpa).color}`}>
                  {examGpa.toFixed(2)}
                </span>
                <span className="text-lg text-txt-secondary">/ 4.50</span>
              </div>
              <span className={`text-sm font-bold ${getGpaGrade(examGpa).color}`}>
                {getGpaGrade(examGpa).label}
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-5">
              {Object.entries(selectedStrategy.statEffects).map(([k, v]) => {
                const labels: Record<string, string> = { knowledge: '준비도', money: '돈', health: '체력', social: '인맥', stress: '스트레스', charm: '매력' };
                const isGood = k === 'stress' ? v < 0 : v > 0;
                return (
                  <span key={k} className={`px-3 py-1 rounded-full text-xs font-bold ${isGood ? 'bg-teal/15 text-teal' : 'bg-coral/15 text-coral'}`}>
                    {labels[k] ?? k} {v > 0 ? '+' : ''}{v}
                  </span>
                );
              })}
            </div>

            <button
              onClick={() => onComplete(selectedStrategy.statEffects)}
              className="w-full py-3 rounded-xl font-semibold text-base bg-teal/20 text-teal border border-teal/30 hover:bg-teal/30 transition-all cursor-pointer active:scale-[0.98]"
            >
              시험 끝!
            </button>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
