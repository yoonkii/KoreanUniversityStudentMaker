'use client';

import { ACTIVITIES } from '@/data/activities';
import GlassPanel from '@/components/ui/GlassPanel';
import type { WeekSchedule, DayKey, TimeSlot } from '@/store/types';

interface ScheduleViewerProps {
  schedule: WeekSchedule;
  onClose: () => void;
  onReplan?: () => void;
}

const DAY_KEYS: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<DayKey, string> = {
  monday: '월', tuesday: '화', wednesday: '수', thursday: '목',
  friday: '금', saturday: '토', sunday: '일',
};
const TIME_SLOTS: TimeSlot[] = ['morning', 'afternoon', 'evening'];
const TIME_LABELS: Record<TimeSlot, string> = { morning: '오전', afternoon: '오후', evening: '저녁' };
const COLOR_HEX: Record<string, string> = {
  teal: '#4ECDC4', gold: '#FFD166', pink: '#F5A0B5',
  coral: '#FF6B6B', lavender: '#A78BFA', 'txt-secondary': '#8B95A8',
};

export default function ScheduleViewer({ schedule, onClose, onReplan }: ScheduleViewerProps) {
  // Build lookup: slotKey → activityId
  const slotMap: Record<string, string> = {};
  for (const [day, slots] of Object.entries(schedule) as [DayKey, { timeSlot: string; activityId: string }[]][]) {
    for (const slot of slots) {
      slotMap[`${day}-${slot.timeSlot}`] = slot.activityId;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
      <GlassPanel variant="strong" className="p-5 animate-modal-enter">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-txt-primary">이번 주 스케줄</h3>
          <button onClick={onClose} className="text-xs text-txt-secondary hover:text-txt-primary cursor-pointer">닫기</button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-8 gap-px bg-white/5 rounded-xl overflow-hidden mb-4">
          <div className="bg-navy" />
          {DAY_KEYS.map((day) => (
            <div key={day} className="bg-navy py-1.5 text-center">
              <span className="text-[10px] font-bold text-txt-secondary">{DAY_LABELS[day]}</span>
            </div>
          ))}
          {TIME_SLOTS.map((time) => (
            <>
              <div key={`l-${time}`} className="bg-navy flex items-center justify-center">
                <span className="text-[9px] text-txt-secondary/50">{TIME_LABELS[time]}</span>
              </div>
              {DAY_KEYS.map((day) => {
                const activityId = slotMap[`${day}-${time}`];
                const activity = activityId ? ACTIVITIES[activityId] : null;
                const colorHex = activity ? COLOR_HEX[activity.color] ?? '#8B95A8' : undefined;
                return (
                  <div
                    key={`${day}-${time}`}
                    className="h-10 flex items-center justify-center bg-navy"
                    style={activity ? { backgroundColor: `${colorHex}18` } : undefined}
                    title={activity?.name}
                  >
                    {activity ? (
                      <span style={{ color: colorHex }}>
                        <iconify-icon icon={activity.icon} width="14" height="14" />
                      </span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>

        {/* Re-plan button */}
        {onReplan && (
          <button
            onClick={onReplan}
            className="w-full py-2.5 rounded-xl text-sm font-medium bg-coral/15 text-coral border border-coral/25 hover:bg-coral/25 transition-all cursor-pointer active:scale-[0.98]"
          >
            다시 짜기
          </button>
        )}
      </GlassPanel>
      </div>
    </div>
  );
}
