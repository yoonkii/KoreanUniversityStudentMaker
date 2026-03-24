import type { Course } from "../types/course";

/**
 * Pre-built course catalog. Players pick 5 courses at semester start.
 * Each course has 3 time slots per week.
 */
export const COURSE_CATALOG: Course[] = [
  {
    id: "course_major_1",
    name: { ko: "전공기초 I", en: "Major Fundamentals I" },
    slots: [
      { day: 1, period: "morning" },
      { day: 3, period: "morning" },
      { day: 5, period: "morning" },
    ],
    difficulty: 2,
    professorNPCId: "npc_prof_kim",
    description: "전공 필수 과목. 김서영 교수 담당.",
  },
  {
    id: "course_major_2",
    name: { ko: "전공심화 II", en: "Advanced Major II" },
    slots: [
      { day: 2, period: "morning" },
      { day: 4, period: "morning" },
    ],
    difficulty: 3,
    professorNPCId: null,
    description: "심화 전공 과목. 난이도 높음.",
  },
  {
    id: "course_liberal_1",
    name: { ko: "교양: 심리학 개론", en: "Liberal Arts: Intro to Psychology" },
    slots: [
      { day: 1, period: "afternoon" },
      { day: 3, period: "afternoon" },
    ],
    difficulty: 1,
    professorNPCId: null,
    description: "교양 과목. 정유나와 같이 듣는 수업.",
  },
  {
    id: "course_liberal_2",
    name: { ko: "교양: 영어회화", en: "Liberal Arts: English Conversation" },
    slots: [
      { day: 2, period: "afternoon" },
      { day: 4, period: "afternoon" },
    ],
    difficulty: 1,
    professorNPCId: null,
    description: "실용 영어 교양 과목.",
  },
  {
    id: "course_major_3",
    name: { ko: "전공실습", en: "Major Practicum" },
    slots: [
      { day: 5, period: "afternoon" },
    ],
    difficulty: 2,
    professorNPCId: null,
    description: "전공 실습/실험 과목.",
  },
  {
    id: "course_liberal_3",
    name: { ko: "교양: 경제학원론", en: "Liberal Arts: Intro to Economics" },
    slots: [
      { day: 1, period: "morning" },
      { day: 3, period: "morning" },
    ],
    difficulty: 2,
    professorNPCId: null,
    description: "경제 교양. 김민수도 듣는 수업.",
  },
  {
    id: "course_elective_1",
    name: { ko: "데이터분석 입문", en: "Intro to Data Analysis" },
    slots: [
      { day: 2, period: "morning" },
      { day: 4, period: "morning" },
      { day: 5, period: "morning" },
    ],
    difficulty: 2,
    professorNPCId: null,
    description: "스펙 쌓기에 좋은 실용 과목.",
  },
  {
    id: "course_elective_2",
    name: { ko: "창업과 혁신", en: "Entrepreneurship & Innovation" },
    slots: [
      { day: 3, period: "afternoon" },
      { day: 5, period: "afternoon" },
    ],
    difficulty: 1,
    professorNPCId: null,
    description: "창업에 관심 있는 학생들을 위한 과목.",
  },
];

/**
 * Check if any two courses have overlapping time slots.
 */
export function hasTimeConflict(courseA: Course, courseB: Course): boolean {
  for (const slotA of courseA.slots) {
    for (const slotB of courseB.slots) {
      if (slotA.day === slotB.day && slotA.period === slotB.period) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Validate a set of selected courses (max 5, no conflicts).
 */
export function validateCourseSelection(
  selectedIds: string[]
): { valid: boolean; error?: string } {
  if (selectedIds.length > 5) {
    return { valid: false, error: "최대 5과목까지 선택 가능합니다." };
  }

  const selected = selectedIds
    .map((id) => COURSE_CATALOG.find((c) => c.id === id))
    .filter((c): c is Course => c !== undefined);

  for (let i = 0; i < selected.length; i++) {
    for (let j = i + 1; j < selected.length; j++) {
      if (hasTimeConflict(selected[i], selected[j])) {
        return {
          valid: false,
          error: `${selected[i].name.ko}와(과) ${selected[j].name.ko}의 시간이 겹칩니다.`,
        };
      }
    }
  }

  return { valid: true };
}
