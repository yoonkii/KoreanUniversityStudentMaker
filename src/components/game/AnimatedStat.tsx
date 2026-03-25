'use client';

import { useState, useEffect, useRef } from 'react';

interface AnimatedStatProps {
  label: string;
  value: number;
  previousValue?: number;
  maxValue?: number;
  icon?: string;
  color: string;    // tailwind color class base, e.g., "blue"
  trend?: 'up' | 'down' | 'stable'; // based on last 3 weeks
  isMoney?: boolean;
}

/** Sparkle particle that appears when crossing thresholds */
function Sparkle({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="animate-sparkle text-yellow-300 text-sm">✦</div>
    </div>
  );
}

export default function AnimatedStat({
  label,
  value,
  previousValue,
  maxValue = 100,
  icon,
  color,
  trend,
  isMoney,
}: AnimatedStatProps) {
  const [displayValue, setDisplayValue] = useState(previousValue ?? value);
  const [showSparkle, setShowSparkle] = useState(false);
  const [pulseClass, setPulseClass] = useState('');
  const rafRef = useRef<number | null>(null);

  // Animated count-up/down
  useEffect(() => {
    const start = displayValue;
    const end = value;
    const diff = end - start;
    if (diff === 0) return;

    const duration = 600; // ms
    const startTime = performance.now();

    // Set pulse color
    setPulseClass(diff > 0 ? 'animate-pulse-green' : 'animate-pulse-red');
    setTimeout(() => setPulseClass(''), 800);

    // Check for threshold crossings (50, 75, 100)
    const thresholds = [50, 75, 100];
    for (const t of thresholds) {
      if ((start < t && end >= t) || (start > t && end <= t)) {
        setShowSparkle(true);
        setTimeout(() => setShowSparkle(false), 1200);
        break;
      }
    }

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      setDisplayValue(Math.round(current));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const delta = previousValue !== undefined ? value - previousValue : 0;
  const percent = isMoney ? Math.min(100, (value / 500000) * 100) : (value / maxValue) * 100;

  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : '';

  // Dynamic bar color based on value
  const barColor = percent < 15
    ? 'bg-red-500'
    : percent < 30
      ? 'bg-orange-500'
      : `bg-${color}-500`;

  return (
    <div className={`relative flex flex-col gap-1.5 ${pulseClass}`}>
      {/* Sparkle effects */}
      {showSparkle && (
        <>
          <Sparkle x={70} y={-10} delay={0} />
          <Sparkle x={80} y={5} delay={100} />
          <Sparkle x={90} y={-5} delay={200} />
          <Sparkle x={75} y={10} delay={150} />
        </>
      )}

      {/* Label row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon && <span className="text-sm">{icon}</span>}
          <span className="text-xs font-bold text-txt-secondary uppercase tracking-wider">
            {label}
          </span>
          {trendArrow && (
            <span className={`text-xs font-bold ${trendColor}`}>{trendArrow}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Big bold number */}
          <span className="text-lg font-black text-txt-primary tabular-nums">
            {isMoney ? `₩${displayValue.toLocaleString()}` : displayValue}
          </span>
          {/* Delta */}
          {delta !== 0 && (
            <span className={`text-xs font-bold font-mono ${
              delta > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {delta > 0 ? '+' : ''}{isMoney ? `₩${delta.toLocaleString()}` : delta}
            </span>
          )}
        </div>
      </div>

      {/* Bar */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${Math.max(1, Math.min(100, percent))}%` }}
        />
      </div>

      <style jsx>{`
        @keyframes sparkle {
          0% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.5) rotate(180deg); }
          100% { opacity: 0; transform: scale(0) rotate(360deg) translateY(-20px); }
        }
        @keyframes pulse-green {
          0%, 100% { box-shadow: none; }
          50% { box-shadow: 0 0 12px rgba(34, 197, 94, 0.4); }
        }
        @keyframes pulse-red {
          0%, 100% { box-shadow: none; }
          50% { box-shadow: 0 0 12px rgba(239, 68, 68, 0.4); }
        }
        .animate-sparkle { animation: sparkle 0.8s ease-out forwards; }
        .animate-pulse-green { animation: pulse-green 0.6s ease-in-out; border-radius: 8px; }
        .animate-pulse-red { animation: pulse-red 0.6s ease-in-out; border-radius: 8px; }
      `}</style>
    </div>
  );
}
