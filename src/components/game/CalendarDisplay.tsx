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

export default function CalendarDisplay({ week, dayName, timeSlot, dayIndex, totalDays }: CalendarDisplayProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-black/50 backdrop-blur-sm">
      {/* Week number */}
      <div className="flex flex-col items-center border-r border-white/10 pr-3">
        <span className="text-[9px] text-white/40 leading-none">{week}주차</span>
        <span className="text-xl font-bold text-white leading-none mt-0.5">{dayIndex + 1}</span>
        <span className="text-[9px] text-white/40 leading-none">/{totalDays}</span>
      </div>
      {/* Day + time */}
      <div>
        <p className="text-sm font-bold text-white">{dayName}</p>
        <p className="text-[10px] text-white/50">{TIME_KO[timeSlot] ?? timeSlot}</p>
      </div>
    </div>
  );
}
