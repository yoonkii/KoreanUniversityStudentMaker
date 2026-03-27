import type { Scene } from '@/store/types';

/** Week 2: Settling in — rivalries form, opportunities appear. */
export const WEEK_2_SCENES: Scene[] = [
  // ─── Scene 1: Study Group / Rival Encounter ───
  {
    id: 'study_group',
    location: 'library',
    backgroundVariant: 'crowded',
    characters: [
      { characterId: 'minji', expression: 'competitive', position: 'center' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '도서관이 평소보다 붐빈다. 다음 주 첫 퀴즈가 예고됐기 때문이다. 빈자리를 찾아 앉았는데 맞은편에 누군가 이미 교재 세 권을 펼쳐놓고 있다.',
      },
      {
        characterId: 'minji',
        expression: 'neutral',
        text: '...여기 자린데.',
      },
      {
        characterId: null,
        text: '같은 과 한민지다. 입학 성적 수석이라는 소문이 벌써 돌았다.',
      },
      {
        characterId: 'minji',
        expression: 'competitive',
        text: '아, 같은 과지? 김 교수님 과제 벌써 끝냈어? 나 어제 다 했는데.',
      },
      {
        characterId: 'minji',
        expression: 'neutral',
        text: '...뭐, 모르는 거 있으면 물어봐. 대신 나도 바쁘니까 간단하게만.',
      },
    ],
    choices: [
      {
        id: 'study_compete',
        text: '나도 거의 다 했어. (블러핑하고 빠르게 끝낸다)',
        statEffects: { knowledge: 4, stress: 6 },
        relationshipEffects: [{ characterId: 'minji', change: 3 }],
      },
      {
        id: 'study_honest',
        text: '솔직히 어디서부터 시작해야 할지 모르겠어...',
        statEffects: { knowledge: 2, social: 3, stress: -2 },
        relationshipEffects: [{ characterId: 'minji', change: 5 }],
      },
      {
        id: 'study_avoid',
        text: '아, 다른 자리 찾아볼게. (자리를 피한다)',
        statEffects: { stress: -3 },
        relationshipEffects: [{ characterId: 'minji', change: -3 }],
      },
    ],
  },

  // ─── Scene 2: Club Recruitment ───
  {
    id: 'club_recruitment',
    location: 'club-room',
    backgroundVariant: 'normal',
    characters: [
      { characterId: 'hyunwoo', expression: 'cool', position: 'center' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '학생회관 3층. 동아리 박람회가 열리고 있다. 형형색색의 현수막과 음악 소리가 복도를 채운다.',
      },
      {
        characterId: null,
        text: '밴드 동아리 부스 앞을 지나가는데, 기타를 들고 있는 선배가 다가왔다. 카리스마 있는 눈빛에 자유로운 분위기.',
      },
      {
        characterId: 'hyunwoo',
        expression: 'cool',
        text: '어, 잠깐. 너 뭔가 느낌 있는데? 우리 동아리 관심 없어?',
      },
      {
        characterId: null,
        text: '정현우. 밴드 동아리 "블루노트" 부회장이란다. 가죽 팔찌에 살짝 긴 머리, 전형적인 "밴드 선배" 비주얼이다.',
      },
      {
        characterId: null,
        text: '부스 뒤쪽에서 누군가 기타를 연습하고 있고, 옆 테이블에서는 신입생 두 명이 가입 신청서를 작성 중이다.',
      },
      {
        characterId: 'hyunwoo',
        expression: 'helpful',
        text: '악기 못 쳐도 괜찮아. 우리 동아리는 음악만 하는 게 아니라 MT도 가고, 축제 무대도 서고, 진짜 재밌어.',
      },
      {
        characterId: 'hyunwoo',
        expression: 'scheming',
        text: '그리고 솔직히... 여기 들어오면 선후배 인맥이 장난 아니야. 취업할 때 그게 다 도움 돼.',
      },
    ],
    choices: [
      {
        id: 'club_join',
        text: '재밌겠다! 가입할게요.',
        statEffects: { social: 5, charm: 3, money: -10000, stress: -2 },
        relationshipEffects: [{ characterId: 'hyunwoo', change: 10 }],
      },
      {
        id: 'club_think',
        text: '좀 더 생각해볼게요. 다른 동아리도 보고 싶어서.',
        statEffects: { social: 1, stress: 1 },
        relationshipEffects: [{ characterId: 'hyunwoo', change: 1 }],
      },
      {
        id: 'club_study_focus',
        text: '동아리는 좀... 공부에 집중하고 싶어서요.',
        statEffects: { knowledge: 2, stress: 2 },
        relationshipEffects: [{ characterId: 'hyunwoo', change: -4 }],
      },
    ],
  },

  // ─── Scene 3: Part-Time Job Offer ───
  {
    id: 'parttime_start',
    location: 'cafe',
    backgroundVariant: 'counter',
    characters: [
      { characterId: 'boss', expression: 'firm', position: 'center' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '카페에 다시 들렀다. 사장님이 카운터에서 손짓을 한다.',
      },
      {
        characterId: 'boss',
        expression: 'pleased',
        text: '아, 저번에 알바 물어봤던 학생이지? 마침 자리가 하나 났어요.',
      },
      {
        characterId: 'boss',
        expression: 'firm',
        text: '주 3일, 시급 만 이천 원. 시험 기간엔 시간 조절해 줄 수 있어요. 대신 한 가지 — 일할 때는 확실하게 해줘야 해요.',
      },
      {
        characterId: 'boss',
        expression: 'understanding',
        text: '학생이니까 학업이 우선인 거 알아요. 근데 여기서 일하면 밥 걱정은 없을 거예요. 직원 식사 제공이니까.',
      },
      {
        characterId: null,
        text: '통장 잔고를 떠올린다. 솔직히 용돈만으로는 이번 학기를 버티기 빠듯하다.',
      },
    ],
    choices: [
      {
        id: 'job_accept',
        text: '감사합니다! 열심히 할게요.',
        statEffects: { money: 30000, social: 2, stress: 3, health: 3 },
        relationshipEffects: [{ characterId: 'boss', change: 8 }],
      },
      {
        id: 'job_negotiate',
        text: '혹시 주 2일로 시작할 수 있을까요?',
        statEffects: { money: 15000, charm: 2, stress: 2 },
        relationshipEffects: [{ characterId: 'boss', change: 3 }],
      },
      {
        id: 'job_decline',
        text: '죄송해요, 아직은 수업에 적응하는 게 먼저라서...',
        statEffects: { knowledge: 2, stress: -2 },
        relationshipEffects: [{ characterId: 'boss', change: -2 }],
      },
    ],
  },
];
