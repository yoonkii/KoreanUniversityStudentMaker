'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import ProgressBar from '@/components/ui/ProgressBar';
import GlassPanel from '@/components/ui/GlassPanel';

function formatGpa(value: number): string {
  return ((value / 100) * 4.5).toFixed(1);
}

function formatMoney(value: number): string {
  return `\u20A9${value.toLocaleString('ko-KR')}`;
}

interface StatRowProps {
  icon: string;
  label: string;
  children: React.ReactNode;
}

function StatRow({ icon, label, children }: StatRowProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <iconify-icon icon={icon} width="18" height="18" />
        <span className="text-sm text-txt-secondary">{label}</span>
      </div>
      {children}
    </div>
  );
}

export default function StatsSidebar() {
  const stats = useGameStore((state) => state.stats);
  const prevMoneyRef = useRef<number>(stats.money);
  const [moneyFlash, setMoneyFlash] = useState<'green' | 'red' | null>(null);

  useEffect(() => {
    if (stats.money !== prevMoneyRef.current) {
      setMoneyFlash(stats.money > prevMoneyRef.current ? 'green' : 'red');
      prevMoneyRef.current = stats.money;
      const t = setTimeout(() => setMoneyFlash(null), 800);
      return () => clearTimeout(t);
    }
  }, [stats.money]);

  return (
    <div className="fixed left-0 top-14 bottom-0 hidden lg:block w-64 z-20 p-4">
      <GlassPanel variant="strong" className="h-full p-5 flex flex-col gap-5 overflow-y-auto">
        <h2 className="text-sm font-semibold text-txt-secondary uppercase tracking-wider">
          능력치
        </h2>

        {/* GPA */}
        <StatRow icon="solar:star-bold" label="학점">
          <div className="flex items-center justify-between">
            <ProgressBar value={stats.gpa} color="gold" size="sm" />
            <span className="ml-3 text-sm text-gold font-medium whitespace-nowrap">
              {formatGpa(stats.gpa)} / 4.5
            </span>
          </div>
        </StatRow>

        {/* Health */}
        <StatRow icon="solar:heart-pulse-bold" label="체력">
          <ProgressBar value={stats.health} color="teal" size="sm" showValue />
        </StatRow>

        {/* Social */}
        <StatRow icon="solar:users-group-rounded-bold" label="인맥">
          <ProgressBar value={stats.social} color="pink" size="sm" showValue />
        </StatRow>

        {/* Money - number only, no progress bar */}
        <StatRow icon="solar:wallet-bold" label="돈">
          <span className={`text-sm font-medium ${moneyFlash === 'green' ? 'animate-flash-green text-teal' : moneyFlash === 'red' ? 'animate-flash-red text-coral' : 'text-teal'}`}>
            {formatMoney(stats.money)}
          </span>
        </StatRow>

        {/* Stress */}
        <StatRow icon="solar:fire-bold" label="스트레스">
          <ProgressBar value={stats.stress} color="coral" size="sm" showValue />
        </StatRow>

        {/* Charm */}
        <StatRow icon="solar:star-shine-bold" label="매력">
          <ProgressBar value={stats.charm} color="lavender" size="sm" showValue />
        </StatRow>
      </GlassPanel>
    </div>
  );
}
