import type { Scene } from '@/store/types';

/** Week 8: 중간고사 (Midterms) — the first real academic crucible. */
export const WEEK_8_SCENES: Scene[] = [
  // ─── Scene 1: Exam Pressure ───
  {
    id: 'midterm_pressure',
    location: 'library',
    backgroundVariant: 'quiet',
    characters: [
      { characterId: 'minji', expression: 'neutral', position: 'center' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '도서관 3층. 빈 자리가 하나도 없다. 모든 좌석에서 형광펜 긋는 소리, 키보드 두드리는 소리가 들린다. 중간고사 전날이다.',
      },
      {
        characterId: null,
        text: '겨우 자리를 잡고 책을 펼치는데, 옆자리에 민지가 앉아 있다. 포스트잇이 가득한 교재, 정리 노트 3권, 태블릿까지.',
      },
      {
        characterId: 'minji',
        expression: 'neutral',
        text: '(속삭이며) ...너 이 범위 다 했어? 나 Chapter 5부터 아직인데.',
      },
      {
        characterId: 'minji',
        expression: 'neutral',
        text: '같이 하면 빠를 것 같은데... 내 노트 공유해줄 테니까 같이 정리하자.',
      },
    ],
    choices: [
      {
        id: 'midterm_study_together',
        text: '좋아, 같이 하자! 분업하면 빠르겠다.',
        statEffects: { knowledge: 5, stress: 5, social: 2 },
        relationshipEffects: [{ characterId: 'minji', change: 8 }],
        consequenceText: '새벽 3시, 민지와 마지막 챕터를 끝냈다. 해냈다.',
      },
      {
        id: 'midterm_study_alone',
        text: '미안, 나는 혼자 집중해야 해. 다음에!',
        statEffects: { knowledge: 3, stress: 8 },
        relationshipEffects: [{ characterId: 'minji', change: -2 }],
      },
      {
        id: 'midterm_give_up',
        text: '솔직히... 이미 반쯤 포기했어. 카페나 갈래?',
        statEffects: { stress: -10, health: 5, knowledge: -3 },
        relationshipEffects: [{ characterId: 'minji', change: 2 }],
        consequenceText: '민지가 잠시 망설이더니 노트를 덮고 따라나섰다.',
      },
    ],
  },

  // ─── Scene 2: After the Exam ───
  {
    id: 'midterm_aftermath',
    location: 'campus',
    backgroundVariant: 'day',
    characters: [
      { characterId: 'jaemin', expression: 'neutral', position: 'center' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '마지막 시험이 끝났다. 강의실을 나서는 순간, 어깨에 실렸던 무게가 한꺼번에 내려간다.',
      },
      {
        characterId: 'jaemin',
        expression: 'neutral',
        text: '...끝났다. 진짜 끝났어.',
      },
      {
        characterId: 'jaemin',
        expression: 'laughing',
        text: '야!!! 치킨이다 치킨!! 오늘 저녁 내가 쏜다!!! ...아, 잠깐 통장 잔액 먼저 확인하고.',
      },
      {
        characterId: null,
        text: '잘 봤든 못 봤든, 끝난 건 끝난 거다. 이제 후반전이 시작된다.',
      },
    ],
    choices: [
      {
        id: 'midterm_celebrate',
        text: '치킨 가자!! 오늘은 아무 생각 안 할 거야!',
        statEffects: { stress: -15, money: -20000, social: 3 },
        relationshipEffects: [{ characterId: 'jaemin', change: 5 }],
        consequenceText: '치킨 뼈가 쌓여갈수록 시험 걱정도 녹아내렸다.',
      },
      {
        id: 'midterm_reflect',
        text: '다음엔 더 잘 준비해야지. 오늘은 일찍 자자.',
        statEffects: { health: 8, stress: -5, knowledge: 2 },
        relationshipEffects: [{ characterId: 'jaemin', change: 2 }],
      },
    ],
  },
];
