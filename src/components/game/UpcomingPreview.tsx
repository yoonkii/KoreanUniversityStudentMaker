'use client';

interface UpcomingPreviewProps {
  nextActivity: { icon: string; name: string; targetNpcName?: string } | null;
  nextDayName?: string;
}

export default function UpcomingPreview({ nextActivity, nextDayName }: UpcomingPreviewProps) {
  if (!nextActivity && !nextDayName) return null;

  return (
    <div className="px-3 py-1.5 rounded-lg bg-black/30 backdrop-blur-sm animate-fade-in">
      {nextActivity ? (
        <p className="text-[10px] text-white/40">
          다음 <span className="text-white/60">{nextActivity.icon} {nextActivity.name}</span>
          {nextActivity.targetNpcName && <span className="text-pink/50"> · {nextActivity.targetNpcName}</span>}
        </p>
      ) : nextDayName ? (
        <p className="text-[10px] text-white/40">
          다음 <span className="text-white/60">📅 {nextDayName}</span>
        </p>
      ) : null}
    </div>
  );
}
