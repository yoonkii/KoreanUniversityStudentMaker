import type { WeekSchedule, Scene, PlayerStats, DayKey, CharacterRelationship } from '@/store/types';
import { ACTIVITIES } from '@/data/activities';
import { WEEK_1_SCENES } from '@/data/scenes/week1';
import { WEEK_2_SCENES } from '@/data/scenes/week2';
import { WEEK_3_SCENES, WEEK_3_VARIANT_B } from '@/data/scenes/week3';
import { WEEK_4_SCENES } from '@/data/scenes/week4';
import { WEEK_5_SCENES } from '@/data/scenes/week5';
import { WEEK_6_SCENES } from '@/data/scenes/week6';
import { WEEK_7_SCENES } from '@/data/scenes/week7';
import { WEEK_8_SCENES } from '@/data/scenes/week8';
import { WEEK_9_SCENES } from '@/data/scenes/week9';
import { WEEK_10_SCENES, WEEK_10_VARIANT_B } from '@/data/scenes/week10';
import { WEEK_11_SCENES, WEEK_11_VARIANT_B } from '@/data/scenes/week11';
import { WEEK_12_SCENES } from '@/data/scenes/week12';
import { WEEK_13_SCENES } from '@/data/scenes/week13';
import { WEEK_14_SCENES } from '@/data/scenes/week14';
import { WEEK_15_SCENES } from '@/data/scenes/week15';

const STRESS_PENALTY_THRESHOLD = 70;
const STRESS_GAIN_MULTIPLIER = 0.5;

// ─── Weekly Baseline Drains ───
// Life costs money, health decays, academic pressure builds
const WEEKLY_DRAINS: Partial<PlayerStats> = {
  money: -30000,  // food + transport + basics
  health: -3,     // natural fatigue
  stress: 5,      // academic pressure
};

// ─── Random Weekly Events ───

export interface WeeklyEvent {
  id: string;
  name: string;
  description: string;
  effects: Partial<PlayerStats>;
}

interface WeeklyEventDef {
  id: string;
  name: string;
  description: string;
  effects: Partial<PlayerStats>;
  probability: number;
  condition?: (stats: PlayerStats, week: number, rels?: Record<string, CharacterRelationship>) => boolean;
  /** Higher priority events are checked first (default 0) */
  priority?: number;
}

