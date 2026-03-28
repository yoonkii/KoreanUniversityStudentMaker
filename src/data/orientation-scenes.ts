import type { Scene } from '@/store/types';

/**
 * Orientation scenes — meet each NPC individually in their own location.
 * Each scene has a unique background, 3-4 dialogue lines, and 1 player choice.
 */

export const ORIENTATION_INTRO: Scene = {
  id: 'ot_intro',
  location: 'campus',
  backgroundVariant: 'day',
  characters: [],
  dialogue: [
    { characterId: null, text: '입학식이 끝나고, 캠퍼스를 둘러보기로 했다.' },
    { characterId: null, text: '낯선 건물들, 낯선 얼굴들. 모든 게 새롭다.' },
    { characterId: null, text: '오늘 하루 동안 이 캠퍼스에서 어떤 사람들을 만나게 될까.' },
  ],
};

export const ORIENTATION_SCENES: Scene[] = [
  // ─── 1. 이재민 — 기숙사에서 만남 ───
  {
    id: 'ot_jaemin',
    location: 'dorm',
    backgroundVariant: 'clean',
    characters: [
      { characterId: 'jaemin', expression: 'happy', position: 'center' },
    ],
    dialogue: [
      { characterId: null, text: '기숙사 방문을 열자, 누군가가 짐을 풀고 있었다.' },
      { characterId: 'jaemin', text: '오! 너 같은 방이지?! 나 이재민! 반가워ㅋㅋ', expression: 'happy' },
      { characterId: 'jaemin', text: '어디서 왔어? 나는 부산인데 서울은 처음이라 다 신기해!', expression: 'laughing' },
      { characterId: null, text: '밝고 에너지 넘치는 친구다. 벌써 편하게 말을 놓는다.' },
      { characterId: 'jaemin', text: '아 참, 나 치킨 시킬 건데 같이 먹을래? 첫날이니까 내가 쏠게!', expression: 'supportive' },
    ],
    choices: [
      {
        id: 'jaemin_warm',
        text: 'ㅋㅋ 좋아! 치킨 먹으면서 얘기하자',
        statEffects: { social: 3, stress: -3 },
        relationshipEffects: [{ characterId: 'jaemin', change: 8, type: 'friendship' as const }],
        consequenceText: '치킨을 먹으며 밤새 이야기했다. 좋은 룸메이트를 만난 것 같다.',
      },
      {
        id: 'jaemin_reserved',
        text: '고마워, 근데 나 먼저 짐 정리 좀 할게',
        statEffects: { knowledge: 2 },
        relationshipEffects: [{ characterId: 'jaemin', change: 4, type: 'friendship' as const }],
        consequenceText: '재민이가 "알겠어~ 편할 때 말해!" 하며 웃었다.',
      },
    ],
  },

  // ─── 2. 한민지 — 강의실에서 만남 ───
  {
    id: 'ot_minji',
    location: 'classroom',
    backgroundVariant: 'daytime',
    characters: [
      { characterId: 'minji', expression: 'neutral', position: 'center' },
    ],
    dialogue: [
      { characterId: null, text: '강의실을 미리 찾아두려고 건물에 들어갔다.' },
      { characterId: null, text: '텅 빈 강의실 맨 앞줄에 누군가가 혼자 앉아 있다.' },
      { characterId: 'minji', expression: 'competitive', text: '...뭐야, 너도 미리 와 본 거야? 같은 과?' },
      { characterId: null, text: '날카로운 눈빛. 하지만 어딘가 경계하는 것 같으면서도 호기심이 보인다.' },
      { characterId: 'minji', expression: 'neutral', text: '한민지야. 수석 입학했어. ...너는?' },
    ],
    choices: [
      {
        id: 'minji_compete',
        text: '나도 열심히 할 거야. 좋은 라이벌이 되자',
        statEffects: { knowledge: 3, charm: 1 },
        relationshipEffects: [{ characterId: 'minji', change: 6, type: 'friendship' as const }],
        consequenceText: '민지가 살짝 웃었다. "...재밌겠네." 인정받은 느낌이다.',
      },
      {
        id: 'minji_friendly',
        text: '대단하다! 잘 부탁해',
        statEffects: { social: 2 },
        relationshipEffects: [{ characterId: 'minji', change: 4, type: 'friendship' as const }],
        consequenceText: '민지가 고개를 끄덕였다. "...응. 잘 부탁해." 무뚝뚝하지만 싫지 않은 사이.',
      },
    ],
  },

  // ─── 3. 정현우 — 캠퍼스 동아리 부스에서 만남 ───
  {
    id: 'ot_hyunwoo',
    location: 'campus',
    backgroundVariant: 'day',
    characters: [
      { characterId: 'hyunwoo', expression: 'cool', position: 'center' },
    ],
    dialogue: [
      { characterId: null, text: '캠퍼스를 걷다가 동아리 부스들이 줄지어 있는 곳을 지났다.' },
      { characterId: null, text: '어디선가 기타 소리가 들린다. 밴드 동아리 부스에서 선배 한 명이 연주 중이다.' },
      { characterId: 'hyunwoo', expression: 'cool', text: '어, 신입생? 음악 좋아해? 우리 동아리 한번 와봐!' },
      { characterId: null, text: '카리스마 있는 선배다. 주변에 사람이 많이 모여 있다.' },
      { characterId: 'hyunwoo', expression: 'helpful', text: '정현우야, 3학년. 이번 주 수요일에 첫 모임 있으니까 한번 놀러 와!' },
    ],
    choices: [
      {
        id: 'hyunwoo_join',
        text: '멋있다! 꼭 갈게요 선배!',
        statEffects: { charm: 3, social: 2 },
        relationshipEffects: [{ characterId: 'hyunwoo', change: 8, type: 'friendship' as const }],
        consequenceText: '현우가 환하게 웃으며 연락처를 줬다. "기대할게!"',
      },
      {
        id: 'hyunwoo_maybe',
        text: '관심은 있는데... 시간 되면 가볼게요',
        statEffects: { knowledge: 1 },
        relationshipEffects: [{ characterId: 'hyunwoo', change: 3, type: 'friendship' as const }],
        consequenceText: '현우가 "언제든 환영이야~" 하며 전단지를 건넸다.',
      },
    ],
  },

  // ─── 4. 박소연 — 카페에서 만남 ───
  {
    id: 'ot_soyeon',
    location: 'cafe',
    backgroundVariant: 'seating',
    characters: [
      { characterId: 'soyeon', expression: 'happy', position: 'center' },
    ],
    dialogue: [
      { characterId: null, text: '캠퍼스 투어에 지쳐서 학교 앞 카페에 들어갔다.' },
      { characterId: null, text: '자리를 찾고 있는데, 누군가가 손을 흔든다.' },
      { characterId: 'soyeon', expression: 'teasing', text: '혹시 신입생? 표정이 "길 잃었어요" 그 자체야ㅋㅋ 이쪽 앉아!' },
      { characterId: null, text: '따뜻한 미소의 선배다. 같은 과 3학년이라고 한다.' },
      { characterId: 'soyeon', expression: 'happy', text: '나 박소연, 같은 과 선배야. 궁금한 거 있으면 뭐든 물어봐~ 밥도 사줄게!' },
    ],
    choices: [
      {
        id: 'soyeon_open',
        text: '감사해요 선배! 사실 모르는 게 너무 많아서...',
        statEffects: { social: 2, stress: -5 },
        relationshipEffects: [{ characterId: 'soyeon', change: 8, type: 'friendship' as const }],
        consequenceText: '소연 선배가 수업 꿀팁부터 맛집까지 알려줬다. 든든한 선배를 만났다.',
      },
      {
        id: 'soyeon_polite',
        text: '감사합니다! 나중에 연락드릴게요',
        statEffects: { charm: 2 },
        relationshipEffects: [{ characterId: 'soyeon', change: 4, type: 'friendship' as const }],
        consequenceText: '소연 선배가 번호를 건네며 "진짜 언제든 연락해~" 하고 웃었다.',
      },
    ],
  },
];

export const ORIENTATION_OUTRO: Scene = {
  id: 'ot_outro',
  location: 'campus',
  backgroundVariant: 'sunset',
  characters: [],
  dialogue: [
    { characterId: null, text: '하루가 순식간에 지나갔다.' },
    { characterId: null, text: '룸메이트, 같은 과 친구, 동아리 선배, 따뜻한 선배...' },
    { characterId: null, text: '아직은 어색하지만, 이 사람들과 함께 보낼 한 학기가 기대된다.' },
    { characterId: null, text: '내일은 수강신청. 진짜 대학 생활이 시작된다.' },
  ],
};
