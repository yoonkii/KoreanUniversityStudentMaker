/**
 * Living Campus System — makes NPCs feel alive with daily routines
 *
 * Instead of static encounter pools, this generates WHERE each NPC
 * is and WHAT they're doing at each time of day. When the player
 * does an activity, they might run into NPCs who happen to be at
 * the same location.
 *
 * Powered by a single Gemini call per week (cached), with rich
 * deterministic fallbacks for offline play.
 */

import type { PlayerStats, CharacterRelationship } from '@/store/types';

// ─── Gemini-powered campus life cache ───
interface AiCampusData {
  week: number;
  routines: Array<{
    npcId: string;
    morning: { location: string; doing: string; dialogue: string };
    afternoon: { location: string; doing: string; dialogue: string };
    evening: { location: string; doing: string; dialogue: string };
  }>;
  overheard?: string;
  atmosphere?: string;
}

let aiCampusCache: AiCampusData | null = null;
let fetchingCampus = false;

export function getCachedAiCampus(): AiCampusData | null {
  return aiCampusCache;
}

export function getOverheardConversation(week: number): string | null {
  if (aiCampusCache?.week === week && aiCampusCache.overheard) return aiCampusCache.overheard;
  // Fallback overheard conversations
  const FALLBACKS: Record<number, string> = {
    1: '"야 OT 언제야?" "내일인데 뭐 입지?" — 신입생들의 대화',
    3: '"조별과제 누구랑 할 거야?" "아무나 괜찮은데..." — 복도에서',
    5: '"교수님 과제 또 내셨대" "아 진짜?" — 한숨 소리',
    7: '"시험 범위 어디까지야?" "몰라 다 나온대" — 도서관 앞',
    9: '"축제 라인업 봤어?" "대박이다!" — 학생회관에서',
    12: '"기말 언제부터야?" "2주 남았어" "..." — 카페에서',
  };
  return FALLBACKS[week] ?? null;
}

/**
 * Trigger background Gemini call for living campus data.
 * One call per week, results cached.
 */
export function triggerAiCampusGeneration(
  week: number,
  stats: PlayerStats,
  relationships: Record<string, CharacterRelationship>,
  recentEvents: string,
): void {
  if (aiCampusCache?.week === week) return;
  if (fetchingCampus) return;
  fetchingCampus = true;

  const relSummary = Object.entries(relationships)
    .map(([id, r]) => `${id}: ${r.affection}`)
    .join(', ');

  fetch('/api/ai/living-campus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      week,
      stats: { knowledge: stats.knowledge, health: stats.health, stress: stats.stress, social: stats.social, money: stats.money },
      relationships: relSummary,
      recentEvents,
    }),
    signal: AbortSignal.timeout(8000),
  })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data?.routines) {
        aiCampusCache = { week, ...data };
      }
    })
    .catch(() => {})
    .finally(() => { fetchingCampus = false; });
}

export interface NpcRoutine {
  npcId: string;
  npcName: string;
  morning: { location: string; activity: string; dialogue: string };
  afternoon: { location: string; activity: string; dialogue: string };
  evening: { location: string; activity: string; dialogue: string };
}

export interface CampusLife {
  week: number;
  routines: NpcRoutine[];
  campusBuzz: string; // One-line campus atmosphere
}

// ─── Deterministic Fallback Routines ───
// Rich, week-aware routines for each main NPC