const WEEKLY_EVENT_POOL: WeeklyEventDef[] = [
  {
    id: 'surprise_quiz',
    name: '깜짝 퀴즈',
    description: '교수님이 예고 없이 퀴즈를 냈다!',
    effects: { stress: 8, knowledge: -3 },
    probability: 0.15,
    condition: (_, w) => w >= 3 && w <= 14,
  },
  {
    id: 'allowance',
    name: '용돈 입금',
    description: '부모님이 용돈을 보내주셨다! 💰',
    effects: { money: 100000, stress: -3 },
    probability: 0.12,
  },
  {
    id: 'caught_cold',
    name: '감기 걸림',
    description: '환절기에 감기에 걸렸다... 🤧',
    effects: { health: -12, stress: 5 },
    probability: 0.1,
    condition: (stats) => stats.health < 50,
  },
  {
    id: 'professor_praise',
    name: '교수님 칭찬',
    description: '교수님이 수업 태도를 칭찬해주셨다!',
    effects: { knowledge: 5, charm: 3, stress: -2 },
    probability: 0.1,
    condition: (stats) => stats.knowledge > 60,
  },
  {
    id: 'group_project_drama',
    name: '조별과제 갈등',
    description: '무임승차하는 조원 때문에 스트레스 폭발 💢',
    effects: { stress: 10, social: -3 },
    probability: 0.12,
    condition: (_, w) => w >= 4 && w <= 14,
  },
  {
    id: 'found_money',
    name: '만원 줍기',
    description: '길에서 만원을 주웠다! 오늘 운수 좋은 날 🍀',
    effects: { money: 10000, stress: -2 },
    probability: 0.05,
  },
  {
    id: 'all_nighter_recovery',
    name: '밤샘 후유증',
    description: '밤새 과제하다 쓰러졌다... 다음 날 수업 결석',
    effects: { health: -8, knowledge: -2, stress: 5 },
    probability: 0.1,
    condition: (stats) => stats.stress > 60,
  },
  {
    id: 'viral_post',
    name: 'SNS 인기글',
    description: '에브리타임에 올린 글이 인기글 등극! 📱',
    effects: { charm: 5, social: 4 },
    probability: 0.08,
  },
  {
    id: 'senior_treat',
    name: '선배 밥 사줌',
    description: '착한 선배가 밥을 사줬다! 고기 먹는 날 🍖',
    effects: { money: 15000, social: 3, stress: -3 },
    probability: 0.1,
    condition: (stats) => stats.social > 30,
  },
  {
    id: 'scholarship_notice',
    name: '장학금 안내',
    description: '성적 장학금 대상자로 선정됐다! 🎓',
    effects: { money: 500000, stress: -10, knowledge: 3 },
    probability: 0.08,
    condition: (stats, w) => stats.knowledge > 75 && w >= 8,
  },
  {
    id: 'phone_broken',
    name: '핸드폰 파손',
    description: '핸드폰 액정이 깨졌다... 수리비 지출 😭',
    effects: { money: -150000, stress: 8 },
    probability: 0.06,
  },
  {
    id: 'cafe_study_buddy',
    name: '카페 스터디',
    description: '카페에서 우연히 같은 과 친구를 만나 같이 공부했다 ☕',
    effects: { knowledge: 3, social: 3, money: -5000 },
    probability: 0.1,
  },
  // ─── NPC-Initiated Events ───
  // These fire based on relationship levels, making NPCs feel alive
  {
    id: 'jaemin_ramen_night',
    name: '재민이의 라면 파티',
    description: '재민이가 새벽 2시에 라면을 끓이며 인생 상담을 시작했다 🍜',
    effects: { social: 5, stress: -8, health: -3, money: -3000 },
    probability: 0.15,
    condition: (_, w) => w >= 3,
  },
  {
    id: 'minji_study_challenge',
    name: '민지의 도전장',
    description: '민지가 "이번 주 누가 더 공부 많이 하나 내기하자" 라고 했다 🔥',
    effects: { knowledge: 4, stress: 5, charm: 2 },
    probability: 0.12,
    condition: (stats) => stats.knowledge > 30,
  },
  {
    id: 'soyeon_care_package',
    name: '소연 선배의 간식',
    description: '소연 선배가 "밥 먹었어?" 하면서 편의점 봉지를 건넸다 🛍️',
    effects: { health: 5, stress: -5, money: 5000 },
    probability: 0.12,
    condition: (stats) => stats.health < 50 || stats.stress > 60,
  },
  {
    id: 'hyunwoo_gig_invite',
    name: '현우의 공연 초대',
    description: '현우가 "이번 주 라이브 카페에서 공연하는데 올래?" 했다 🎸',
    effects: { social: 6, charm: 4, stress: -5, money: -15000 },
    probability: 0.1,
    condition: (_, w) => w >= 4,
  },
  {
    id: 'prof_kim_office_hours',
    name: '김 교수님 면담',
    description: '교수님이 연구실로 불렀다. "자네 잠재력이 보여. 한번 얘기해보자."',
    effects: { knowledge: 6, charm: 3, stress: 3 },
    probability: 0.08,
    condition: (stats, w) => stats.knowledge > 50 && w >= 5,
  },
  {
    id: 'campus_couple_spotted',
    name: '커플 목격',
    description: '캠퍼스에서 사귀는 커플을 봤다. 괜히 쓸쓸해진다... 💔',
    effects: { stress: 5, charm: -2 },
    probability: 0.1,
    condition: (stats) => stats.social < 35,
  },
  {
    id: 'library_seat_war',
    name: '도서관 자리 전쟁',
    description: '시험 기간에 도서관 자리가 없어서 1시간을 헤맸다 📚',
    effects: { stress: 8, knowledge: -2, health: -2 },
    probability: 0.15,
    condition: (_, w) => [6, 7, 13, 14].includes(w),
  },
  {
    id: 'delivery_app_trap',
    name: '배달앱의 유혹',
    description: '밤에 배달앱을 열었다가 치킨+피자+떡볶이를 시켜버렸다 🍕',
    effects: { stress: -10, health: -5, money: -25000 },
    probability: 0.12,
    condition: (stats) => stats.stress > 50,
  },
  {
    id: 'everytime_drama',
    name: '에브리타임 논쟁',
    description: '에브리타임 익명 게시판에 학과 관련 글이 올라와서 한참 읽었다',
    effects: { social: 3, stress: 3, knowledge: -1 },
    probability: 0.1,
  },
  {
    id: 'part_time_tip',
    name: '알바 팁',
    description: '알바 사장님이 "오늘 수고했다" 하며 팁을 줬다 💵',
    effects: { money: 20000, stress: -3, charm: 1 },
    probability: 0.08,
    condition: (stats) => stats.money < 200000,
  },
  // ─── Narrative Arc Events (relationship-dependent) ───
  // These fire based on relationship depth + timing, creating story progression
  {
    id: 'minji_vulnerability',
    name: '민지의 고민',
    description: '민지가 처음으로 속마음을 털어놓았다. "사실 나도 불안해... 잘하고 싶은데."',
    effects: { social: 5, stress: -3 },
    probability: 0.2,
    priority: 2,
    condition: (_, w, rels) => w >= 6 && (rels?.['minji']?.affection ?? 0) >= 50 && (rels?.['minji']?.encounters ?? 0) >= 3,
  },
  {
    id: 'jaemin_dream_talk',
    name: '재민이의 꿈',
    description: '새벽에 재민이가 "나 사실 요리사가 되고 싶어" 라고 말했다. 진지한 눈이었다.',
    effects: { social: 4, stress: -5 },
    probability: 0.2,
    priority: 2,
    condition: (_, w, rels) => w >= 8 && (rels?.['jaemin']?.affection ?? 0) >= 60,
  },
  {
    id: 'soyeon_graduation_worry',
    name: '소연 선배의 고민',
    description: '소연 선배: "졸업하면 너희 못 보잖아... 벌써 아쉽다."',
    effects: { social: 3, stress: 2 },
    probability: 0.15,
    priority: 2,
    condition: (_, w, rels) => w >= 12 && (rels?.['soyeon']?.affection ?? 0) >= 60,
  },
  {
    id: 'hyunwoo_band_crisis',
    name: '밴드 해체 위기',
    description: '현우가 심각한 표정으로 말했다. "드러머가 빠진대... 공연 어떡하지?"',
    effects: { stress: 8, social: 3 },
    probability: 0.15,
    priority: 2,
    condition: (_, w, rels) => w >= 7 && (rels?.['hyunwoo']?.affection ?? 0) >= 45,
  },
  {
    id: 'study_group_formed',
    name: '스터디 그룹 결성',
    description: '민지가 "우리 셋이서 스터디 하자" 라고 제안했다. 은근 기대된다.',
    effects: { knowledge: 4, social: 5, stress: 2 },
    probability: 0.15,
    priority: 1,
    condition: (stats, w, rels) => w >= 5 && stats.knowledge >= 35 && (rels?.['minji']?.affection ?? 0) >= 40,
  },
  {
    id: 'confession_received',
    name: '고백을 받았다',
    description: '같은 과 누군가가 편지를 남겼다. "좋아하게 됐어요. 만날 수 있을까요?"',
    effects: { charm: 5, stress: 5, social: 3 },
    probability: 0.08,
    priority: 3,
    condition: (stats, w) => stats.charm >= 55 && stats.social >= 45 && w >= 6,
  },
  {
    id: 'family_call',
    name: '부모님 전화',
    description: '"공부는 잘 하고 있어? 밥은 먹고 다니고?" 목소리에 걱정이 가득하다.',
    effects: { stress: -8, money: 50000 },
    probability: 0.12,
    priority: 1,
    condition: (_, w) => w === 5 || w === 10 || w === 15,
  },
  {
    id: 'internship_offer',
    name: '인턴십 제안',
    description: '교수님이 아는 회사에서 방학 인턴을 찾는다고 추천해주셨다!',
    effects: { knowledge: 3, charm: 5, stress: 5 },
    probability: 0.1,
    priority: 3,
    condition: (stats, w, rels) => w >= 12 && stats.knowledge >= 65 && (rels?.['prof-kim']?.affection ?? 0) >= 50,
  },
  // ─── Relationship Milestone Events ───
  {
    id: 'minji_smile',
    name: '민지의 미소',
    description: '민지가 처음으로 진심 어린 미소를 보여줬다. "너 덕분에 학교가 좀 재밌어졌어."',
    effects: { social: 5, charm: 3, stress: -5 },
    probability: 0.25,
    priority: 4,
    condition: (_, w, rels) => w >= 8 && (rels?.['minji']?.affection ?? 0) >= 70 && (rels?.['minji']?.affection ?? 0) < 85,
  },
  {
    id: 'jaemin_night_talk',
    name: '재민이와의 밤',
    description: '새벽 3시. 재민이가 "야, 잠 안 와?" 하며 진지한 이야기를 시작했다. 대학 와서 가장 깊은 대화를 나눴다.',
    effects: { social: 8, stress: -10 },
    probability: 0.2,
    priority: 4,
    condition: (_, w, rels) => w >= 6 && (rels?.['jaemin']?.affection ?? 0) >= 70 && (rels?.['jaemin']?.encounters ?? 0) >= 5,
  },
  {
    id: 'soyeon_letter',
    name: '소연 선배의 편지',
    description: '로커에서 소연 선배의 손편지를 발견했다. "네가 후배라서 다행이야. 남은 학기도 화이팅!"',
    effects: { social: 5, charm: 3, stress: -8 },
    probability: 0.2,
    priority: 4,
    condition: (_, w, rels) => w >= 10 && (rels?.['soyeon']?.affection ?? 0) >= 75,
  },
  {
    id: 'hyunwoo_acknowledgment',
    name: '현우 선배의 인정',
    description: '현우: "솔직히 처음엔 그냥 후배인 줄 알았는데... 너 진짜 멋있는 사람이야."',
    effects: { charm: 6, social: 4, stress: -3 },
    probability: 0.2,
    priority: 4,
    condition: (_, w, rels) => w >= 9 && (rels?.['hyunwoo']?.affection ?? 0) >= 70,
  },
  {
    id: 'loneliness_crisis',
    name: '외로움',
    description: '기숙사에 혼자 누워 있는데, 핸드폰에 연락 온 사람이 아무도 없다. 눈물이 났다.',
    effects: { stress: 12, health: -5, social: -3 },
    probability: 0.15,
    priority: 4,
    condition: (stats, w) => w >= 6 && stats.social < 15 && stats.stress > 50,
  },
  // ─── NPC Special Day Events ───
  {
    id: 'jaemin_birthday',
    name: '재민이 생일',
    description: '재민이 생일이다! "야 오늘 내 생일이야! 케이크는 내가 샀으니까 같이 먹자!" 🎂',
    effects: { social: 6, stress: -5, money: -15000 },
    probability: 1.0, // Always fires on the right week
    priority: 5,
    condition: (_, w) => w === 5,
  },
  {
    id: 'minji_award',
    name: '민지의 수상',
    description: '민지가 교내 논문 대회에서 우수상을 받았다! 축하 메시지를 보냈다.',
    effects: { social: 3, knowledge: 2 },
    probability: 1.0,
    priority: 5,
    condition: (_, w, rels) => w === 11 && (rels?.['minji']?.affection ?? 0) >= 30,
  },
  {
    id: 'soyeon_graduation_prep',
    name: '소연 선배 졸업 준비',
    description: '소연 선배가 졸업사진을 찍고 있다. "벌써 이 시간이 왔네..." 약간 울먹였다.',
    effects: { social: 5, stress: 3 },
    probability: 1.0,
    priority: 5,
    condition: (_, w, rels) => w === 13 && (rels?.['soyeon']?.affection ?? 0) >= 40,
  },
  {
    id: 'hyunwoo_last_concert',
    name: '현우의 마지막 공연',
    description: '현우 선배의 졸업 전 마지막 공연이 있다. "꼭 와줘. 마지막이니까."',
    effects: { social: 8, charm: 3, stress: -5, money: -10000 },
    probability: 1.0,
    priority: 5,
    condition: (_, w, rels) => w === 14 && (rels?.['hyunwoo']?.affection ?? 0) >= 45,
  },
  // ─── Campus Calendar Events (fixed timing, no probability) ───
  {
    id: 'campus_cherry_blossom',
    name: '벚꽃 시즌',
    description: '캠퍼스에 벚꽃이 만개했다. 길을 걷는 것만으로도 행복한 하루.',
    effects: { stress: -8, charm: 2 },
    probability: 1.0,
    priority: 3,
    condition: (_, w) => w === 3,
  },
  {
    id: 'campus_typhoon',
    name: '태풍 경보',
    description: '태풍 때문에 갑자기 휴강이 됐다. 하루 종일 기숙사에서 보냈다.',
    effects: { stress: -5, health: 3, knowledge: -2 },
    probability: 0.3,
    priority: 3,
    condition: (_, w) => w === 10 || w === 11,
  },
  // ─── Jealousy / Social Dynamics ───
  {
    id: 'minji_jealous',
    name: '민지의 질투',
    description: '민지가 묘하게 차갑다. "요즘 다른 사람이랑 많이 노나 봐?"',
    effects: { stress: 5, social: -2 },
    probability: 0.2,
    priority: 3,
    condition: (_, _w, rels) => {
      const minji = rels?.['minji']?.affection ?? 0;
      const others = Object.entries(rels ?? {}).filter(([id, r]) => id !== 'minji' && r.affection > minji + 15);
      return minji >= 40 && others.length > 0;
    },
  },
  {
    id: 'jaemin_neglected',
    name: '재민이의 섭섭함',
    description: '재민: "야 요즘 나한테 관심 없지? 밥도 같이 안 먹잖아."',
    effects: { stress: 3, social: -1 },
    probability: 0.2,
    priority: 3,
    condition: (_, w, rels) => {
      const jaemin = rels?.['jaemin'];
      return w >= 5 && (jaemin?.affection ?? 0) >= 40 && (jaemin?.lastInteraction ?? 0) <= w - 3;
    },
  },
];

