'use client';

import { useEffect, useState } from 'react';

interface WeekTitleCardProps {
  week: number;
  onDone: () => void;
}

const WEEK_TITLES: Record<number, { title: string; subtitle: string }> = {
  1: { title: '입학', subtitle: '새로운 시작, 새로운 인연' },
  2: { title: '적응기', subtitle: '캠퍼스 생활에 익숙해지는 중' },
  3: { title: '첫 과제', subtitle: '조별과제의 세계에 오신 걸 환영합니다' },
  4: { title: 'MT 시즌', subtitle: '대학 생활의 꽃, 엠티!' },
  5: { title: '수강 변경', subtitle: '지금이 마지막 기회' },
  6: { title: '시험 준비', subtitle: '중간고사가 다가온다' },
  7: { title: '중간고사', subtitle: '첫 번째 고비' },
  8: { title: '반환점', subtitle: '절반을 넘었다. 여기까지 온 걸 자랑스러워해도 좋아.' },
  9: { title: '축제 주간', subtitle: '캠퍼스가 축제로 물든다' },
  10: { title: '중간 슬럼프', subtitle: '쉬어가도 괜찮아' },
  11: { title: '성적 발표', subtitle: '현실을 직면할 시간' },
  12: { title: '공모전 시즌', subtitle: '도전할 것인가, 안정을 택할 것인가' },
  13: { title: '기말 준비', subtitle: '마지막 전투를 앞두고' },
  14: { title: '기말고사', subtitle: '최후의 스퍼트' },
  15: { title: '종강', subtitle: '1학기의 끝, 그리고...' },
  16: { title: '마지막 주', subtitle: '학기의 마무리. 최선을 다하자.' },
};

export default function WeekTitleCard({ week, onDone }: WeekTitleCardProps) {
  const [visible, setVisible] = useState(true);

  const info = WEEK_TITLES[week] ?? { title: `${week}주차`, subtitle: '' };

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300); // wait for fade out
    }, 1000);
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
        <p className="text-lg text-txt-secondary/70 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {info.subtitle}
        </p>
      </div>
    </div>
  );
}
