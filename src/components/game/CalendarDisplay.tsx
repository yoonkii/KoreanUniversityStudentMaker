'use client';

interface CalendarDisplayProps {
  week: number;
  dayName: string;
  timeSlot: string;
  dayIndex: number;
  totalDays: number;
}

const TIME_KO: Record<string, string> = {
  morning: '오전',
  afternoon: '오후',
  evening: '저녁',
};

const TIME_EMOJI: Record<string, string> = {
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌙',
};

/** PM3-style calendar card — bordered, with large day number */
export default function CalendarDisplay({ week, dayName, timeSlot, dayIndex, totalDays }: CalendarDisplayProps) {
  return (
    <div className="bg-black/60 backdrop-blur-md rounded-xl border border-white/15 shadow-lg overflow-hidden">
      {/* Top: progress bar */}
      <div className="h-1 bg-white/5">
        <div
          className="h-full bg-teal/60 transition-all duration-500"
          style={{ width: `${((dayIndex + 1) / totalDays) * 100}%` }}
        />
      </div>
      <div className="flex items-center gap-2.5 px-3 py-2">
        {/* Day number — large, PM3 style */}
        <div className="flex flex-col items-center w-10">
          <span className="text-[8px] text-white/30 uppercase tracking-wider leading-none">{week}주차</span>
          <span className="text-2xl font-black text-white leading-none">{dayIndex + 1}</span>
          <span className="text-[8px] text-white/25 leading-none">/ {totalDays}</span>
        </div>
        {/* Divider */}
        <div className="w-px h-8 bg-white/10" />
        {/* Day + time */}
        <div>
          <p className="text-sm font-bold text-white leading-tight">{dayName}</p>
          <p className="text-[10px] text-white/50">{TIME_EMOJI[timeSlot] ?? '📋'} {TIME_KO[timeSlot] ?? timeSlot}</p>
        </div>
      </div>
    </div>
  );
}
