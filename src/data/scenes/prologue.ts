import type { Scene } from '@/store/types';

/** Prologue: 입학 — Arriving at university. Sets the emotional tone before OT begins.
 *  NO classroom or lecture scenes here — player hasn't registered for courses yet! */
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
        text: '합격 통보를 받은 게 엊그제 같은데, 벌써 대학생이라니.',
      },
      {
        characterId: null,
        text: '학생식당에서 풍기는 밥 냄새, 카페에서 새어 나오는 커피 향, 멀리서 들리는 기타 소리...',
      },
      {
        characterId: null,
        text: '이게 대학이구나.',
      },
    ],
  },
  // ─── Scene 2: 기숙사 도착 (Arriving at Dorm) ───
  {
    id: 'prologue_dorm',
    location: 'dorm',
    backgroundVariant: 'clean',
    characters: [],
    dialogue: [
      {
        characterId: null,
        text: '기숙사 방. 좁지만 나만의 공간이다.',
      },
      {
        characterId: null,
        text: '짐을 내려놓고 창밖을 본다. 캠퍼스가 한눈에 들어온다.',
      },
      {
        characterId: null,
        text: '내일은 신입생 오리엔테이션. 어떤 사람들을 만나게 될까.',
      },
      {
        characterId: null,
        text: '16주. 어떤 대학 생활을 만들어 나갈지는 전부 나에게 달렸다.',
      },
      {
        characterId: null,
        text: '— 1학기가 시작된다.',
      },
    ],
  },
];
