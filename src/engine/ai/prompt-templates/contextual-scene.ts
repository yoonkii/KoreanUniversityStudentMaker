import type { PlayerStats, WeekSchedule, DayKey } from "@/store/types";
import type { CharacterRelationship } from "@/store/types";
import { ACTIVITIES } from "@/data/activities";

const DAY_LABELS: Record<DayKey, string> = {
  monday: "월", tuesday: "화", wednesday: "수", thursday: "목",
  friday: "금", saturday: "토", sunday: "일",
};

const TIME_LABELS: Record<string, string> = {
  morning: "오전", afternoon: "오후", evening: "저녁",
};

const CHARACTERS_INFO = `
사용 가능한 캐릭터:
- soyeon (박소연): 따뜻한 3학년 선배, 문학 동아리 회장. expressions: neutral, happy, teasing, blushing, worried, sad
- jaemin (이재민): 같은 과 룸메이트, 밝고 낙천적. expressions: neutral, happy, anxious, laughing, concerned, supportive
- minji (한민지): 과 수석, 겉은 차갑지만 속은 따뜻. expressions: neutral, competitive, friendly, frustrated, triumphant
- hyunwoo (정현우): 밴드 동아리 선배, 카리스마. expressions: neutral, cool, scheming, helpful, surprised
- prof-kim (김 교수): 엄격하지만 학생을 아끼는 전공 교수. expressions: neutral, stern, approving, disappointed, thoughtful

사용 가능한 배경:
- campus (day, night, sunset), classroom (daytime, exam), library (quiet, crowded)
- cafe (counter, seating), dorm (clean, messy), club-room (normal, meeting)
`;

export function buildContextualSceneSystemPrompt(): string {
  return `당신은 한국 대학교 생활 시뮬레이션 게임의 시나리오 작가입니다.
플레이어의 이번 주 스케줄과 현재 상태를 바탕으로 짧은 이벤트 씬을 생성합니다.

규칙:
1. 씬은 플레이어가 이번 주에 한 활동과 직접 연관되어야 합니다.
2. 대사는 자연스러운 한국어 대학생 말투로 작성하세요.
3. 캐릭터는 1-2명만 등장시키세요.
4. 대화는 4-7줄로 간결하게 작성하세요.
5. 선택지는 반드시 2-3개 제공하세요. 각 선택지는 서로 다른 능력치에 영향을 줘야 합니다.
6. characterId가 null이면 나레이터입니다.
7. 선택지의 statEffects 값은 -10 ~ +10 범위로 설정하세요. money는 -30000 ~ +30000.

${CHARACTERS_INFO}

JSON 형식으로 응답하세요.`;
}

export function buildContextualSceneUserPrompt(
  schedule: WeekSchedule,
  stats: PlayerStats,
  week: number,
  relationships: Record<string, CharacterRelationship>,
): string {
  // Summarize schedule
  const scheduleLines: string[] = [];
  const activityCounts: Record<string, number> = {};

  for (const [day, slots] of Object.entries(schedule) as [DayKey, { timeSlot: string; activityId: string }[]][]) {
    for (const slot of slots) {
      const activity = ACTIVITIES[slot.activityId];
      if (activity) {
        scheduleLines.push(`${DAY_LABELS[day]} ${TIME_LABELS[slot.timeSlot]}: ${activity.name}`);
        activityCounts[activity.name] = (activityCounts[activity.name] || 0) + 1;
      }
    }
  }

  const dominantActivities = Object.entries(activityCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, count]) => `${name}(${count}회)`)
    .join(", ");

  // Summarize relationships
  const relSummary = Object.entries(relationships)
    .map(([id, r]) => `${id}: 호감도 ${r.affection}`)
    .join(", ");

  return `## ${week}주차 상황

### 이번 주 스케줄
${scheduleLines.join("\n")}

### 주요 활동: ${dominantActivities}

### 플레이어 현재 상태
- 준비도: ${stats.knowledge}/100
- 체력: ${stats.health}/100
- 인맥: ${stats.social}/100
- 돈: ₩${stats.money.toLocaleString("ko-KR")}
- 스트레스: ${stats.stress}/100
- 매력: ${stats.charm}/100

### 관계
${relSummary || "아직 관계 없음"}

이번 주 스케줄의 주요 활동(${dominantActivities})과 연관된 씬을 생성하세요.
씬의 id는 "ai_week${week}_scene"으로 설정하세요.`;
}
