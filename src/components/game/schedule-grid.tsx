"use client";

import { useState } from "react";
import { ActivityPicker } from "./activity-picker";
import type { ActivityId, DailySchedule, TimeSlot, LockedSlot } from "@/engine/types/activity";

interface ScheduleGridProps {
  lockedSlots: LockedSlot[];
  onConfirm: (schedule: DailySchedule) => void;
  lang: "ko" | "en";
}

export function ScheduleGrid({
  lockedSlots,
  onConfirm,
  lang,
}: ScheduleGridProps) {
  const [morning, setMorning] = useState<ActivityId | null>(null);
  const [afternoon, setAfternoon] = useState<ActivityId | null>(null);
  const [evening, setEvening] = useState<ActivityId | null>(null);

  const morningLock = lockedSlots.find((s) => s.slot === "morning");
  const afternoonLock = lockedSlots.find((s) => s.slot === "afternoon");
  const eveningLock = lockedSlots.find((s) => s.slot === "evening");

  const canConfirm =
    (morningLock || morning) &&
    (afternoonLock || afternoon) &&
    (eveningLock || evening);

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm({
      morning: morningLock ? "attend_class" : morning,
      afternoon: afternoonLock ? "attend_class" : afternoon,
      evening: eveningLock ? "attend_class" : evening,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-bold text-gray-800">
        {lang === "ko" ? "오늘의 일정을 정해주세요" : "Plan your day"}
      </h2>

      <div className="flex flex-col gap-6">
        <ActivityPicker
          slot="morning"
          selectedActivity={morningLock ? "attend_class" : morning}
          lockedSlot={morningLock}
          onSelect={setMorning}
          lang={lang}
        />
        <ActivityPicker
          slot="afternoon"
          selectedActivity={afternoonLock ? "attend_class" : afternoon}
          lockedSlot={afternoonLock}
          onSelect={setAfternoon}
          lang={lang}
        />
        <ActivityPicker
          slot="evening"
          selectedActivity={eveningLock ? "attend_class" : evening}
          lockedSlot={eveningLock}
          onSelect={setEvening}
          lang={lang}
        />
      </div>

      <button
        onClick={handleConfirm}
        disabled={!canConfirm}
        className={`w-full py-3 rounded-xl font-bold text-lg transition-all ${
          canConfirm
            ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl active:scale-[0.98]"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        {lang === "ko" ? "하루 시작!" : "Start the day!"}
      </button>
    </div>
  );
}
