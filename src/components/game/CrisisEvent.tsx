'use client';

import { useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import GlassPanel from '@/components/ui/GlassPanel';
import type { PlayerStats, CharacterRelationship } from '@/store/types';

interface CrisisEventProps {
  onDismiss: () => void;
}

interface CrisisChoice {
  id: string;
  text: string;
  statEffects: Partial<PlayerStats>;
  consequence: string;
  requiredNpc?: { id: string; minFriendship: number; name: string };
  relationshipEffect?: { characterId: string; change: number; type?: 'friendship' | 'romance' };
}

interface Crisis {
  id: string;
  title: string;
  emoji: string;
  description: string;
  choices: CrisisChoice[];
}

function detectCrisis(stats: PlayerStats, week: number, relationships?: Record<string, CharacterRelationship>): Crisis | null {
  // Health collapse
  if (stats.health <= 10) {
    const hasSoyeon = (relationships?.['soyeon']?.friendship ?? relationships?.['soyeon']?.affection ?? 0) >= 40;
    return {
      id: 'health_collapse',
      title: '쓰러졌다',
      emoji: '🏥',
      description: '체력이 바닥나서 수업 중에 쓰러졌다. 보건실 침대에서 눈을 떴다.',
      choices: [
        {
          id: 'rest_alone',
          text: '조용히 쉬면서 회복한다',
          statEffects: { health: 15, knowledge: -5, stress: -8 },
          consequence: '혼자 하루를 쉬었다. 놓친 수업이 걱정되지만 몸이 먼저다.',
        },
        {
          id: 'push_through',
          text: '무리해서라도 수업에 돌아간다',
          statEffects: { health: 5, knowledge: 2, stress: 10 },
          consequence: '억지로 수업에 갔다. 출석은 챙겼지만 컨디션이 더 나빠진 느낌...',
        },
        {
          id: 'soyeon_help',
          text: '소연 선배에게 도움을 요청한다',
          statEffects: { health: 25, stress: -15, knowledge: -3 },
          consequence: '소연 선배가 죽을 끓여왔다. "무리하지 마. 수업 노트는 내가 빌려줄게." 따뜻함에 눈물이 났다.',
          requiredNpc: { id: 'soyeon', minFriendship: 40, name: '소연 선배' },
          relationshipEffect: { characterId: 'soyeon', change: 3 },
        },
      ],
    };
  }

  // Mental breakdown
  if (stats.stress >= 90) {
    const hasJaemin = (relationships?.['jaemin']?.friendship ?? relationships?.['jaemin']?.affection ?? 0) >= 30;
    const hasRomancePartner = Object.entries(relationships ?? {}).find(([, r]) => (r.romance ?? 0) >= 25);
    const choices: CrisisChoice[] = [
      {
        id: 'counseling',
        text: '학교 상담센터에 간다',
        statEffects: { stress: -25, health: -3, knowledge: -2 },
        consequence: '상담사 선생님과 한 시간을 이야기했다. 완전히 괜찮아지진 않았지만, 머릿속이 조금 정리됐다.',
      },
      {
        id: 'skip_everything',
        text: '모든 걸 내려놓고 하루를 쉰다',
        statEffects: { stress: -35, health: 5, knowledge: -5, money: -20000 },
        consequence: '수업도 알바도 다 빠지고 카페에서 하루를 보냈다. 죄책감이 들지만... 살 것 같다.',
      },
    ];

    if (hasJaemin) {
      choices.push({
        id: 'jaemin_talk',
        text: '재민이에게 솔직하게 말한다',
        statEffects: { stress: -30, social: 3, health: 2 },
        consequence: '재민이가 조용히 들어줬다. "야, 혼자 끙끙 앓지 마. 내가 옆에 있잖아." 어깨가 가벼워졌다.',
        requiredNpc: { id: 'jaemin', minFriendship: 30, name: '재민' },
        relationshipEffect: { characterId: 'jaemin', change: 5 },
      });
    }

    if (hasRomancePartner) {
      const [partnerId, partnerRel] = hasRomancePartner;
      const NPC_KO: Record<string, string> = { jaemin: '재민', minji: '민지', soyeon: '소연 선배', hyunwoo: '현우 선배' };
      const name = NPC_KO[partnerId] ?? partnerId;
      choices.push({
        id: 'partner_comfort',
        text: `${name}에게 기댄다`,
        statEffects: { stress: -35, health: 3, charm: 2 },
        consequence: `${name}이(가) 아무 말 없이 안아줬다. "괜찮아. 내가 여기 있어." 세상에서 가장 든든한 존재.`,
        requiredNpc: { id: partnerId, minFriendship: (partnerRel.friendship ?? 0), name },
        relationshipEffect: { characterId: partnerId, change: 3, type: 'romance' },
      });
    }

    return {
      id: 'mental_breakdown',
      title: '번아웃',
      emoji: '💔',
      description: '더 이상 못 하겠다. 아침에 눈을 떠도 일어날 힘이 없다. 모든 게 의미 없게 느껴진다.',
      choices,
    };
  }

  // Broke
  if (stats.money <= 0 && week > 2) {
    return {
      id: 'broke_crisis',
      title: '무일푼',
      emoji: '💸',
      description: '통장 잔고가 0원이다. 오늘 저녁 편의점 도시락도 못 산다.',
      choices: [
        {
          id: 'emergency_parttime',
          text: '급하게 단기 알바를 뛴다',
          statEffects: { money: 120000, health: -12, stress: 10, knowledge: -3 },
          consequence: '이틀 연속 새벽 알바를 뛰었다. 죽을 것 같지만 통장에 돈이 들어왔다.',
        },
        {
          id: 'call_parents',
          text: '부모님께 전화한다',
          statEffects: { money: 200000, stress: -5 },
          consequence: '"괜찮아, 보내줄게." 부모님의 목소리가 따뜻하다. 고맙지만... 미안하다.',
        },
        {
          id: 'ramen_diet',
          text: '라면으로 버틴다',
          statEffects: { money: 30000, health: -8, stress: 5 },
          consequence: '일주일째 라면만 먹었다. 싸긴 싸지만 몸이 보내는 경고 신호가 느껴진다.',
        },
      ],
    };
  }

  // Academic warning
  if (stats.knowledge <= 15 && week >= 8) {
    const hasMinji = (relationships?.['minji']?.friendship ?? relationships?.['minji']?.affection ?? 0) >= 40;
    const choices: CrisisChoice[] = [
      {
        id: 'cramming',
        text: '벼락치기로 만회한다',
        statEffects: { knowledge: 8, stress: 15, health: -8 },
        consequence: '3일 밤낮을 공부했다. 기본은 따라잡았지만 몸과 마음이 만신창이다.',
      },
      {
        id: 'professor_meeting',
        text: '교수님을 찾아간다',
        statEffects: { knowledge: 5, stress: 5, charm: -2 },
        consequence: '교수님이 한숨을 쉬며 과제를 하나 더 주셨다. 기회를 주신 거지만... 무겁다.',
      },
    ];

    if (hasMinji) {
      choices.push({
        id: 'minji_study',
        text: '민지에게 공부를 도와달라고 한다',
        statEffects: { knowledge: 10, stress: 3, social: 2 },
        consequence: '민지가 한숨을 쉬더니 노트를 펼쳤다. "...이것도 모르면서 어떻게 여기까지 왔어. 앉아." 쿨한 척하지만 3시간을 가르쳐줬다.',
        requiredNpc: { id: 'minji', minFriendship: 40, name: '민지' },
        relationshipEffect: { characterId: 'minji', change: 3 },
      });
    }

    return {
      id: 'academic_warning',
      title: '학사경고 위기',
      emoji: '⚠️',
      description: '학과 사무실에서 연락이 왔다. "이대로면 학사경고입니다." 심장이 쿵 내려앉았다.',
      choices,
    };
  }

  // Social isolation
  if (stats.social <= 5 && week >= 6) {
    return {
      id: 'isolation',
      title: '완전한 고립',
      emoji: '🌑',
      description: '캠퍼스를 걸어도 아는 사람이 없다. 카톡 알림이 며칠째 0개다. 투명인간이 된 기분.',
      choices: [
        {
          id: 'mentoring',
          text: '학과 멘토링 프로그램에 신청한다',
          statEffects: { social: 12, stress: 3, charm: 2 },
          consequence: '어색한 첫 만남이었지만, 같은 처지인 사람들이 있다는 것만으로 위안이 됐다.',
        },
        {
          id: 'club_join',
          text: '동아리 문을 두드린다',
          statEffects: { social: 8, charm: 5, stress: 5, money: -15000 },
          consequence: '현우가 환하게 맞아줬다. "어, 왔어? 기다렸어!" 처음으로 환영받는 기분이다.',
          relationshipEffect: { characterId: 'hyunwoo', change: 5 },
        },
        {
          id: 'embrace_solitude',
          text: '혼자만의 시간을 받아들인다',
          statEffects: { knowledge: 5, charm: 3, stress: -5 },
          consequence: '도서관 구석에서 책을 읽었다. 외롭지만... 이 시간이 나를 단단하게 만들고 있다.',
        },
      ],
    };
  }

  return null;
}

export default function CrisisEvent({ onDismiss }: CrisisEventProps) {
  const stats = useGameStore((s) => s.stats);
  const currentWeek = useGameStore((s) => s.currentWeek);
  const relationships = useGameStore((s) => s.relationships);
  const updateStats = useGameStore((s) => s.updateStats);
  const updateRelationship = useGameStore((s) => s.updateRelationship);
  const addEventHistory = useGameStore((s) => s.addEventHistory);
  const [chosen, setChosen] = useState<CrisisChoice | null>(null);

  const crisis = detectCrisis(stats, currentWeek, relationships);

  const handleChoice = useCallback((choice: CrisisChoice) => {
    setChosen(choice);
    updateStats(choice.statEffects);
    if (choice.relationshipEffect) {
      updateRelationship(
        choice.relationshipEffect.characterId,
        choice.relationshipEffect.change,
        choice.relationshipEffect.type ?? 'friendship',
      );
    }
    addEventHistory({
      week: currentWeek,
      summary: `위기 — ${crisis?.title}: ${choice.text}`,
      choiceMade: choice.consequence.split('.')[0],
    });
  }, [updateStats, updateRelationship, addEventHistory, currentWeek, crisis]);

  if (!crisis) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <GlassPanel variant="strong" className="w-full max-w-md p-6 animate-modal-enter border border-coral/30">
        <div className="text-center mb-4">
          <span className="text-5xl block mb-3">{crisis.emoji}</span>
          <h2 className="text-xl font-bold text-coral mb-2">{crisis.title}</h2>
          <p className="text-sm text-txt-primary/80 leading-relaxed">{crisis.description}</p>
        </div>

        {!chosen ? (
          <div className="flex flex-col gap-2 mt-4">
            {crisis.choices.map((choice) => {
              // Check NPC gate
              const gated = choice.requiredNpc && (relationships[choice.requiredNpc.id]?.friendship ?? relationships[choice.requiredNpc.id]?.affection ?? 0) < choice.requiredNpc.minFriendship;
              return (
                <button
                  key={choice.id}
                  onClick={() => !gated && handleChoice(choice)}
                  disabled={!!gated}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    gated
                      ? 'bg-white/[0.02] border-white/5 opacity-40 cursor-not-allowed'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  <p className="text-sm text-txt-primary font-medium">{choice.text}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {Object.entries(choice.statEffects).map(([k, v]) => {
                      if (!v) return null;
                      const labels: Record<string, string> = { knowledge: '준비도', money: '돈', health: '체력', social: '인맥', stress: '스트레스', charm: '매력' };
                      const isGood = k === 'stress' ? v < 0 : v > 0;
                      return (
                        <span key={k} className={`text-[9px] px-1.5 py-0.5 rounded-full ${isGood ? 'bg-teal/10 text-teal/70' : 'bg-coral/10 text-coral/70'}`}>
                          {labels[k]}{v > 0 ? '+' : ''}{k === 'money' ? `${(v/1000).toFixed(0)}K` : v}
                        </span>
                      );
                    })}
                    {choice.relationshipEffect && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-400/10 text-sky-400/70">
                        {choice.requiredNpc?.name} +{choice.relationshipEffect.change}
                      </span>
                    )}
                  </div>
                  {gated && choice.requiredNpc && (
                    <p className="text-[9px] text-coral/40 mt-1">🔒 {choice.requiredNpc.name}과(와) 더 친해져야 합니다</p>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 animate-fade-in">
            <div className="bg-white/5 rounded-xl px-4 py-3 mb-4">
              <p className="text-sm text-txt-primary/70 italic leading-relaxed">{chosen.consequence}</p>
            </div>
            <button
              onClick={onDismiss}
              className="w-full py-3 rounded-xl font-semibold text-base bg-white/10 text-txt-primary border border-white/20 hover:bg-white/20 transition-all cursor-pointer active:scale-[0.98]"
            >
              계속하기
            </button>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}

export { detectCrisis };
