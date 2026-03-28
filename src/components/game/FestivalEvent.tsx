'use client';

import { useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import GlassPanel from '@/components/ui/GlassPanel';
import Image from 'next/image';

interface FestivalEventProps {
  onComplete: (statEffects: Record<string, number>) => void;
}

interface FestivalChoice {
  id: string;
  title: string;
  emoji: string;
  description: string;
  statEffects: Record<string, number>;
  npcEncounter: string;
  npcLine: string;
  isRomantic?: boolean;
}

const FESTIVAL_CHOICES: FestivalChoice[] = [
  {
    id: 'performance',
    title: '공연 관람',
    emoji: '🎸',
    description: '동아리 공연과 초청 가수의 무대를 관람한다',
    statEffects: { stress: -12, social: 5, charm: 3 },
    npcEncounter: 'hyunwoo',
    npcLine: '우리 동아리 공연 보러 와줘! 제일 앞줄에서 봐야 해!',
  },
  {
    id: 'booths',
    title: '부스 체험',
    emoji: '🎪',
    description: '각종 동아리 부스와 먹거리 천국을 즐긴다',
    statEffects: { social: 8, charm: 4, money: -20000, stress: -8 },
    npcEncounter: 'jaemin',
    npcLine: '야, 저기 떡볶이 부스 줄이 엄청나! 같이 가자!',
  },
  {
    id: 'night_festival',
    title: '야간 축제',
    emoji: '🎆',
    description: '불꽃놀이와 야간 행사를 즐기며 추억을 만든다',
    statEffects: { social: 6, charm: 5, stress: -15, money: -10000 },
    npcEncounter: 'minji',
    npcLine: '...불꽃놀이 보러 왔어? 나도 혼자 온 건 아닌데...',
  },
  {
    id: 'volunteer',
    title: '축제 스태프',
    emoji: '📋',
    description: '축제 운영 자원봉사로 스펙도 쌓고 인맥도 넓힌다',
    statEffects: { social: 10, charm: 6, stress: 5, knowledge: 2 },
    npcEncounter: 'soyeon',
    npcLine: '봉사 와줘서 고마워! 이런 경험이 나중에 큰 도움 돼.',
  },
  {
    id: 'fireworks_date',
    title: '불꽃놀이 데이트',
    emoji: '🎆💕',
    description: '특별한 사람과 함께 불꽃놀이를 본다. 캠퍼스 뒷산이 명당이라던데...',
    statEffects: { charm: 8, stress: -15, social: 3, money: -15000 },
    npcEncounter: '', // dynamic
    npcLine: '',
    isRomantic: true,
  },
  {
    id: 'study',
    title: '축제 무시하고 공부',
    emoji: '📚',
    description: '시끄러운 캠퍼스를 피해 도서관에서 공부한다',
    statEffects: { knowledge: 8, stress: 3, social: -5 },
    npcEncounter: 'prof-kim',
    npcLine: '축제 중에 도서관에 있다니... 대단한 의지군요.',
  },
];

export default function FestivalEvent({ onComplete }: FestivalEventProps) {
  const [phase, setPhase] = useState<'intro' | 'choosing' | 'result'>('intro');
  const [selectedChoice, setSelectedChoice] = useState<FestivalChoice | null>(null);
  const updateStats = useGameStore((s) => s.updateStats);
  const updateRelationship = useGameStore((s) => s.updateRelationship);
  const addEventHistory = useGameStore((s) => s.addEventHistory);
  const relationships = useGameStore((s) => s.relationships);

  // Find romance partner for fireworks date
  const NPC_KO: Record<string, string> = { jaemin: '재민', minji: '민지', soyeon: '소연 선배', hyunwoo: '현우 선배' };
  const NPC_FIREWORK_LINES: Record<string, string> = {
    jaemin: '"야... 불꽃놀이 진짜 예쁘다. 근데 옆에 있는 네가 더..." 재민이가 말끝을 흐렸다.',
    minji: '"...예쁘다." 민지가 하늘을 보며 말했다. 근데 불꽃놀이를 본 건 아닌 것 같았다.',
    soyeon: '"이런 밤이면 솔직해져도 되지?" 소연 선배가 손을 잡았다. 불꽃이 두 사람을 비췄다.',
    hyunwoo: '"이 순간을 노래로 만들고 싶어. 제목은... 너." 현우가 하늘을 가리키며 웃었다.',
  };
  const romPartner = Object.entries(relationships)
    .filter(([id, r]) => (r.romance ?? 0) >= 15 && NPC_KO[id])
    .sort(([, a], [, b]) => (b.romance ?? 0) - (a.romance ?? 0))[0];
  const romanticNpcId = romPartner?.[0] ?? '';
  const romanticAvailable = !!romPartner;

  const handleChoose = useCallback((choice: FestivalChoice) => {
    const actualChoice = { ...choice };
    if (choice.isRomantic && romanticNpcId) {
      actualChoice.npcEncounter = romanticNpcId;
      actualChoice.npcLine = NPC_FIREWORK_LINES[romanticNpcId] ?? '불꽃이 하늘을 수놓았다.';
    }
    setSelectedChoice(actualChoice);
    updateStats(actualChoice.statEffects);
    if (choice.isRomantic && romanticNpcId) {
      updateRelationship(romanticNpcId, 3, 'friendship');
      updateRelationship(romanticNpcId, 5, 'romance');
    } else {
      updateRelationship(actualChoice.npcEncounter, 5);
    }
    addEventHistory({
      week: 9,
      summary: `축제 — ${actualChoice.title}${choice.isRomantic ? ` (${NPC_KO[romanticNpcId]})` : ''}`,
      npcInvolved: actualChoice.npcEncounter,
      choiceMade: actualChoice.title,
    });
    setPhase('result');
  }, [updateStats, updateRelationship, addEventHistory, romanticNpcId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
      {/* Background — campus sunset for festival vibe */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/assets/backgrounds/campus/sunset.png"
          alt=""
          fill
          className="object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/50" />
      </div>

      <div className="relative z-10 w-full max-w-lg px-4">
        {/* Intro phase */}
        {phase === 'intro' && (
          <GlassPanel variant="strong" className="p-6 text-center animate-modal-enter">
            <span className="text-5xl block mb-3">🎉</span>
            <h2 className="text-2xl font-bold text-txt-primary mb-2">축제 주간!</h2>
            <p className="text-sm text-txt-secondary mb-1">캠퍼스가 축제로 물들었다.</p>
            <p className="text-sm text-txt-secondary mb-6">이번 주 일정 대신, 축제를 어떻게 보낼지 선택하세요.</p>
            <button
              onClick={() => setPhase('choosing')}
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30 transition-all cursor-pointer active:scale-[0.97]"
            >
              축제 시작!
            </button>
          </GlassPanel>
        )}

        {/* Choosing phase */}
        {phase === 'choosing' && (
          <div className="flex flex-col gap-3 animate-fade-in-up">
            <h3 className="text-lg font-bold text-txt-primary text-center mb-1">축제에서 뭘 할까?</h3>
            {FESTIVAL_CHOICES.map((choice) => {
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
                      {choice.isRomantic && romanticNpcId ? `${choice.title} (${NPC_KO[romanticNpcId]})` : choice.title}
                    </div>
                    <div className="text-xs text-txt-secondary mt-0.5">
                      {isRomanticLocked ? '🔒 누군가와 설렘 이상의 관계가 필요합니다 (사랑 15+)' : choice.description}
                    </div>
                    {choice.isRomantic && !isRomanticLocked && (
                      <span className="text-[9px] text-pink/50 mt-0.5 block">💕 사랑 +5 — 불꽃놀이 아래 특별한 순간</span>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {Object.entries(choice.statEffects).map(([k, v]) => {
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

        {/* Result phase */}
        {phase === 'result' && selectedChoice && (
          <GlassPanel variant="strong" className="p-6 text-center animate-modal-enter">
            <span className="text-5xl block mb-3">{selectedChoice.emoji}</span>
            <h2 className="text-xl font-bold text-txt-primary mb-3">{selectedChoice.title}</h2>

            {/* NPC encounter */}
            <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-white/5 rounded-xl text-left">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-white/10">
                <Image
                  src={`/assets/characters/${selectedChoice.npcEncounter}/neutral.png`}
                  alt=""
                  width={40}
                  height={40}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <p className="text-sm text-txt-primary/80 italic">&ldquo;{selectedChoice.npcLine}&rdquo;</p>
            </div>

            {/* Stat changes */}
            <div className="flex flex-wrap justify-center gap-2 mb-5">
              {Object.entries(selectedChoice.statEffects).map(([k, v]) => {
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
              축제 끝! 다음 주로
            </button>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
