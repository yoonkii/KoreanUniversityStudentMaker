import type { Scene } from '@/store/types';

/** Week 7: 시험 직전 — The night before midterms. Cramming, anxiety, and a moment of solidarity. */
export const WEEK_7_SCENES: Scene[] = [
  {
    id: 'midterm_eve',
    location: 'library',
    backgroundVariant: 'night',
    characters: [
      { characterId: 'jaemin', expression: 'neutral', position: 'left' },
      { characterId: 'minji', expression: 'neutral', position: 'right' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '중간고사 전날 밤. 도서관은 빈 자리가 하나도 없다. 편의점 커피가 세 번째다.',
      },
      {
        characterId: 'jaemin',
        expression: 'neutral',
        text: '하... 이 범위를 못 외우겠어. 왜 시험 범위가 이렇게 많은 거야...',
      },
      {
        characterId: 'minji',
        expression: 'neutral',
        text: '...나도 솔직히 불안해. 이번 시험 범위 진짜 넓어.',
      },
      {
        characterId: null,
        text: '민지가 불안하다고 말하는 건 처음이다. 완벽해 보이는 그녀도 긴장하는구나.',
      },
      {
        characterId: 'jaemin',
        expression: 'neutral',
        text: '야, 우리 이 시간에 여기 있는 것만으로도 대단한 거 아니야?',
      },
      {
        characterId: 'minji',
        expression: 'neutral',
        text: '...맞아. 포기하지 않고 여기까지 온 거잖아. 내일 끝나면 치킨이다.',
      },
    ],
    choices: [
      {
        id: 'midterm_cram_together',
        text: '같이 버티자! 모르는 거 서로 알려주면서 하자.',
        statEffects: { gpa: 4, social: 3, stress: 3 },
        relationshipEffects: [
          { characterId: 'jaemin', change: 5 },
          { characterId: 'minji', change: 6 },
        ],
      },
      {
        id: 'midterm_solo_focus',
        text: '미안, 나 집중 모드 들어갈게. 이어폰 꽂고 달린다.',
        statEffects: { gpa: 6, stress: 8 },
        relationshipEffects: [
          { characterId: 'jaemin', change: -1 },
          { characterId: 'minji', change: 2 },
        ],
      },
      {
        id: 'midterm_give_up',
        text: '...오늘은 여기까지. 컨디션 관리가 더 중요해.',
        statEffects: { health: 5, stress: -10, gpa: -2 },
        relationshipEffects: [
          { characterId: 'jaemin', change: 3 },
          { characterId: 'minji', change: -2 },
        ],
      },
    ],
  },
];
