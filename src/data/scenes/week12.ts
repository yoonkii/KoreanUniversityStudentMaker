import type { Scene } from '@/store/types';

/** Week 12: 공모전 시즌 — Competition season. Team up or go solo for resume-building. */
export const WEEK_12_SCENES: Scene[] = [
  // ─── Scene 1: 공모전 모집 (Competition Recruitment) ───
  {
    id: 'competition_recruit',
    location: 'student_center',
    backgroundVariant: 'busy',
    characters: [
      { characterId: 'hyunwoo', expression: 'neutral', position: 'left' },
      { characterId: 'minji', expression: 'neutral', position: 'right' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '학생회관 게시판이 공모전 포스터로 가득하다. 기말 전 마지막 대외활동 시즌.',
      },
      {
        characterId: 'hyunwoo',
        expression: 'neutral',
        text: '야, 이 공모전 같이 나갈 사람 구하는데! 대상 상금이 200만원이래.',
      },
      {
        characterId: 'minji',
        expression: 'neutral',
        text: '나도 봤어. 근데 기말고사 2주 전인데... 시간 분배가 관건이겠다.',
      },
      {
        characterId: 'hyunwoo',
        expression: 'neutral',
        text: '이런 건 대학생 때만 할 수 있잖아. 스펙도 되고, 경험도 되고!',
      },
      {
        characterId: 'minji',
        expression: 'neutral',
        text: '그건 맞아. 근데 팀플 하면서 공모전까지... 너 학점은 괜찮아?',
      },
    ],
    choices: [
      {
        id: 'competition_join',
        text: '현우야 나도 끼워줘! 이런 경험 놓치기 아깝다.',
        statEffects: { charm: 5, social: 4, stress: 8, knowledge: -3 },
        relationshipEffects: [
          { characterId: 'hyunwoo', change: 8 },
          { characterId: 'minji', change: 2 },
        ],
      },
      {
        id: 'competition_solo',
        text: '관심 있는 공모전이 하나 있긴 해. 개인으로 나가볼까 해.',
        statEffects: { knowledge: 2, charm: 4, stress: 6 },
        relationshipEffects: [
          { characterId: 'hyunwoo', change: -1 },
          { characterId: 'minji', change: 4 },
        ],
      },
      {
        id: 'competition_skip',
        text: '기말이 더 중요해. 나는 시험 준비에 집중할게.',
        statEffects: { knowledge: 4, stress: -2 },
        relationshipEffects: [
          { characterId: 'hyunwoo', change: -3 },
          { characterId: 'minji', change: 3 },
        ],
      },
    ],
  },
];
