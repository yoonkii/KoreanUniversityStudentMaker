import type { Scene } from '@/store/types';

/** Week 14: 기말고사 주간 — Finals week. Last push, burnout risk, semester reflection. */
export const WEEK_14_SCENES: Scene[] = [
  {
    id: 'finals_week',
    location: 'library',
    backgroundVariant: 'night',
    characters: [
      { characterId: 'jaemin', expression: 'neutral', position: 'left' },
      { characterId: 'soyeon', expression: 'neutral', position: 'right' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '기말고사 주간. 도서관 24시간 개방. 잠을 포기한 얼굴들이 곳곳에 보인다.',
      },
      {
        characterId: 'jaemin',
        expression: 'neutral',
        text: '2일 째 밤샘 중... 커피가 더 이상 안 듣는 것 같아.',
      },
      {
        characterId: 'soyeon',
        expression: 'neutral',
        text: '재민아, 밤새는 건 진짜 비효율적이야. 4시간이라도 자고 와.',
      },
      {
        characterId: 'jaemin',
        expression: 'neutral',
        text: '선배도 학생 때 밤새지 않았어요?',
      },
      {
        characterId: 'soyeon',
        expression: 'neutral',
        text: '했지. 그래서 말하는 거야. 밤새고 본 시험이 더 결과가 안 좋았거든.',
      },
      {
        characterId: null,
        text: '시험 전날 밤. 마지막 한 시간의 선택이 성적을 가를 수도 있다.',
      },
    ],
    choices: [
      {
        id: 'finals_allnighter',
        text: '잠은 시험 끝나고 잔다! 마지막까지 달린다.',
        statEffects: { knowledge: 5, health: -10, stress: 10 },
        relationshipEffects: [
          { characterId: 'jaemin', change: 3 },
          { characterId: 'soyeon', change: -3 },
        ],
      },
      {
        id: 'finals_balanced',
        text: '선배 말이 맞아. 잠깐 자고 와서 컨디션 챙기자.',
        statEffects: { knowledge: 2, health: 5, stress: -5 },
        relationshipEffects: [
          { characterId: 'jaemin', change: 1 },
          { characterId: 'soyeon', change: 5 },
        ],
      },
      {
        id: 'finals_encourage',
        text: '재민아, 같이 나가서 바람 쐬고 오자. 10분이면 돼.',
        statEffects: { social: 4, stress: -5, health: 3, knowledge: -1 },
        relationshipEffects: [
          { characterId: 'jaemin', change: 7 },
          { characterId: 'soyeon', change: 3 },
        ],
      },
    ],
  },
];
