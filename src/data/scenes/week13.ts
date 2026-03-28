import type { Scene } from '@/store/types';

/** Week 13: 기말 준비 — Finals prep begins. Study groups form, relationships are tested by pressure. */
export const WEEK_13_SCENES: Scene[] = [
  {
    id: 'finals_prep',
    location: 'study_room',
    backgroundVariant: 'focused',
    characters: [
      { characterId: 'hyunwoo', expression: 'neutral', position: 'left' },
      { characterId: 'minji', expression: 'neutral', position: 'right' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '13주차. 캠퍼스 분위기가 확 바뀌었다. 스터디룸은 예약 전쟁이고, 카페도 노트북으로 가득하다.',
      },
      {
        characterId: 'hyunwoo',
        expression: 'neutral',
        text: '기말이 3주 앞이야. 동아리 활동은 잠시 쉬고, 다들 공부 모드로 전환해야 할 것 같아.',
      },
      {
        characterId: 'minji',
        expression: 'neutral',
        text: '중간고사 때 실수한 거 만회하려면 이번에 진짜 잘 봐야 해. 족보 있는 사람?',
      },
      {
        characterId: 'hyunwoo',
        expression: 'neutral',
        text: '아, 선배한테 작년 족보 받았어! 공유할까?',
      },
      {
        characterId: 'minji',
        expression: 'neutral',
        text: '족보에 의존하는 건 좀... 근데 참고 정도는 괜찮겠지.',
      },
      {
        characterId: null,
        text: '족보 문화. 한국 대학의 오래된 전통이자 논쟁거리. 당신의 선택은?',
      },
    ],
    choices: [
      {
        id: 'finals_jokbo',
        text: '족보 공유해줘! 어차피 기출 풀어보는 건 좋은 공부법이야.',
        statEffects: { knowledge: 4, social: 2, stress: -3, charm: -2 },
        relationshipEffects: [
          { characterId: 'hyunwoo', change: 5 },
          { characterId: 'minji', change: -1 },
        ],
        consequenceText: '족보를 펼치는 순간, 민지의 눈빛이 살짝 차가워졌다.',
      },
      {
        id: 'finals_study_group',
        text: '족보 대신 스터디 그룹 만들자. 같이 정리하면 더 확실해.',
        statEffects: { knowledge: 3, social: 5, stress: 3 },
        relationshipEffects: [
          { characterId: 'hyunwoo', change: 3 },
          { characterId: 'minji', change: 6 },
        ],
      },
      {
        id: 'finals_solo',
        text: '나는 혼자 공부하는 게 맞아. 집중해서 내 방식대로 할게.',
        statEffects: { knowledge: 5, stress: 6 },
        relationshipEffects: [
          { characterId: 'hyunwoo', change: -2 },
          { characterId: 'minji', change: 2 },
        ],
        consequenceText: '조용한 독서실에서 홀로 버티는 밤이 길어졌다.',
      },
      {
        id: 'finals_hyunwoo_romantic',
        text: '(현우 선배에게) 선배, 시험 끝나면... 둘이서 어디 가고 싶어요.',
        statEffects: { charm: 3, stress: -5 },
        relationshipEffects: [
          { characterId: 'hyunwoo', change: 3 },
          { characterId: 'hyunwoo', change: 2, type: 'romance' as const },
        ],
        requiredRelationship: { characterId: 'hyunwoo', minAffection: 30 },
        requiredStat: { stat: 'charm', min: 40 },
        consequenceText: '현우가 환하게 웃었다. "좋지! 내가 기가 막히게 좋은 데 알아. 약속이다."',
      },
    ],
  },
];
