'use client';

import { useGameStore } from '@/store/gameStore';
import GlassPanel from '@/components/ui/GlassPanel';
import ProgressBar from '@/components/ui/ProgressBar';
import type { PlayerStats } from '@/store/types';

interface WeekSummaryProps {
  onContinue: () => void;
}

const STAT_CONFIG: {
  key: keyof PlayerStats;
  label: string;
  icon: string;
  color: 'teal' | 'gold' | 'pink' | 'coral' | 'lavender';
  isMoney?: boolean;
  isKnowledge?: boolean;
}[] = [
  { key: 'knowledge', label: '준비도', icon: 'solar:star-bold', color: 'gold', isKnowledge: true },
  { key: 'health', label: '체력', icon: 'solar:heart-pulse-bold', color: 'teal' },
  { key: 'social', label: '인맥', icon: 'solar:users-group-rounded-bold', color: 'pink' },
  { key: 'money', label: '돈', icon: 'solar:wallet-bold', color: 'teal', isMoney: true },
  { key: 'stress', label: '스트레스', icon: 'solar:fire-bold', color: 'coral' },
  { key: 'charm', label: '매력', icon: 'solar:star-shine-bold', color: 'lavender' },
];

function formatDelta(key: keyof PlayerStats, delta: number): string {
  if (key === 'money') {
    const prefix = delta >= 0 ? '+' : '';
    return `${prefix}${delta.toLocaleString('ko-KR')}원`;
  }
  if (key === 'knowledge') {
    const prefix = delta > 0 ? '+' : '';
    return `${prefix}${delta}`;
  }
  const prefix = delta > 0 ? '+' : '';
  return `${prefix}${delta}`;
}

function formatStatDisplay(key: keyof PlayerStats, value: number): string {
  if (key === 'money') {
    return `\u20A9${value.toLocaleString('ko-KR')}`;
  }
  if (key === 'knowledge') {
    return `${value} / 100`;
  }
  return `${value} / 100`;
}

function getWeekComment(deltas: Partial<PlayerStats>): string {
  const stress = deltas.stress ?? 0;
  const knowledge = deltas.knowledge ?? 0;
  const social = deltas.social ?? 0;
  const health = deltas.health ?? 0;
  if (stress > 20) return '힘든 한 주였어요... 다음 주는 좀 쉬어가요 😥';
  if (knowledge > 15 && social > 10) return '준비도도 인맥도 챙긴 갓생러! ✨';
  if (knowledge > 15) return '공부 열심히 한 보람이 있네요! 📚';
  if (social > 15) return '이번 주 인싸 활동 대성공! 🎉';
  if (health > 15) return '건강한 한 주! 체력 관리 잘했어요 💪';
  if (stress < -10) return '여유로운 한 주, 리프레시 완료! 🌿';
  return '무난한 한 주가 지나갔어요 📅';
}

