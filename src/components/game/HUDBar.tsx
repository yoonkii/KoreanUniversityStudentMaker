'use client';

import { useGameStore } from '@/store/gameStore';

const SEMESTER_WEEKS = 16;

function getSemesterLabel(week: number): string {
  // Year and semester derived from week number
  // Each semester is 16 weeks, 2 semesters per year
  const semesterIndex = Math.floor((week - 1) / SEMESTER_WEEKS);
  const year = Math.floor(semesterIndex / 2) + 1;
  const semester = (semesterIndex % 2) + 1;
  const weekInSemester = ((week - 1) % SEMESTER_WEEKS) + 1;
  return `${year}학년 ${semester}학기 ${weekInSemester}주차`;
}

function getDayOfWeek(_week: number): string {
  // Each in-game week maps to days; for display we show "월~일"
  return '월 ~ 일';
}

export default function HUDBar() {
  const currentWeek = useGameStore((state) => state.currentWeek);

  return (
    <div className="fixed top-0 left-0 right-0 z-30 glass px-4 py-2.5 md:px-6">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left: Calendar + semester info */}
        <div className="flex items-center gap-2 text-sm">
          <iconify-icon
            icon="solar:calendar-bold"
            width="18"
            height="18"
            className="text-teal"
          />
          <span className="text-txt-primary font-medium">
            {getSemesterLabel(currentWeek)}
          </span>
        </div>

        {/* Right: Day of week */}
        <div className="flex items-center gap-2 text-sm text-txt-secondary">
          <iconify-icon icon="solar:clock-circle-bold" width="16" height="16" />
          <span>{getDayOfWeek(currentWeek)}</span>
        </div>
      </div>
    </div>
  );
}
