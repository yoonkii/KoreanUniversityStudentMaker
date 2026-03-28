'use client';

interface UpcomingPreviewProps {
  nextActivity: { icon: string; name: string; targetNpcName?: string } | null;
  nextDayName?: string;
}

/** Shows next day preview — same-day activities are shown in the schedule strip */
export default function UpcomingPreview({ nextActivity, nextDayName }: UpcomingPreviewProps) {
  // Only show when we're about to transition to a new day (not between same-day activities)
  if (!nextDayName) return null;

  return (
    <div className="px-3 py-2 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10 animate-fade-in">
      <p className="text-[9px] text-white/30 mb-0.5">내일</p>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-white/70">📅 {nextDayName}</span>
        {nextActivity && (
          <span className="text-[10px] text-white/40">{nextActivity.icon} {nextActivity.name}</span>
        )}
      </div>
    </div>
  );
}
