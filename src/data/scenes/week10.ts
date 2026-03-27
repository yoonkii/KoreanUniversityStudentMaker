import type { Scene } from '@/store/types';

/** Week 10 Variant B: 새로운 발견 — Discovering something unexpected on campus. */
export const WEEK_10_VARIANT_B: Scene[] = [
  {
    id: 'campus_discovery',
    location: 'campus',
    backgroundVariant: 'day',
    characters: [
      { characterId: 'soyeon', expression: 'happy', position: 'center' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '10주차. 수업 끝나고 평소와 다른 길로 캠퍼스를 걸었다.',
      },
      {
        characterId: null,
        text: '학교 뒤편에 이런 정원이 있었나? 벤치에 앉아 있는 소연 선배가 보인다.',
      },
      {
        characterId: 'soyeon',
        expression: 'happy',
        text: '여기 알아? 나만의 비밀 장소인데. 시험 때 여기 오면 마음이 편해져.',
      },
      {
        characterId: 'soyeon',
        expression: 'teasing',
        text: '가끔은 교실 밖에서 배우는 게 더 많아. 요즘 뭐 새로운 거 해본 적 있어?',
      },
      {
        characterId: null,
        text: '선배의 질문에 생각에 빠진다. 매일 같은 루틴의 반복이었는데...',
      },
    ],
    choices: [
      {
        id: 'discover_writing',
        text: '글 쓰기에 관심이 생겼어요. 블로그라도 시작해볼까...',
        statEffects: { charm: 5, stress: -5, gpa: 2 },
        relationshipEffects: [{ characterId: 'soyeon', change: 8 }],
      },
      {
        id: 'discover_exercise',
        text: '요즘 운동을 시작했는데, 생각보다 재밌어요!',
        statEffects: { health: 8, charm: 3, stress: -5 },
        relationshipEffects: [{ characterId: 'soyeon', change: 5 }],
      },
      {
        id: 'discover_nothing',
        text: '딱히... 매일 똑같은 것 같아요.',
        statEffects: { stress: 5 },
        relationshipEffects: [{ characterId: 'soyeon', change: 3 }],
      },
    ],
  },
];

/** Week 10: 중간 슬럼프 — Post-midterm slump. Motivation crashes, choices define recovery. */
export const WEEK_10_SCENES: Scene[] = [
  // ─── Scene 1: 공강에 뭐하지 (Empty Period Blues) ───
  {
    id: 'midterm_slump',
    location: 'campus_bench',
    backgroundVariant: 'autumn',
    characters: [
      { characterId: 'jaemin', expression: 'neutral', position: 'right' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '중간고사가 끝났다. 해방감은 이틀이면 사라지고, 남은 건 공허함뿐이다.',
      },
      {
        characterId: null,
        text: '수업은 계속되는데, 다음 목표가 뭔지 모르겠다. 벤치에 앉아 멍하니 하늘을 본다.',
      },
      {
        characterId: 'jaemin',
        expression: 'neutral',
        text: '야, 너도 여기서 멍 때리고 있었어? 나도 요즘 아무것도 하기 싫어...',
      },
      {
        characterId: 'jaemin',
        expression: 'neutral',
        text: '시험 끝나면 신날 줄 알았는데, 오히려 더 무기력해. 이게 뭐지?',
      },
      {
        characterId: null,
        text: '중간고사 후 슬럼프. 거의 모든 대학생이 겪는다는 그것.',
      },
    ],
    choices: [
      {
        id: 'slump_refresh',
        text: '오늘은 학교 앞 맛집이나 가자. 맛있는 거 먹으면 나아져.',
        statEffects: { stress: -8, social: 3, money: -15000 },
        relationshipEffects: [
          { characterId: 'jaemin', change: 5 },
        ],
      },
      {
        id: 'slump_plan',
        text: '기말고사까지 계획표를 다시 짜보자. 목표가 있으면 괜찮아져.',
        statEffects: { gpa: 3, stress: -3 },
        relationshipEffects: [
          { characterId: 'jaemin', change: 3 },
        ],
      },
      {
        id: 'slump_wallow',
        text: '좀 쉬자... 오늘은 넷플릭스나 보면서 충전하는 날로.',
        statEffects: { stress: -12, health: 3, gpa: -2 },
        relationshipEffects: [
          { characterId: 'jaemin', change: 2 },
        ],
      },
    ],
  },
  // ─── Scene 2: 선배의 조언 (Senior's Advice) ───
  {
    id: 'senior_advice',
    location: 'cafe',
    backgroundVariant: 'warm',
    characters: [
      { characterId: 'soyeon', expression: 'neutral', position: 'left' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '학교 앞 카페에서 소연 선배를 우연히 만났다.',
      },
      {
        characterId: 'soyeon',
        expression: 'neutral',
        text: '어? 요즘 표정이 좀 어둡다? 혹시 중간고사 후 슬럼프?',
      },
      {
        characterId: 'soyeon',
        expression: 'neutral',
        text: '나도 1학년 때 그랬어. 시험 끝나면 갑자기 목표가 사라진 것 같지?',
      },
      {
        characterId: 'soyeon',
        expression: 'neutral',
        text: '근데 있잖아, 이 시기가 사실 제일 중요해. 학점만으로 남는 게 아니거든.',
      },
      {
        characterId: 'soyeon',
        expression: 'neutral',
        text: '지금이야말로 학점 외에 뭘 하고 싶은지 생각해볼 시간이야.',
      },
    ],
    choices: [
      {
        id: 'advice_career',
        text: '선배, 진로 고민 좀 들어주세요. 요즘 많이 생각하고 있어요.',
        statEffects: { gpa: 2, stress: -5, charm: 2 },
        relationshipEffects: [
          { characterId: 'soyeon', change: 8 },
        ],
      },
      {
        id: 'advice_life',
        text: '학교 생활 꿀팁 좀 알려주세요! 선배는 어떻게 다 잘하셨어요?',
        statEffects: { social: 4, charm: 3, stress: -3 },
        relationshipEffects: [
          { characterId: 'soyeon', change: 6 },
        ],
      },
      {
        id: 'advice_independent',
        text: '감사해요, 근데 스스로 답을 찾아보고 싶어요.',
        statEffects: { gpa: 1, stress: 3, charm: -1 },
        relationshipEffects: [
          { characterId: 'soyeon', change: -2 },
        ],
      },
    ],
  },
];
