import type { ActivityDef } from '@/store/types';

export const ACTIVITIES: Record<string, ActivityDef> = {
  lecture: {
    id: 'lecture',
    name: '수업 듣기',
    icon: 'solar:book-bold',
    color: 'teal',
    statEffects: { knowledge: 3, stress: 4, social: 1 },
    description: '전공 수업에 출석해서 교수님 강의를 듣는다.',
  },
  study: {
    id: 'study',
    name: '도서관 공부',
    icon: 'solar:book-2-bold',
    color: 'gold',
    statEffects: { knowledge: 5, stress: 10, health: -5, social: -2 },
    description: '도서관에 틀어박혀서 집중적으로 공부한다. 외로워진다.',
  },
  parttime: {
    id: 'parttime',
    name: '아르바이트',
    icon: 'solar:wallet-bold',
    color: 'teal',
    statEffects: { money: 40000, stress: 8, health: -8, knowledge: -1 },
    description: '학교 앞 카페에서 아르바이트를 한다. 공부할 시간이 줄어든다.',
  },
  club: {
    id: 'club',
    name: '동아리 활동',
    icon: 'solar:music-note-bold',
    color: 'lavender',
    statEffects: { money: -15000, social: 7, stress: -2, charm: 3 },
    description: '동아리 모임에 참여해서 선후배들과 어울린다.',
  },
  date: {
    id: 'date',
    name: '데이트',
    icon: 'solar:heart-bold',
    color: 'pink',
    statEffects: { money: -30000, social: 5, stress: -10, charm: 5, knowledge: -2 },
    description: '좋아하는 사람과 데이트. 사랑 감정이 생길 수 있다. (우정 40+ 필요)',
    unlockRequirement: { stat: 'charm', min: 40, label: '매력 40 이상' },
    requiresNpcTarget: true,
    npcVariants: [
      { npcId: 'jaemin', npcName: '이재민', statEffects: { social: 8, charm: 4, stress: -12, money: -25000, knowledge: -2 }, description: '재민이랑 둘이 나간다. 💕', requiredTier: 'friend' },
      { npcId: 'minji', npcName: '한민지', statEffects: { knowledge: 2, charm: 4, stress: -5, money: -25000, social: 3 }, description: '민지와 카페 데이트. 💕', requiredTier: 'friend' },
      { npcId: 'soyeon', npcName: '박소연', statEffects: { social: 5, charm: 6, stress: -12, money: -30000, knowledge: -1 }, description: '소연 선배와 데이트. 💕', requiredTier: 'friend' },
      { npcId: 'hyunwoo', npcName: '정현우', statEffects: { social: 6, charm: 5, stress: -8, money: -35000 }, description: '현우 선배와 데이트. 💕', requiredTier: 'friend' },
    ],
  },
  exercise: {
    id: 'exercise',
    name: '운동하기',
    icon: 'solar:running-round-bold',
    color: 'teal',
    statEffects: { health: 8, stress: -5, charm: 2, money: -3000 },
    description: '학교 체육관에서 운동으로 체력을 기른다.',
  },
  rest: {
    id: 'rest',
    name: '휴식',
    icon: 'solar:moon-bold',
    color: 'txt-secondary',
    statEffects: { health: 8, stress: -12, knowledge: -1 },
    description: '기숙사에서 편하게 쉬면서 회복한다. 공부는 못 한다.',
  },
  friends: {
    id: 'friends',
    name: '친구 만나기',
    icon: 'solar:users-group-rounded-bold',
    color: 'pink',
    statEffects: { social: 8, stress: -5, money: -15000, charm: 2 },
    description: '친구와 만나서 밥도 먹고 수다도 떤다.',
    requiresNpcTarget: true,
    npcVariants: [
      { npcId: 'jaemin', npcName: '이재민', statEffects: { social: 8, stress: -8, money: -10000 }, description: '재민이랑 치킨 먹으며 수다.', requiredTier: 'acquaintance' },
      { npcId: 'minji', npcName: '한민지', statEffects: { knowledge: 3, social: 5, stress: 2 }, description: '민지와 경쟁적 스터디.', requiredTier: 'acquaintance' },
      { npcId: 'soyeon', npcName: '박소연', statEffects: { social: 5, knowledge: 2, stress: -5 }, description: '소연 선배의 따뜻한 조언.', requiredTier: 'acquaintance' },
      { npcId: 'hyunwoo', npcName: '정현우', statEffects: { social: 6, charm: 5, money: -20000 }, description: '현우 선배와 분위기 좋은 곳.', requiredTier: 'acquaintance' },
    ],
  },
  // ─── Unlockable Activities ───
  tutoring: {
    id: 'tutoring',
    name: '과외하기',
    icon: 'solar:pen-new-square-bold',
    color: 'gold',
    statEffects: { money: 60000, knowledge: 2, stress: 6, charm: 2 },
    description: '후배에게 과외를 해주며 돈도 벌고 복습도 한다.',
    unlockRequirement: { stat: 'knowledge', min: 50, label: '준비도 50 이상' },
    unlockWeek: 4,
  },
  networking: {
    id: 'networking',
    name: '네트워킹',
    icon: 'solar:global-bold',
    color: 'lavender',
    statEffects: { social: 12, charm: 5, stress: 5, money: -20000 },
    description: '업계 선배들과의 네트워킹 모임에 참석한다.',
    unlockRequirement: { stat: 'social', min: 50, label: '인맥 50 이상' },
    unlockWeek: 8,
  },
  selfcare: {
    id: 'selfcare',
    name: '자기관리',
    icon: 'solar:shield-bold',
    color: 'pink',
    statEffects: { health: 12, charm: 4, stress: -8, money: -15000 },
    description: '피부관리, 헤어, 쇼핑... 자신에게 투자하는 시간.',
    unlockRequirement: { stat: 'charm', min: 40, label: '매력 40 이상' },
  },
  // ─── Weekend-Only Activities ───
  explore: {
    id: 'explore',
    name: '캠퍼스 탐험',
    icon: 'solar:map-bold',
    color: 'teal',
    statEffects: { charm: 3, stress: -6, social: 4, health: 2 },
    description: '주말에 캠퍼스를 돌아다니며 숨은 명소를 발견한다.',
    unlockWeek: 2,
  },
  volunteer: {
    id: 'volunteer',
    name: '봉사활동',
    icon: 'solar:hand-heart-bold',
    color: 'teal',
    statEffects: { social: 8, charm: 5, stress: 3, health: -3 },
    description: '지역 봉사활동에 참여한다. 힘들지만 보람 있다.',
    unlockWeek: 3,
  },
};

export const ACTIVITY_LIST: ActivityDef[] = Object.values(ACTIVITIES);

export function getActivity(id: string): ActivityDef | undefined {
  return ACTIVITIES[id];
}