// ─── Weather System ───

export interface WeatherCondition {
  type: 'sunny' | 'rainy' | 'cold' | 'hot' | 'normal';
  label: string;
  emoji: string;
  hint: string;
}

const WEATHER_POOL: WeatherCondition[] = [
  { type: 'sunny', label: '맑음', emoji: '☀️', hint: '운동·외출 효과 +20%' },
  { type: 'rainy', label: '비', emoji: '🌧️', hint: '실내 활동 효과 +20%, 외출 스트레스 +2' },
  { type: 'cold', label: '추움', emoji: '❄️', hint: '체력 소모 +20%, 휴식 효과 +20%' },
  { type: 'hot', label: '더움', emoji: '🌡️', hint: '스트레스 +2, 아이스 커피 -₩3,000' },
  { type: 'normal', label: '보통', emoji: '🌤️', hint: '특이사항 없음' },
];

export function getWeatherForWeek(week: number): WeatherCondition {
  const hash = ((week * 2654435761) >>> 0) % WEATHER_POOL.length;
  return WEATHER_POOL[hash];
}

function rollWeeklyEvent(
  stats: PlayerStats,
  week: number,
  relationships?: Record<string, CharacterRelationship>,
): WeeklyEvent | null {
  // Sort by priority (higher first), then shuffle within same priority
  const sorted = [...WEEKLY_EVENT_POOL].sort((a, b) => {
    const pDiff = (b.priority ?? 0) - (a.priority ?? 0);
    if (pDiff !== 0) return pDiff;
    return Math.random() - 0.5;
  });

  for (const def of sorted) {
    if (def.condition && !def.condition(stats, week, relationships)) continue;
    if (Math.random() < def.probability) {
      return { id: def.id, name: def.name, description: def.description, effects: { ...def.effects } };
    }
  }
  return null;
}

