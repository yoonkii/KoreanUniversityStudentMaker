'use client';

import { useState } from 'react';

interface OnboardingStep {
  title: string;
  description: string;
  emoji: string;
  highlight?: string; // CSS selector hint for what to point at
}

const STEPS: OnboardingStep[] = [
  {
    title: '환영합니다! 🎓',
    description: '한국 대학생 메이커에 오신 걸 환영해요! 앞으로 16주 동안의 대학 생활을 계획하게 됩니다.',
    emoji: '👋',
  },
  {
    title: '6가지 능력치',
    description: '학점, 체력, 사회성, 재정, 매력, 스트레스 — 이 6가지의 균형이 학기 말 결과를 결정해요. 스트레스가 70을 넘으면 모든 성장이 반감됩니다!',
    emoji: '📊',
  },
  {
    title: '주간 스케줄',
    description: '매주 7일 × 3타임(오전/오후/저녁)에 활동을 배치하세요. 공부, 알바, 동아리, 운동, 데이트... 시간은 유한합니다.',
    emoji: '📋',
  },
  {
    title: 'AI 캐릭터들',
    description: '8명의 NPC가 각자의 성격과 기억을 가지고 있어요. 당신의 선택에 따라 관계가 깊어지거나 멀어질 수 있습니다.',
    emoji: '👥',
  },
  {
    title: '스토리텔러',
    description: '보이지 않는 AI 스토리 디렉터가 당신의 대학 생활에 드라마를 만들어요. 선택한 모드에 따라 극적이거나, 랜덤하거나, 느긋한 스토리가 펼쳐집니다.',
    emoji: '🎭',
  },
  {
    title: '준비 완료!',
    description: '첫 주 스케줄을 짜봐요. 모든 것을 완벽하게 할 순 없어요 — 그게 대학 생활이니까.',
    emoji: '🚀',
  },
];

interface OnboardingOverlayProps {
  onComplete: () => void;
}

export default function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  const handleNext = () => {
    if (step >= STEPS.length - 1) {
      onComplete();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4 animate-fade-in">
      <div className="w-full max-w-md glass-strong rounded-2xl p-6 text-center">
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step ? 'bg-teal w-6' : i < step ? 'bg-teal/40' : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        <div className="text-5xl mb-4">{current.emoji}</div>
        <h3 className="text-xl font-bold text-txt-primary mb-3">{current.title}</h3>
        <p className="text-txt-secondary leading-relaxed mb-8 text-sm">{current.description}</p>

        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 py-3 text-sm text-txt-secondary hover:text-txt-primary transition-colors"
          >
            건너뛰기
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-3 bg-teal text-white rounded-xl font-bold text-sm hover:bg-teal/90 transition-all active:scale-[0.97]"
          >
            {step >= STEPS.length - 1 ? '시작하기!' : '다음'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}
