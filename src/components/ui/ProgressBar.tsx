'use client';

interface ProgressBarProps {
  value: number;
  max?: number;
  color: 'teal' | 'gold' | 'pink' | 'coral' | 'lavender';
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md';
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
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const gradient = COLOR_GRADIENTS[color];

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
      <div className={`w-full bg-surface-dark rounded-full ${HEIGHT_CLASSES[size]}`}>
        <div
          className={`${HEIGHT_CLASSES[size]} rounded-full transition-all duration-500 ease-out`}
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(to right, ${gradient.from}, ${gradient.to})`,
          }}
        />
      </div>
    </div>
  );
}
