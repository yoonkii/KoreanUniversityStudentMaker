'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getCachedAiCampus } from '@/lib/livingCampus';

interface WeekTitleCardProps {
  week: number;
  onDone: () => void;
}

const WEEK_TITLES: Record<number, { title: string }> = {
  1: { title: '입학' },
  2: { title: '적응기' },
  3: { title: '첫 과제' },
  4: { title: 'MT 시즌' },
  5: { title: '수강 변경' },
  6: { title: '시험 준비' },
  7: { title: '중간고사' },
  8: { title: '반환점' },
  9: { title: '축제 주간' },
  10: { title: '중간 슬럼프' },
  11: { title: '성적 발표' },
  12: { title: '공모전 시즌' },
  13: { title: '기말 준비' },
  14: { title: '기말고사' },
  15: { title: '종강' },
  16: { title: '마지막 주' },
};

/** Generate a contextual subtitle based on game state + relationships */
function getContextualSubtitle(week: number, stats: { stress: number; knowledge: number; social: number; health: number; money: number }): string {
  const NPC_KO: Record<string, string> = { jaemin: '재민', minji: '민지', soyeon: '소연 선배', hyunwoo: '현우 선배' };
  const rels = useGameStore.getState().relationships;

  // Find romance partner
  const romantic = Object.entries(rels)
    .filter(([, r]) => (r.romance ?? 0) >= 10)
    .sort(([, a], [, b]) => (b.romance ?? 0) - (a.romance ?? 0))[0];
  const romName = romantic ? NPC_KO[romantic[0]] : '';
  const romLevel = romantic ? (romantic[1].romance ?? 0) : 0;

  // Week-specific overrides (with romance flavor)
  if (week === 1) return '새로운 시작, 새로운 인연';
  if (week === 4) return '대학 생활의 꽃, 엠티!';
  if (week === 7) return romLevel >= 25 ? `시험도 걱정되지만... ${romName} 생각이 더 난다.` : '첫 번째 고비. 준비된 만큼 보여줄 시간.';
  if (week === 9) return romLevel >= 25 ? `축제, ${romName}과(와) 함께라면 더 빛날 거야.` : '캠퍼스가 축제로 물든다';
  if (week === 14) return romLevel >= 45 ? `마지막 전투. ${romName}이(가) 응원해주고 있다.` : '마지막 전투. 최후의 스퍼트!';
  if (week === 15) return romLevel >= 45 ? `1학기의 끝. ${romName}과(와)의 이야기는 계속된다.` : '1학기의 끝, 그리고...';

  // Romance-reactive subtitles (highest priority after week-specific)
  if (romLevel >= 45) return `${romName}과(와) 함께라면 어떤 주도 좋다.`;
  if (romLevel >= 25) return `${romName} 생각에 자꾸 웃음이 나온다.`;
  if (romLevel >= 10 && Math.random() < 0.4) return `${romName}을(를) 볼 수 있는 한 주. 괜히 설렌다.`;

  // Crisis-level stat overrides
  if (stats.stress > 80) return '한계에 가까워지고 있다... 버틸 수 있을까?';
  if (stats.health < 25) return '몸이 무겁다. 쉬어가야 할 것 같은데...';
  if (stats.money < 30000) return '통장이 텅 비어간다. 이번 주도 라면인가.';

  // Positive stat subtitles
  if (stats.knowledge >= 70 && stats.social >= 50) return '공부도 인맥도 순조롭다. 갓생러의 길!';
  if (stats.knowledge >= 60) return '공부가 점점 재밌어지고 있다.';
  if (stats.social >= 60) return '캠퍼스 어딜 가든 아는 얼굴이 있다.';
  if (stats.stress > 65) return '피곤하다. 조금만 더 힘내자.';
  if (stats.social < 20 && week > 4) return '요즘 혼자인 시간이 많다.';

  // Semester phase atmosphere
  if (week <= 3) return '아직 모든 게 새롭다. 어떤 가능성이든 열려 있다.';
  if (week <= 6) return '루틴이 잡히기 시작했다. 이 페이스를 유지하자.';
  if (week <= 10) return '학기가 절반을 넘었다. 뒤돌아보면 많이 왔다.';
  if (week <= 13) return '끝이 보인다. 남은 시간을 어떻게 쓸까.';

  return '매일이 새롭고, 매 순간이 선택이다.';
}

export default function WeekTitleCard({ week, onDone }: WeekTitleCardProps) {
  const [visible, setVisible] = useState(true);
  const stats = useGameStore((s) => s.stats);
  const diaryEntries = useGameStore((s) => s.diaryEntries);

  const info = WEEK_TITLES[week] ?? { title: `${week}주차` };
  const subtitle = getContextualSubtitle(week, stats);
  const lastDiary = week > 1 ? diaryEntries.find(d => d.week === week - 1) : null;
  const aiCampus = getCachedAiCampus();
  const aiAtmosphere = aiCampus?.week === week ? aiCampus.atmosphere : null;

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 2000); // 2 seconds — enough time to read title + atmosphere
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy/90 backdrop-blur-sm transition-opacity duration-400 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="text-center">
        <p className="text-txt-secondary/50 text-sm tracking-widest mb-2">{week}주차</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-txt-primary mb-3 animate-fade-in-up">
          {info.title}
        </h1>
        <p className="text-lg text-txt-secondary/70 animate-fade-in-up max-w-md px-4" style={{ animationDelay: '0.2s' }}>
          {subtitle}
        </p>
        {/* AI-generated campus atmosphere */}
        {aiAtmosphere && (
          <p className="text-[11px] text-txt-secondary/50 mt-3 animate-fade-in-up max-w-sm px-6 leading-relaxed" style={{ animationDelay: '0.25s' }}>
            {aiAtmosphere}
          </p>
        )}

        {/* Last week memory flash */}
        {lastDiary && !aiAtmosphere && (
          <p className="text-[10px] text-txt-secondary/30 mt-2 animate-fade-in-up italic max-w-sm px-6" style={{ animationDelay: '0.3s' }}>
            지난 주: {lastDiary.text.slice(0, 50)}{lastDiary.text.length > 50 ? '...' : ''}
          </p>
        )}
        {/* Mood music indicator — atmospheric suggestion */}
        <p className="text-[10px] text-txt-secondary/20 mt-4 animate-fade-in-up tracking-wider" style={{ animationDelay: '0.4s' }}>
          {week <= 3 ? '♪ 새로운 시작 — 설레는 봄의 멜로디' :
           week === 4 ? '♪ MT의 밤 — 캠프파이어 기타' :
           week <= 6 ? '♪ 일상의 리듬 — 카페 재즈' :
           week <= 8 ? '♪ 긴장감 — 시험의 정적' :
           week === 9 ? '♪ 축제의 열기 — 밴드 사운드' :
           week <= 11 ? '♪ 가을 산책 — 잔잔한 피아노' :
           week <= 13 ? '♪ 마지막 질주 — 결의의 테마' :
           week <= 15 ? '♪ 그리고 — 이별과 시작의 노래' :
           '♪ 에필로그 — 추억의 멜로디'}
        </p>
      </div>
    </div>
  );
}
