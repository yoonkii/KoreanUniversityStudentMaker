'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import GlassPanel from '@/components/ui/GlassPanel';
import ProgressBar from '@/components/ui/ProgressBar';
import { getCharacter } from '@/data/characters';
import type { PlayerStats } from '@/store/types';

interface WeekSummaryProps {
  onContinue: () => void;
}

// ── Stat display config ────────────────────────────────────────────────────────
const STAT_CONFIG: { key: keyof PlayerStats; label: string; icon: string; color: 'teal' | 'gold' | 'pink' | 'coral' | 'lavender'; isMoney?: boolean; isGpa?: boolean }[] = [
  { key: 'gpa', label: '학점', icon: 'solar:star-bold', color: 'gold', isGpa: true },
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
  if (key === 'gpa') {
    const gpaDelta = (delta / 100) * 4.5;
    const prefix = gpaDelta >= 0 ? '+' : '';
    return `${prefix}${gpaDelta.toFixed(1)}`;
  }
  const prefix = delta > 0 ? '+' : '';
  return `${prefix}${delta}`;
}

function formatStatDisplay(key: keyof PlayerStats, value: number): string {
  if (key === 'money') return `\u20A9${value.toLocaleString('ko-KR')}`;
  if (key === 'gpa') return `${((value / 100) * 4.5).toFixed(1)} / 4.5`;
  return `${value} / 100`;
}

// ── Micro-events ───────────────────────────────────────────────────────────────
interface MicroEvent {
  id: string;
  emoji: string;
  description: string;
  choices: { text: string; emoji: string; statEffects: Partial<PlayerStats> }[];
}

const MICRO_EVENTS: MicroEvent[] = [
  { id: 'rain', emoji: '🌧️', description: '비가 온다. 우산이 없다. 뛰어야 할까, 기다릴까?', choices: [{ text: '전력질주!', emoji: '🏃', statEffects: { health: -3, stress: 5 } }, { text: '처마 밑에서 기다리기', emoji: '☂️', statEffects: { health: 2, stress: -5 } }] },
  { id: 'vending', emoji: '🥤', description: '자판기에서 음료수가 두 개 나왔다! 오늘 운수 대통~', choices: [{ text: '럭키~ 챙겨가기 🎉', emoji: '🎉', statEffects: { money: 2000, stress: -5 } }] },
  { id: 'professor', emoji: '👨‍🏫', description: '교수님이 복도에서 인사하셨다. "요즘 열심히 하던데?"', choices: [{ text: '"네, 교수님!" 밝게 인사', emoji: '😊', statEffects: { gpa: 2, social: 3 } }, { text: '어색하게 고개만 끄덕', emoji: '😅', statEffects: { gpa: 1 } }] },
  { id: 'snack', emoji: '🍜', description: '학식 오늘 메뉴가 라면이다. 소소한 대학 생활의 행복.', choices: [{ text: '2개 시키기', emoji: '🍜', statEffects: { health: -3, stress: -8, money: -3000 } }, { text: '1개만 먹기', emoji: '🥢', statEffects: { stress: -4, money: -1500 } }] },
  { id: 'found_money', emoji: '💸', description: '주머니에서 잊고 있던 만원 발견! 과거의 나 고마워~', choices: [{ text: '편의점 달려가기', emoji: '🛒', statEffects: { money: 10000, stress: -5 } }] },
  { id: 'study_spot', emoji: '📚', description: '도서관에서 제일 좋아하는 자리를 잡았다. 집중력 MAX!', choices: [{ text: '오늘 작심삼일 공부!', emoji: '✍️', statEffects: { gpa: 3, stress: 3, health: -2 } }, { text: '낮잠이나 자자', emoji: '😴', statEffects: { health: 5, stress: -5 } }] },
];

// ── Streak logic ───────────────────────────────────────────────────────────────
const STUDY_SET = new Set(['lecture', 'study']);
const EXERCISE_SET = new Set(['exercise']);
const SOCIAL_SET = new Set(['friends', 'club', 'date']);

type StreakCategory = 'study' | 'exercise' | 'social';

const STREAK_INFO: Record<StreakCategory, { title: string; emoji: string; desc: string; statEffects: Partial<PlayerStats> }> = {
  study: { title: '공부벌레', emoji: '📚', desc: '3주 연속 공부!', statEffects: { gpa: 2 } },
  exercise: { title: '운동왕', emoji: '💪', desc: '3주 연속 운동!', statEffects: { health: 3 } },
  social: { title: '인싸 모드 활성화', emoji: '🌟', desc: '3주 연속 친목 활동!', statEffects: { social: 2 } },
};

