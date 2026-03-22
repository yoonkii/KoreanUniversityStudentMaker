'use client';

interface GlassPanelProps {
  children: React.ReactNode;
  variant?: 'standard' | 'strong';
  className?: string;
  onClick?: () => void;
}

export default function GlassPanel({
  children,
  variant = 'standard',
  className = '',
  onClick,
}: GlassPanelProps) {
  const glassClass = variant === 'strong' ? 'glass-strong' : 'glass';

  return (
    <div
      className={`${glassClass} rounded-2xl ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
