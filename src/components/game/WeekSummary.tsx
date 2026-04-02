'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import GlassPanel from '@/components/ui/GlassPanel';
import ProgressBar from '@/components/ui/ProgressBar';
import type { PlayerStats } from '@/store/types';
import { generateWeeklyChallenges, checkChallengeCompletion, type WeeklyChallenge } from '@/lib/weeklyChallenge';

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

/** Next week teaser — creates anticipation and "one more week" pull */
function getNextWeekPreview(week: number, stats: PlayerStats): string {
  const nextWeek = week + 1;
  // Hard-coded special event teasers
  if (nextWeek === 4) return '다음 주 예고: MT가 잡혔다! 선배들이랑 1박 2일... 어떤 일이 생길까? 🏕️';
  if (nextWeek === 7) return '다음 주 예고: 중간고사 시즌 돌입! 📝 준비는 됐나요?';
  if (nextWeek === 9) return '다음 주 예고: 대동제 축제가 열린다! 🎪 캠퍼스 분위기가 달라질 것 같다.';
  if (nextWeek === 14) return '다음 주 예고: 기말고사 주간! 📚 1학기의 마지막 고비.';
  if (nextWeek === 16) return '다음 주 예고: 마지막 주... 학기가 끝나간다. 어떤 마무리를 할까? 🎓';
  // Relationship threshold teasers
  const rels = useGameStore.getState().relationships;
  const NPC_KO: Record<string, string> = { jaemin: '재민', minji: '민지', soyeon: '소연 선배', hyunwoo: '현우 선배' };
  for (const [id, rel] of Object.entries(rels)) {
    const name = NPC_KO[id];
    if (!name) continue;
    const fr = rel.friendship ?? rel.affection ?? 0;
    const rom = rel.romance ?? 0;
    if (fr >= 35 && fr < 40) return `다음 주 예고: ${name}이(가) 뭔가 말하고 싶어 하는 것 같다... 💭`;
    if (rom >= 20 && rom < 25) return `다음 주 예고: ${name}을(를) 볼 때마다 두근거린다. 이 감정, 뭘까? 💓`;
    if (rom >= 40 && rom < 45) return `다음 주 예고: ${name}과(와)... 더 가까워질 수 있을까? 💕`;
  }
  // Stat-based warnings / excitement
  if (stats.stress >= 65) return '다음 주 예고: 이러다 쓰러지겠어. 다음 주엔 꼭 좀 쉬어야겠다. 😰';
  if (stats.money < 80000) return '다음 주 예고: 통장이 비어가고 있다... 알바 자리를 더 알아봐야 할 것 같다. 💸';
  if (stats.knowledge >= 58 && stats.knowledge < 62) return '다음 주 예고: 스터디 그룹을 꾸려볼 수 있을 것 같다. 준비도가 쌓이고 있어! 📖';
  if (stats.health >= 68 && stats.health < 72) return '다음 주 예고: 마라톤 대회 신청서를 봤다. 체력이라면 이제 자신 있는데... 🏃';
  if (stats.social >= 48 && stats.social < 52) return '다음 주 예고: 파티 초대장이 들어올 것 같은 예감. 인맥이 넓어지고 있다! 🎉';
  // Generic week-based teasers
  const teasers: Record<number, string> = {
    2: '다음 주 예고: 새로운 얼굴들과 조금씩 친해질 수 있을까? 아직 모든 게 낯설다. 👋',
    3: '다음 주 예고: 캠퍼스 생활에 점점 익숙해지는 느낌이다. 무언가 좋은 일이 있을 것 같다. ✨',
    5: '다음 주 예고: 5주 차. 조금씩 이 생활의 패턴이 보이기 시작한다. 🗓️',
    6: '다음 주 예고: 중간고사가 점점 다가온다. 지금부터 준비해야 하지 않을까? 📚',
    8: '다음 주 예고: 시험이 끝나면 잠깐 숨을 돌릴 수 있을 것 같다. 조금만 더! 💪',
    10: '다음 주 예고: 후반부 시작. 1학기가 절반쯤 지났다. 어떻게 마무리할까? 🍂',
    11: '다음 주 예고: 가을 캠퍼스... 뭔가 낭만적인 일이 생길 것 같은 예감이다. 🍁',
    12: '다음 주 예고: 남은 주가 몇 주 안 된다. 하고 싶었던 걸 지금 해야 할지도. ⏰',
    13: '다음 주 예고: 기말 시즌이 다가온다. 준비도를 최대한 올려야 한다. 🎯',
    15: '다음 주 예고: 드디어 마지막 주. 1학기 마무리를 어떻게 할지 생각해봐야겠다. 🌅',
  };
  return teasers[nextWeek] ?? `다음 주 예고: ${nextWeek}주 차가 기다리고 있다. 어떤 이야기가 펼쳐질까? ✨`;
}

