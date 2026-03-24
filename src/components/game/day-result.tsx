"use client";

import type { PlayerStats, StatKey } from "@/engine/types/stats";
import { STAT_KEYS, STAT_LABELS } from "@/engine/types/stats";
import { StatBar } from "@/components/ui/stat-bar";

interface DayResultProps {
  beforeStats: PlayerStats;
  afterStats: PlayerStats;
  narrative: string;
  onContinue: () => void;
  lang: "ko" | "en";
}

export function DayResult({
  beforeStats,
  afterStats,
  narrative,
  onContinue,
  lang,
}: DayResultProps) {
  const changes = STAT_KEYS.filter(
    (key) => afterStats[key] !== beforeStats[key]
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Narrative */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {narrative}
        </div>
      </div>

      {/* Stat Changes */}
      {changes.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100">
          <div className="text-sm font-bold text-gray-600 mb-3">
            {lang === "ko" ? "오늘의 변화" : "Today's Changes"}
          </div>
          <div className="flex flex-col gap-2">
            {changes.map((key) => {
              const diff = afterStats[key] - beforeStats[key];
              return (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {STAT_LABELS[key][lang]}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 font-mono">
                      {Math.round(beforeStats[key])}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span
                      className={`text-sm font-bold font-mono ${
                        diff > 0 ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {Math.round(afterStats[key])}
                    </span>
                    <span
                      className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                        diff > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {diff > 0 ? "+" : ""}
                      {diff}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Updated stat bars */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100">
        <div className="flex flex-col gap-2">
          {STAT_KEYS.map((key) => (
            <StatBar
              key={key}
              statKey={key}
              value={afterStats[key]}
              previousValue={beforeStats[key]}
              lang={lang}
              compact
            />
          ))}
        </div>
      </div>

      <button
        onClick={onContinue}
        className="w-full py-3 rounded-xl font-bold text-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
      >
        {lang === "ko" ? "다음 날로" : "Next Day"}
      </button>
    </div>
  );
}
