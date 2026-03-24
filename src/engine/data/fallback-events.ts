/**
 * Pre-written fallback events for when AI calls fail or no NPC encounter occurs.
 * These are generic "quiet day" events that maintain immersion.
 */

interface FallbackEvent {
  narrative: string;
  mood: "neutral" | "positive" | "melancholic";
}

export const FALLBACK_EVENTS_KO: FallbackEvent[] = [
  { narrative: "평범한 하루였다. 강의를 듣고, 밥을 먹고, 시간이 흘렀다.", mood: "neutral" },
  { narrative: "오늘따라 캠퍼스가 유난히 고요했다. 나만 바쁜 것 같은 하루.", mood: "melancholic" },
  { narrative: "학생 식당에서 혼밥을 했다. 의외로 오늘 메뉴가 맛있었다.", mood: "positive" },
  { narrative: "도서관 자리 맡기 전쟁에서 겨우 승리. 창가 자리를 차지했다.", mood: "positive" },
  { narrative: "수업 끝나고 편의점에서 삼각김밥과 커피. 작은 행복.", mood: "positive" },
  { narrative: "비가 왔다. 우산 없이 뛰어가다가 신발이 다 젖었다.", mood: "melancholic" },
  { narrative: "SNS를 보니 다들 재미있는 것 같은데... 나만 아무것도 안 하고 있나.", mood: "melancholic" },
  { narrative: "기숙사에서 라면 끓여 먹으며 유튜브를 봤다. 죄책감 반, 행복 반.", mood: "neutral" },
  { narrative: "캠퍼스 벤치에 앉아 지나가는 사람들을 구경했다. 가끔은 이런 시간도 필요하다.", mood: "positive" },
  { narrative: "과제 마감이 코앞인데 아직 시작도 못 했다. 오늘도 미루기 성공.", mood: "neutral" },
  { narrative: "자판기 커피를 마시며 내일 할 일을 생각했다. 생각만 했다.", mood: "neutral" },
  { narrative: "교수님이 수업 중에 갑자기 인생 조언을 했다. 약간 찔렸다.", mood: "melancholic" },
  { narrative: "오늘은 하루 종일 졸렸다. 체력 관리를 해야 하나...", mood: "neutral" },
  { narrative: "학교 고양이를 만났다. 잠시나마 모든 걱정이 사라졌다.", mood: "positive" },
  { narrative: "도서관에서 모르는 사람이 자리를 맡아달라고 했다. 30분 동안 안 왔다.", mood: "neutral" },
  { narrative: "카페에서 공부하는 척하다가 결국 인스타그램만 2시간 봤다.", mood: "neutral" },
  { narrative: "밤에 기숙사 옥상에서 별을 봤다. 서울에서도 가끔 별이 보인다.", mood: "positive" },
  { narrative: "편의점 앞에서 배달 기다리는 사람들을 봤다. 다들 바쁘게 산다.", mood: "melancholic" },
  { narrative: "학교 축제 포스터가 붙어있었다. 올해는 누구랑 갈까.", mood: "neutral" },
  { narrative: "오늘 아무도 만나지 않았다. 조용하지만 조금 쓸쓸한 하루.", mood: "melancholic" },
];

export const FALLBACK_EVENTS_EN: FallbackEvent[] = [
  { narrative: "An ordinary day. Attended classes, ate, time passed.", mood: "neutral" },
  { narrative: "The campus was unusually quiet today. Feels like only I'm busy.", mood: "melancholic" },
  { narrative: "Ate alone at the cafeteria. The menu was surprisingly good today.", mood: "positive" },
  { narrative: "Won the library seat war. Got the window seat.", mood: "positive" },
  { narrative: "Convenience store triangle kimbap and coffee after class. Small happiness.", mood: "positive" },
];

let fallbackIndex = 0;

export function getRandomFallbackEvent(lang: "ko" | "en"): FallbackEvent {
  const events = lang === "ko" ? FALLBACK_EVENTS_KO : FALLBACK_EVENTS_EN;
  const event = events[fallbackIndex % events.length];
  fallbackIndex++;
  return event;
}