function getJaeminRoutine(week: number): NpcRoutine {
  const isExamSeason = [6, 7, 8, 13, 14, 15].includes(week);
  const isFestival = week === 9;

  // Varied morning dialogues
  const morningLines = [
    '학식 오늘 돈까스다! 빨리 와 자리 없어!',
    '오늘 학식 비빔밥이래. 3,500원에 이 정도면 개이득이지!',
    '아 늦었다... 1교시 출석 불렀나? 확인 좀 해줘ㅠ',
    '편의점 삼각김밥 2+1이래! 아침은 이걸로 해결이야.',
  ];
  const afternoonLines = [
    '야 같이 농구 한 판 할래? 3대3 하는데 한 명 부족해!',
    'ㅋㅋㅋ 이 영상 봐봐. 고양이가 빵에 얼굴 넣었어.',
    '피시방 갈래? 오버워치 시즌 시작했어!',
    '낮잠 자다가 일어났는데 벌써 4시야... 시간 어디 갔지?',
  ];
  const eveningLines = [
    '라면 먹을래? 내가 쏠게! 계란 라면이 최고지.',
    '야 롤 한 판만 더... 아 졌다ㅋㅋ 다시!',
    '치킨 시킬까? 황금올리브 먹고 싶다...',
    '넷플 뭐 봐? 나 요즘 이상한 변호사 우영우 다시 보는 중.',
  ];

  return {
    npcId: 'jaemin', npcName: '이재민',
    morning: {
      location: isExamSeason ? 'library' : 'cafeteria',
      activity: isExamSeason ? '도서관에서 벼락치기 중' : '학식당에서 아침 먹는 중',
      dialogue: isExamSeason ? '야... 밤새 공부했는데 하나도 모르겠어ㅠ 커피 사와줘...'
        : isFestival ? '축제다!! 오늘 뭐 볼 거야?!'
        : morningLines[week % morningLines.length],
    },
    afternoon: {
      location: isExamSeason ? 'library' : week % 2 === 0 ? 'gym' : 'cafe',
      activity: isExamSeason ? '계속 공부 중... 눈이 빠질 것 같다'
        : week % 2 === 0 ? '체육관에서 농구 중' : '카페에서 유튜브 보는 중',
      dialogue: isExamSeason ? '이 공식 맞아? 아 모르겠다 그냥 외우자...'
        : afternoonLines[week % afternoonLines.length],
    },
    evening: {
      location: week % 3 === 0 ? 'convenience_store' : 'dorm',
      activity: week % 3 === 0 ? '편의점에서 야식 고르는 중' : '기숙사에서 게임 중',
      dialogue: eveningLines[week % eveningLines.length],
    },
  };
}

function getMinjiRoutine(week: number): NpcRoutine {
  const isExamSeason = [6, 7, 8, 13, 14, 15].includes(week);

  const morningLines = [
    '...앞자리 앉을 거야? 난 여기 앉을 건데.',
    '오늘 교수님이 중요하다고 하신 부분 정리했어. 볼래?',
    '어제 과제 다 했어? ...나는 새벽 2시에 끝냈어.',
    '이번 주 발표 순서 정해졌대. 준비해야 할 것 같아.',
  ];
  const afternoonLines = [
    '...여기 조용해서 좋아. 너도 공부할 거야?',
    '이 논문 읽어봤어? 교수님이 추천하신 건데 어렵다...',
    '카페 아메리카노 리필 됐다. 가격 대비 최고야.',
    '...자꾸 핸드폰 보게 돼. 에브리타임 중독인가.',
  ];
  const eveningLines = [
    '아메리카노 3잔째... 살 것 같아.',
    '도서관 곧 닫는대. 학생회관 자습실로 옮길까.',
    '오늘 공부한 거 정리하면... 아직 부족한데.',
    '...배고파. 근데 나가기 귀찮아.',
  ];

  return {
    npcId: 'minji', npcName: '한민지',
    morning: {
      location: 'classroom',
      activity: '수업 시작 전에 예습하는 중',
      dialogue: isExamSeason ? '...이번 범위 끝냈어? 나 아직 3장 남았어.'
        : morningLines[week % morningLines.length],
    },
    afternoon: {
      location: isExamSeason ? 'library' : week % 2 === 0 ? 'cafe' : 'library',
      activity: isExamSeason ? '도서관에서 미친 듯이 공부 중' : '조용히 공부하는 중',
      dialogue: isExamSeason ? '말 걸지 마. 집중하고 있어.'
        : afternoonLines[week % afternoonLines.length],
    },
    evening: {
      location: week >= 10 ? 'cafe' : 'library',
      activity: week >= 10 ? '카페에서 과제하는 중' : '도서관 마감 시간까지 버티는 중',
      dialogue: eveningLines[week % eveningLines.length],
    },
  };
}

