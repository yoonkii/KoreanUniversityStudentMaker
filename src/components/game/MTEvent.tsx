'use client';

import { useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import GlassPanel from '@/components/ui/GlassPanel';
import Image from 'next/image';

interface MTEventProps {
  onComplete: (statEffects: Record<string, number>) => void;
}

interface MTChoice {
  id: string;
  title: string;
  emoji: string;
  description: string;
  statEffects: Record<string, number>;
  npcEncounter: string;
  npcLine: string;
  memory: string;
  isRomantic?: boolean;
}

const MT_CHOICES: MTChoice[] = [
  {
    id: 'go_all_in',
    title: '올인! 밤새 놀기',
    emoji: '🔥',
    description: '선배들과 술게임, 캠프파이어, 밤새 수다. 대학생의 로망!',
    statEffects: { social: 12, charm: 5, stress: -15, health: -8, money: -30000 },
    npcEncounter: 'hyunwoo',
    npcLine: '이게 진짜 대학 생활이지! 오늘은 내가 쏜다!',
    memory: 'MT에서 밤새 캠프파이어 옆에서 이야기를 나눴다.',
  },
  {
    id: 'moderate',
    title: '적당히 즐기기',
    emoji: '😊',
    description: '낮에는 레크리에이션, 밤에는 적당히. 건강하게 즐긴다.',
    statEffects: { social: 8, charm: 3, stress: -8, money: -30000 },
    npcEncounter: 'soyeon',
    npcLine: '이 정도가 딱 좋아. 내일도 있으니까 적당히 하자~',
    memory: 'MT에서 선후배들과 즐거운 시간을 보냈다.',
  },
  {
    id: 'bonding',
    title: '진심 대화하기',
    emoji: '💬',
    description: '새벽 감성으로 깊은 대화. 진짜 친구를 만드는 시간.',
    statEffects: { social: 6, charm: 6, stress: -10, money: -30000 },
    npcEncounter: 'jaemin',
    npcLine: '야, 솔직히 말하는 건데... 너랑 같은 과여서 다행이야.',
    memory: '새벽 캠프파이어 앞에서 재민이와 진심을 나눴다.',
  },
  {
    id: 'stargazing',
    title: '별 보며 둘이서',
    emoji: '🌟',
    description: '캠프파이어가 꺼진 새벽, 혼자 별을 보고 있는데 누군가 옆에 앉는다.',
    statEffects: { charm: 8, stress: -12, social: 4, money: -30000 },
    npcEncounter: '', // determined dynamically
    npcLine: '',
    memory: 'MT 새벽, 별 아래에서 특별한 시간을 보냈다.',
    isRomantic: true,
  },
  {
    id: 'skip',
    title: 'MT 불참',
    emoji: '📚',
    description: '₩30,000 아끼고 주말에 공부한다. 외로울 수 있다.',
    statEffects: { knowledge: 5, money: 0, stress: 3, social: -8 },
    npcEncounter: 'minji',
    npcLine: '너도 안 갔구나? ...같이 도서관이라도 갈래?',
    memory: 'MT 대신 도서관에서 민지와 공부했다.',
  },
];

export default function MTEvent({ onComplete }: MTEventProps) {
  const [phase, setPhase] = useState<'intro' | 'choosing' | 'result'>('intro');
  const [selectedChoice, setSelectedChoice] = useState<MTChoice | null>(null);
  const updateStats = useGameStore((s) => s.updateStats);
  const updateRelationship = useGameStore((s) => s.updateRelationship);
  const addEventHistory = useGameStore((s) => s.addEventHistory);

  const relationships = useGameStore((s) => s.relationships);

  // For the romantic stargazing choice, find the NPC with highest friendship
  const NPC_KO: Record<string, string> = { jaemin: '재민', minji: '민지', soyeon: '소연 선배', hyunwoo: '현우 선배' };
  const NPC_ROMANTIC_LINES: Record<string, string> = {
    jaemin: '"야... 별 진짜 많다. 근데 지금은 옆에 있는 네가 더 빛나." 재민이가 조용히 웃었다.',
    minji: '"...별 보러 왔는데 왜 자꾸 네 얼굴을 보게 되지." 민지가 고개를 돌렸지만 귀가 빨갛다.',
    soyeon: '"이런 밤에는 솔직해져도 되는 거 아닐까?" 소연 선배가 어깨에 기댔다.',
    hyunwoo: '"이 별 아래서 노래 하나 불러줄까?" 현우 선배가 작게 흥얼거리기 시작했다.',
  };
  const bestNpcForRomance = Object.entries(relationships)
    .filter(([id]) => NPC_KO[id])
    .sort(([, a], [, b]) => (b.friendship ?? b.affection ?? 0) - (a.friendship ?? a.affection ?? 0))[0];
  const romanticNpcId = bestNpcForRomance?.[0] ?? 'jaemin';
  const romanticNpcFriendship = bestNpcForRomance ? (bestNpcForRomance[1].friendship ?? bestNpcForRomance[1].affection ?? 0) : 0;
  const romanticAvailable = romanticNpcFriendship >= 20;

  const handleChoose = useCallback((choice: MTChoice) => {
    const actualChoice = { ...choice };
    if (choice.isRomantic) {
      actualChoice.npcEncounter = romanticNpcId;
      actualChoice.npcLine = NPC_ROMANTIC_LINES[romanticNpcId] ?? '별이 참 예쁘다...';
      actualChoice.memory = `MT 새벽, ${NPC_KO[romanticNpcId]}과(와) 별을 보며 특별한 시간을 보냈다.`;
    }
    setSelectedChoice(actualChoice);
    updateStats(actualChoice.statEffects);
    if (choice.isRomantic) {
      updateRelationship(actualChoice.npcEncounter, 3, 'friendship');
      updateRelationship(actualChoice.npcEncounter, 3, 'romance');
    } else {
      updateRelationship(actualChoice.npcEncounter, choice.id === 'skip' ? 3 : 8);
    }
    addEventHistory({
      week: 4,
      summary: `MT — ${actualChoice.title}${choice.isRomantic ? ` (${NPC_KO[romanticNpcId]})` : ''}`,
      npcInvolved: actualChoice.npcEncounter,
      choiceMade: choice.title,
    });
    setPhase('result');
  }, [updateStats, updateRelationship, addEventHistory]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
      <div className="fixed inset-0 z-0">
        <Image src="/assets/backgrounds/campus/sunset.png" alt="" fill className="object-cover opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/50" />
      </div>

      <div className="relative z-10 w-full max-w-lg px-4">
        {phase === 'intro' && (
          <GlassPanel variant="strong" className="p-6 text-center animate-modal-enter">
            <span className="text-5xl block mb-3">🏕️</span>
            <h2 className="text-2xl font-bold text-txt-primary mb-2">MT 시즌!</h2>
            <p className="text-sm text-txt-secondary mb-1">과 MT가 다가왔다. 1박 2일 단체 여행.</p>
            <p className="text-sm text-txt-secondary mb-1">참가비 ₩30,000. 선후배들과 친해질 절호의 기회.</p>
            <p className="text-xs text-txt-secondary/60 mb-6">이번 주는 MT로 대체됩니다.</p>
            <button
              onClick={() => setPhase('choosing')}
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-lavender/20 text-lavender border border-lavender/30 hover:bg-lavender/30 transition-all cursor-pointer active:scale-[0.97]"
            >
              MT 시작!
            </button>
          </GlassPanel>
        )}

        {phase === 'choosing' && (
          <div className="flex flex-col gap-3 animate-fade-in-up">
            <h3 className="text-lg font-bold text-txt-primary text-center mb-1">MT에서 어떻게 할까?</h3>
            {MT_CHOICES.map((choice) => {
              const isRomanticLocked = choice.isRomantic && !romanticAvailable;
              return (
              <button
                key={choice.id}
                onClick={() => !isRomanticLocked && handleChoose(choice)}
                disabled={isRomanticLocked}
                className={`glass-strong px-4 py-4 rounded-xl text-left transition-all group ${isRomanticLocked ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/10 cursor-pointer active:scale-[0.98]'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0 mt-0.5">{choice.emoji}</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-txt-primary group-hover:text-teal transition-colors">
                      {choice.isRomantic ? `${choice.title} (${NPC_KO[romanticNpcId]})` : choice.title}
                    </div>
                    <div className="text-xs text-txt-secondary mt-0.5">
                      {isRomanticLocked ? `🔒 누군가와 더 친해져야 합니다 (우정 20+)` : choice.description}
                    </div>
                    {choice.isRomantic && !isRomanticLocked && (
                      <span className="text-[9px] text-pink/50 mt-0.5 block">💕 로맨스 +3</span>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {Object.entries(choice.statEffects).filter(([,v]) => v !== 0).map(([k, v]) => {
                        const labels: Record<string, string> = { knowledge: '준비도', money: '돈', health: '체력', social: '인맥', stress: '스트레스', charm: '매력' };
                        const isGood = k === 'stress' ? v < 0 : v > 0;
                        return (
                          <span key={k} className={`text-[10px] px-1.5 py-0.5 rounded ${isGood ? 'bg-teal/10 text-teal' : 'bg-coral/10 text-coral'}`}>
                            {labels[k] ?? k} {v > 0 ? '+' : ''}{k === 'money' ? `${(v/1000).toFixed(0)}K` : v}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </button>
            );})}
          </div>
        )}

        {phase === 'result' && selectedChoice && (
          <GlassPanel variant="strong" className="p-6 text-center animate-modal-enter">
            <span className="text-5xl block mb-3">{selectedChoice.emoji}</span>
            <h2 className="text-xl font-bold text-txt-primary mb-3">{selectedChoice.title}</h2>

            <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-white/5 rounded-xl text-left">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-white/10">
                <Image
                  src={`/assets/characters/${selectedChoice.npcEncounter}/neutral.png`}
                  alt="" width={40} height={40}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <p className="text-sm text-txt-primary/80 italic">&ldquo;{selectedChoice.npcLine}&rdquo;</p>
            </div>

            <p className="text-xs text-txt-secondary/60 italic mb-4">{selectedChoice.memory}</p>

            <div className="flex flex-wrap justify-center gap-2 mb-5">
              {Object.entries(selectedChoice.statEffects).filter(([,v]) => v !== 0).map(([k, v]) => {
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
              onClick={() => onComplete(selectedChoice.statEffects)}
              className="w-full py-3 rounded-xl font-semibold text-base bg-teal/20 text-teal border border-teal/30 hover:bg-teal/30 transition-all cursor-pointer active:scale-[0.98]"
            >
              MT 끝! 다음 주로
            </button>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
