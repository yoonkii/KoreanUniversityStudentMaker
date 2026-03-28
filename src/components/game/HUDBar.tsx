'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getWeatherForWeek } from '@/lib/gameEngine';
import type { ExamResults } from '@/store/types';
import RelationshipPanel from './RelationshipPanel';

const SEMESTER_WEEKS = 16;

function getSemesterLabel(week: number): string {
  const semesterIndex = Math.floor((week - 1) / SEMESTER_WEEKS);
  const year = Math.floor(semesterIndex / 2) + 1;
  const semester = (semesterIndex % 2) + 1;
  const weekInSemester = ((week - 1) % SEMESTER_WEEKS) + 1;
  return `${year}학년 ${semester}학기 ${weekInSemester}주차`;
}

function getWeekEvent(week: number): { label: string; color: string } | null {
  const w = ((week - 1) % SEMESTER_WEEKS) + 1;
  if (w === 7 || w === 8) return { label: '중간고사', color: 'text-coral' };
  if (w === 14 || w === 15) return { label: '기말고사', color: 'text-red-400' };
  if (w === 9) return { label: '축제', color: 'text-pink' };
  if (w === 4) return { label: 'MT 시즌', color: 'text-lavender' };
  return null;
}

function getStressEmoji(stress: number): string {
  if (stress >= 90) return '🤯';
  if (stress >= 70) return '😰';
  if (stress >= 50) return '😓';
  if (stress >= 30) return '😐';
  return '😊';
}

function getStressColor(stress: number): string {
  if (stress >= 80) return 'text-red-400 animate-pulse';
  if (stress >= 60) return 'text-orange-400';
  if (stress >= 40) return 'text-yellow-400';
  return 'text-green-400';
}