function getSoyeonRoutine(week: number): NpcRoutine {
  const isLate = week >= 12;
  return {
    npcId: 'soyeon', npcName: '박소연',
    morning: {
      location: 'campus',
      activity: isLate ? '졸업 준비로 행정실 가는 중' : '캠퍼스를 산책하는 중',
      dialogue: isLate ? '졸업 서류가 이렇게 많을 줄 몰랐어... 후배야 도와줘ㅠ'
        : week <= 3 ? '안녕! 캠퍼스 예쁘지? 벚꽃 봤어?'
        : '오늘 날씨 좋다~ 수업 가기 싫어지는 날씨야ㅋ',
    },
    afternoon: {
      location: week % 2 === 0 ? 'cafeteria' : 'library',
      activity: week % 2 === 0 ? '후배들이랑 밥 먹는 중' : '논문 자료 찾는 중',
      dialogue: week % 2 === 0 ? '오 왔어? 같이 먹자! 오늘 학식 괜찮아.'
        : '이 논문 진짜 어렵다... 교수님이 왜 이걸 시키신 거야.',
    },
    evening: {
      location: 'cafe',
      activity: '카페에서 취업 준비하는 중',
      dialogue: isLate ? '이력서 쓰는 게 시험보다 어려워...'
        : '카페 분위기 좋지? 여기 단골이야. 추천해줄게.',
    },
  };
}

function getHyunwooRoutine(week: number): NpcRoutine {
  const isFestival = week === 9;
  return {
    npcId: 'hyunwoo', npcName: '정현우',
    morning: {
      location: week % 3 === 0 ? 'classroom' : 'club_room',
      activity: week % 3 === 0 ? '늦잠 자다 수업에 겨우 온 중' : '아침 연습하는 중',
      dialogue: week % 3 === 0 ? '아 늦었다... 출석 불렀어?'
        : isFestival ? '축제 공연 연습 중! 와서 봐!'
        : '아침부터 기타 치니까 기분 좋다~',
    },
    afternoon: {
      location: isFestival ? 'campus' : 'club_room',
      activity: isFestival ? '축제 부스 돌아다니는 중' : '밴드 합주 중',
      dialogue: isFestival ? '여기 먹을 거 맛있다! 같이 돌아보자!'
        : '새 곡 배우고 있어. 들어볼래?',
    },
    evening: {
      location: week >= 8 ? 'live_cafe' : 'restaurant',
      activity: week >= 8 ? '라이브 카페에서 공연 보는 중' : '학교 앞 맛집 탐방 중',
      dialogue: week >= 8 ? '이 밴드 진짜 좋아. 우리도 저렇게 하고 싶다.'
        : '여기 치킨 맛집이야! 같이 먹을래?',
    },
  };
}

/**
 * Get deterministic NPC routines for the week.
 * Rich, week-aware schedules that make NPCs feel alive.
 */
export function getWeeklyRoutines(week: number): CampusLife {
  const routines = [
    getJaeminRoutine(week),
    getMinjiRoutine(week),
    getSoyeonRoutine(week),
    getHyunwooRoutine(week),
  ];

  const BUZZ: Record<number, string> = {
    1: '새 학기 시작! 캠퍼스 곳곳에서 새내기들의 설렘이 느껴진다.',
    2: '동아리 홍보가 한창이다. 학생회관이 축제 분위기.',
    3: '벚꽃이 만개했다. 잔디밭에서 사진 찍는 학생들.',
    4: 'MT 시즌! 과마다 버스 대절 중.',
    5: '중간고사 한 달 전. 슬슬 긴장감이 도는 캠퍼스.',
    6: '도서관 좌석이 부족해지기 시작했다.',
    7: '시험 기간. 편의점 에너지 드링크 매진.',
    8: '중간 끝! 해방감에 취한 학생들.',
    9: '축제 주간! 무대와 부스로 가득한 캠퍼스.',
    10: '가을이 깊어진다. 낙엽 사이로 걷는 학생들.',
    11: '취업 특강 시즌. 4학년들 표정이 진지하다.',
    12: '공모전 포스터가 게시판을 가득 채웠다.',
    13: '기말 준비. 24시간 도서관이 만석.',
    14: '마지막 시험. 캠퍼스에 긴장감이 감돈다.',
    15: '종강! 환호성이 캠퍼스를 가득 채운다.',
    16: '방학의 시작. 텅 빈 캠퍼스가 쓸쓸하다.',
  };

  return {
    week,
    routines,
    campusBuzz: BUZZ[week] ?? '평범한 하루. 학생들이 바쁘게 오간다.',
  };
}

