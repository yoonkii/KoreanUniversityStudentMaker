/**
 * NPC Reactions — characters comment on what you just did
 *
 * After each activity, a nearby NPC might react to your effort.
 * PM-style: the tutor praises, the shopkeeper comments, etc.
 */

interface NpcReaction {
  npcName: string;
  text: string;
}

const ACTIVITY_REACTIONS: Record<string, NpcReaction[]> = {
  '수업': [
    { npcName: '김 교수', text: '오늘 집중 잘 하더군요. 다음 시간도 이렇게.' },
    { npcName: '윤희', text: '야, 오늘 필기 잘 했다. 나중에 빌려줄 수 있어?' },
    { npcName: '김 교수', text: '질문이 날카로워지고 있어요. 좋은 징조입니다.' },
    { npcName: '재민', text: '야 이번 수업 뭔 소린지 하나도 모르겠다ㅋㅋ 노트 보여줘...' },
  ],
  '공부': [
    { npcName: '사서', text: '열심히 하시네요. 이 자리 내일도 비워둘까요?' },
    { npcName: '민지', text: '...아직도 여기 있었어? 대단하다.' },
    { npcName: '나영', text: '(4학년 선배가 엄지를 치켜세웠다)' },
    { npcName: '재민', text: '(카톡) 야 너 도서관이야? 나도 갈까...' },
  ],
  '알바': [
    { npcName: '사장님', text: '오늘 실수 없이 잘 했어. 내일도 부탁해.' },
    { npcName: '사장님', text: '학생, 요즘 일 빨라졌어요. 고마워요.' },
    { npcName: '태혁', text: '고생했어~ 퇴근하고 뭐 먹을래?' },
    { npcName: '손님', text: '"여기 직원 친절하네요" (리뷰 별 5개)' },
  ],
  '운동': [
    { npcName: '서진', text: '오, 폼 좋은데? 매일 오는 거야?' },
    { npcName: '동욱', text: '같이 스쿼트 하자! 한 세트만 더!' },
    { npcName: '경비', text: '학생, 운동 꾸준히 하니까 얼굴색이 좋아졌어.' },
  ],
  '휴식': [
    { npcName: '재민', text: '야 넷플 뭐 봐? 나도 같이 보자ㅋㅋ' },
    { npcName: '경비', text: '(경비 아저씨가 초인종 울렸다. 택배 왔다.)' },
    { npcName: '재민', text: '(옆 침대에서 코고는 소리가 들린다...)' },
  ],
  '친구': [
    { npcName: '수민', text: '오늘 진짜 재밌었다! 다음에 또 보자~' },
    { npcName: '동욱', text: '같이 밥 먹으니까 확실히 맛있다ㅋㅋ' },
  ],
  '동아리': [
    { npcName: '현우', text: '오늘 합주 좋았어. 실력이 느는 게 보여.' },
    { npcName: '해리', text: '이 곡 다음 공연 때 해보자! 어울릴 것 같아.' },
    { npcName: '지훈', text: '선배 오늘 멋있었어요! 저도 그렇게 하고 싶어요.' },
  ],
  '데이트': [
    { npcName: '', text: '(오늘 기분이 좋다. 자꾸 미소가 난다.)' },
    { npcName: '', text: '(핸드폰을 확인했다. 아직 답장이 안 왔다... 괜찮겠지?)' },
  ],
};

/**
 * Get an NPC reaction for an activity. 30% chance to trigger.
 */
export function getNpcReaction(activityName: string, week: number, slotIndex: number): NpcReaction | null {
  // 30% chance
  if (((week * 11 + slotIndex * 13) % 10) >= 3) return null;

  for (const [keyword, reactions] of Object.entries(ACTIVITY_REACTIONS)) {
    if (activityName.includes(keyword)) {
      const idx = ((week * 7 + slotIndex * 5) >>> 0) % reactions.length;
      return reactions[idx];
    }
  }
  return null;
}
