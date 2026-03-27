'use client';

import { useEffect, useRef, useState } from 'react';
import type { PlayerStats } from '@/store/types';

interface StatChangePopupProps {
  statEffects: Partial<PlayerStats>;
  onDone: () => void;
}

const STAT_LABELS: Record<string, string> = {
  knowledge: '준비도', money: '돈', health: '체력', social: '인맥', stress: '스트레스', charm: '매력',
};

function formatValue(key: string, value: number): string {
  const prefix = value > 0 ? '+' : '';
  if (key === 'money') return `${prefix}${(value / 1000).toFixed(0)}K`;
  return `${prefix}${value}`;
}

export default function StatChangePopup({ statEffects, onDone }: StatChangePopupProps) {
  const [visible, setVisible] = useState(true);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDoneRef.current(), 300); // wait for fade-out
    }, 2000);
    return () => clearTimeout(timer);
  }, []); // stable — runs once on mount, uses ref for latest callback

  const entries = Object.entries(statEffects).filter(([, v]) => v !== undefined && v !== 0);
  if (entries.length === 0) return null;

  return (
    <div
      className={`fixed top-1/3 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1.5 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
    >
      {entries.map(([key, value], i) => {
        const isPositive = key === 'stress' ? value! < 0 : value! > 0;
        return (
          <div
            key={key}
            className={`px-4 py-1.5 rounded-full text-sm font-bold backdrop-blur-md shadow-lg ${isPositive ? 'bg-teal/20 text-teal border border-teal/30' : 'bg-coral/20 text-coral border border-coral/30'}`}
            style={{ animationDelay: `${i * 100}ms`, animation: 'fadeInUp 0.4s ease-out forwards' }}
          >
            {STAT_LABELS[key] ?? key} {formatValue(key, value!)}
          </div>
        );
      })}
    </div>
  );
}