/**
 * NPC Initiative — NPCs proactively invite you to activities.
 * Returns an invitation if an NPC wants to do something with you.
 */
export interface NpcInvitation {
  npcId: string;
  npcName: string;
  message: string;
  activity: string;
  statBonus: Record<string, number>;
}

export function rollNpcInvitation(
  week: number,
  relationships: Record<string, { affection: number; lastInteraction?: number }>,
): NpcInvitation | null {
  // 30% chance per week of an NPC invitation
  if (Math.random() > 0.3) return null;

  const invitations: (NpcInvitation & { condition: () => boolean })[] = [
    {
      npcId: 'jaemin', npcName: '이재민',
      message: '야! 오늘 저녁에 치킨 먹으러 갈래? 새로 생긴 데 있는데!',
      activity: '재민이와 치킨 먹기',
      statBonus: { social: 5, stress: -8, money: -12000 },
      condition: () => (relationships['jaemin']?.affection ?? 0) >= 30,
    },
    {
      npcId: 'minji', npcName: '한민지',
      message: '...내일 도서관에서 같이 공부할래? 혼자 하니까 졸려서.',
      activity: '민지와 스터디',
      statBonus: { knowledge: 5, social: 3, stress: 2 },
      condition: () => (relationships['minji']?.affection ?? 0) >= 35,
    },
    {
      npcId: 'soyeon', npcName: '박소연',
      message: '후배야~ 이번 주에 맛집 하나 알려줄까? 학교 앞에 새로 생겼어!',
      activity: '소연 선배와 맛집 탐방',
      statBonus: { social: 4, charm: 3, stress: -5, money: -15000 },
      condition: () => (relationships['soyeon']?.affection ?? 0) >= 30,
    },
    {
      npcId: 'hyunwoo', npcName: '정현우',
      message: '후배! 이번 주 합주 끝나고 노래방 갈 건데, 같이 가자!',
      activity: '현우 선배와 노래방',
      statBonus: { social: 6, charm: 4, stress: -6, money: -10000 },
      condition: () => (relationships['hyunwoo']?.affection ?? 0) >= 30,
    },
    {
      npcId: 'jaemin', npcName: '이재민',
      message: '야 PC방 갈래? 새 게임 나왔는데 같이 하자!',
      activity: '재민이와 PC방',
      statBonus: { social: 5, stress: -10, money: -5000, knowledge: -1 },
      condition: () => (relationships['jaemin']?.affection ?? 0) >= 25 && week <= 6,
    },
    {
      npcId: 'minji', npcName: '한민지',
      message: '카페 가서 과제 같이 하지 않을래? 혼자 하기 싫어서...',
      activity: '민지와 카페 과제',
      statBonus: { knowledge: 4, social: 4, money: -5000 },
      condition: () => (relationships['minji']?.affection ?? 0) >= 40 && week >= 3,
    },
  ];

  const eligible = invitations.filter(inv => inv.condition());
  if (eligible.length === 0) return null;

  const pick = eligible[((week * 7) >>> 0) % eligible.length];
  return { npcId: pick.npcId, npcName: pick.npcName, message: pick.message, activity: pick.activity, statBonus: pick.statBonus };
}

/**
 * Find NPCs at the same location during a specific time slot.
 * Prefers AI-generated data, falls back to deterministic routines.
 */
