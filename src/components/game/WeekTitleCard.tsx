'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';

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

/** Generate a contextual subtitle based on current game state */
function getContextualSubtitle(week: number, stats: { stress: number; knowledge: number; social: number; health: number; money: number }): string {
  // Week-specific overrides
  if (week === 1) return '새로운 시작, 새로운 인연';
  if (week === 4) return '대학 생활의 꽃, 엠티!';
  if (week === 7) return '첫 번째 고비. 준비된 만큼 보여줄 시간.';
  if (week === 9) return '캠퍼스가 축제로 물든다';
  if (week === 14) return '마지막 전투. 최후의 스퍼트!';
  if (week === 15) return '1학기의 끝, 그리고...';

  // Stat-reactive subtitles — what the player is feeling right now
  if (stats.stress > 80) return '한계에 가까워지고 있다... 버틸 수 있을까?';
  if (stats.stress > 65) return '피곤하다. 조금만 더 힘내자.';
  if (stats.health < 25) return '몸이 무겁다. 쉬어가야 할 것 같은데...';
  if (stats.money < 30000) return '통장이 텅 비어간다. 이번 주도 라면인가.';
  if (stats.knowledge >= 70 && stats.social >= 50) return '공부도 인맥도 순조롭다. 갓생러의 길!';
  if (stats.knowledge >= 60) return '공부가 점점 재밌어지고 있다.';
  if (stats.social >= 60) return '캠퍼스 어딜 가든 아는 얼굴이 있다.';
  if (stats.social < 20 && week > 4) return '요즘 혼자인 시간이 많다.';

  // Generic but varied
  const generic = [
    '평범한 하루의 시작. 하지만 오늘이 특별해질 수도.',
    '벚꽃은 졌지만, 아직 할 일이 많다.',
    '이번 주는 어떤 선택을 하게 될까.',
    '시간은 기다려주지 않는다.',
    '매일이 새롭고, 매 순간이 선택이다.',
  ];
  return generic[week % generic.length];
}

export default function WeekTitleCard({ week, onDone }: WeekTitleCardProps) {
  const [visible, setVisible] = useState(true);
  const stats = useGameStore((s) => s.stats);

  const info = WEEK_TITLES[week] ?? { title: `${week}주차` };
  const subtitle = getContextualSubtitle(week, stats);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 1200); // Slightly longer for reading
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
      </div>
    </div>
  );
}
