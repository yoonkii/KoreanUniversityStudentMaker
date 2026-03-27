import type { Scene } from '@/store/types';

/** Week 1: Orientation week — first impressions, new beginnings. */
export const WEEK_1_SCENES: Scene[] = [
  // ─── Scene 1: Orientation & Roommate ───
  {
    id: 'orientation',
    location: 'campus',
    backgroundVariant: 'day',
    characters: [
      { characterId: 'jaemin', expression: 'happy', position: 'center' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '3월의 첫 바람이 캠퍼스를 스쳐 지나간다. 벚꽃 봉오리가 막 터지기 시작한 교정에는 새내기들의 설렘과 긴장이 뒤섞여 있다.',
      },
      {
        characterId: null,
        text: '짐을 한가득 들고 기숙사 복도를 걸어가는데, 이미 방 안에서 누군가가 신나게 음악을 틀어놓고 있다.',
      },
      {
        characterId: 'jaemin',
        expression: 'happy',
        text: '오 왔어?! 나 이재민! 같은 방 쓰게 됐네. 야, 짐 많다 — 이쪽에 놔.',
      },
      {
        characterId: 'jaemin',
        expression: 'laughing',
        text: '나 침대 위에 이미 자리 잡아서 미안ㅋㅋ 아래쪽이 더 좋아 솔직히, 콘센트 가까우니까.',
      },
      {
        characterId: null,
        text: '재민이는 이미 벽에 포스터를 붙여놓고, 책상 위엔 라면 박스가 쌓여 있다. ...이번 학기, 재밌어질 것 같다.',
      },
    ],
    choices: [
      {
        id: 'orientation_friendly',
        text: '반가워! 나도 빨리 정리하고 같이 학교 구경 가자.',
        statEffects: { social: 3, stress: -2, knowledge: -1 },
        relationshipEffects: [{ characterId: 'jaemin', change: 5 }],
        consequenceText: '재민이와 함께 캠퍼스를 돌아다녔다. 학교가 넓다!',
      },
      {
        id: 'orientation_reserved',
        text: '아, 반가워. 나 먼저 짐 정리 좀 할게.',
        statEffects: { stress: -1, social: -1 },
        relationshipEffects: [{ characterId: 'jaemin', change: 1 }],
        consequenceText: '조용히 짐을 정리했다. 재민이는 약간 아쉬운 표정.',
      },
      {
        id: 'orientation_joke',
        text: '라면 박스는 뭐야 ㅋㅋ 혹시 라면으로 학기 버틸 생각이야?',
        statEffects: { social: 5, charm: 2, stress: 1 },
        relationshipEffects: [{ characterId: 'jaemin', change: 8 }],
        consequenceText: '재민이가 빵 터졌다. "ㅋㅋㅋ 야 너 재밌다!" 첫날부터 분위기 좋다.',
      },
    ],
  },

  // ─── Scene 2: First Class ───
  {
    id: 'first_class',
    location: 'classroom',
    backgroundVariant: 'daytime',
    characters: [
      { characterId: 'prof-kim', expression: 'neutral', position: 'center' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '첫 전공 수업. 강의실은 200명 규모인데 벌써 빈자리가 별로 없다. 교수님이 출석부를 들고 단상에 선다.',
      },
      {
        characterId: 'prof-kim',
        expression: 'stern',
        text: '김 교수입니다. 이 수업에서는 출석과 과제, 두 번의 시험으로 평가합니다. 출석이 3분의 1 미만이면 자동 F입니다.',
      },
      {
        characterId: 'prof-kim',
        expression: 'thoughtful',
        text: '학점은 여러분의 미래를 결정하지 않습니다. 하지만 이 수업에서 배우는 사고방식은 평생 갑니다. 진지하게 임하시기 바랍니다.',
      },
      {
        characterId: null,
        text: '교수님의 날카로운 눈빛이 강의실을 한 번 훑는다. 옆자리 학생이 긴장한 듯 볼펜을 돌리고 있다.',
      },
    ],
    choices: [
      {
        id: 'class_front',
        text: '앞자리로 가서 필기 준비를 한다.',
        statEffects: { knowledge: 3, stress: 2 },
        relationshipEffects: [{ characterId: 'prof-kim', change: 3 }],
      },
      {
        id: 'class_back',
        text: '뒷자리에 앉아서 분위기를 살핀다.',
        statEffects: { social: 2, stress: -1 },
        relationshipEffects: [{ characterId: 'prof-kim', change: -1 }],
      },
      {
        id: 'class_question',
        text: '수업 후 교수님께 질문을 하러 간다.',
        statEffects: { knowledge: 5, charm: 2, stress: 3 },
        relationshipEffects: [{ characterId: 'prof-kim', change: 7 }],
      },
    ],
  },

  // ─── Scene 3: Library Encounter ───
  {
    id: 'library_encounter',
    location: 'library',
    backgroundVariant: 'quiet',
    characters: [
      { characterId: 'soyeon', expression: 'happy', position: 'center' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '도서관 3층 열람실. 첫 주부터 과제가 나왔다. 전공 서적을 펼쳐 놓고 한 시간째 같은 페이지를 보고 있다.',
      },
      {
        characterId: 'soyeon',
        expression: 'teasing',
        text: '야, 그 페이지 아까부터 계속 보고 있는 거 아니야? ㅋㅋ',
      },
      {
        characterId: 'soyeon',
        expression: 'happy',
        text: '나 박소연, 3학년이야. 그 과제 나도 1학년 때 했는데 — 도움 필요하면 말해.',
      },
      {
        characterId: 'soyeon',
        expression: 'neutral',
        text: '처음엔 다 어려워. 근데 이 과목 첫 과제가 제일 중요해, 교수님이 그걸로 학생 파악하거든.',
      },
    ],
    choices: [
      {
        id: 'library_accept',
        text: '감사합니다 선배! 이 부분이 진짜 이해가 안 돼서요...',
        statEffects: { knowledge: 4, social: 3, stress: -3, money: -3000 },
        relationshipEffects: [{ characterId: 'soyeon', change: 8 }],
      },
      {
        id: 'library_decline',
        text: '아, 괜찮아요. 좀 더 혼자 해볼게요.',
        statEffects: { knowledge: 1, stress: 2 },
        relationshipEffects: [{ characterId: 'soyeon', change: -2 }],
      },
      {
        id: 'library_chat',
        text: '선배는 이 시간에 도서관 자주 와요?',
        statEffects: { social: 5, charm: 2, knowledge: -1 },
        relationshipEffects: [{ characterId: 'soyeon', change: 5 }],
      },
    ],
  },

  // ─── Scene 4: Cafe Visit ───
  {
    id: 'cafe_visit',
    location: 'cafe',
    backgroundVariant: 'seating',
    characters: [
      { characterId: 'jaemin', expression: 'happy', position: 'left' },
      { characterId: 'boss', expression: 'pleased', position: 'right' },
    ],
    dialogue: [
      {
        characterId: 'jaemin',
        expression: 'happy',
        text: '여기 진짜 맛있어, 학교 앞에서 제일 유명한 카페야. 아메리카노가 2천 원이라고!',
      },
      {
        characterId: 'boss',
        expression: 'pleased',
        text: '어머, 새로 온 학생이구나? 어서 와요. 여기 단골 되면 후회 안 할 거예요.',
      },
      {
        characterId: 'jaemin',
        expression: 'laughing',
        text: '사장님이 학생들한테 서비스를 잘 줘서 여기 항상 사람 많아 ㅋㅋ',
      },
      {
        characterId: 'boss',
        expression: 'understanding',
        text: '학생이 밥은 잘 챙겨 먹고 다녀요? 얼굴이 좀 피곤해 보여서.',
      },
      {
        characterId: null,
        text: '카페 안에는 노트북을 펴놓은 학생들, 과제 논의를 하는 팀, 조용히 책 읽는 사람들로 가득하다. 대학 생활의 한 장면 같다.',
      },
    ],
    choices: [
      {
        id: 'cafe_relax',
        text: '재민이랑 느긋하게 커피 마시면서 이야기한다.',
        statEffects: { social: 4, stress: -5, money: -4000 },
        relationshipEffects: [
          { characterId: 'jaemin', change: 4 },
          { characterId: 'boss', change: 2 },
        ],
      },
      {
        id: 'cafe_study',
        text: '커피 사서 바로 과제하러 도서관에 간다.',
        statEffects: { knowledge: 2, money: -2000, stress: 2 },
        relationshipEffects: [{ characterId: 'jaemin', change: -1 }],
      },
      {
        id: 'cafe_parttime',
        text: '사장님, 혹시 여기 알바 자리 있어요?',
        statEffects: { social: 2, charm: 3, stress: 2 },
        relationshipEffects: [{ characterId: 'boss', change: 6 }],
      },
    ],
  },
];
