"use client";

import { cn } from "@/lib/utils";
import type { ActivityId, TimeSlot, LockedSlot } from "@/engine/types/activity";
import { ACTIVITIES, ACTIVITY_LIST } from "@/engine/types/activity";

interface ActivityPickerProps {
  slot: TimeSlot;
  selectedActivity: ActivityId | null;
  lockedSlot?: LockedSlot;
  onSelect: (activity: ActivityId) => void;
  lang: "ko" | "en";
}

const SLOT_LABELS: Record<TimeSlot, { ko: string; en: string }> = {
  morning: { ko: "오전", en: "Morning" },
  afternoon: { ko: "오후", en: "Afternoon" },
  evening: { ko: "저녁", en: "Evening" },
};

const SLOT_ICONS: Record<TimeSlot, string> = {
  morning: "🌅",
  afternoon: "☀️",
  evening: "🌙",
};

export function ActivityPicker({
  slot,
  selectedActivity,
  lockedSlot,
  onSelect,
  lang,
}: ActivityPickerProps) {
  const isLocked = !!lockedSlot;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
        <span>{SLOT_ICONS[slot]}</span>
        <span>{SLOT_LABELS[slot][lang]}</span>
        {isLocked && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            {lockedSlot!.courseName}
          </span>
        )}
      </div>

      {isLocked ? (
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 text-blue-800 text-sm">
          📚 {lockedSlot!.courseName}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {ACTIVITY_LIST.map((activity) => (
            <button
              key={activity.id}
              onClick={() => onSelect(activity.id)}
              className={cn(
                "flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all text-sm",
                selectedActivity === activity.id
                  ? "border-indigo-500 bg-indigo-50 shadow-md scale-[1.02]"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              )}
            >
              <span className="text-lg">{activity.icon}</span>
              <div>
                <div className="font-medium text-gray-800">
                  {activity.label[lang]}
                </div>
                <div className="text-xs text-gray-500 line-clamp-1">
                  {activity.description[lang]}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
