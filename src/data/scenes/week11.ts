import type { Scene } from '@/store/types';

/** Week 11 Variant B: 소문 — Overhearing gossip about yourself. Reputation has consequences. */
export const WEEK_11_VARIANT_B: Scene[] = [
  {
    id: 'campus_gossip',
    location: 'cafe',
    backgroundVariant: 'seating',
    characters: [
      { characterId: 'hyunwoo', expression: 'neutral', position: 'center' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '11주차. 카페에서 커피를 기다리는데, 뒷자리에서 내 이름이 들린다.',
      },
      {
        characterId: null,
        text: '"걔? 요즘 좀 유명하던데..." 누군가 내 이야기를 하고 있다.',
      },
      {
        characterId: null,
        text: '정확히는 안 들리지만, 내가 학교에서 어떻게 보이는지 처음 의식하게 된다.',
      },
      {
        characterId: 'hyunwoo',
        expression: 'helpful',
        text: '야, 너 여기 있었어? 아까 네 얘기 하는 거 들었어?',
      },
      {
        characterId: 'hyunwoo',
        expression: 'cool',
        text: '신경 쓰지 마. 대학에서 소문은 빨라. 중요한 건 네가 어떻게 사느냐야.',
      },
    ],
    choices: [
      {
        id: 'gossip_confident',
        text: '오히려 좋아. 사람들이 나를 기억한다는 거잖아.',
        statEffects: { charm: 5, social: 3, stress: -2 },
        relationshipEffects: [{ characterId: 'hyunwoo', change: 5 }],
      },
      {
        id: 'gossip_worried',
        text: '무슨 소문인지 좀 알려줘... 나쁜 얘기는 아니겠지?',
        statEffects: { stress: 5, social: 2 },
        relationshipEffects: [{ characterId: 'hyunwoo', change: 3 }],
      },
      {
        id: 'gossip_indifferent',
        text: '남들 얘기에 신경 쓸 시간 없어. 할 일이 많으니까.',
        statEffects: { gpa: 3, charm: -2, stress: 2 },
        relationshipEffects: [{ characterId: 'hyunwoo', change: 1 }],
      },
    ],
  },
];

/** Week 11: 중간고사 성적 발표 — Midterm grades are out. Reactions, reflections, and recalibration. */
export const WEEK_11_SCENES: Scene[] = [
  {
    id: 'grade_reveal',
    location: 'campus_bench',
    backgroundVariant: 'autumn',
    characters: [
      { characterId: 'minji', expression: 'neutral', position: 'left' },
      { characterId: 'jaemin', expression: 'neutral', position: 'right' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '11주차. 중간고사 성적이 학교 포털에 올라왔다. 에브리타임이 난리다.',
      },
      {
        characterId: 'jaemin',
        expression: 'neutral',
        text: '확인했어...? 나 솔직히 무서워서 아직 안 봤어.',
      },
      {
        characterId: 'minji',
        expression: 'neutral',
        text: '나는 봤어. 생각보다... 별로야. 열심히 했는데 점수가 안 나왔어.',
      },
      {
        characterId: null,
        text: '민지의 목소리가 평소와 다르다. 항상 자신감 넘치던 그녀가 흔들리고 있다.',
      },
      {
        characterId: 'jaemin',
        expression: 'neutral',
        text: '민지가 별로면 나는 어떡해... 에잇, 그냥 볼래. 뭐가 됐든 현실을 직면해야지.',
      },
      {
        characterId: null,
        text: '성적표를 열었다. 예상대로인 과목도 있고, 충격적인 과목도 있다.',
      },
    ],
    choices: [
      {
        id: 'grade_comfort_minji',
        text: '민지야, 한 번 시험으로 결정되는 건 아니야. 기말에 만회하면 돼.',
        statEffects: { social: 4, charm: 3, stress: -2 },
        relationshipEffects: [
          { characterId: 'minji', change: 8 },
          { characterId: 'jaemin', change: 2 },
        ],
      },
      {
        id: 'grade_study_plan',
        text: '기말까지 7주 남았어. 지금부터 전략을 바꾸자.',
        statEffects: { gpa: 3, stress: 3 },
        relationshipEffects: [
          { characterId: 'minji', change: 4 },
          { characterId: 'jaemin', change: 4 },
        ],
      },
      {
        id: 'grade_chill',
        text: '성적이 전부는 아니잖아. 오늘은 맛있는 거 먹으러 가자!',
        statEffects: { stress: -8, social: 5, money: -20000 },
        relationshipEffects: [
          { characterId: 'minji', change: 3 },
          { characterId: 'jaemin', change: 6 },
        ],
      },
    ],
  },
];
