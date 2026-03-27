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
  return {
    npcId: 'jaemin', npcName: '이재민',
    morning: {
      location: isExamSeason ? 'library' : 'cafeteria',
      activity: isExamSeason ? '도서관에서 벼락치기 중' : '학식당에서 아침 먹는 중',
      dialogue: isExamSeason ? '야... 밤새 공부했는데 하나도 모르겠어ㅠ 커피 사와줘...'
        : isFestival ? '축제다!! 오늘 뭐 볼 거야?!'
        : week <= 3 ? '학식 오늘 돈까스다! 빨리 와 자리 없어!'
        : '아 배고파... 오늘 뭐 먹지?',
    },
    afternoon: {
      location: isExamSeason ? 'library' : week % 2 === 0 ? 'gym' : 'cafe',
      activity: isExamSeason ? '계속 공부 중... 눈이 빠질 것 같다'
        : week % 2 === 0 ? '체육관에서 농구 중' : '카페에서 유튜브 보는 중',
      dialogue: isExamSeason ? '이 공식 맞아? 아 모르겠다 그냥 외우자...'
        : week % 2 === 0 ? '야 같이 농구 한 판 할래? 혼자 하니까 심심해!'
        : 'ㅋㅋㅋ 이 영상 봐봐 진짜 웃겨',
    },
    evening: {
      location: week % 3 === 0 ? 'convenience_store' : 'dorm',
      activity: week % 3 === 0 ? '편의점에서 야식 고르는 중' : '기숙사에서 게임 중',
      dialogue: week % 3 === 0 ? '라면 먹을래? 내가 쏠게!'
        : '야 롤 한 판만 더... 아 졌다ㅋㅋ',
    },
  };
}

function getMinjiRoutine(week: number): NpcRoutine {
  const isExamSeason = [6, 7, 8, 13, 14, 15].includes(week);
  return {
    npcId: 'minji', npcName: '한민지',
    morning: {
      location: 'classroom',
      activity: '수업 시작 전에 예습하는 중',
      dialogue: isExamSeason ? '...이번 범위 끝냈어? 나 아직 3장 남았어.'
        : week <= 3 ? '...앞자리 앉을 거야? 난 여기 앉을 건데.'
        : '오늘 교수님이 중요하다고 하신 부분 정리했어. 볼래?',
    },
    afternoon: {
      location: isExamSeason ? 'library' : week % 2 === 0 ? 'cafe' : 'library',
      activity: isExamSeason ? '도서관에서 미친 듯이 공부 중' : '조용히 공부하는 중',
      dialogue: isExamSeason ? '말 걸지 마. 집중하고 있어.'
        : '...여기 조용해서 좋아. 너도 공부할 거야?',
    },
    evening: {
      location: week >= 10 ? 'cafe' : 'library',
      activity: week >= 10 ? '카페에서 과제하는 중' : '도서관 마감 시간까지 버티는 중',
      dialogue: week >= 10 ? '아메리카노 3잔째... 살 것 같아.'
        : '도서관 곧 닫는대. 나가야 하나...',
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
 * Find NPCs at the same location during a specific time slot.
 * Returns encounter-ready data with dialogue.
 */
export function findNpcsAtLocation(
  activityLocation: string,
  timeSlot: 'morning' | 'afternoon' | 'evening',
  week: number,
): { npcId: string; npcName: string; activity: string; dialogue: string }[] {
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
 * Get a brief "where is everyone?" summary for the weekly overview.
 */
export function getNpcLocationSummary(week: number, timeOfDay: 'morning' | 'afternoon' | 'evening'): string[] {
  const campus = getWeeklyRoutines(week);
  return campus.routines.map(r => {
    const slot = r[timeOfDay];
    return `${r.npcName}: ${slot.activity}`;
  });
}
