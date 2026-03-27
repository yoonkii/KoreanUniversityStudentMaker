/**
 * Activity Flavor Text — dynamic descriptions based on semester phase
 *
 * Makes activities feel different depending on when you do them.
 * Early semester = new and exciting. Pre-exam = intense. Post-festival = relaxed.
 */

type SemesterPhase = 'early' | 'settling' | 'pre_midterm' | 'midterm' | 'post_midterm' | 'festival' | 'late' | 'pre_finals' | 'finals' | 'ending';

function getSemesterPhase(week: number): SemesterPhase {
  if (week <= 2) return 'early';
  if (week <= 5) return 'settling';
  if (week === 6) return 'pre_midterm';
  if (week <= 8) return 'midterm';
  if (week === 9) return 'festival';
  if (week <= 11) return 'post_midterm';
  if (week <= 13) return 'late';
  if (week === 14) return 'pre_finals';
  if (week === 15) return 'finals';
  return 'ending';
}

const ACTIVITY_FLAVOR: Record<string, Partial<Record<SemesterPhase, string[]>>> = {
  '수업': {
    early: ['첫 수업이라 긴장된다. 교수님 이름이라도 기억하자.', '강의실이 어디지... 건물을 헤맸다.'],
    settling: ['수업 패턴이 좀 잡히기 시작했다.', '필기하는 속도가 붙었다.'],
    midterm: ['시험 범위가 어디까지지... 집중해서 들어야 한다.', '교수님이 "여기 시험에 나옵니다" 라고 했다!'],
    late: ['이제 교수님 농담 타이밍도 알겠다ㅋㅋ', '수업이 점점 어려워진다...'],
    pre_finals: ['마지막 수업... 정리 노트를 꼼꼼히 적었다.'],
  },
  '공부': {
    early: ['도서관이 어디 있는지 찾는 것부터 시작.', '아직 뭘 공부해야 하는지 잘 모르겠다.'],
    settling: ['나만의 공부 자리를 찾았다. 3층 구석 자리.', '교재를 처음부터 정독하고 있다.'],
    pre_midterm: ['도서관이 만석이다... 자리 잡기 전쟁.', '시험 범위 정리 중. 많다...'],
    midterm: ['미친 듯이 외우고 있다. 머리에 들어오는 건지 모르겠다.', '밤새 공부 중. 커피가 생명이다.'],
    post_midterm: ['중간 끝났으니 좀 여유롭게 공부한다.', '놓쳤던 부분 다시 보고 있다.'],
    late: ['기말 준비를 슬슬 시작해야겠다.', '공부한 게 쌓이는 느낌이 들기 시작했다.'],
    pre_finals: ['도서관 24시간 개방! 자리 쟁탈전이 치열하다.', '지금이 마지막 스퍼트다.'],
  },
  '알바': {
    early: ['첫 출근이라 메뉴를 못 외워서 헤맸다.', '선배 알바생이 친절하게 알려줬다.'],
    settling: ['이제 주문은 눈 감고도 받을 수 있다.', '단골 손님이 생기기 시작했다.'],
    midterm: ['시험 기간인데 알바까지... 체력이 버틸까.', '공부도 해야 하는데 돈도 필요하고...'],
    festival: ['축제 기간이라 손님이 엄청 많다! 팁도 많이 받았다.'],
    late: ['알바가 익숙해지니까 좀 편해졌다.'],
  },
  '운동': {
    early: ['체육관 시설이 의외로 좋다! 러닝머신부터 시작.', '운동복을 안 가져왔다... 내일부터 제대로 하자.'],
    settling: ['운동 루틴이 자리잡기 시작했다.'],
    midterm: ['시험 스트레스 푸는 데 운동만 한 게 없다.'],
    festival: ['축제 끝나고 먹은 거 다 빼야지...'],
  },
  '휴식': {
    early: ['아직 방이 익숙하지 않지만 침대는 편하다.', '넷플릭스 추천 리스트를 정리 중.'],
    midterm: ['시험 끝나고 12시간 잤다. 행복.', '잠이 보약이라는 말이 맞다.'],
    late: ['가끔은 이렇게 아무것도 안 하는 게 필요하다.'],
  },
  '친구': {
    early: ['아직 서먹서먹하지만 밥은 같이 먹는다.', '이름을 겨우 외웠다.'],
    settling: ['어색함이 사라지고 편해졌다.', '같이 다니는 게 자연스러워졌다.'],
    festival: ['축제에서 같이 놀았다! 최고의 추억.'],
    late: ['벌써 이렇게 친해질 줄 몰랐다.', '학기가 끝나면 이런 시간이 그리울 것 같다.'],
  },
  '동아리': {
    early: ['첫 모임! 선배들이 따뜻하게 맞아줬다.', '악기/활동을 처음 배우기 시작했다.'],
    settling: ['동아리 활동이 점점 재밌어진다.'],
    festival: ['축제 공연 준비 중! 긴장된다.', '무대에 서면 어떤 기분일까.'],
    late: ['이제 후배들한테 알려줄 수 있는 수준이 됐다.'],
  },
};

/**
 * Get a contextual flavor text for an activity based on semester phase.
 * Returns null if no specific flavor is available.
 */
export function getActivityFlavorText(activityName: string, week: number): string | null {
  const phase = getSemesterPhase(week);

  for (const [keyword, phaseTexts] of Object.entries(ACTIVITY_FLAVOR)) {
    if (activityName.includes(keyword)) {
      const texts = phaseTexts[phase];
      if (!texts || texts.length === 0) return null;
      // Deterministic selection based on week
      const idx = ((week * 7 + keyword.length) >>> 0) % texts.length;
      return texts[idx];
    }
  }
  return null;
}
