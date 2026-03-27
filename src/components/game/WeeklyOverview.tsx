'use client';

import { useGameStore } from '@/store/gameStore';
import { getRelationshipTier } from '@/store/gameStore';
import { getWeekCondition, getWeatherForWeek } from '@/lib/gameEngine';
import { getCachedDialogue } from '@/lib/weeklyDialogueCache';
import { generateRumors } from '@/lib/rumorSystem';
import Image from 'next/image';
import GlassPanel from '@/components/ui/GlassPanel';

interface WeeklyOverviewProps {
  onContinue: () => void;
}

function getMoodEmoji(stress: number, health: number): { emoji: string; label: string } {
  const wellbeing = health - stress;
  if (wellbeing > 40) return { emoji: '😊', label: '컨디션 좋음' };
  if (wellbeing > 10) return { emoji: '🙂', label: '보통' };
  if (wellbeing > -20) return { emoji: '😐', label: '피곤함' };
  if (wellbeing > -40) return { emoji: '😓', label: '힘듦' };
  return { emoji: '😰', label: '위험' };
}

interface EventEntry { week: number; summary: string; npcInvolved?: string; choiceMade?: string }

/** Soyeon (caring senior) as our "Cube butler" — personalized weekly advice with memory */
function getSoyeonAdvice(week: number, stress: number, knowledge: number, social: number, health: number, events?: EventEntry[]): { text: string; expression: string } {
  // Sometimes reference a past event (memory callback)
  if (events && events.length > 0 && week > 5 && Math.random() < 0.3) {
    const recentEvent = events[events.length - 1];
    if (recentEvent.npcInvolved === 'soyeon') {
      return { text: `저번에 같이 보낸 시간 즐거웠어. 또 놀자~`, expression: 'happy' };
    }
    if (recentEvent.summary.includes('MT')) {
      return { text: 'MT 재밌었지? 그때 사진 아직도 보고 웃어.', expression: 'teasing' };
    }
    if (recentEvent.summary.includes('축제')) {
      return { text: '축제 때 기억나? 벌써 그리운데... 다음엔 더 재밌게 놀자!', expression: 'happy' };
    }
    if (recentEvent.summary.includes('위기')) {
      return { text: '저번에 힘들었지? 지금은 좀 괜찮아? 걱정했어...', expression: 'worried' };
    }
  }
  if (stress > 80) return { text: '야, 너 요즘 얼굴이 많이 안 좋아 보여. 오늘은 좀 쉬어. 학점보다 건강이 먼저야.', expression: 'worried' };
  if (health < 25) return { text: '밥은 제대로 먹고 다니는 거지? 체력이 떨어지면 아무것도 못 해. 선배 말 들어.', expression: 'worried' };
  if (knowledge < 25) return { text: '공부 준비가 좀 걱정돼... 다음 주는 도서관에서 좀 보자. 내가 노트 빌려줄게.', expression: 'sad' };
  if (social < 20 && week > 4) return { text: '요즘 혼자 다니는 거 같던데... 밥이라도 같이 먹자. 혼밥은 선배가 허락 안 해.', expression: 'teasing' };
  if (week >= 14) return { text: '기말 화이팅! 여기까지 온 거 대단해. 끝까지 힘내자, 종강이 코앞이야!', expression: 'happy' };
  if (week >= 7 && week <= 8) return { text: '중간고사 기간이네. 긴장되지? 괜찮아, 준비한 만큼 나와. 선배가 응원할게.', expression: 'neutral' };
  if (week === 9) return { text: '축제다! 이번 축제는 같이 돌아다니자. 대학 축제는 1학년 때가 제일 재밌어!', expression: 'happy' };
  if (week === 4) return { text: 'MT 가기로 했지? 선배들이랑 친해질 좋은 기회야. 즐겁게 보내!', expression: 'teasing' };
  if (knowledge >= 75 && stress <= 30) return { text: '와, 요즘 진짜 잘하고 있다! 이 페이스 유지하면 장학금도 노려볼 만해.', expression: 'happy' };
  if (week <= 3) return { text: '새 학기 잘 적응하고 있지? 모르는 거 있으면 언제든 물어봐. 선배가 다 알려줄게~', expression: 'happy' };
  return { text: '이번 주도 잘 해보자! 뭐 고민 있으면 언제든 카톡해.', expression: 'neutral' };
}