/** Character diary — personal reflection on the week, relationship-aware */
export function getDiaryEntry(week: number, deltas: Partial<PlayerStats>, stats: PlayerStats): string {
  const NPC_KO: Record<string, string> = { jaemin: '재민', minji: '민지', soyeon: '소연 선배', hyunwoo: '현우 선배' };
  const rels = useGameStore.getState().relationships;
  const prevRels = useGameStore.getState().previousRelationships ?? {};

  // Find NPC with biggest romance change this week
  let romanceNpc = '';
  let romanceDelta = 0;
  let romanceTier = '';
  // Find NPC with biggest friendship change this week
  let friendNpc = '';
  let friendDelta = 0;

  for (const [id, rel] of Object.entries(rels)) {
    const name = NPC_KO[id];
    if (!name) continue;
    const prev = prevRels[id];
    const rDelta = (rel.romance ?? 0) - (prev?.romance ?? 0);
    const fDelta = (rel.friendship ?? rel.affection ?? 0) - (prev?.friendship ?? prev?.affection ?? 0);
    if (rDelta > romanceDelta) { romanceNpc = name; romanceDelta = rDelta; romanceTier = (rel.romance ?? 0) >= 45 ? 'dating' : (rel.romance ?? 0) >= 25 ? 'crush' : 'interest'; }
    if (fDelta > friendDelta) { friendNpc = name; friendDelta = fDelta; }
  }

  const stress = deltas.stress ?? 0;
  const knowledge = deltas.knowledge ?? 0;

  // ─── Romance-aware entries (highest priority) ───
  if (romanceDelta >= 3 && romanceTier === 'dating') {
    return `${romanceNpc}과(와) 함께한 시간이 꿈만 같았다. 연인이라는 게 아직 실감이 안 난다. 이 행복이 오래 가길.`;
  }
  if (romanceDelta >= 2 && romanceTier === 'crush') {
    return `자꾸 ${romanceNpc} 생각이 난다. 수업 중에도, 밥 먹을 때도. 이게 설렘이라는 거겠지.`;
  }
  if (romanceDelta >= 1 && romanceTier === 'interest') {
    return `${romanceNpc}이(가) 왜 자꾸 신경 쓰이지? 아직 잘 모르겠는 감정인데... 신기하다.`;
  }

  // ─── Friendship-aware entries ───
  if (friendDelta >= 3 && friendNpc) {
    return `${friendNpc}과(와) 이번 주에 많이 가까워진 느낌이다. 같이 있으면 시간이 빨리 간다.`;
  }

  // ─── Week-specific entries ───
  if (week === 1) return '첫 주가 끝났다. 모든 게 새롭고 어색하지만, 나름 잘 해낸 것 같다. 내일부터 진짜 시작이다.';
  if (week === 4) return 'MT 갔다 왔다. 선배들이랑 밤새 얘기한 게 기억에 남는다. 이래서 대학을 오는 거구나.';
  if (week === 8) return '중간고사 끝! 결과는 모르겠지만, 최선은 다했다. 오늘만큼은 푹 자자.';
  if (week === 9) return '축제 진짜 재밌었다. 캠퍼스가 이렇게 활기찬 건 처음이야.';
  if (week === 15) return '기말고사 끝... 해방이다. 1학기가 이렇게 빨리 지나갈 줄 몰랐다.';

  // ─── Stat-reactive entries ───
  if (stress > 15 && stats.stress > 70) return '너무 무리했나. 머리가 멍하고 몸이 무겁다. 내일은 좀 쉬어야겠다.';
  if (knowledge > 12) return '열심히 공부한 보람이 느껴진다. 이 페이스 유지하면 좋은 결과가 있을 거야.';
  if (stress < -8) return '여유로운 한 주였다. 가끔은 이렇게 쉬어가는 것도 중요하다는 걸 배웠다.';
  if (stats.money < 50000) return '통장 잔고가 너무 줄었다... 다음 주엔 알바를 더 넣어야 할 것 같다.';
  if (stats.social < 20 && week > 5) return '요즘 혼자 있는 시간이 많다. 외롭진 않은데... 약간 허전하다.';

  // ─── Friendship flavor if anyone interacted ───
  if (friendNpc && friendDelta > 0) {
    const lines = [
      `이번 주 ${friendNpc}과(와) 시간을 보냈다. 대학에서 이런 인연을 만나다니.`,
      `${friendNpc}이(가) 웃을 때 기분이 좋아진다. 좋은 사람을 만난 것 같다.`,
    ];
    return lines[week % lines.length];
  }

  // ─── Generic ───
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
  const [reflectionDone, setReflectionDone] = useState(false);
  const [challengeRewardApplied, setChallengeRewardApplied] = useState(false);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg py-8">
      <GlassPanel variant="strong" className="w-full p-6 animate-modal-enter border border-white/10">
        {/* Header — dramatic, PM-style */}
        <div className="text-center mb-6">
          <p className="text-xs text-txt-secondary/50 tracking-widest mb-2">WEEK REPORT</p>
          <h2 className="text-3xl font-black text-txt-primary">{currentWeek}주차 결산</h2>
          <p className="text-sm text-teal/80 mt-1.5">{getWeekComment(weekStatDeltas)}</p>
          {/* Week rating tag */}
          {(() => {
            const totalPositive = Object.entries(weekStatDeltas)
              .filter(([k, v]) => k !== 'stress' && k !== 'money' && (v ?? 0) > 0)
              .reduce((sum, [, v]) => sum + (v ?? 0), 0);
            const stressDelta = weekStatDeltas.stress ?? 0;
            let tag: { text: string; color: string };
            if (totalPositive >= 20 && stressDelta <= 5) tag = { text: '🌟 최고의 한 주', color: 'text-gold' };
            else if (totalPositive >= 12) tag = { text: '😊 좋은 한 주', color: 'text-teal' };
            else if (stressDelta >= 15) tag = { text: '😰 힘든 한 주', color: 'text-coral' };
            else if (totalPositive <= 3 && stressDelta >= 5) tag = { text: '😐 평범한 한 주', color: 'text-txt-secondary' };
            else tag = { text: '🙂 무난한 한 주', color: 'text-txt-secondary' };
            return <p className={`text-xs mt-1 ${tag.color}`}>{tag.text}</p>;
          })()}
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
                    prevValue={delta !== undefined ? (isKnowledge ? stats.knowledge - delta : stats[key] - delta) : undefined}
                    color={color}
                    size="sm"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Random weekly event — dramatic presentation */}
        {weeklyEvent && (
          <div className="mb-4 rounded-xl bg-gradient-to-r from-lavender/10 to-pink/5 border border-lavender/20 overflow-hidden animate-stat-reveal" style={{ animationDelay: '650ms' }}>
            <div className="px-4 py-1.5 bg-lavender/10 border-b border-lavender/15">
              <p className="text-[9px] text-lavender/60 tracking-wider">⚡ 이번 주 사건</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-2xl">🎲</span>
            <div className="flex-1">
              <div className="text-sm font-bold text-lavender">{weeklyEvent.name}</div>
              <div className="text-xs text-txt-secondary mt-0.5">{weeklyEvent.description}</div>
            </div>
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

        {/* Weekly challenge completion */}
        {(() => {
          const rels = useGameStore.getState().relationships;
          const prevRels = useGameStore.getState().previousRelationships ?? {};
          const prevStats: PlayerStats = { ...stats };
          for (const [k, v] of Object.entries(weekStatDeltas)) {
            if (v !== undefined) prevStats[k as keyof PlayerStats] -= v;
          }
          const challenges = generateWeeklyChallenges(currentWeek, prevStats, prevRels);
          if (challenges.length === 0) return null;
          const { completed, totalReward } = checkChallengeCompletion(challenges, stats, prevStats, rels, prevRels);

          // Apply rewards (only once)
          if (completed.length > 0 && Object.keys(totalReward).length > 0 && !challengeRewardApplied) {
            setChallengeRewardApplied(true);
            setTimeout(() => useGameStore.getState().updateStats(totalReward), 100);
          }

          return (
            <div className="mb-4 animate-stat-reveal" style={{ animationDelay: '780ms' }}>
              <p className="text-[10px] text-teal/50 mb-2">🎯 챌린지 결과</p>
              <div className="flex flex-col gap-1.5">
                {challenges.map(c => {
                  const done = completed.includes(c);
                  return (
                    <div key={c.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${done ? 'bg-teal/10 border border-teal/20' : 'bg-white/[0.02] border border-white/5'}`}>
                      <span className="text-sm">{done ? '✅' : '❌'}</span>
                      <span className={`text-xs flex-1 ${done ? 'text-teal' : 'text-white/30 line-through'}`}>{c.text}</span>
                      {done && (
                        <span className="text-[9px] text-teal/60">보상 획득!</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

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

          // ─── Relationship tier milestones ───
          const NPC_KO: Record<string, string> = { jaemin: '재민', minji: '민지', soyeon: '소연 선배', hyunwoo: '현우 선배' };
          const rels = useGameStore.getState().relationships;
          const prevRels = useGameStore.getState().previousRelationships ?? {};
          for (const [npcId, rel] of Object.entries(rels)) {
            const name = NPC_KO[npcId];
            if (!name) continue;
            const fr = rel.friendship ?? rel.affection ?? 0;
            const prevFr = prevRels[npcId]?.friendship ?? prevRels[npcId]?.affection ?? 0;
            const rom = rel.romance ?? 0;
            const prevRom = prevRels[npcId]?.romance ?? 0;
            // Friendship tier-ups
            if (prevFr < 20 && fr >= 20) milestones.push({ emoji: '👋', text: `${name}과(와) 아는 사이가 되었다.` });
            if (prevFr < 40 && fr >= 40) milestones.push({ emoji: '🤝', text: `${name}과(와) 친구가 되었다!` });
            if (prevFr < 60 && fr >= 60) milestones.push({ emoji: '💛', text: `${name}이(가) 절친이 되었다! 든든한 존재.` });
            if (prevFr < 80 && fr >= 80) milestones.push({ emoji: '⭐', text: `${name}과(와) 베프가 되었다! 평생 함께할 친구.` });
            // Romance tier-ups
            if (prevRom < 10 && rom >= 10) milestones.push({ emoji: '💭', text: `${name}에 대한 관심이 생기기 시작했다...` });
            if (prevRom < 25 && rom >= 25) milestones.push({ emoji: '💓', text: `${name}을(를) 볼 때마다 심장이 뛴다... 이게 설렘?` });
            if (prevRom < 45 && rom >= 45) milestones.push({ emoji: '💕', text: `${name}과(와) 연인이 되었다! 캠퍼스 커플 탄생!` });
            if (prevRom < 70 && rom >= 70) milestones.push({ emoji: '💗', text: `${name}과(와) 깊은 사랑에 빠졌다. 서로 없이는 못 살아.` });
          }

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

        {/* Relationship changes this week */}
        {(() => {
          const rels = useGameStore.getState().relationships;
          const prevRels = useGameStore.getState().previousRelationships ?? {};
          const NPC_KO: Record<string, string> = { jaemin: '재민', minji: '민지', soyeon: '소연', hyunwoo: '현우' };
          const changes: { id: string; name: string; frDelta: number; romDelta: number; fr: number; rom: number; decayWarning: boolean }[] = [];

          for (const [id, rel] of Object.entries(rels)) {
            const name = NPC_KO[id];
            if (!name) continue;
            const prev = prevRels[id];
            if (!prev && rel.encounters === 0) continue;
            const fr = rel.friendship ?? rel.affection ?? 0;
            const prevFr = prev?.friendship ?? prev?.affection ?? 0;
            const rom = rel.romance ?? 0;
            const prevRom = prev?.romance ?? 0;
            const frDelta = fr - prevFr;
            const romDelta = rom - prevRom;
            // Decay warning: romance > 0 and no date in 2+ weeks
            const weeksSinceDate = rel.lastDateWeek ? currentWeek - rel.lastDateWeek : 99;
            const decayWarning = rom > 0 && weeksSinceDate >= 2;
            if (frDelta !== 0 || romDelta !== 0 || decayWarning || rel.encounters > 0) {
              changes.push({ id, name, frDelta, romDelta, fr, rom, decayWarning });
            }
          }

          if (changes.length === 0) return null;
          return (
            <div className="mb-4 animate-stat-reveal" style={{ animationDelay: '860ms' }}>
              <p className="text-[10px] text-txt-secondary/50 mb-2">👥 이번 주 인간관계</p>
              <div className="flex flex-col gap-1.5">
                {changes.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03]">
                    <span className="text-xs text-txt-primary/70 w-10 font-medium">{c.name}</span>
                    <div className="flex-1 flex items-center gap-2">
                      {/* Friendship bar + delta */}
                      <div className="flex items-center gap-1 flex-1">
                        <div className="w-14 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-sky-400/50 rounded-full" style={{ width: `${c.fr}%` }} />
                        </div>
                        {c.frDelta !== 0 && (
                          <span className={`text-[9px] font-mono ${c.frDelta > 0 ? 'text-sky-400/70' : 'text-coral/60'}`}>
                            {c.frDelta > 0 ? '+' : ''}{c.frDelta}
                          </span>
                        )}
                      </div>
                      {/* Romance bar + delta (only if romance exists) */}
                      {(c.rom > 0 || c.romDelta !== 0) && (
                        <div className="flex items-center gap-1 flex-1">
                          <div className="w-14 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-pink/50 rounded-full" style={{ width: `${c.rom}%` }} />
                          </div>
                          {c.romDelta !== 0 && (
                            <span className={`text-[9px] font-mono ${c.romDelta > 0 ? 'text-pink/70' : 'text-coral/60'}`}>
                              {c.romDelta > 0 ? '+' : ''}{c.romDelta}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Decay warning */}
                    {c.decayWarning && (
                      <span className="text-[9px] text-amber-400/70" title="데이트 안 하면 사랑 감소">💔</span>
                    )}
                  </div>
                ))}
              </div>
              {changes.some(c => c.decayWarning) && (
                <p className="text-[9px] text-amber-400/50 mt-1.5 text-center">💔 오래 데이트 안 하면 사랑이 식어요!</p>
              )}
            </div>
          );
        })()}

        {/* Activity streaks */}
        {(() => {
          const streaks = useGameStore.getState().activityStreaks;
          const STREAK_LABELS: Record<string, { name: string; emoji: string }> = {
            study: { name: '공부', emoji: '📚' },
            exercise: { name: '운동', emoji: '💪' },
            parttime: { name: '알바', emoji: '💼' },
            club: { name: '동아리', emoji: '🎵' },
          };
          const activeStreaks = Object.entries(streaks)
            .filter(([, count]) => count >= 3)
            .map(([id, count]) => ({ ...STREAK_LABELS[id], count }))
            .filter(s => s.name);
          if (activeStreaks.length === 0) return null;
          return (
            <div className="flex flex-wrap gap-2 mb-3 animate-stat-reveal" style={{ animationDelay: '870ms' }}>
              {activeStreaks.map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-lavender/10 border border-lavender/20">
                  <span>{s.emoji}</span>
                  <span className="text-[10px] text-lavender font-bold">{s.name} {s.count}주 연속!</span>
                  <span className="text-[10px] text-lavender/50">🔥</span>
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

        {/* Weekly reflection — quick mindset choice */}
        {currentWeek < 16 && currentWeek >= 2 && !reflectionDone && (
          <div className="mb-3">
            <p className="text-[10px] text-txt-secondary/50 mb-1.5 text-center">다음 주 마음가짐은?</p>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { emoji: '🔥', label: '열정!', effect: { knowledge: 2, stress: 3 } },
                { emoji: '😌', label: '여유', effect: { stress: -5, health: 2 } },
                { emoji: '💪', label: '도전', effect: { charm: 2, social: 2 } },
              ].map((mood) => (
                <button
                  key={mood.label}
                  onClick={() => {
                    useGameStore.getState().updateStats(mood.effect);
                    setReflectionDone(true);
                  }}
                  className="py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all cursor-pointer text-center active:scale-[0.95]"
                >
                  <span className="text-lg block">{mood.emoji}</span>
                  <span className="text-[9px] text-txt-secondary">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Next Week Preview — anticipation hook */}
        {currentWeek < 16 && (
          <div className="mb-4 animate-stat-reveal" style={{ animationDelay: '930ms' }}>
            <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-[10px] text-txt-secondary/40 mb-1.5">📺 다음 주 예고</p>
              <p className="text-sm text-txt-primary/60 italic leading-relaxed">{getNextWeekPreview(currentWeek, stats)}</p>
            </div>
          </div>
        )}

        {/* Continue button */}
        <button
          onClick={() => {
            clearNewAchievements();
            // Save diary entry with relationship context
            const diary = getDiaryEntry(currentWeek, weekStatDeltas, stats);
            const rels = useGameStore.getState().relationships;
            const NPC_KO: Record<string, string> = { jaemin: '재민', minji: '민지', soyeon: '소연', hyunwoo: '현우' };
            const topNpc = Object.entries(rels)
              .filter(([, r]) => r.lastInteraction === currentWeek)
              .sort(([, a], [, b]) => b.affection - a.affection)[0];
            const relNote = topNpc ? ` [${NPC_KO[topNpc[0]] ?? topNpc[0]}과(와) 시간을 보냄]` : '';
            useGameStore.getState().addDiaryEntry(currentWeek, diary + relNote);
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
    </div>
  );
}
