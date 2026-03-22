import type { ActivityDef } from '@/store/types';

export const ACTIVITIES: Record<string, ActivityDef> = {
  lecture: {
    id: 'lecture',
    name: '수업 듣기',
    icon: 'solar:book-bold',
    color: 'teal',
    statEffects: { gpa: 3, stress: 3, social: 1 },
    description: '전공 수업에 출석해서 교수님 강의를 듣는다.',
  },
  study: {
    id: 'study',
    name: '도서관 공부',
    icon: 'solar:book-2-bold',
    color: 'gold',
    statEffects: { gpa: 5, stress: 8, health: -3 },
    description: '도서관에 틀어박혀서 집중적으로 공부한다.',
  },
  parttime: {
    id: 'parttime',
    name: '아르바이트',
    icon: 'solar:wallet-bold',
    color: 'teal',
    statEffects: { money: 45000, stress: 5, health: -5, social: 2 },
    description: '학교 앞 카페에서 아르바이트를 한다.',
  },
  club: {
    id: 'club',
    name: '동아리 활동',
    icon: 'solar:music-note-bold',
    color: 'lavender',
    statEffects: { gpa: 1, money: -10000, social: 8, stress: -3, charm: 3 },
    description: '동아리 모임에 참여해서 선후배들과 어울린다.',
  },
  date: {
    id: 'date',
    name: '데이트',
    icon: 'solar:heart-bold',
    color: 'pink',
    statEffects: { money: -30000, social: 5, stress: -10, charm: 5 },
    description: '좋아하는 사람과 함께 시간을 보낸다.',
  },
  exercise: {
    id: 'exercise',
    name: '운동하기',
    icon: 'solar:running-round-bold',
    color: 'teal',
    statEffects: { health: 10, stress: -5, charm: 2 },
    description: '학교 체육관에서 운동으로 체력을 기른다.',
  },
  rest: {
    id: 'rest',
    name: '휴식',
    icon: 'solar:moon-bold',
    color: 'txt-secondary',
    statEffects: { health: 10, stress: -15 },
    description: '기숙사에서 편하게 쉬면서 몸과 마음을 회복한다.',
  },
  friends: {
    id: 'friends',
    name: '친구 만나기',
    icon: 'solar:users-group-rounded-bold',
    color: 'pink',
    statEffects: { social: 10, stress: -5, money: -15000, charm: 2 },
    description: '친구들과 만나서 밥도 먹고 수다도 떤다.',
  },
};

export const ACTIVITY_LIST: ActivityDef[] = Object.values(ACTIVITIES);

export function getActivity(id: string): ActivityDef | undefined {
  return ACTIVITIES[id];
}