export default function WeeklyOverview({ onContinue }: WeeklyOverviewProps) {
  const currentWeek = useGameStore((state) => state.currentWeek);
  const stats = useGameStore((state) => state.stats);
  const eventHistory = useGameStore((state) => state.eventHistory);

  const nextWeek = currentWeek + 1;
  const mood = getMoodEmoji(stats.stress, stats.health);
  const condition = getWeekCondition(nextWeek);
  const weather = getWeatherForWeek(nextWeek);
  const soyeon = getSoyeonAdvice(nextWeek, stats.stress, stats.knowledge, stats.social, stats.health, eventHistory);

  // Simple stat trend from recent events (last 3 entries)
  const recentEvents = eventHistory.slice(-3);

  // Find two most notable stats
  const statEntries: { label: string; value: number; icon: string; status: 'good' | 'warning' | 'danger' }[] = [
    { label: '준비도', value: stats.knowledge, icon: '📖', status: stats.knowledge >= 60 ? 'good' : stats.knowledge >= 40 ? 'warning' : 'danger' },
    { label: '체력', value: stats.health, icon: '💚', status: stats.health >= 50 ? 'good' : stats.health >= 30 ? 'warning' : 'danger' },
    { label: '스트레스', value: stats.stress, icon: '🔥', status: stats.stress <= 40 ? 'good' : stats.stress <= 65 ? 'warning' : 'danger' },
    { label: '인맥', value: stats.social, icon: '👥', status: stats.social >= 40 ? 'good' : stats.social >= 20 ? 'warning' : 'danger' },
    { label: '돈', value: stats.money, icon: '💰', status: stats.money >= 300000 ? 'good' : stats.money >= 100000 ? 'warning' : 'danger' },
    { label: '매력', value: stats.charm, icon: '✨', status: stats.charm >= 40 ? 'good' : 'warning' },
  ];

  // Sort by urgency: danger first, then warning
  const sortedStats = [...statEntries].sort((a, b) => {
    const order = { danger: 0, warning: 1, good: 2 };
    return order[a.status] - order[b.status];
  });
  const topStats = sortedStats.slice(0, 3);

  const statusColor = { good: 'text-teal', warning: 'text-gold', danger: 'text-coral' };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 cursor-pointer" onClick={onContinue}>
      <GlassPanel variant="strong" className="w-full max-w-lg p-6 animate-modal-enter">
        {/* Header with seasonal accent */}
        <div className="text-center mb-5">
          <span className="text-4xl mb-2 block">{mood.emoji}</span>
          <h2 className="text-xl font-bold text-txt-primary">{nextWeek}주차 준비</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-sm text-txt-secondary">{mood.label}</span>
            <span className="text-xs text-txt-secondary/30">·</span>
            <span className="text-xs text-txt-secondary/50">
              {nextWeek <= 3 ? '🌸 3월' : nextWeek <= 7 ? '🌿 4월' : nextWeek <= 11 ? '☀️ 5월' : '🌻 6월'}
            </span>
          </div>
        </div>

        {/* Campus atmosphere — AI-generated or fallback */}
        {(() => {
          const aiDialogue = getCachedDialogue(nextWeek);
          const atmosphere = aiDialogue?.campusAtmosphere;
          // Fallback atmospheric descriptions by semester phase
          const FALLBACK_ATMOSPHERE: Record<number, string> = {
            1: '벚꽃이 만개한 캠퍼스. 신입생들의 설렘이 공기 중에 가득하다.',
            2: '캠퍼스 곳곳에서 동아리 홍보 부스가 활기를 띤다.',
            3: '도서관 앞 벤치에서 학생들이 과제를 논의하고 있다.',
            4: 'MT 시즌이라 과 깃발을 든 학생들이 보인다.',
            5: '수강 변경 기간. 행정실 앞에 줄이 길다.',
            6: '중간고사가 다가오면서 도서관 자리가 부족해지기 시작했다.',
            7: '시험 기간. 편의점 에너지 드링크가 불티나게 팔린다.',
            8: '중간고사가 끝나고 캠퍼스에 잠시 여유가 돌아왔다.',
            9: '축제 준비로 캠퍼스가 화려하게 꾸며지고 있다.',
            10: '가을이 깊어지며 캠퍼스의 나뭇잎이 물들고 있다.',
            11: '공모전 포스터가 게시판을 가득 채우고 있다.',
            12: '겨울이 다가오며 캠퍼스에 찬 바람이 분다.',
            13: '기말고사 준비로 카페마다 학생들이 가득하다.',
            14: '도서관 24시간 개방. 기말 전쟁이 시작됐다.',
            15: '종강을 앞둔 캠퍼스. 학생들 표정이 밝아지고 있다.',
          };
          const text = atmosphere || FALLBACK_ATMOSPHERE[nextWeek] || '';
          if (!text) return null;
          return (
            <p className="text-xs text-txt-secondary/50 italic text-center mb-3 px-4 leading-relaxed">
              {text}
            </p>
          );
        })()}

        {/* Soyeon companion message (PM2 Cube butler pattern) */}
        <div className="flex gap-3 px-3 py-3 mb-4 bg-white/5 rounded-xl border-l-2 border-pink/40">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-pink/10">
            <Image
              src={`/assets/characters/soyeon/${soyeon.expression}.png`}
              alt="소연 선배"
              width={40}
              height={40}
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-pink/70 font-medium">박소연 선배</span>
            <p className="text-sm text-txt-primary/80 leading-relaxed mt-0.5">{soyeon.text}</p>
          </div>
        </div>

        {/* Semester progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-txt-secondary/50 mb-1">
            <span>1주차</span>
            <span>학기 진행도 {Math.round((currentWeek / 16) * 100)}%</span>
            <span>16주차</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-teal rounded-full transition-all duration-500" style={{ width: `${(currentWeek / 16) * 100}%` }} />
          </div>
        </div>

        {/* Knowledge → GPA projection */}
        {currentWeek < 16 && (
          <div className="mb-4 px-3 py-2.5 rounded-xl bg-gold/5 border border-gold/15">
            <div className="flex items-center justify-between">
              <span className="text-xs text-txt-secondary">📊 예상 학점 (현재 준비도 기준)</span>
              <span className="text-sm font-bold text-gold">
                ~{((stats.knowledge / 100) * 4.5).toFixed(1)} / 4.5
              </span>
            </div>
            <p className="text-[10px] text-txt-secondary/50 mt-1">
              {stats.knowledge >= 70 ? '이대로면 A 이상 가능!' :
               stats.knowledge >= 50 ? 'B+ 정도. 더 공부하면 A도 가능해요.' :
               stats.knowledge >= 30 ? 'C+ 수준. 시험 전까지 준비도를 올려야 해요.' :
               '위험! 공부에 집중하지 않으면 학점이 낮을 수 있어요.'}
            </p>
          </div>
        )}

        {/* Stat overview with trend indicators */}
        <div className="flex flex-col gap-2 mb-4">
          <p className="text-xs text-txt-secondary font-medium">현재 상태</p>
          {topStats.map((stat) => {
            // Qualitative descriptions for each stat
            function getQualLabel(label: string, value: number): string {
              if (label === '준비도') return value >= 70 ? '우수' : value >= 45 ? '보통' : value >= 25 ? '부족' : '위험';
              if (label === '체력') return value >= 70 ? '건강' : value >= 45 ? '보통' : value >= 25 ? '피곤' : '위험';
              if (label === '스트레스') return value <= 30 ? '여유' : value <= 50 ? '보통' : value <= 70 ? '힘듦' : '한계';
              if (label === '인맥') return value >= 60 ? '인싸' : value >= 40 ? '보통' : value >= 20 ? '소수' : '외톨이';
              if (label === '매력') return value >= 60 ? '인기' : value >= 40 ? '보통' : '평범';
              return '';
            }
            const qual = stat.label !== '돈' ? getQualLabel(stat.label, stat.value) : '';
            return (
              <div key={stat.label} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-txt-secondary">{stat.icon} {stat.label}</span>
                  {qual && <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${statusColor[stat.status]} bg-white/5`}>{qual}</span>}
                </div>
                <span className={`text-sm font-medium ${statusColor[stat.status]}`}>
                  {stat.label === '돈' ? `₩${stat.value.toLocaleString('ko-KR')}` : `${stat.value}/100`}
                  <span className="ml-1 text-[10px]">
                    {stat.status === 'danger' ? '⬇️' : stat.status === 'warning' ? '➡️' : '⬆️'}
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        {/* NPC Mood Board — who's feeling what this week */}
        {(() => {
          const NPC_INFO: Record<string, { name: string; portrait: string; role: string }> = {
            jaemin: { name: '재민', portrait: '/assets/characters/jaemin/happy.png', role: '룸메' },
            minji: { name: '민지', portrait: '/assets/characters/minji/neutral.png', role: '라이벌' },
            soyeon: { name: '소연', portrait: '/assets/characters/soyeon/neutral.png', role: '선배' },
            hyunwoo: { name: '현우', portrait: '/assets/characters/hyunwoo/neutral.png', role: '동아리' },
          };
          const relationships = useGameStore.getState().relationships;
          const activeNpcs = Object.entries(NPC_INFO)
            .map(([id, info]) => {
              const rel = relationships[id];
              if (!rel || rel.encounters === 0) return null;
              const tier = getRelationshipTier(rel.affection);
              const TIER_EMOJI: Record<string, string> = { stranger: '👤', acquaintance: '🤝', friend: '😊', close_friend: '💛', soulmate: '💕' };
              const weeksSince = rel.lastInteraction ? currentWeek - rel.lastInteraction : 99;
              const decaying = weeksSince >= 3;
              return { id, ...info, affection: rel.affection, tierEmoji: TIER_EMOJI[tier] ?? '👤', decaying };
            })
            .filter(Boolean);

          if (activeNpcs.length === 0) return null;
          return (
            <div className="mb-4">
              <p className="text-xs text-txt-secondary font-medium mb-2">👥 인간관계</p>
              <div className="grid grid-cols-2 gap-2">
                {activeNpcs.map((npc) => npc && (
                  <div key={npc.id} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/5 ${npc.decaying ? 'border border-coral/20' : ''}`}>
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-white/10">
                      <Image src={npc.portrait} alt={npc.name} width={28} height={28} className="object-cover object-top" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-medium text-txt-primary">{npc.name}</span>
                        <span className="text-[10px]">{npc.tierEmoji}</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full mt-0.5">
                        <div className="h-full bg-pink rounded-full transition-all" style={{ width: `${npc.affection}%` }} />
                      </div>
                    </div>
                    {npc.decaying && <span className="text-[10px] text-coral" title="오래 안 만남">📉</span>}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Upcoming events */}
        <div className="flex flex-wrap gap-2 mb-5">
          {condition.type !== 'normal' && (
            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${condition.type === 'festival' ? 'bg-gold/15 text-gold' : 'bg-coral/15 text-coral'}`}>
              {condition.emoji} {condition.label}
            </span>
          )}
          {weather.type !== 'normal' && (
            <span className="px-2.5 py-1 rounded-lg text-xs bg-white/10 text-txt-secondary">
              {weather.emoji} {weather.label}
            </span>
          )}
          {recentEvents.length > 0 && (
            <span className="px-2.5 py-1 rounded-lg text-xs bg-white/5 text-txt-secondary/60">
              📖 추억 {eventHistory.length}개
            </span>
          )}
        </div>

        {/* Campus rumors — what people are saying about you */}
        {(() => {
          const allRels = useGameStore.getState().relationships;
          const rumors = generateRumors(currentWeek, stats, allRels);
          if (rumors.length === 0) return null;
          return (
            <div className="mb-4">
              <p className="text-[10px] text-txt-secondary/40 mb-1.5">👂 캠퍼스 소문</p>
              <div className="flex flex-col gap-1.5">
                {rumors.map((r) => (
                  <div key={r.id} className={`text-[11px] px-3 py-1.5 rounded-lg border ${
                    r.type === 'positive' ? 'bg-teal/5 border-teal/10 text-teal/70'
                    : r.type === 'negative' ? 'bg-coral/5 border-coral/10 text-coral/70'
                    : 'bg-white/[0.02] border-white/5 text-txt-secondary/50'
                  } italic`}>
                    {r.text}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Continue button */}
        <button
          onClick={onContinue}
          className="w-full py-3 rounded-xl font-semibold text-base transition-all duration-300 cursor-pointer bg-teal/20 text-teal border border-teal/30 hover:bg-teal/30 active:scale-[0.98]"
        >
          다음 주 스케줄 짜기
        </button>
        <button
          onClick={onContinue}
          className="w-full py-1.5 text-[10px] text-txt-secondary/30 hover:text-txt-secondary/60 transition-colors cursor-pointer"
        >
          아무 곳이나 탭하여 건너뛰기
        </button>
      </GlassPanel>
    </div>
  );
}
