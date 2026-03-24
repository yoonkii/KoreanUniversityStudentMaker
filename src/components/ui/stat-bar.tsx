"use client";

import { cn } from "@/lib/utils";
import type { StatKey } from "@/engine/types/stats";
import { STAT_LABELS, CRISIS_THRESHOLD } from "@/engine/types/stats";

interface StatBarProps {
  statKey: StatKey;
  value: number;
  previousValue?: number;
  lang: "ko" | "en";
  compact?: boolean;
}

const STAT_COLORS: Record<StatKey, string> = {
  gpa: "bg-blue-500",
  energy: "bg-green-500",
  social: "bg-yellow-500",
  finances: "bg-emerald-500",
  career: "bg-purple-500",
  mental: "bg-pink-500",
};

const STAT_BG_COLORS: Record<StatKey, string> = {
  gpa: "bg-blue-100",
  energy: "bg-green-100",
  social: "bg-yellow-100",
  finances: "bg-emerald-100",
  career: "bg-purple-100",
  mental: "bg-pink-100",
};

export function StatBar({
  statKey,
  value,
  previousValue,
  lang,
  compact,
}: StatBarProps) {
  const label = STAT_LABELS[statKey][lang];
  const isCritical = value < CRISIS_THRESHOLD;
  const delta = previousValue !== undefined ? value - previousValue : 0;

  return (
    <div className={cn("flex flex-col gap-1", compact ? "gap-0.5" : "gap-1")}>
      <div className="flex justify-between items-center text-sm">
        <span className={cn("font-medium", isCritical && "text-red-600")}>
          {label}
        </span>
        <div className="flex items-center gap-1">
          <span
            className={cn(
              "font-mono text-sm",
              isCritical && "text-red-600 font-bold"
            )}
          >
            {Math.round(value)}
          </span>
          {delta !== 0 && (
            <span
              className={cn(
                "text-xs font-mono",
                delta > 0 ? "text-green-600" : "text-red-500"
              )}
            >
              {delta > 0 ? "+" : ""}
              {delta}
            </span>
          )}
        </div>
      </div>
      <div
        className={cn(
          "w-full rounded-full overflow-hidden",
          compact ? "h-2" : "h-3",
          STAT_BG_COLORS[statKey]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            isCritical ? "bg-red-500 animate-pulse" : STAT_COLORS[statKey]
          )}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
