import type { Scene } from '@/store/types';

/** Week 6: Pre-midterm tension — study pressure builds, friendships are tested. */
export const WEEK_6_SCENES: Scene[] = [
  // ─── Scene 1: 야자 (Night Study Session) ───
  {
    id: 'night_study',
    location: 'library',
    backgroundVariant: 'quiet',
    characters: [
      { characterId: 'minji', expression: 'neutral', position: 'left' },
      { characterId: 'jaemin', expression: 'neutral', position: 'right' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '밤 10시. 도서관이 문을 닫을 시간인데, 아무도 일어나질 않는다. 중간고사가 2주 앞으로 다가왔다.',
      },
      {
        characterId: 'jaemin',
        expression: 'neutral',
        text: '야... 솔직히 나 이번 시험 좀 불안해. 수업 시간에 자느라 놓친 게 많아.',
      },
      {
        characterId: 'minji',
        expression: 'neutral',
        text: '늦었다고 생각할 때가 진짜 늦은 거야. 지금부터라도 하면 돼.',
      },
      {
        characterId: 'jaemin',
        expression: 'neutral',
        text: '민지야 너는 늘 여유로워 보여서 부러워... 비결이 뭐야?',
      },
      {
        characterId: 'minji',
        expression: 'neutral',
        text: '...여유? 나 어제 새벽 4시까지 과제했어. 여유로워 보이는 건 그냥 안 티 내는 거야.',
      },
      {
        characterId: null,
        text: '민지의 표정이 잠깐 흔들린다. 모두가 각자의 방식으로 불안한 거구나.',
      },
    ],
    choices: [
      {
        id: 'night_study_group',
        text: '우리 셋이서 스터디 그룹 만들자! 같이 하면 빠르잖아.',
        statEffects: { knowledge: 3, social: 5, stress: 3 },
        relationshipEffects: [
          { characterId: 'jaemin', change: 5 },
          { characterId: 'minji', change: 5 },
        ],
      },
      {
        id: 'night_study_encourage',
        text: '재민아 괜찮아, 시간 충분해. 오늘부터 같이 하자.',
        statEffects: { social: 3, charm: 2, knowledge: -1 },
        relationshipEffects: [
          { characterId: 'jaemin', change: 8 },
          { characterId: 'minji', change: 2 },
        ],
      },
      {
        id: 'night_study_focus',
        text: '미안, 나도 집중해야 해서... 각자 열심히 하자.',
        statEffects: { knowledge: 4, stress: 5 },
        relationshipEffects: [
          { characterId: 'jaemin', change: -2 },
          { characterId: 'minji', change: 2 },
        ],
      },
    ],
  },
];