function getDominantCategory(ids: string[]): StreakCategory | null {
  let study = 0, exercise = 0, social = 0;
  for (const id of ids) {
    if (STUDY_SET.has(id)) study++;
    else if (EXERCISE_SET.has(id)) exercise++;
    else if (SOCIAL_SET.has(id)) social++;
  }
  const max = Math.max(study, exercise, social);
  if (max === 0) return null;
  if (study === max) return 'study';
  if (exercise === max) return 'exercise';
  return 'social';
}

function detectStreak(history: string[][], currentIds: string[]): StreakCategory | null {
  const all = [...history, currentIds];
  if (all.length < 3) return null;
  const last3 = all.slice(-3).map(getDominantCategory);
  if (last3[0] && last3[0] === last3[1] && last3[1] === last3[2]) return last3[0];
  return null;
}

// ── Fun recap generator ────────────────────────────────────────────────────────
function generateRecap(stats: PlayerStats, deltas: Partial<PlayerStats>, week: number, lastEvent: { summary: string; npcInvolved?: string } | undefined, relationships: Record<string, { affection: number }>): string[] {
  const lines: string[] = [];
  if (lastEvent?.summary) {
    const npcName = lastEvent.npcInvolved ? (getCharacter(lastEvent.npcInvolved)?.name ?? null) : null;
    lines.push(npcName ? `이번 주 하이라이트: ${npcName}와(과) ${lastEvent.summary.slice(0, 18)}... 🎬` : `이번 주: ${lastEvent.summary.slice(0, 28)} 🎬`);
  } else if (week <= 1) {
    lines.push('대학 생활 첫 주가 끝났다. 앞으로 어떤 일이 기다릴까? 🎓');
  }
  if (stats.stress > 80) {
    lines.push('스트레스 레벨: 위험!! 번아웃 직전이다... 😱 제발 좀 쉬어라');
  } else if (stats.stress > 60) {
    lines.push('스트레스 레벨: 많이 지쳤다. 다음 주는 좀 쉬어야 할 듯... 😰');
  } else if (stats.stress < 20) {
    lines.push('스트레스 없음! 몸과 마음이 상쾌하다 ✨');
  }
  if (stats.health < 30) lines.push('체력이 바닥이다. 쓰러지기 전에 좀 쉬어라... 💔');
  if (deltas.social && deltas.social >= 5) {
    const top = Object.entries(relationships).sort(([, a], [, b]) => b.affection - a.affection)[0];
    if (top) {
      const name = getCharacter(top[0])?.name ?? top[0];
      lines.push(`인맥 파워: ↑↑↑ ${name}이(가) 당신에게 더 관심을 보이기 시작했다 💕`);
    }
  }
  if (stats.money < 50000) lines.push('통장 잔고 위험 🚨 다음 주엔 알바 시간을 늘려야 할 것 같은데...');
  if (deltas.gpa && deltas.gpa >= 5) lines.push('학점이 쭉쭉 올라가고 있다! 이 기세를 유지하자 📈');
  return lines.slice(0, 3);
}

// ── NPC messages ──────────────────────────────────────────────────────────────
const NPC_MSG_POOL: Record<string, { high: string[]; mid: string[]; low: string }> = {
  soyeon: { high: ['오빠 이번 주말에 뭐해? ㅋㅋ 📱', '요즘 얼굴 보고 싶다~', '오빠 밥은 먹고 다녀? 걱정돼 ㅠㅠ'], mid: ['요즘 바쁜가봐~ 나중에 같이 커피 마셔요 ☕', '동아리 모임 잊지 마세요!'], low: '...' },
  jaemin: { high: ['야 과제 다 했어? 나 아직 못 했는데... 😭', '오늘 학식 같이 먹자! ㅋㅋ', 'ㄹㅇ 요즘 너 없으면 캠퍼스가 재미없다'], mid: ['야 과제 했어? 나 아직...', '이번 주도 파이팅 ㅎ'], low: '(읽음)' },
  minji: { high: ['이번 시험 어떻게 된 것 같아요?', '같이 공부하는 거... 생각해봤어요. 딱히 필요해서는 아니고.'], mid: ['열심히 하네요.', '다음 발표 준비됐어요?'], low: '.' },
  hyunwoo: { high: ['야 이번 주말에 밴드 연습 있는데 올래?', '요즘 어때, 대학 생활 적응됐어?'], mid: ['잘 지내? 힘든 거 있으면 말해', '동아리 오면 좋을 텐데~'], low: '(봤어요)' },
  minsu: { high: ['야!! 오늘 뭐해 뭐해?? 같이 놀자!!!', 'ㄹㅇ 요즘 너랑 있으면 너무 재밌음ㅋㅋ'], mid: ['야 오늘 점심 뭐 먹었어', '이번 주 수고했다~'], low: '(...)' },
  jiwon: { high: ['이번 주 공부 어땠어요? 같이 스터디 해볼까요?', '교수님 수업 필기 공유해드릴게요.'], mid: ['강의 잘 들었어요?', '과제 제출 기한 확인했죠?'], low: '..' },
};

