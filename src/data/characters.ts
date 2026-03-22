import type { CharacterDef } from '@/store/types';

export const CHARACTERS: Record<string, CharacterDef> = {
  soyeon: {
    id: 'soyeon',
    name: '박소연',
    role: '따뜻한 선배',
    description: '항상 후배들을 챙기는 따뜻한 3학년 선배. 문학 동아리 회장.',
    expressions: ['neutral', 'happy', 'teasing', 'blushing', 'worried', 'sad'],
    personality: 'caring_mentor',
    color: 'pink',
  },
  jaemin: {
    id: 'jaemin',
    name: '이재민',
    role: '룸메이트',
    description: '밝고 사교적인 같은 학년 친구. 항상 긍정적이지만 속으로는 불안한 면도.',
    expressions: ['neutral', 'happy', 'anxious', 'laughing', 'concerned', 'supportive'],
    personality: 'supportive_friend',
    color: 'teal',
  },
  'prof-kim': {
    id: 'prof-kim',
    name: '김 교수',
    role: '전공 교수',
    description: '엄격하지만 실력있는 학생을 아끼는 전공 교수님.',
    expressions: ['neutral', 'stern', 'approving', 'disappointed', 'thoughtful'],
    personality: 'strict_mentor',
    color: 'gold',
  },
  minji: {
    id: 'minji',
    name: '한민지',
    role: '라이벌',
    description: '같은 과 수석 경쟁자. 겉으로는 차갑지만 인정 많은 성격.',
    expressions: ['neutral', 'competitive', 'friendly', 'frustrated', 'triumphant'],
    personality: 'competitive_rival',
    color: 'coral',
  },
  hyunwoo: {
    id: 'hyunwoo',
    name: '정현우',
    role: '동아리 선배',
    description: '카리스마 있는 밴드 동아리 선배. 자유로운 영혼.',
    expressions: ['neutral', 'cool', 'scheming', 'helpful', 'surprised'],
    personality: 'cool_senior',
    color: 'lavender',
  },
  boss: {
    id: 'boss',
    name: '이사장님',
    role: '알바 사장님',
    description: '학교 앞 카페 사장님. 학생들을 자식처럼 챙기는 따뜻한 분.',
    expressions: ['neutral', 'busy', 'understanding', 'firm', 'pleased'],
    personality: 'warm_boss',
    color: 'teal',
  },
};

export function getCharacter(id: string): CharacterDef | undefined {
  return CHARACTERS[id];
}

export function getCharacterName(id: string | null): string {
  if (!id) return '나레이터';
  return CHARACTERS[id]?.name ?? id;
}
