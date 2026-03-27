import type { Scene } from '@/store/types';

/** Week 9: 축제 (University Festival) — the highlight of every Korean semester. */
export const WEEK_9_SCENES: Scene[] = [
  // ─── Scene 1: Festival Opens ───
  {
    id: 'festival_open',
    location: 'campus',
    backgroundVariant: 'day',
    characters: [
      { characterId: 'jaemin', expression: 'happy', position: 'left' },
      { characterId: 'hyunwoo', expression: 'happy', position: 'right' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '캠퍼스가 완전히 달라졌다. 학과 부스마다 현수막이 걸리고, 메인 무대에서는 사운드 체크 소리가 울려 퍼진다. 1년에 한 번, 대학 축제가 시작됐다.',
      },
      {
        characterId: 'jaemin',
        expression: 'happy',
        text: '야!! 축제다 축제!! 오늘 저녁에 유명 가수 온다던데? 자리 먼저 잡으러 가자!',
      },
      {
        characterId: 'hyunwoo',
        expression: 'happy',
        text: '우리 동아리 부스도 봐줘야 해! 떡볶이 팔거든. 맛 보장함.',
      },
      {
        characterId: null,
        text: '어디부터 갈까? 시간은 한정되어 있고, 볼 건 너무 많다.',
      },
    ],
    choices: [
      {
        id: 'festival_booth',
        text: '동아리 부스부터 가자! 현우 선배 도와드릴게요.',
        statEffects: { social: 5, money: -8000 },
        relationshipEffects: [
          { characterId: 'hyunwoo', change: 8 },
          { characterId: 'jaemin', change: 2 },
        ],
      },
      {
        id: 'festival_concert',
        text: '공연 자리 먼저 잡자! 놓치면 후회해!',
        statEffects: { stress: -8, charm: 3, money: -5000 },
        relationshipEffects: [
          { characterId: 'jaemin', change: 5 },
        ],
      },
      {
        id: 'festival_wander',
        text: '일단 천천히 둘러보자. 분위기 즐기면서.',
        statEffects: { stress: -5, social: 3, charm: 2 },
        relationshipEffects: [
          { characterId: 'jaemin', change: 3 },
          { characterId: 'hyunwoo', change: 3 },
        ],
      },
    ],
  },

  // ─── Scene 2: Festival Night ───
  {
    id: 'festival_night',
    location: 'campus',
    backgroundVariant: 'day',
    characters: [
      { characterId: 'minji', expression: 'neutral', position: 'center' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '해가 지고 캠퍼스에 조명이 켜진다. 야시장 불빛, 맥주 거품, 웃음소리가 뒤섞인 축제의 밤.',
      },
      {
        characterId: null,
        text: '벤치에 앉아 맥주를 마시고 있는데, 민지가 혼자 걸어온다. 평소와 다르게 좀 풀어진 표정.',
      },
      {
        characterId: 'minji',
        expression: 'neutral',
        text: '...혼자야? 나도 좀 앉아도 돼?',
      },
      {
        characterId: 'minji',
        expression: 'neutral',
        text: '축제 때는 좀 다르지 않아? 평소에는 다들 경쟁하고 바쁜데... 오늘은 그냥 편하다.',
      },
      {
        characterId: 'minji',
        expression: 'happy',
        text: '...솔직히 중간고사 결과 좀 충격이었거든. 그래도 뭐, 이런 날이 있으니까 버티는 거지.',
      },
      {
        characterId: null,
        text: '민지의 솔직한 모습은 처음이다. 평소의 완벽주의자 이미지와는 다른, 편안한 얼굴.',
      },
    ],
    choices: [
      {
        id: 'festival_minji_empathy',
        text: '나도 그래. 힘든 건 같이 얘기하면 좀 나아지더라.',
        statEffects: { social: 3, charm: 2, stress: 2 },
        relationshipEffects: [{ characterId: 'minji', change: 10 }],
      },
      {
        id: 'festival_minji_compete',
        text: '민지가 그런 말을 하다니. 이번 기말엔 나도 안 질 거야.',
        statEffects: { knowledge: 2, social: -2 },
        relationshipEffects: [{ characterId: 'minji', change: 3 }],
      },
      {
        id: 'festival_minji_cheer',
        text: '야, 한 잔 더 마셔! 오늘은 생각하지 말자.',
        statEffects: { stress: -10, money: -5000 },
        relationshipEffects: [{ characterId: 'minji', change: 7 }],
      },
    ],
  },

  // ─── Scene 3: Festival Ending — Fireworks ───
  {
    id: 'festival_fireworks',
    location: 'campus',
    backgroundVariant: 'day',
    characters: [
      { characterId: 'soyeon', expression: 'happy', position: 'left' },
      { characterId: 'jaemin', expression: 'happy', position: 'right' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '축제 마지막 밤. 운동장에 모든 학생들이 모여 하늘을 올려다본다.',
      },
      {
        characterId: null,
        text: '펑— 하고 첫 번째 불꽃이 터진다. 환호성이 캠퍼스를 가득 채운다.',
      },
      {
        characterId: 'jaemin',
        expression: 'happy',
        text: '와... 진짜 예쁘다. 이런 게 대학 생활이지!',
      },
      {
        characterId: 'soyeon',
        expression: 'happy',
        text: '벌써 학기 반이 지났네... 다들 고생 많았어.',
      },
      {
        characterId: null,
        text: '불꽃이 밤하늘을 수놓는 동안, 이번 학기의 기억들이 하나둘 스쳐 지나간다. OT, 첫 수업, MT, 중간고사... 그리고 지금, 이 순간.',
      },
      {
        characterId: null,
        text: '학기의 절반이 지났다. 남은 반, 어떤 사람이 되어 있을까.',
      },
    ],
    choices: [
      {
        id: 'festival_end_determined',
        text: '후반전이 시작이야. 더 열심히 하자!',
        statEffects: { knowledge: 2, stress: 3 },
        relationshipEffects: [
          { characterId: 'soyeon', change: 3 },
          { characterId: 'jaemin', change: 3 },
        ],
      },
      {
        id: 'festival_end_grateful',
        text: '좋은 사람들이랑 함께해서 다행이다.',
        statEffects: { social: 5, stress: -5, knowledge: -1 },
        relationshipEffects: [
          { characterId: 'soyeon', change: 5 },
          { characterId: 'jaemin', change: 5 },
        ],
      },
    ],
  },
];
