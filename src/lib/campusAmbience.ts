/**
 * Campus Ambience — what's happening AROUND you during activities
 *
 * Not about the activity itself, but the world around it.
 * Changes per week to prevent repetition.
 */

const AMBIENCE: Record<string, string[]> = {
  classroom: [
    '옆자리 학생이 졸다가 고개를 흔들며 깨어났다.',
    '뒤에서 누군가 에어팟으로 몰래 노래를 듣고 있다.',
    '창밖으로 잔디밭에서 점심 먹는 학생들이 보인다.',
    '교수님이 갑자기 "질문 없어요?" 하셔서 교실이 얼어붙었다.',
    '카톡 알림이 울렸는데 무음 안 해놔서 모두가 쳐다봤다.',
    '앞자리 학생이 태블릿으로 필기하는 게 부러웠다.',
  ],
  library: [
    '누군가의 위장이 꼬르륵 울렸다. 조용한 도서관에 울려 퍼졌다.',
    '옆 자리에서 형광펜 긋는 소리가 계속 들린다.',
    '에어컨 바람이 세서 카디건을 꺼냈다.',
    '마감 1시간 전, 자리 경쟁이 치열해지기 시작했다.',
    '배터리가 20%... 충전기를 안 가져왔다.',
    '커피 향이 도서관 입구까지 퍼져 나온다.',
  ],
  cafe: [
    '바리스타가 우유 스티밍하는 소리가 ASMR 같다.',
    '옆 테이블에서 면접 준비 연습하는 학생들이 보인다.',
    '노트북 화면에 비치는 자기 얼굴이 피곤해 보인다.',
    '카페 유리창 너머로 비가 내리기 시작했다.',
    '스피커에서 잔잔한 재즈가 흘러나온다.',
  ],
  gym: [
    '운동 끝나고 샤워실에서 나오니까 상쾌하다.',
    '러닝머신 옆 사람이 엄청 빨리 뛴다. 자극 받는다.',
    '체육관 거울에 비친 자신을 보며 "좀 나아졌나?" 싶다.',
    '운동하면서 들은 노래가 계속 머릿속을 맴돈다.',
  ],
  dorm: [
    '기숙사 복도에서 라면 냄새가 난다. 누군가 야식 중.',
    '윗층에서 발소리가 쿵쿵 울린다.',
    '창문을 열었더니 캠퍼스 불빛이 예쁘게 보인다.',
    '옆방에서 기타 연습 소리가 들린다. 은근 잘 친다.',
  ],
  campus: [
    '벤치에 앉은 커플이 사진을 찍고 있다.',
    '고양이 한 마리가 도서관 앞에서 낮잠 자고 있다.',
    '자전거 타고 지나가는 학생이 인사를 건넨다.',
    '캠퍼스 방송에서 동아리 홍보 안내가 흘러나온다.',
  ],
};

/**
 * Get an ambient campus detail for the current activity location.
 * Returns null sometimes (40% chance) to not be overwhelming.
 */
export function getCampusAmbience(activityName: string, week: number, slotIndex: number): string | null {
  // 40% chance to show ambience
  if (((week * 13 + slotIndex * 7) % 10) >= 4) return null;

  let locationType: string;
  const n = activityName.toLowerCase();
  if (n.includes('수업') || n.includes('lecture')) locationType = 'classroom';
  else if (n.includes('공부') || n.includes('도서관')) locationType = 'library';
  else if (n.includes('알바') || n.includes('카페')) locationType = 'cafe';
  else if (n.includes('운동')) locationType = 'gym';
  else if (n.includes('휴식')) locationType = 'dorm';
  else locationType = 'campus';

  const pool = AMBIENCE[locationType] ?? AMBIENCE.campus;
  const idx = ((week * 7 + slotIndex * 3 + locationType.length) >>> 0) % pool.length;
  return pool[idx];
}
