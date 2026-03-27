export interface PlayerStats {
  knowledge: number; // 준비도 (0-100). GPA derived at exams only.
  energy: number; // 체력 (0-100)
  social: number; // 사회성 (0-100)
  finances: number; // 재정 (0-100, normalized financial security)
  career: number; // 스펙 (0-100)
  mental: number; // 멘탈 (0-100)
}

export type StatKey = keyof PlayerStats;

export const STAT_KEYS: StatKey[] = [
  "knowledge",
  "energy",
  "social",
  "finances",
  "career",
  "mental",
];

export const STAT_LABELS: Record<StatKey, { ko: string; en: string }> = {
  knowledge: { ko: "준비도", en: "Knowledge" },
  energy: { ko: "체력", en: "Energy" },
  social: { ko: "사회성", en: "Social" },
  finances: { ko: "재정", en: "Finances" },
  career: { ko: "스펙", en: "Career" },
  mental: { ko: "멘탈", en: "Mental" },
};

export const STAT_MIN = 0;
export const STAT_MAX = 100;
export const CRISIS_THRESHOLD = 10;
export const GPA_PROBATION_THRESHOLD = 20;

export const BASE_STATS: PlayerStats = {
  knowledge: 50,
  energy: 80,
  social: 40,
  finances: 100,
  career: 20,
  mental: 70,
};

export type MajorType = "engineering" | "business" | "humanities" | "arts";

export const MAJOR_LABELS: Record<MajorType, { ko: string; en: string }> = {
  engineering: { ko: "공대", en: "Engineering" },
  business: { ko: "경영", en: "Business" },
  humanities: { ko: "인문", en: "Humanities" },
  arts: { ko: "예체능", en: "Arts/Athletics" },
};

// Major overrides — these REPLACE base stats for specified keys
export const MAJOR_STAT_OVERRIDES: Record<MajorType, Partial<PlayerStats>> = {
  engineering: { knowledge: 45, career: 30, social: 30 },
  business: { knowledge: 55, social: 50, career: 25 },
  humanities: { knowledge: 60, mental: 60, finances: 90 },
  arts: { social: 55, mental: 75, finances: 70 },
};

export type StatDelta = Partial<Record<StatKey, number>>;
