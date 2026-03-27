import type { StatDelta } from "./stats";

export type ActivityId =
  | "attend_class"
  | "study"
  | "part_time_work"
  | "club_social"
  | "exercise"
  | "rest"
  | "career_prep"
  | "date";

export type TimeSlot = "morning" | "afternoon" | "evening";

export interface Activity {
  id: ActivityId;
  label: { ko: string; en: string };
  description: { ko: string; en: string };
  baseDelta: StatDelta;
  icon: string; // emoji for now
  requiresMinRelationship?: number; // for date — need a romantic interest above this level
  locationIds: string[]; // which locations this activity takes place at
}

export const ACTIVITIES: Record<ActivityId, Activity> = {
  attend_class: {
    id: "attend_class",
    label: { ko: "수업 참석", en: "Attend Class" },
    description: {
      ko: "강의를 듣고 출석 체크",
      en: "Attend lecture and check attendance",
    },
    baseDelta: { knowledge: 3, energy: -2, social: 1 },
    icon: "📚",
    locationIds: ["classroom"],
  },
  study: {
    id: "study",
    label: { ko: "공부", en: "Study" },
    description: {
      ko: "도서관이나 카페에서 집중 공부",
      en: "Focused studying at library or cafe",
    },
    baseDelta: { knowledge: 5, energy: -3, mental: -1 },
    icon: "📖",
    locationIds: ["library", "cafe"],
  },
  part_time_work: {
    id: "part_time_work",
    label: { ko: "알바", en: "Part-time Work" },
    description: {
      ko: "편의점, 카페 등에서 아르바이트",
      en: "Part-time job at convenience store, cafe, etc.",
    },
    baseDelta: { energy: -3, finances: 5, career: 1, mental: -1 },
    icon: "💼",
    locationIds: ["work"],
  },
  club_social: {
    id: "club_social",
    label: { ko: "동아리/모임", en: "Club/Social" },
    description: {
      ko: "동아리 활동이나 친구들과 어울리기",
      en: "Club activities or hanging out with friends",
    },
    baseDelta: { energy: -1, social: 4, finances: -1, mental: 2 },
    icon: "🎉",
    locationIds: ["club_room", "campus_outdoor", "cafe"],
  },
  exercise: {
    id: "exercise",
    label: { ko: "운동", en: "Exercise" },
    description: { ko: "체육관이나 운동장에서 운동", en: "Work out at the gym" },
    baseDelta: { energy: 3, social: 1, mental: 2 },
    icon: "🏃",
    locationIds: ["gym"],
  },
  rest: {
    id: "rest",
    label: { ko: "휴식", en: "Rest" },
    description: {
      ko: "기숙사에서 쉬면서 회복",
      en: "Rest and recover in the dorm",
    },
    baseDelta: { energy: 5, mental: 3 },
    icon: "😴",
    locationIds: ["dorm"],
  },
  career_prep: {
    id: "career_prep",
    label: { ko: "취업준비", en: "Career Prep" },
    description: {
      ko: "자격증 공부, 포트폴리오 작업, 인턴 지원",
      en: "Certifications, portfolio work, internship applications",
    },
    baseDelta: { energy: -2, career: 5, mental: -2 },
    icon: "💻",
    locationIds: ["library", "dorm"],
  },
  date: {
    id: "date",
    label: { ko: "데이트", en: "Date" },
    description: {
      ko: "좋아하는 사람과 시간 보내기",
      en: "Spend time with someone special",
    },
    baseDelta: { energy: -1, social: 3, finances: -2, mental: 3 },
    icon: "❤️",
    requiresMinRelationship: 60,
    locationIds: ["cafe", "campus_outdoor"],
  },
};

export const ACTIVITY_LIST = Object.values(ACTIVITIES);

export interface DailySchedule {
  morning: ActivityId | null; // null = locked by course
  afternoon: ActivityId | null;
  evening: ActivityId | null;
}

export interface LockedSlot {
  slot: TimeSlot;
  courseId: string;
  courseName: string;
}
