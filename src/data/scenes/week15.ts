import type { Scene } from '@/store/types';

/** Week 15: 기말고사 + 종강 (Finals + End of Semester) — the final push. */
export const WEEK_15_SCENES: Scene[] = [
  // ─── Scene 1: 팀플 지옥 (Group Project Hell) ───
  {
    id: 'finals_teamproject',
    location: 'library',
    backgroundVariant: 'quiet',
    characters: [
      { characterId: 'soyeon', expression: 'neutral', position: 'center' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '기말 시험도 문제지만, 진짜 문제는 팀 프로젝트다. 발표가 3일 남았는데, 팀원 한 명이 연락이 안 된다.',
      },
      {
        characterId: 'soyeon',
        expression: 'neutral',
        text: '그 팀원... 걔 원래 그래. MT 때도 안 왔잖아. PPT 분량 내가 대신 해줄까?',
      },
      {
        characterId: 'soyeon',
        expression: 'neutral',
        text: '근데 이거 교수님한테 말해야 하는 거 아닌가? 무임승차는 좀...',
      },
    ],
    choices: [
      {
        id: 'finals_cover',
        text: '그냥 우리가 나눠서 하자. 싸우기엔 시간이 없어.',
        statEffects: { knowledge: 3, stress: 10, health: -5 },
        relationshipEffects: [{ characterId: 'soyeon', change: 5 }],
      },
      {
        id: 'finals_report',
        text: '교수님께 말씀드리자. 이건 공정하지 않아.',
        statEffects: { knowledge: 2, stress: 5, charm: 3 },
        relationshipEffects: [{ characterId: 'soyeon', change: 3 }],
      },
      {
        id: 'finals_confront',
        text: '걔한테 직접 연락해볼게. 마지막으로 기회를 주자.',
        statEffects: { social: 3, stress: 5 },
        relationshipEffects: [{ characterId: 'soyeon', change: 4 }],
      },
    ],
  },

  // ─── Scene 2: 종강 (End of Semester) ───
  {
    id: 'finals_ending',
    location: 'campus',
    backgroundVariant: 'day',
    characters: [
      { characterId: 'jaemin', expression: 'happy', position: 'left' },
      { characterId: 'soyeon', expression: 'happy', position: 'right' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '마지막 시험 답안지를 제출하고 강의실을 나서는 순간, 하늘이 유난히 높고 푸르다.',
      },
      {
        characterId: 'jaemin',
        expression: 'happy',
        text: '종강이다아아아!!! 드디어!!!',
      },
      {
        characterId: 'soyeon',
        expression: 'happy',
        text: '이번 학기 고생 정말 많았어, 다들. 방학 계획은 있어?',
      },
      {
        characterId: 'jaemin',
        expression: 'laughing',
        text: '일단 3일 내리 잘 거야. 그다음에 생각해도 늦지 않지?',
      },
      {
        characterId: null,
        text: '한 학기가 끝났다. OT에서 떨렸던 첫날, MT의 모닥불, 중간고사의 스트레스, 축제의 불꽃... 모든 게 어제 같은데.',
      },
      {
        characterId: null,
        text: '성적표가 나오면 기쁠 수도, 아쉬울 수도 있겠지. 하지만 확실한 건 — 이번 학기, 나쁘지 않았다는 거.',
      },
    ],
    choices: [
      {
        id: 'finals_promise',
        text: '다음 학기에 또 보자! 더 좋은 학기 만들자.',
        statEffects: { social: 5, stress: -10, money: -10000 },
        relationshipEffects: [
          { characterId: 'jaemin', change: 5 },
          { characterId: 'soyeon', change: 5 },
        ],
      },
      {
        id: 'finals_solo',
        text: '방학 동안 혼자만의 시간도 필요해. 잠시 쉬어야겠다.',
        statEffects: { health: 10, stress: -15, social: -2 },
        relationshipEffects: [
          { characterId: 'jaemin', change: 2 },
          { characterId: 'soyeon', change: 2 },
        ],
      },
    ],
  },
];
