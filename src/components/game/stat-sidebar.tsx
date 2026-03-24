"use client";

import { StatBar } from "@/components/ui/stat-bar";
import type { PlayerStats } from "@/engine/types/stats";
import { STAT_KEYS } from "@/engine/types/stats";
import type { ClockState } from "@/engine/types/game-state";
import { getDayName, getPhaseLabel } from "@/engine/systems/semester-clock";

interface StatSidebarProps {
  stats: PlayerStats;
  previousStats?: PlayerStats;
  clock: ClockState;
  lang: "ko" | "en";
  onRelationshipsClick?: () => void;
}

export function StatSidebar({
  stats,
  previousStats,
  clock,
  lang,
  onRelationshipsClick,
}: StatSidebarProps) {
  const dayLabel = lang === "ko" ? "일차" : "Day";
  const weekLabel = lang === "ko" ? "주차" : "Week";
  const dayName = getDayName(clock.currentDayOfWeek, lang);
  const phaseLabel = getPhaseLabel(clock.semesterPhase, lang);

  return (
    <div className="w-64 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100 flex flex-col gap-4">
      {/* Time display */}
      <div className="text-center pb-3 border-b border-gray-100">
        <div className="text-2xl font-bold text-gray-800">
          {dayLabel} {clock.currentDay} ({dayName})
        </div>
        <div className="text-sm text-gray-500">
          {weekLabel} {clock.currentWeek}/16 · {phaseLabel}
        </div>
        <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(clock.currentDay / 112) * 100}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-3">
        {STAT_KEYS.map((key) => (
          <StatBar
            key={key}
            statKey={key}
            value={stats[key]}
            previousValue={previousStats?.[key]}
            lang={lang}
          />
        ))}
      </div>

      {/* Navigation */}
      {onRelationshipsClick && (
        <button
          onClick={onRelationshipsClick}
          className="w-full py-2 text-sm text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors font-medium"
        >
          {lang === "ko" ? "👥 인간관계" : "👥 Relationships"}
        </button>
      )}
    </div>
  );
}
