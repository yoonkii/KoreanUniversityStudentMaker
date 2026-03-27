import type { Scene } from '@/store/types';

/** Prologue: 입학 — Arriving at university. Sets the emotional tone before gameplay begins. */
export const PROLOGUE_SCENES: Scene[] = [
  // ─── Scene 1: 캠퍼스 도착 (Campus Arrival) ───
  {
    id: 'prologue_arrival',
    location: 'campus',
    backgroundVariant: 'day',
    characters: [],
    dialogue: [
      {
        characterId: null,
        text: '3월의 첫째 주. 벚꽃이 흩날리는 캠퍼스에 발을 들였다.',
      },
      {
        characterId: null,
        text: '정문을 지나자 넓은 잔디밭이 펼쳐진다. 새내기 환영 현수막이 바람에 펄럭이고, 동아리 홍보 부스에서 음악이 흘러나온다.',
      },
      {
        characterId: null,
        text: '합격 통보를 받은 게 엊그제 같은데, 벌써 대학생이라니. 주변을 둘러보니 나처럼 지도를 들고 서성이는 새내기들이 보인다.',
      },
      {
        characterId: null,
        text: '학생식당에서 풍기는 밥 냄새, 카페에서 새어 나오는 커피 향, 멀리서 들리는 기타 소리... 이게 대학이구나.',
      },
      {
        characterId: null,
        text: '새 교재가 잔뜩 든 가방이 어깨를 짓누르지만, 가슴은 기대로 가득하다.',
      },
      {
        characterId: null,
        text: '이 캠퍼스에서 보낼 16주. 누구를 만나고, 무엇을 배우고, 어떤 사람이 될까. 모든 건 내 선택에 달려 있다.',
      },
    ],
  },
  // ─── Scene 2: 첫 교실 (First Classroom) ───
  {
    id: 'prologue_classroom',
    location: 'classroom',
    backgroundVariant: 'daytime',
    characters: [
      { characterId: 'prof-kim', expression: 'neutral', position: 'center' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '첫 전공 수업. 교수님이 엄숙한 표정으로 출석을 부른다.',
      },
      {
        characterId: 'prof-kim',
        expression: 'stern',
        text: '이 수업은 쉽지 않습니다. 하지만 끝까지 따라오면, 반드시 성장할 겁니다.',
      },
      {
        characterId: null,
        text: '강의실을 둘러보니, 다들 긴장한 표정이다. 나만 불안한 게 아니구나.',
      },
    ],
  },
  // ─── Scene 3: 기숙사 첫날 밤 (First Night in Dorm) ───
  {
    id: 'prologue_dorm',
    location: 'dorm',
    backgroundVariant: 'clean',
    characters: [],
    dialogue: [
      {
        characterId: null,
        text: '기숙사 방. 좁지만 나만의 공간이다. 책상 위에 시간표를 펼쳐놓았다.',
      },
      {
        characterId: null,
        text: '16주. 짧다면 짧고, 길다면 긴 시간.',
      },
      {
        characterId: null,
        text: '어떤 대학 생활을 만들어 나갈지는 전부 나에게 달렸다.',
      },
      {
        characterId: null,
        text: '— 1학기가 시작된다.',
      },
    ],
  },
];