// Exam week definitions
const MIDTERM_WEEKS = [7, 8];
const FINALS_WEEKS = [14, 15];
const FESTIVAL_WEEK = 9;

function isExamWeek(week: number): boolean {
  return MIDTERM_WEEKS.includes(week) || FINALS_WEEKS.includes(week);
}

function isFestivalWeek(week: number): boolean {
  return week === FESTIVAL_WEEK;
}

export interface WeekCondition {
  type: 'midterm' | 'finals' | 'festival' | 'normal';
  label: string;
  hint: string;
  emoji: string;
}

export function getWeekCondition(week: number): WeekCondition {
  if (MIDTERM_WEEKS.includes(week)) {
    return { type: 'midterm', label: '중간고사 기간', hint: '공부 효과 2배, 스트레스 +5', emoji: '📝' };
  }
  if (FINALS_WEEKS.includes(week)) {
    return { type: 'finals', label: '기말고사 기간', hint: '공부 효과 2배, 스트레스 +5', emoji: '📚' };
  }
  if (week === FESTIVAL_WEEK) {
    return { type: 'festival', label: '축제 주간', hint: '인맥·매력 효과 1.5배, 스트레스 -3', emoji: '🎉' };
  }
  return { type: 'normal', label: '', hint: '', emoji: '' };
}

