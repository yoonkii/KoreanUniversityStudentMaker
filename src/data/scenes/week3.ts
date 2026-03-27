import type { Scene } from '@/store/types';

/** Week 3 Variant B: 학식 — Cafeteria bonding. A lighter social scene. */
export const WEEK_3_VARIANT_B: Scene[] = [
  {
    id: 'cafeteria_bonding',
    location: 'cafe',
    backgroundVariant: 'seating',
    characters: [
      { characterId: 'jaemin', expression: 'happy', position: 'left' },
      { characterId: 'hyunwoo', expression: 'neutral', position: 'right' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '3주차. 점심시간 학식당. 의외로 맛있는 메뉴가 있다는 소문을 듣고 왔다.',
      },
      {
        characterId: 'jaemin',
        expression: 'happy',
        text: '야, 오늘 돈까스 나왔다! 3,500원에 이 퀄리티면 개이득이지.',
      },
      {
        characterId: 'hyunwoo',
        expression: 'cool',
        text: '오, 신입? 나 밴드 동아리 정현우야. 같이 앉아도 돼?',
      },
      {
        characterId: 'jaemin',
        expression: 'neutral',
        text: '선배님이세요? 저희 1학년이에요. 아직 동아리 안 정했는데...',
      },
      {
        characterId: 'hyunwoo',
        expression: 'helpful',
        text: '관심 있으면 이번 주 합주 구경 와. 강제 가입 이런 거 없으니까 편하게.',
      },
    ],
    choices: [
      {
        id: 'cafe_club',
        text: '동아리 합주 꼭 가볼게요! 관심 있었거든요.',
        statEffects: { social: 5, charm: 3, stress: -2 },
        relationshipEffects: [
          { characterId: 'hyunwoo', change: 8 },
          { characterId: 'jaemin', change: 3 },
        ],
      },
      {
        id: 'cafe_study',
        text: '동아리는 시간 되면... 요즘 과제가 많아서요.',
        statEffects: { gpa: 2, social: 1, stress: 2 },
        relationshipEffects: [
          { characterId: 'hyunwoo', change: 1 },
          { characterId: 'jaemin', change: 2 },
        ],
      },
      {
        id: 'cafe_chill',
        text: '일단 밥이나 맛있게 먹자! 선배, 여기 뭐가 맛있어요?',
        statEffects: { social: 4, charm: 2, health: 2 },
        relationshipEffects: [
          { characterId: 'hyunwoo', change: 5 },
          { characterId: 'jaemin', change: 4 },
        ],
      },
    ],
  },
];

/** Week 3 Variant A: 첫 과제 — First real assignment and group project assignment. The academic pressure begins. */
export const WEEK_3_SCENES: Scene[] = [
  {
    id: 'first_assignment',
    location: 'classroom',
    backgroundVariant: 'normal',
    characters: [
      { characterId: 'minji', expression: 'neutral', position: 'left' },
      { characterId: 'jaemin', expression: 'neutral', position: 'right' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '3주차. 꿀 같았던 개강 분위기가 끝나고, 교수님이 첫 조별과제를 공지했다.',
      },
      {
        characterId: null,
        text: '"4명이 한 조로 보고서를 작성하세요. 다음 주까지입니다."',
      },
      {
        characterId: 'jaemin',
        expression: 'neutral',
        text: '으... 벌써 조별과제? 누구랑 해야 하지... 아는 사람이 별로 없는데.',
      },
      {
        characterId: 'minji',
        expression: 'neutral',
        text: '빨리 조 짜는 게 좋아. 늦으면 남는 사람끼리 되는데, 그건 복불복이야.',
      },
      {
        characterId: 'jaemin',
        expression: 'neutral',
        text: '민지야, 혹시 우리 같은 조 할래? 넌 잘하잖아...',
      },
      {
        characterId: 'minji',
        expression: 'neutral',
        text: '...나를 이용하려는 건 아니지? 같이 하려면 제대로 해야 해.',
      },
    ],
    choices: [
      {
        id: 'assignment_lead',
        text: '내가 조장 할게! 역할 분배부터 하자.',
        statEffects: { gpa: 4, charm: 3, stress: 6 },
        relationshipEffects: [
          { characterId: 'minji', change: 5 },
          { characterId: 'jaemin', change: 5 },
        ],
      },
      {
        id: 'assignment_follow',
        text: '민지가 리드하는 게 나을 것 같아. 난 열심히 할게.',
        statEffects: { gpa: 2, social: 3, stress: 3 },
        relationshipEffects: [
          { characterId: 'minji', change: 3 },
          { characterId: 'jaemin', change: 3 },
        ],
      },
      {
        id: 'assignment_solo',
        text: '나는 개인 과제가 더 편해... 혼자 해도 되나요?',
        statEffects: { gpa: 3, social: -3, stress: 4 },
        relationshipEffects: [
          { characterId: 'minji', change: -2 },
          { characterId: 'jaemin', change: -3 },
        ],
      },
    ],
  },
];