/** Character diary — personal reflection on the week */
export function getDiaryEntry(week: number, deltas: Partial<PlayerStats>, stats: PlayerStats): string {
  const stress = deltas.stress ?? 0;
  const knowledge = deltas.knowledge ?? 0;
  const social = deltas.social ?? 0;

  // Week-specific entries
  if (week === 1) return '첫 주가 끝났다. 모든 게 새롭고 어색하지만, 나름 잘 해낸 것 같다. 내일부터 진짜 시작이다.';
  if (week === 4) return 'MT 갔다 왔다. 선배들이랑 밤새 얘기한 게 기억에 남는다. 이래서 대학을 오는 거구나.';
  if (week === 8) return '중간고사 끝! 결과는 모르겠지만, 최선은 다했다. 오늘만큼은 푹 자자.';
  if (week === 9) return '축제 진짜 재밌었다. 캠퍼스가 이렇게 활기찬 건 처음이야.';
  if (week === 15) return '기말고사 끝... 해방이다. 1학기가 이렇게 빨리 지나갈 줄 몰랐다.';

  // Stat-reactive entries
  if (stress > 15 && stats.stress > 70) return '너무 무리했나. 머리가 멍하고 몸이 무겁다. 내일은 좀 쉬어야겠다.';
  if (knowledge > 12) return '열심히 공부한 보람이 느껴진다. 이 페이스 유지하면 좋은 결과가 있을 거야.';
  if (social > 12) return '이번 주는 사람들이랑 많이 어울렸다. 혼자일 때보다 에너지가 생기는 느낌.';
  if (stress < -8) return '여유로운 한 주였다. 가끔은 이렇게 쉬어가는 것도 중요하다는 걸 배웠다.';
  if (stats.money < 50000) return '통장 잔고가 너무 줄었다... 다음 주엔 알바를 더 넣어야 할 것 같다.';
  if (stats.social < 20 && week > 5) return '요즘 혼자 있는 시간이 많다. 외롭진 않은데... 약간 허전하다.';

  // Generic but personal
  const generic = [
    '평범한 한 주. 근데 이런 평범함이 나중에 그리워질 것 같다.',
    '오늘 하늘이 예뻤다. 캠퍼스를 걸으면서 잠깐 생각에 잠겼다.',
    '시간이 진짜 빨리 간다. 벌써 이만큼 왔다니.',
    '내일은 오늘보다 조금 더 잘하자. 그게 내 목표다.',
  ];
  return generic[week % generic.length];
}

