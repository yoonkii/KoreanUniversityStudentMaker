/**
 * Activity Result Messages — brief narrative outcomes per activity
 *
 * Each activity type has multiple possible result messages that add
 * flavor to the action phase. Selected based on week + index for variety.
 */

const ACTIVITY_RESULTS: Record<string, string[]> = {
  '수업': [
    '교수님의 설명이 머리에 쏙 들어왔다.',
    '필기하느라 손이 아프다. 그래도 뿌듯.',
    '오늘 수업 내용이 어려웠다. 복습 필요.',
    '교수님이 중요하다고 밑줄 그으신 부분 체크!',
    '뒷자리에서 졸 뻔했다. 위험위험.',
  ],
  '공부': [
    '집중 3시간. 한 챕터를 끝냈다.',
    '커피 2잔으로 버텼다. 눈이 뻑뻑.',
    '이해가 되기 시작했다. 이 느낌!',
    '옆 사람 타자 소리 때문에 집중이 안 됐다.',
    '마감 임박 과제를 겨우 끝냈다.',
  ],
  '알바': [
    '오늘 장사가 잘 됐다. 사장님 기분 좋으심.',
    '손님이 적어서 여유로운 시프트였다.',
    '실수 없이 깔끔하게 마무리!',
    '퇴근하니까 다리가 아프다.',
    '단골 손님이 "수고해요~" 해줬다.',
  ],
  '운동': [
    '땀을 흘리니까 머리가 맑아졌다.',
    '개인 기록을 갱신했다!',
    '운동 후 단백질 쉐이크. 건강해지는 느낌.',
    '오늘은 좀 힘들었다. 컨디션 조절 필요.',
    '러닝 후 석양을 보며 쿨다운.',
  ],
  '휴식': [
    '아무것도 안 하는 행복. 이게 삶이지.',
    '넷플 3편 연속 시청. 후회 없다.',
    '낮잠 2시간. 세상에서 가장 행복한 순간.',
    '기숙사에서 음악 듣며 뒹굴뒹굴.',
    '오랜만에 부모님이랑 통화했다.',
  ],
  '친구': [
    '맛있는 거 먹으면서 수다 떨었다.',
    '같이 카페에서 수다 + 과제 = 완벽.',
    '오랜만에 웃었다. 친구가 최고.',
    '시간 가는 줄 몰랐다.',
    '서로 고민 나누니까 마음이 편해졌다.',
  ],
  '동아리': [
    '합주가 점점 맞아간다. 성장하는 느낌.',
    '선배가 새로운 곡을 가르쳐줬다.',
    '동아리 후배가 들어왔다. 이제 나도 선배?',
    '연습 끝나고 같이 밥 먹으러 갔다.',
    '다음 공연 준비가 착착 진행 중.',
  ],
  '데이트': [
    '두근두근. 시간이 너무 빨리 갔다.',
    '같이 걸으면서 이런저런 이야기를 했다.',
    '사진을 많이 찍었다. 추억 저장.',
    '오늘 분위기 좋았다. 웃음이 멈추지 않았다.',
    '헤어지기 아쉬웠다. 다음에 또 만나자.',
  ],
};

/**
 * Get a result message for an activity.
 * Deterministic based on week + activity index for variety without randomness.
 */
export function getActivityResult(activityName: string, week: number, slotIndex: number): string | null {
  for (const [keyword, results] of Object.entries(ACTIVITY_RESULTS)) {
    if (activityName.includes(keyword)) {
      const idx = ((week * 7 + slotIndex * 3) >>> 0) % results.length;
      return results[idx];
    }
  }
  return null;
}
