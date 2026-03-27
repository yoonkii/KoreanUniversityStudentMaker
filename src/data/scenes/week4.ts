import type { Scene } from '@/store/types';

/** Week 4: MT (엠티 / Membership Training) — the iconic Korean university bonding trip. */
export const WEEK_4_SCENES: Scene[] = [
  // ─── Scene 1: MT Announcement ───
  {
    id: 'mt_announcement',
    location: 'campus',
    backgroundVariant: 'day',
    characters: [
      { characterId: 'hyunwoo', expression: 'happy', position: 'center' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '점심시간, 학과 단체 카톡방이 폭발한다. 현우 선배가 올린 공지 하나에 다들 난리다.',
      },
      {
        characterId: 'hyunwoo',
        expression: 'happy',
        text: '이번 주 금-토 MT 확정!! 강원도 펜션이야. 참가비 3만원, 교통비 별도. 무조건 와야 해!',
      },
      {
        characterId: null,
        text: '엠티... 대학 생활의 꽃이라고 하던데. 밤새 게임하고, 술 마시고, 선후배 관계를 쌓는 그 전설의...',
      },
      {
        characterId: 'hyunwoo',
        expression: 'neutral',
        text: '참가 안 하면 다음 학기에 아는 사람 없어서 외로울 수 있어~ 농담 아니고 진짜야.',
      },
    ],
    choices: [
      {
        id: 'mt_go',
        text: '당연히 가야지! 엠티 빠지면 서운하잖아.',
        statEffects: { money: -30000, social: 3 },
        relationshipEffects: [{ characterId: 'hyunwoo', change: 5 }],
      },
      {
        id: 'mt_reluctant',
        text: '돈이 좀 부담되는데... 고민 좀 해볼게.',
        statEffects: { stress: 3 },
        relationshipEffects: [{ characterId: 'hyunwoo', change: -2 }],
      },
      {
        id: 'mt_skip',
        text: '이번엔 패스할게. 시험 준비도 해야 하고...',
        statEffects: { gpa: 3, stress: -5 },
        relationshipEffects: [{ characterId: 'hyunwoo', change: -5 }],
      },
    ],
  },

  // ─── Scene 2: MT Night — Campfire ───
  {
    id: 'mt_campfire',
    location: 'campus',
    backgroundVariant: 'day',
    characters: [
      { characterId: 'soyeon', expression: 'happy', position: 'left' },
      { characterId: 'jaemin', expression: 'laughing', position: 'right' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '밤 11시. 펜션 마당에 모닥불을 피워놓고 다 같이 둘러앉았다. 고기 굽는 냄새, 맥주 캔 따는 소리, 누군가 틀어놓은 기타 소리.',
      },
      {
        characterId: 'jaemin',
        expression: 'laughing',
        text: '야야야 소원 말해봐! 돌아가면서 한 명씩 올해 목표 발표하는 거야!',
      },
      {
        characterId: 'soyeon',
        expression: 'happy',
        text: '나부터 할게. 이번 학기 학점 4.0 이상... 그리고 새로운 사람들이랑 많이 친해지기!',
      },
      {
        characterId: 'soyeon',
        expression: 'neutral',
        text: '(작은 목소리로) ...그리고 선배 안 무서워하기.',
      },
      {
        characterId: 'jaemin',
        expression: 'happy',
        text: '소연이 귀여워ㅋㅋ 선배들 다 착해~ 자 다음!',
      },
      {
        characterId: null,
        text: '모두의 시선이 이쪽으로 향한다. 내 차례다.',
      },
    ],
    choices: [
      {
        id: 'mt_goal_academic',
        text: '장학금 받는 게 목표야! 올 A+ 가자!',
        statEffects: { gpa: 2 },
        relationshipEffects: [
          { characterId: 'soyeon', change: 5 },
          { characterId: 'jaemin', change: 2 },
        ],
      },
      {
        id: 'mt_goal_social',
        text: '이번 학기에 평생 친구 만들고 싶어!',
        statEffects: { social: 5, charm: 2 },
        relationshipEffects: [
          { characterId: 'soyeon', change: 3 },
          { characterId: 'jaemin', change: 5 },
        ],
      },
      {
        id: 'mt_goal_funny',
        text: '일단... 이 학기 살아남는 게 목표?',
        statEffects: { charm: 3, stress: -5 },
        relationshipEffects: [
          { characterId: 'soyeon', change: 2 },
          { characterId: 'jaemin', change: 3 },
        ],
      },
    ],
  },

  // ─── Scene 3: MT Morning After ───
  {
    id: 'mt_morning',
    location: 'campus',
    backgroundVariant: 'day',
    characters: [
      { characterId: 'soyeon', expression: 'neutral', position: 'center' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '다음 날 아침. 머리가 약간 무겁지만, 어젯밤의 기억은 선명하다. 모닥불, 웃음소리, 별... 대학 생활이 이런 거구나.',
      },
      {
        characterId: null,
        text: '펜션 밖 테라스에서 소연 선배가 혼자 커피를 마시고 있다.',
      },
      {
        characterId: 'soyeon',
        expression: 'neutral',
        text: '어, 일찍 일어났네? 커피 마실래? 내가 타줄게.',
      },
      {
        characterId: 'soyeon',
        expression: 'happy',
        text: '어젯밤 목표 발표 좋았어. 솔직해서 좋더라.',
      },
      {
        characterId: 'soyeon',
        expression: 'neutral',
        text: '...이번 학기 힘든 일 있으면 언제든 연락해. 선배니까.',
      },
      {
        characterId: null,
        text: '소연 선배의 따뜻한 커피가 손을 감싼다. 이 학기, 혼자가 아니라는 게 좀 안심이 된다.',
      },
    ],
    choices: [
      {
        id: 'mt_soyeon_open',
        text: '고마워요 선배. 진짜 의지할게요!',
        statEffects: { social: 3, stress: -8 },
        relationshipEffects: [{ characterId: 'soyeon', change: 8 }],
      },
      {
        id: 'mt_soyeon_cool',
        text: '감사합니다. 저도 선배 도울 일 있으면 말씀하세요.',
        statEffects: { charm: 2, social: 2 },
        relationshipEffects: [{ characterId: 'soyeon', change: 5 }],
      },
    ],
  },
];