export default function WeekSummary({ onContinue }: WeekSummaryProps) {
  const currentWeek = useGameStore((state) => state.currentWeek);
  const stats = useGameStore((state) => state.stats);
  const weekStatDeltas = useGameStore((state) => state.weekStatDeltas);
  const weekCombos = useGameStore((state) => state.weekCombos);
  const weeklyEvent = useGameStore((state) => state.weeklyEvent);
  const newAchievements = useGameStore((state) => state.newAchievements);
  const clearNewAchievements = useGameStore((state) => state.clearNewAchievements);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40">
      <GlassPanel variant="strong" className="w-full max-w-lg p-6 animate-modal-enter">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-sm text-txt-secondary mb-1">주간 결산</p>
          <h2 className="text-2xl font-bold text-txt-primary">{currentWeek}주차 완료</h2>
          <p className="text-sm text-teal/80 mt-1.5">{getWeekComment(weekStatDeltas)}</p>
        </div>

        {/* Weekly highlight — the single most notable thing */}
        {(() => {
          // Determine highlight based on what happened
          const deltas = weekStatDeltas;
          const highlights: { emoji: string; text: string; color: string }[] = [];

          // Biggest stat change
          const biggestGain = Object.entries(deltas)
            .filter(([k, v]) => k !== 'money' && k !== 'stress' && (v ?? 0) > 0)
            .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))[0];
          const biggestLoss = Object.entries(deltas)
            .filter(([k, v]) => k !== 'money' && k === 'stress' ? (v ?? 0) > 10 : (v ?? 0) < -5)
            .sort(([, a], [, b]) => Math.abs(b ?? 0) - Math.abs(a ?? 0))[0];

          if (weeklyEvent) {
            highlights.push({ emoji: '🎲', text: `이번 주 사건: ${weeklyEvent.name}`, color: 'text-lavender' });
          }
          if (biggestGain && (biggestGain[1] ?? 0) >= 10) {
            const labels: Record<string, string> = { knowledge: '준비도', health: '체력', social: '인맥', charm: '매력' };
            highlights.push({ emoji: '📈', text: `${labels[biggestGain[0]] ?? biggestGain[0]}이(가) 크게 올랐다! (+${biggestGain[1]})`, color: 'text-teal' });
          }
          if (biggestLoss) {
            highlights.push({ emoji: '📉', text: `이번 주 가장 힘들었던 것: 스트레스 +${biggestLoss[1]}`, color: 'text-coral' });
          }
          if (weekCombos.length >= 2) {
            highlights.push({ emoji: '✨', text: `콤보 ${weekCombos.length}개 달성!`, color: 'text-gold' });
          }

          const highlight = highlights[0];
          if (!highlight) return null;
          return (
            <div className={`flex items-center gap-2.5 px-4 py-2.5 mb-4 rounded-xl bg-white/5 border border-white/10 ${highlight.color}`}>
              <span className="text-lg">{highlight.emoji}</span>
              <span className="text-sm font-medium">{highlight.text}</span>
            </div>
          );
        })()}

        {/* Stat changes */}
        <div className="flex flex-col gap-4 mb-6">
          {STAT_CONFIG.map(({ key, label, icon, color, isMoney, isKnowledge }, index) => {
            const delta = weekStatDeltas[key];

            return (
              <div key={key} className="flex flex-col gap-1 animate-stat-reveal" style={{ animationDelay: `${index * 80 + 200}ms` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <iconify-icon icon={icon} width="16" height="16" />
                    <span className="text-sm text-txt-secondary">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {delta !== undefined && delta !== 0 && (
                      <span
                        className={`text-xs font-medium ${
                          // For stress, positive delta is bad (coral), negative is good (teal)
                          key === 'stress'
                            ? delta > 0
                              ? 'text-coral'
                              : 'text-teal'
                            : delta > 0
                              ? 'text-teal'
                              : 'text-coral'
                        }`}
                      >
                        {delta > 0 ? '\u25B2' : '\u25BC'} {formatDelta(key, delta)}
                      </span>
                    )}
                    <span className="text-sm text-txt-primary font-medium">
                      {formatStatDisplay(key, stats[key])}
                    </span>
                  </div>
                </div>
                {!isMoney && (
                  <ProgressBar
                    value={isKnowledge ? stats.knowledge : stats[key]}
                    color={color}
                    size="sm"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Random weekly event */}
        {weeklyEvent && (
          <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-lavender/10 border border-lavender/20 animate-stat-reveal" style={{ animationDelay: '650ms' }}>
            <span className="text-xl">🎲</span>
            <div className="flex-1">
              <div className="text-sm font-bold text-lavender">{weeklyEvent.name}</div>
              <div className="text-xs text-txt-secondary">{weeklyEvent.description}</div>
            </div>
          </div>
        )}

        {/* Activity combos */}
        {weekCombos.length > 0 && (
          <div className="flex flex-col gap-1.5 mb-4 animate-stat-reveal" style={{ animationDelay: '700ms' }}>
            <p className="text-xs text-txt-secondary font-medium mb-0.5">활동 콤보</p>
            {weekCombos.map((combo) => (
              <div
                key={combo.name}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                  combo.name === '벼락치기' || combo.name === '알바 중독'
                    ? 'bg-coral/10 border-coral/20'
                    : 'bg-teal/10 border-teal/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{combo.name === '벼락치기' || combo.name === '알바 중독' ? '⚠️' : '✨'}</span>
                  <span className="text-xs text-txt-secondary">{combo.description}</span>
                </div>
                <span className={`text-xs font-medium ${
                  combo.name === '벼락치기' || combo.name === '알바 중독' ? 'text-coral' : 'text-teal'
                }`}>
                  {combo.effect}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Achievement unlocks */}
        {newAchievements.length > 0 && (
          <div className="flex flex-col gap-2 mb-4 animate-stat-reveal" style={{ animationDelay: '800ms' }}>
            {newAchievements.map((ach) => (
              <div key={ach.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gold/10 border border-gold/20">
                <span className="text-2xl">{ach.emoji}</span>
                <div>
                  <div className="text-sm font-bold text-gold">업적 달성!</div>
                  <div className="text-xs text-txt-secondary">{ach.title}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Milestone celebrations — "level up" moments */}
        {(() => {
          const milestones: { emoji: string; text: string }[] = [];
          const prevKnowledge = stats.knowledge - (weekStatDeltas.knowledge ?? 0);
          const prevSocial = stats.social - (weekStatDeltas.social ?? 0);
          const prevCharm = stats.charm - (weekStatDeltas.charm ?? 0);
          const prevHealth = stats.health - (weekStatDeltas.health ?? 0);
          // Knowledge milestones
          if (prevKnowledge < 40 && stats.knowledge >= 40) milestones.push({ emoji: '📖', text: '준비도가 올라가고 있어! 기초가 잡히는 느낌이다.' });
          if (prevKnowledge < 60 && stats.knowledge >= 60) milestones.push({ emoji: '🎯', text: '시험 준비 순조로워! 이 페이스면 좋은 성적을 기대할 수 있다.' });
          if (prevKnowledge < 80 && stats.knowledge >= 80) milestones.push({ emoji: '🏆', text: '준비도 최상! A+ 학점을 노려볼 수 있는 실력이다!' });
          // Social milestones
          if (prevSocial < 50 && stats.social >= 50) milestones.push({ emoji: '🤝', text: '캠퍼스에서 아는 사람이 늘었다. 인사하는 사람이 많아졌어!' });
          if (prevSocial < 75 && stats.social >= 75) milestones.push({ emoji: '🌟', text: '캠퍼스 인싸 등극! 어딜 가든 아는 사람이 있다.' });
          // Charm milestones
          if (prevCharm < 60 && stats.charm >= 60) milestones.push({ emoji: '✨', text: '분위기가 달라졌다는 말을 듣기 시작했다.' });
          // Health milestones
          if (prevHealth < 40 && stats.health >= 40) milestones.push({ emoji: '💚', text: '체력이 돌아오고 있다. 컨디션 회복 중!' });
          // Stress warnings (inverse milestones)
          if (stats.stress >= 80 && (stats.stress - (weekStatDeltas.stress ?? 0)) < 80) milestones.push({ emoji: '🚨', text: '번아웃 위험! 당장 쉬어야 한다...' });
          // Money milestones
          if (stats.money >= 500000 && (stats.money - (weekStatDeltas.money ?? 0)) < 500000) milestones.push({ emoji: '💰', text: '통장 잔고 50만 원 돌파! 여유가 생겼다.' });
          if (stats.money <= 50000 && (stats.money - (weekStatDeltas.money ?? 0)) > 50000) milestones.push({ emoji: '😱', text: '잔고가 5만 원 이하... 다음 주부터 알바 필수!' });

          if (milestones.length === 0) return null;
          return (
            <div className="flex flex-col gap-1.5 mb-4 animate-stat-reveal" style={{ animationDelay: '850ms' }}>
              {milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gold/5 border border-gold/15">
                  <span className="text-lg">{m.emoji}</span>
                  <span className="text-xs text-gold/90 font-medium">{m.text}</span>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Character diary entry */}
        <div className="mb-4 animate-stat-reveal" style={{ animationDelay: '900ms' }}>
          <div className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5">
            <p className="text-[10px] text-txt-secondary/40 mb-1.5">📔 일기</p>
            <p className="text-sm text-txt-primary/60 leading-relaxed italic">
              {getDiaryEntry(currentWeek, weekStatDeltas, stats)}
            </p>
          </div>
        </div>

        {/* Continue button */}
        <button
          onClick={() => {
            clearNewAchievements();
            // Save diary entry
            const diary = getDiaryEntry(currentWeek, weekStatDeltas, stats);
            useGameStore.getState().addDiaryEntry(currentWeek, diary);
            onContinue();
          }}
          className={`w-full py-3 rounded-xl font-semibold text-base transition-all duration-300 cursor-pointer active:scale-[0.98] ${
            currentWeek >= 16
              ? 'bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30'
              : 'bg-teal/20 text-teal border border-teal/30 hover:bg-teal/30'
          }`}
        >
          {currentWeek >= 16 ? '🎓 학기 결산 보기' : '다음 주 시작'}
        </button>
      </GlassPanel>
    </div>
  );
}