const DAY_KEYS: DayKey[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

function getScenesForWeek(week: number): Scene[] {
  switch (week) {
    case 1: return [...WEEK_1_SCENES];
    case 2: return [...WEEK_2_SCENES];
    case 3: return Math.random() < 0.5 ? [...WEEK_3_SCENES] : [...WEEK_3_VARIANT_B];
    case 4: return [...WEEK_4_SCENES];
    case 5: return [...WEEK_5_SCENES];
    case 6: return [...WEEK_6_SCENES];
    case 7: return [...WEEK_7_SCENES];
    case 8: return [...WEEK_8_SCENES];
    case 9: return [...WEEK_9_SCENES];
    case 10: return Math.random() < 0.5 ? [...WEEK_10_SCENES] : [...WEEK_10_VARIANT_B];
    case 11: return Math.random() < 0.5 ? [...WEEK_11_SCENES] : [...WEEK_11_VARIANT_B];
    case 12: return [...WEEK_12_SCENES];
    case 13: return [...WEEK_13_SCENES];
    case 14: return [...WEEK_14_SCENES];
    case 15: return [...WEEK_15_SCENES];
    default: return [];
  }
}

// ─── Relationship Tier Bonuses ───
// Applied as multipliers/additions to stat deltas during simulateWeek

interface RelationshipBonus {
  npcId: string;
  friendBonus: (deltas: Record<keyof PlayerStats, number>) => void;
  closeFriendBonus: (deltas: Record<keyof PlayerStats, number>) => void;
  soulmateBonus: (deltas: Record<keyof PlayerStats, number>) => void;
}

const RELATIONSHIP_BONUSES: RelationshipBonus[] = [
  {
    npcId: 'minji',
    friendBonus: (d) => { if (d.knowledge > 0) d.knowledge = Math.round(d.knowledge * 1.1); },
    closeFriendBonus: (d) => { if (d.knowledge > 0) d.knowledge = Math.round(d.knowledge * 1.2); },
    soulmateBonus: () => {}, // Exam GPA bonus handled in ExamEvent
  },
  {
    npcId: 'jaemin',
    friendBonus: (d) => { d.stress -= 2; },
    closeFriendBonus: (d) => { d.stress -= 5; d.money += 15000; },
    soulmateBonus: () => {}, // Burnout threshold handled in stress check
  },
  {
    npcId: 'soyeon',
    friendBonus: (d) => { if (d.social > 0) d.social = Math.round(d.social * 1.1); },
    closeFriendBonus: (d) => { if (d.social > 0) d.social = Math.round(d.social * 1.15); },
    soulmateBonus: (d) => { if (d.charm > 0) d.charm = Math.round(d.charm * 1.15); },
  },
  {
    npcId: 'hyunwoo',
    friendBonus: (d) => { if (d.charm > 0) d.charm = Math.round(d.charm * 1.1); },
    closeFriendBonus: (d) => { /* club costs reduced — handled in activity processing */ },
    soulmateBonus: () => {}, // Festival bonus handled in festival check
  },
];

function applyRelationshipBonuses(
  deltas: Record<keyof PlayerStats, number>,
  relationships: Record<string, CharacterRelationship>,
): void {
  for (const bonus of RELATIONSHIP_BONUSES) {
    const rel = relationships[bonus.npcId];
    if (!rel) continue;
    const aff = rel.affection;
    if (aff >= 90) {
      bonus.friendBonus(deltas);
      bonus.closeFriendBonus(deltas);
      bonus.soulmateBonus(deltas);
    } else if (aff >= 70) {
      bonus.friendBonus(deltas);
      bonus.closeFriendBonus(deltas);
    } else if (aff >= 50) {
      bonus.friendBonus(deltas);
    }
  }
}

// ─── Stress Micro-Penalties ───

function applyStressPenalties(
  deltas: Record<keyof PlayerStats, number>,
  schedule: WeekSchedule,
  currentStress: number,
  jaeminSoulmate: boolean,
): { skippedActivities: string[] } {
  const burnoutThreshold = jaeminSoulmate ? 100 : 90;
  const skippedActivities: string[] = [];

  // Stress 50+: 10% chance to skip a scheduled activity
  if (currentStress >= 50) {
    for (const day of DAY_KEYS) {
      const slots = schedule[day];
      if (!slots) continue;
      for (const slot of slots) {
        if (Math.random() < 0.10) {
          skippedActivities.push(slot.activityId);
          // Reverse this activity's effects (already accumulated)
          const activity = ACTIVITIES[slot.activityId];
          if (activity) {
            for (const [stat, value] of Object.entries(activity.statEffects)) {
              if (value !== undefined) {
                deltas[stat as keyof PlayerStats] -= value;
              }
            }
          }
        }
      }
    }
  }

  // Stress 70+: knowledge decay
  if (currentStress >= 70) {
    deltas.knowledge -= 2;
  }

  // Stress at burnout: forced rest (stress reduction but nothing else)
  if (currentStress >= burnoutThreshold) {
    deltas.stress -= 10;
    deltas.health += 5;
  }

  return { skippedActivities };
}

export interface ActiveCombo {
  name: string;
  description: string;
  effect: string;
}

/**
 * Simulate a full week of scheduled activities.
 * Now includes weekly baseline drains, relationship bonuses, and stress penalties.
 */
export function simulateWeek(
  schedule: WeekSchedule,
  currentWeek: number,
  currentStats: PlayerStats,
  options?: {
    disableRandomEvents?: boolean;
    relationships?: Record<string, CharacterRelationship>;
  },
): { statDeltas: Partial<PlayerStats>; scenes: Scene[]; combos: ActiveCombo[]; weeklyEvent: WeeklyEvent | null; skippedActivities?: string[]; npcInteractions: Record<string, number> } {
  const deltas: Record<keyof PlayerStats, number> = {
    knowledge: 0,
    money: 0,
    health: 0,
    social: 0,
    stress: 0,
    charm: 0,
  };

  // ─── Energy Overwork Penalty ───
  // If player scheduled too many intensive activities, health takes a hit
  const ENERGY_COSTS: Record<string, number> = {
    study: 15, lecture: 8, parttime: 18, club: 10, date: 12, exercise: 14, rest: 0, friends: 10,
    tutoring: 16, networking: 12, selfcare: 5, explore: 8, volunteer: 15,
  };
  const maxEnergy = Math.max(50, Math.round(currentStats.health * 1.5 + 30));
  let totalEnergy = 0;
  for (const day of DAY_KEYS) {
    for (const slot of (schedule[day] ?? [])) {
      totalEnergy += ENERGY_COSTS[slot.activityId] ?? 10;
    }
  }
  if (totalEnergy > maxEnergy) {
    const overwork = Math.round((totalEnergy - maxEnergy) * 0.5);
    deltas.health -= overwork;
    deltas.stress += Math.round(overwork * 0.5);
  }

  // ─── Weekly Baseline Drains ───
  for (const [stat, value] of Object.entries(WEEKLY_DRAINS)) {
    if (value !== undefined) {
      deltas[stat as keyof PlayerStats] += value;
    }
  }

  // Count activity occurrences for combo detection
  const activityCounts: Record<string, number> = {};
  for (const day of DAY_KEYS) {
    const slots = schedule[day];
    if (!slots) continue;
    for (const slot of slots) {
      activityCounts[slot.activityId] = (activityCounts[slot.activityId] || 0) + 1;
    }
  }

  // Track NPC interactions from targeted social activities
  const npcInteractions: Record<string, number> = {};

  // Accumulate raw stat changes with diminishing returns for 4+ repeats
  const activitySeen: Record<string, number> = {};
  for (const day of DAY_KEYS) {
    const slots = schedule[day];
    if (!slots) continue;

    for (const slot of slots) {
      // Use NPC-specific effects if targeting an NPC
      let effects: Partial<PlayerStats>;
      const activity = ACTIVITIES[slot.activityId];
      if (!activity) continue;

      if (slot.targetNpcId && activity.npcVariants) {
        const variant = activity.npcVariants.find(v => v.npcId === slot.targetNpcId);
        effects = variant?.statEffects ?? activity.statEffects;
        // Auto-bump NPC affection (+3 per slot for friends, +5 for date)
        const affBump = slot.activityId === 'date' ? 5 : 3;
        npcInteractions[slot.targetNpcId] = (npcInteractions[slot.targetNpcId] || 0) + affBump;
      } else {
        effects = activity.statEffects;
        // Club activity implicitly interacts with Hyunwoo
        if (slot.activityId === 'club') {
          npcInteractions['hyunwoo'] = (npcInteractions['hyunwoo'] || 0) + 2;
        }
      }

      activitySeen[slot.activityId] = (activitySeen[slot.activityId] || 0) + 1;
      const count = activitySeen[slot.activityId];
      const diminish = count >= 4 ? 0.5 : 1;

      // Hyunwoo close friend: club costs reduced 50%
      const hyunwooRel = options?.relationships?.['hyunwoo'];
      const clubDiscount = slot.activityId === 'club' && hyunwooRel && hyunwooRel.affection >= 70;

      // Probabilistic variance: ±20% random, 5% crit success (+50%), 5% bad day (-30%)
      const varianceRoll = options?.disableRandomEvents ? 1.0 : (() => {
        const r = Math.random();
        if (r < 0.05) return 1.5;  // Critical success!
        if (r > 0.95) return 0.7;  // Bad day...
        return 0.8 + Math.random() * 0.4; // ±20% normal variance
      })();

      for (const [stat, value] of Object.entries(effects)) {
        if (value !== undefined) {
          // Money doesn't get variance (₩45K is ₩45K)
          const useVariance = stat !== 'money' ? varianceRoll : 1.0;
          let finalValue = Math.round(value * diminish * useVariance);
          if (clubDiscount && stat === 'money' && finalValue < 0) {
            finalValue = Math.round(finalValue * 0.5);
          }
          deltas[stat as keyof PlayerStats] += finalValue;
        }
      }
    }
  }

  // ─── Activity Combo Bonuses ───
  const combos: ActiveCombo[] = [];

  if (activityCounts['study'] && activityCounts['lecture']) {
    deltas.knowledge += 2;
    combos.push({ name: '효율적 학습', description: '수업 + 공부 시너지', effect: '준비도 +2' });
  }
  if (activityCounts['exercise'] && activityCounts['rest']) {
    deltas.health += 5;
    combos.push({ name: '균형 잡힌 생활', description: '운동 + 휴식 시너지', effect: '체력 +5' });
  }
  if (activityCounts['club'] && activityCounts['friends']) {
    deltas.social += 3;
    combos.push({ name: '인맥 왕', description: '동아리 + 친구 시너지', effect: '인맥 +3' });
  }
  if (activityCounts['parttime'] && activityCounts['study']) {
    deltas.knowledge += 1;
    deltas.money += 10000;
    combos.push({ name: '고학생', description: '알바 + 공부 병행', effect: '준비도 +1, 돈 +₩10,000' });
  }
  if (activityCounts['date'] && activityCounts['exercise']) {
    deltas.charm += 4;
    combos.push({ name: '캠퍼스 커플', description: '데이트 + 운동 시너지', effect: '매력 +4' });
  }
  if ((activityCounts['study'] || 0) >= 4) {
    deltas.stress += 5;
    combos.push({ name: '벼락치기', description: '공부 4회 이상 반복', effect: '스트레스 +5' });
  }
  if ((activityCounts['parttime'] || 0) >= 3) {
    deltas.health -= 5;
    combos.push({ name: '알바 중독', description: '알바 3회 이상 반복', effect: '체력 -5' });
  }

  // ─── Weather Effects ───
  const weather = options?.disableRandomEvents ? { type: 'normal' as const } : getWeatherForWeek(currentWeek);
  if (weather.type === 'sunny') {
    if (activityCounts['exercise']) deltas.health += Math.round(activityCounts['exercise'] * 2);
    if (activityCounts['friends']) deltas.social += Math.round(activityCounts['friends'] * 1);
  } else if (weather.type === 'rainy') {
    if (activityCounts['study']) deltas.knowledge += Math.round(activityCounts['study'] * 1);
    if (activityCounts['rest']) deltas.health += Math.round(activityCounts['rest'] * 2);
    deltas.stress += 2;
  } else if (weather.type === 'cold') {
    deltas.health -= 2;
    if (activityCounts['rest']) deltas.health += Math.round(activityCounts['rest'] * 2);
  } else if (weather.type === 'hot') {
    deltas.stress += 2;
    deltas.money -= 3000;
  }

  // ─── Stat Interactions ───
  const charmBonus = Math.min(0.5, Math.floor(currentStats.charm / 10) * 0.1);
  if (deltas.social > 0) {
    deltas.social = Math.round(deltas.social * (1 + charmBonus));
  }

  if (currentStats.knowledge > 70 && deltas.stress > 0) {
    deltas.stress = Math.round(deltas.stress * 0.75);
  }

  if (currentStats.social > 60 && deltas.money < 0) {
    deltas.money = Math.round(deltas.money * 0.8);
  }

  if (currentStats.health < 30 && deltas.stress > 0) {
    deltas.stress = Math.round(deltas.stress * 1.3);
  }

  // ─── Semester Calendar Effects ───
  if (isExamWeek(currentWeek)) {
    if (deltas.knowledge > 0) {
      deltas.knowledge = Math.round(deltas.knowledge * 2);
    }
    deltas.stress += 5;
  }

  if (isFestivalWeek(currentWeek)) {
    if (deltas.social > 0) {
      deltas.social = Math.round(deltas.social * 1.5);
    }
    if (deltas.charm > 0) {
      deltas.charm = Math.round(deltas.charm * 1.5);
    }
    deltas.stress -= 3;
    // Hyunwoo soulmate: festival bonus doubled
    const hyunwooRel = options?.relationships?.['hyunwoo'];
    if (hyunwooRel && hyunwooRel.affection >= 90) {
      if (deltas.social > 0) deltas.social = Math.round(deltas.social * 1.5);
      if (deltas.charm > 0) deltas.charm = Math.round(deltas.charm * 1.5);
    }
  }

  // ─── Relationship Bonuses ───
  if (options?.relationships) {
    applyRelationshipBonuses(deltas, options.relationships);
  }

  // ─── Stress Penalty ───
  const jaeminSoulmate = (options?.relationships?.['jaemin']?.affection ?? 0) >= 90;
  const isOverstressed = currentStats.stress > STRESS_PENALTY_THRESHOLD;
  if (isOverstressed) {
    for (const key of Object.keys(deltas) as (keyof PlayerStats)[]) {
      if (key === 'money') continue;
      if (deltas[key] > 0) {
        deltas[key] = Math.round(deltas[key] * STRESS_GAIN_MULTIPLIER);
      }
    }
  }

  // ─── Stress Micro-Penalties ───
  const { skippedActivities } = options?.disableRandomEvents
    ? { skippedActivities: [] }
    : applyStressPenalties(deltas, schedule, currentStats.stress, jaeminSoulmate);

  // ─── Random Weekly Event ───
  const weeklyEvent = options?.disableRandomEvents ? null : rollWeeklyEvent(currentStats, currentWeek, options?.relationships);
  if (weeklyEvent) {
    for (const [stat, value] of Object.entries(weeklyEvent.effects)) {
      if (value !== undefined) {
        deltas[stat as keyof PlayerStats] += value;
      }
    }
  }

  // Convert to Partial — strip zero entries
  const trimmedDeltas: Partial<PlayerStats> = {};
  for (const [key, value] of Object.entries(deltas)) {
    if (value !== 0) {
      trimmedDeltas[key as keyof PlayerStats] = value;
    }
  }

  const scenes = getScenesForWeek(currentWeek);

  return { statDeltas: trimmedDeltas, scenes, combos, weeklyEvent, skippedActivities, npcInteractions };
}

/**
 * Calculate GPA from knowledge + strategy multiplier + randomness.
 * Used by ExamEvent component.
 */
export function calculateExamGpa(
  knowledge: number,
  strategyMultiplier: number,
  bonusGpa: number = 0,
): number {
  const noise = (Math.random() - 0.5) * 0.3; // ±0.15 random variation
  const raw = (knowledge / 100) * 4.5 * strategyMultiplier + noise + bonusGpa;
  return Math.round(Math.max(0, Math.min(4.5, raw)) * 100) / 100; // 2 decimal places, clamped
}