const CHAR_BUBBLE_CLASS: Record<string, string> = {
  pink: 'border-pink/40 bg-pink/10',
  teal: 'border-teal/40 bg-teal/10',
  gold: 'border-gold/40 bg-gold/10',
  coral: 'border-coral/40 bg-coral/10',
  lavender: 'border-lavender/40 bg-lavender/10',
};
const CHAR_NAME_CLASS: Record<string, string> = {
  pink: 'text-pink', teal: 'text-teal', gold: 'text-gold', coral: 'text-coral', lavender: 'text-lavender',
};

function generateNPCMessages(relationships: Record<string, { affection: number }>): { id: string; name: string; message: string; color: string }[] {
  const result: { id: string; name: string; message: string; color: string }[] = [];
  const sorted = Object.entries(relationships).filter(([, r]) => r.affection >= 20).sort(([, a], [, b]) => b.affection - a.affection).slice(0, 2);
  for (const [charId, rel] of sorted) {
    const char = getCharacter(charId);
    const pool = NPC_MSG_POOL[charId];
    if (!char || !pool) continue;
    const msgs = rel.affection >= 65 ? pool.high : rel.affection >= 35 ? pool.mid : null;
    const message = msgs ? msgs[Math.floor(Math.random() * msgs.length)] : pool.low;
    result.push({ id: charId, name: char.name, message, color: char.color });
  }
  return result;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function WeekSummary({ onContinue }: WeekSummaryProps) {
  const currentWeek = useGameStore((state) => state.currentWeek);
  const stats = useGameStore((state) => state.stats);
  const weekStatDeltas = useGameStore((state) => state.weekStatDeltas);
  const relationships = useGameStore((state) => state.relationships);
  const scheduleHistory = useGameStore((state) => state.scheduleHistory);
  const schedule = useGameStore((state) => state.schedule);
  const eventHistory = useGameStore((state) => state.eventHistory);
  const updateStats = useGameStore((state) => state.updateStats);

  // Stable micro-event (picked once on mount)
  const [microEvent] = useState<MicroEvent | null>(() => Math.random() < 0.3 ? MICRO_EVENTS[Math.floor(Math.random() * MICRO_EVENTS.length)] : null);
  const [microResolved, setMicroResolved] = useState(false);
  const [microChoiceText, setMicroChoiceText] = useState<string | null>(null);

  // Stable NPC messages (picked once on mount)
  const npcMessages = useMemo(() => generateNPCMessages(relationships), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Streak detection — includes current week's schedule
  const currentIds: string[] = useMemo(() => schedule ? Object.values(schedule).flat().map((s) => s.activityId) : [], [schedule]);
  const streak = useMemo(() => detectStreak(scheduleHistory, currentIds), [scheduleHistory, currentIds]);

  // Apply streak bonus stats once on mount
  const streakApplied = useRef(false);
  useEffect(() => {
    if (streak && !streakApplied.current) {
      streakApplied.current = true;
      updateStats(STREAK_INFO[streak].statEffects);
    }
  }, [streak, updateStats]);

  // Fun recap
  const lastEvent = eventHistory.at(-1);
  const recapLines = useMemo(() => generateRecap(stats, weekStatDeltas, currentWeek, lastEvent, relationships), []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMicroChoice = (choice: { text: string; emoji: string; statEffects: Partial<PlayerStats> }) => {
    updateStats(choice.statEffects);
    setMicroChoiceText(`${choice.emoji} ${choice.text}`);
    setMicroResolved(true);
  };

  const canContinue = !microEvent || microResolved;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
      <GlassPanel variant="strong" className="w-full max-w-lg p-6 my-4">
        {/* Header */}
        <div className="text-center mb-4">
          <p className="text-sm text-txt-secondary mb-1">주간 결산</p>
          <h2 className="text-2xl font-bold text-txt-primary">{currentWeek}주차 완료</h2>
        </div>

        {/* Fun recap */}
        {recapLines.length > 0 && (
          <div className="glass rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-teal mb-2 uppercase tracking-wider">이번 주 요약</p>
            <div className="flex flex-col gap-1.5">
              {recapLines.map((line, i) => <p key={i} className="text-sm text-txt-primary break-keep">{line}</p>)}
            </div>
          </div>
        )}

        {/* Streak reward */}
        {streak && (
          <div className="rounded-xl p-4 mb-4 border border-gold/40 bg-gold/10">
            <p className="text-sm font-bold text-gold">{STREAK_INFO[streak].emoji} {STREAK_INFO[streak].desc} <span className="text-txt-primary">{STREAK_INFO[streak].title} 칭호 획득!</span></p>
            <p className="text-xs text-txt-secondary mt-1">{Object.entries(STREAK_INFO[streak].statEffects).map(([k, v]) => { const l: Record<string, string> = { gpa: '학점', health: '체력', social: '인맥' }; return `${l[k] ?? k} 보너스 +${v}`; }).join(', ')}</p>
          </div>
        )}

        {/* NPC messages */}
        {npcMessages.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-txt-secondary mb-2 flex items-center gap-1.5"><span>📱</span>카카오톡</p>
            <div className="flex flex-col gap-2">
              {npcMessages.map((msg) => (
                <div key={msg.id} className={`rounded-xl px-4 py-3 border ${CHAR_BUBBLE_CLASS[msg.color] ?? 'border-white/10 bg-white/5'}`}>
                  <p className={`text-xs font-bold mb-1 ${CHAR_NAME_CLASS[msg.color] ?? 'text-txt-secondary'}`}>{msg.name}</p>
                  <p className="text-sm text-txt-primary">{msg.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Micro-event */}
        {microEvent && !microResolved && (
          <div className="glass rounded-xl p-4 mb-4 border border-teal/25">
            <p className="text-xs font-semibold text-teal mb-2">⚡ 갑작스러운 이벤트</p>
            <p className="text-sm text-txt-primary mb-3">{microEvent.emoji} {microEvent.description}</p>
            <div className="flex gap-2">
              {microEvent.choices.map((c) => (
                <button key={c.text} onClick={() => handleMicroChoice(c)} className="flex-1 glass rounded-lg py-2 px-3 text-sm text-txt-primary hover:bg-teal/10 transition-colors cursor-pointer text-center">
                  {c.emoji} {c.text}
                </button>
              ))}
            </div>
          </div>
        )}
        {microEvent && microResolved && (
          <div className="rounded-xl p-3 mb-4 border border-teal/20 bg-teal/5">
            <p className="text-xs text-teal">✓ {microChoiceText} 선택함</p>
          </div>
        )}

        {/* Stat changes */}
        <div className="flex flex-col gap-4 mb-6">
          {STAT_CONFIG.map(({ key, label, icon, color, isMoney, isGpa }) => {
            const delta = weekStatDeltas[key];
            return (
              <div key={key} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <iconify-icon icon={icon} width="16" height="16" />
                    <span className="text-sm text-txt-secondary">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {delta !== undefined && delta !== 0 && (
                      <span className={`text-xs font-medium ${key === 'stress' ? (delta > 0 ? 'text-coral' : 'text-teal') : (delta > 0 ? 'text-teal' : 'text-coral')}`}>
                        {delta > 0 ? '\u25B2' : '\u25BC'} {formatDelta(key, delta)}
                      </span>
                    )}
                    <span className="text-sm text-txt-primary font-medium">{formatStatDisplay(key, stats[key])}</span>
                  </div>
                </div>
                {!isMoney && <ProgressBar value={isGpa ? stats.gpa : stats[key]} color={color} size="sm" />}
              </div>
            );
          })}
        </div>

        {/* Continue button */}
        <button onClick={onContinue} disabled={!canContinue} className="w-full py-3 rounded-xl font-semibold text-base transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-teal/20 text-teal border border-teal/30 hover:bg-teal/30 active:scale-[0.98]">
          {canContinue ? '다음 주 시작 →' : '이벤트를 먼저 해결해주세요'}
        </button>
      </GlassPanel>
    </div>
  );
}
