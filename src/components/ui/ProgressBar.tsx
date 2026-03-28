'use client';

interface ProgressBarProps {
  value: number;
  max?: number;
  color: 'teal' | 'gold' | 'pink' | 'coral' | 'lavender';
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md';
  /** Previous value — shows a delta highlight on the bar */
  prevValue?: number;
}

const COLOR_GRADIENTS: Record<ProgressBarProps['color'], { from: string; to: string }> = {
  teal: { from: '#4ECDC499', to: '#4ECDC4' },
  gold: { from: '#FFD16699', to: '#FFD166' },
  pink: { from: '#F5A0B599', to: '#F5A0B5' },
  coral: { from: '#FF6B6B99', to: '#FF6B6B' },
  lavender: { from: '#A78BFA99', to: '#A78BFA' },
};

const HEIGHT_CLASSES: Record<NonNullable<ProgressBarProps['size']>, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
};

export default function ProgressBar({
  value,
  max = 100,
  color,
  label,
  showValue = false,
  size = 'md',
  prevValue,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const prevPercentage = prevValue !== undefined ? Math.min(100, Math.max(0, (prevValue / max) * 100)) : undefined;
  const gradient = COLOR_GRADIENTS[color];
  const delta = prevValue !== undefined ? value - prevValue : 0;
  const hasDelta = prevValue !== undefined && delta !== 0;

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1">
          {label && (
            <span className="text-xs text-txt-secondary">{label}</span>
          )}
          {showValue && (
            <span className="text-xs text-txt-secondary">
              {value} / {max}
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-surface-dark rounded-full ${HEIGHT_CLASSES[size]} relative overflow-hidden`}>
        {/* Delta highlight — shows the change area */}
        {hasDelta && prevPercentage !== undefined && (
          <div
            className={`absolute top-0 ${HEIGHT_CLASSES[size]} rounded-full ${delta > 0 ? 'bg-teal/20' : 'bg-coral/20'}`}
            style={{
              left: delta > 0 ? `${prevPercentage}%` : `${percentage}%`,
              width: `${Math.abs(percentage - prevPercentage)}%`,
              animation: 'pulse 1.5s ease-in-out 2',
            }}
          />
        )}
        {/* Main bar */}
        <div
          className={`${HEIGHT_CLASSES[size]} rounded-full transition-all duration-700 ease-out relative z-10`}
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(to right, ${gradient.from}, ${gradient.to})`,
          }}
        />
      </div>
    </div>
  );
}
