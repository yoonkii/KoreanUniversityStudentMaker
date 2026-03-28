'use client';

import { useEffect, useState } from 'react';

interface DayTransitionCardProps {
  dayName: string;
  onDone: () => void;
}

export default function DayTransitionCard({ dayName, onDone }: DayTransitionCardProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 400);
    }, 1200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 transition-opacity duration-400 cursor-pointer ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={() => { setVisible(false); setTimeout(onDone, 200); }}
    >
      <div className="text-center animate-fade-in-up">
        <p className="text-sm text-white/30 tracking-widest mb-2">다음 날</p>
        <h2 className="text-3xl font-bold text-white">{dayName}</h2>
      </div>
    </div>
  );
}