export function findNpcsAtLocation(
  activityLocation: string,
  timeSlot: 'morning' | 'afternoon' | 'evening',
  week: number,
): { npcId: string; npcName: string; activity: string; dialogue: string }[] {
  // Try AI-generated campus data first
  const aiData = getCachedAiCampus();
  if (aiData?.week === week && aiData.routines.length > 0) {
    const NPC_NAMES: Record<string, string> = { jaemin: '이재민', minji: '한민지', soyeon: '박소연', hyunwoo: '정현우' };
    return aiData.routines
      .filter(r => {
        const slot = r[timeSlot];
        return slot?.location?.includes(activityLocation) || activityLocation.includes(slot?.location ?? '');
      })
      .map(r => ({
        npcId: r.npcId,
        npcName: NPC_NAMES[r.npcId] ?? r.npcId,
        activity: r[timeSlot].doing,
        dialogue: r[timeSlot].dialogue,
      }));
  }

  // Fallback to deterministic routines
  const campus = getWeeklyRoutines(week);
  const LOCATION_MAP: Record<string, string[]> = {
    classroom: ['classroom'],
    library: ['library'],
    cafe: ['cafe', 'live_cafe'],
    cafeteria: ['cafeteria'],
    gym: ['gym'],
    club_room: ['club_room'],
    dorm: ['dorm', 'convenience_store'],
    campus: ['campus'],
    restaurant: ['restaurant'],
  };

  const matchLocations = LOCATION_MAP[activityLocation] ?? [activityLocation];

  return campus.routines
    .filter(r => {
      const npcLocation = r[timeSlot].location;
      return matchLocations.includes(npcLocation);
    })
    .map(r => ({
      npcId: r.npcId,
      npcName: r.npcName,
      activity: r[timeSlot].activity,
      dialogue: r[timeSlot].dialogue,
    }));
}

/**
 * NPC-to-NPC social dynamics — things happening BETWEEN NPCs
 * that the player might overhear or learn about.
 */
export function getNpcSocialEvent(week: number): { text: string; npcs: string[] } | null {
  const events: { text: string; npcs: string[]; week: number[] }[] = [
    { text: '재민이랑 현우 선배가 학식당에서 같이 밥 먹는 걸 봤다. 동아리 얘기를 하는 것 같다.', npcs: ['jaemin', 'hyunwoo'], week: [2, 3, 4] },
    { text: '민지가 소연 선배한테 공부법을 물어보는 모습을 목격했다. 의외의 조합이다.', npcs: ['minji', 'soyeon'], week: [3, 5, 6] },
    { text: '재민이가 민지랑 과제 팀이 됐다며 투덜거렸다. "걔 기준이 너무 높아..."', npcs: ['jaemin', 'minji'], week: [4, 5, 8] },
    { text: '소연 선배가 현우 선배랑 카페에서 진지하게 얘기하고 있었다. 졸업 후 계획인 것 같다.', npcs: ['soyeon', 'hyunwoo'], week: [10, 11, 12] },
    { text: '현우 선배가 재민이한테 기타 가르쳐주고 있었다. 재민이 표정이 진지하다.', npcs: ['hyunwoo', 'jaemin'], week: [5, 6, 7] },
    { text: '민지가 혼자 도서관에서 공부하다가 소연 선배를 만나서 같이 밥 먹으러 간 모양이다.', npcs: ['minji', 'soyeon'], week: [7, 9, 13] },
    { text: '재민이가 현우 선배 밴드 공연 보러 갔다 왔다며 사진을 보여줬다. 신나 보인다.', npcs: ['jaemin', 'hyunwoo'], week: [8, 9] },
    { text: '민지가 재민이한테 노트 빌려달라고 했다는 소문을 들었다. 민지가? 믿기 어렵다.', npcs: ['minji', 'jaemin'], week: [6, 10, 14] },
  ];

  const eligible = events.filter(e => e.week.includes(week));
  if (eligible.length === 0 || Math.random() > 0.4) return null;
  return eligible[week % eligible.length];
}

/**
 * Get a brief "where is everyone?" summary for the weekly overview.
 */
export function getNpcLocationSummary(week: number, timeOfDay: 'morning' | 'afternoon' | 'evening'): string[] {
  const campus = getWeeklyRoutines(week);
  return campus.routines.map(r => {
    const slot = r[timeOfDay];
    return `${r.npcName}: ${slot.activity}`;
  });
}