export default function HUDBar() {
  const currentWeek = useGameStore((state) => state.currentWeek);
  const stats = useGameStore((state) => state.stats);
  const examResults = useGameStore((state) => state.examResults);
  const relationships = useGameStore((state) => state.relationships);
  const [showRelPanel, setShowRelPanel] = useState(false);
  const knowledge = stats?.knowledge ?? 50;
  const stress = stats?.stress ?? 0;
  const health = stats?.health ?? 100;
  const money = stats?.money ?? 0;
  const weekInSemester = ((currentWeek - 1) % SEMESTER_WEEKS) + 1;
  const semesterProgress = (weekInSemester / SEMESTER_WEEKS) * 100;

  return (
    <>
      {/* Stress pulse overlay at high stress */}
      {stress >= 80 && (
        <div className="fixed inset-0 z-25 pointer-events-none animate-pulse" style={{ background: `radial-gradient(ellipse at center, transparent 60%, rgba(239,68,68,${(stress - 80) * 0.01}) 100%)` }} />
      )}

      <div className="fixed top-0 left-0 right-0 z-30 glass">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 py-2.5 md:px-6">
          {/* Left: Calendar + semester info */}
          <div className="flex items-center gap-2 text-sm">
            <iconify-icon icon="solar:calendar-bold" width="18" height="18" className="text-teal" />
            <span className="text-txt-primary font-medium">{getSemesterLabel(currentWeek)}</span>
            {getWeekEvent(currentWeek) && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md bg-white/10 ${getWeekEvent(currentWeek)!.color}`}>
                {getWeekEvent(currentWeek)!.label}
              </span>
            )}
            {(() => {
              const weather = getWeatherForWeek(currentWeek);
              if (weather.type === 'normal') return null;
              return (
                <span className="text-xs px-1.5 py-0.5 rounded-md bg-white/5 text-txt-secondary" title={weather.hint}>
                  {weather.emoji}
                </span>
              );
            })()}
            {/* Exam countdown — builds anticipation */}
            {(() => {
              const w = weekInSemester;
              if (w >= 5 && w < 7) return <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-coral/10 text-coral/70 animate-pulse">중간고사 D-{7 - w}주</span>;
              if (w >= 12 && w < 14) return <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-400/70 animate-pulse">기말고사 D-{14 - w}주</span>;
              return null;
            })()}
          </div>

          {/* Center: Mood + relationship indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm" title={`스트레스 ${Math.round(stress)} | 체력 ${health}`}>
              <span className={getStressColor(stress)}>{getStressEmoji(stress)}</span>
              <span className={`text-[10px] ${getStressColor(stress)}`}>
                {stress >= 80 ? '한계...' : stress >= 60 ? '힘들다' : stress >= 40 ? '보통' : health >= 60 ? '좋아!' : '괜찮아'}
              </span>
            </div>
            {/* Relationship quick indicator — tap to open panel */}
            {(() => {
              const NPC_KO: Record<string, string> = { jaemin: '재민', minji: '민지', soyeon: '소연', hyunwoo: '현우' };
              // Find romance partner or closest friend
              const romantic = Object.entries(relationships)
                .filter(([, r]) => (r.romance ?? 0) >= 10)
                .sort(([, a], [, b]) => (b.romance ?? 0) - (a.romance ?? 0))[0];
              const bestFriend = Object.entries(relationships)
                .filter(([id]) => NPC_KO[id])
                .sort(([, a], [, b]) => (b.friendship ?? b.affection ?? 0) - (a.friendship ?? a.affection ?? 0))[0];

              const target = romantic || bestFriend;
              if (!target) return null;
              const [npcId, rel] = target;
              const name = NPC_KO[npcId];
              if (!name) return null;
              const rom = rel.romance ?? 0;
              const isRomantic = rom >= 10;
              const tierEmoji = rom >= 70 ? '💗' : rom >= 45 ? '💕' : rom >= 25 ? '💓' : rom >= 10 ? '💭' : (rel.friendship ?? rel.affection ?? 0) >= 60 ? '💛' : '🤝';

              return (
                <button
                  onClick={() => setShowRelPanel(true)}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  title="인간관계 보기"
                >
                  <span className="text-[10px]">{tierEmoji}</span>
                  <span className={`text-[9px] font-medium ${isRomantic ? 'text-pink/70' : 'text-txt-secondary/50'}`}>{name}</span>
                </button>
              );
            })()}
          </div>

          {/* Right: Quick-glance mini stat bars (mobile only) */}
          <div className="flex items-center gap-2 text-xs text-txt-secondary lg:hidden">
            {([
              { emoji: '📚', value: knowledge, max: 100, color: '#FFD166', label: '준비도' },
              { emoji: '♥', value: health, max: 100, color: health < 30 ? '#FF6B6B' : '#4ECDC4', label: '체력' },
              { emoji: '🔥', value: stress, max: 100, color: stress > 70 ? '#FF6B6B' : stress > 40 ? '#FFA500' : '#4ECDC4', label: '스트레스' },
            ] as const).map(stat => (
              <div key={stat.label} className="flex items-center gap-1" title={`${stat.label} ${stat.value}/100`}>
                <span style={{ color: stat.color }} className="text-[10px]">{stat.emoji}</span>
                <div className="w-10 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${stat.value}%`, backgroundColor: stat.color }} />
                </div>
              </div>
            ))}
            <div className="flex items-center gap-0.5" title={`₩${money.toLocaleString('ko-KR')}`}>
              <span className="text-[10px]" style={{ color: '#FFD166' }}>₩</span>
              <span className="font-mono text-[10px]">{money >= 10000 ? `${Math.floor(money / 10000)}만` : money.toLocaleString('ko-KR')}</span>
            </div>
          </div>

          {/* Right: Semester count (desktop — sidebar already shows stats) */}
          <div className="hidden lg:flex items-center gap-2 text-sm text-txt-secondary">
            <span>{weekInSemester}/{SEMESTER_WEEKS}주</span>
          </div>
        </div>

        {/* Semester progress bar with milestone markers */}
        <div className="w-full h-1.5 bg-white/5 relative">
          <div className="h-full bg-teal/40 transition-all duration-700 ease-out rounded-r-full" style={{ width: `${semesterProgress}%` }} />
          {/* Milestone markers */}
          {[
            { week: 4, label: 'MT' },
            { week: 8, label: '중간' },
            { week: 9, label: '축제' },
            { week: 15, label: '기말' },
          ].map(({ week, label }) => (
            <div
              key={week}
              className="absolute top-0 h-full flex items-center"
              style={{ left: `${(week / SEMESTER_WEEKS) * 100}%` }}
            >
              <div className={`w-px h-full ${weekInSemester >= week ? 'bg-teal/60' : 'bg-white/15'}`} />
              <span className={`absolute -bottom-3.5 -translate-x-1/2 text-[7px] ${weekInSemester >= week ? 'text-teal/50' : 'text-white/15'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
      {showRelPanel && <RelationshipPanel onClose={() => setShowRelPanel(false)} />}
    </>
  );
}
