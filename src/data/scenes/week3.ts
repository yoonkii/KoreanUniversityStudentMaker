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
        text: '3주차 점심시간. 학생식당은 12시가 되자마자 줄이 길어졌다. 트레이를 들고 자리를 찾는데, 재민이가 손을 흔든다.',
      },
      {
        characterId: null,
        text: '주변에서 수강 변경 얘기, 동아리 가입 고민, 교수님 험담이 뒤섞여 들려온다. 대학 특유의 활기찬 점심 풍경.',
      },
      {
        characterId: 'jaemin',
        expression: 'happy',
        text: '야, 여기 여기! 오늘 돈까스 나왔다! 3,500원에 이 퀄리티면 개이득이지. 빨리 와 없어지기 전에!',
      },
      {
        characterId: null,
        text: '그때 기타 케이스를 멘 선배 한 명이 재민이 옆에 트레이를 내려놓으며 자연스럽게 합석했다.',
      },
      {
        characterId: 'hyunwoo',
        expression: 'cool',
        text: '오, 신입? 나 밴드 동아리 정현우. 재민이 친구야? 같이 먹자.',
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
        statEffects: { social: 5, charm: 3, stress: -2, knowledge: -1 },
        relationshipEffects: [
          { characterId: 'hyunwoo', change: 8 },
          { characterId: 'jaemin', change: 3 },
        ],
      },
      {
        id: 'cafe_study',
        text: '동아리는 시간 되면... 요즘 과제가 많아서요.',
        statEffects: { knowledge: 2, social: 1, stress: 2 },
        relationshipEffects: [
          { characterId: 'hyunwoo', change: 1 },
          { characterId: 'jaemin', change: 2 },
        ],
      },
      {
        id: 'cafe_chill',
        text: '일단 밥이나 맛있게 먹자! 선배, 여기 뭐가 맛있어요?',
        statEffects: { social: 4, charm: 2, health: 2, money: -3500 },
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
        text: '3주차. 꿀 같았던 개강 분위기가 끝나고, 교수님이 첫 조별과제를 공지했다. 강의실에 한숨 소리가 퍼진다.',
      },
      {
        characterId: null,
        text: '교수님이 화면에 과제 내용을 띄우자 학생들이 급히 핸드폰으로 사진을 찍기 시작한다. "4명이 한 조, 다음 주까지."',
      },
      {
        characterId: null,
        text: '수업이 끝나자마자 강의실이 술렁인다. 이미 친한 사람끼리 눈빛을 교환하고, 아직 모르는 사이인 학생들은 어색하게 주변을 살핀다.',
      },
      {
        characterId: 'jaemin',
        expression: 'neutral',
        text: '으... 벌써 조별과제? 누구랑 해야 하지... 아는 사람이 너밖에 없는데.',
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
        statEffects: { knowledge: 4, charm: 3, stress: 6 },
        relationshipEffects: [
          { characterId: 'minji', change: 5 },
          { characterId: 'jaemin', change: 5 },
        ],
      },
      {
        id: 'assignment_follow',
        text: '민지가 리드하는 게 나을 것 같아. 난 열심히 할게.',
        statEffects: { knowledge: 2, social: 3, stress: 3 },
        relationshipEffects: [
          { characterId: 'minji', change: 3 },
          { characterId: 'jaemin', change: 3 },
        ],
      },
      {
        id: 'assignment_solo',
        text: '나는 개인 과제가 더 편해... 혼자 해도 되나요?',
        statEffects: { knowledge: 3, social: -3, stress: 4 },
        relationshipEffects: [
          { characterId: 'minji', change: -2 },
          { characterId: 'jaemin', change: -3 },
        ],
      },
    ],
  },
];
