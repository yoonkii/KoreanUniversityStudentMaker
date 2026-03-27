import type { StoryDirectorState } from "../../types/story";
import type { PlayerStats } from "../../types/stats";
import type { NPCCharacterSheet, NPCLiveState } from "../../types/npc";
import { STORYTELLER_CONFIGS } from "../../data/storyteller-modes";

export function buildDirectorSystemPrompt(mode: StoryDirectorState["mode"]): string {
  const config = STORYTELLER_CONFIGS[mode];
  const modeDesc = {
    cassandra: "전통적 서사 곡선을 따릅니다. 점진적으로 긴장감을 높이고, 절정 후 잠시 쉬었다가 다시 올립니다. 3일 이상 평탄하면 안 됩니다.",
    randy: "혼돈의 카오스. 예측 불가능합니다. 위기를 겹겹이 쌓을 수도, 2주간 평화를 줄 수도 있습니다.",
    phoebe: "일상 위주에 가끔 극적인 스파이크. 기본 긴장도는 낮지만, 10-15일마다 강렬한 사건이 터집니다.",
  };

  return `당신은 한국 대학 생활 시뮬레이션의 보이지 않는 스토리 디렉터입니다.
스토리텔링 모드: ${config.label.ko} — ${modeDesc[mode]}

핵심 규칙:
1. 당신은 절대로 직접 이벤트를 만들거나 서사를 쓰지 않습니다.
2. 당신은 NPC의 행동에 '편향'을 주입하여 간접적으로 드라마를 만듭니다.
3. 개입은 항상 자연스러워야 합니다 — "김민수가 조별과제 스트레스로 짜증이 나서 자연스럽게 갈등을 일으킬 것이다" (O)
   "싸움 이벤트를 만들어라" (X)
4. 하루에 최대 2개의 개입만 가능합니다.
5. 긴장도가 목표보다 낮으면 올리고, 높으면 해소해주세요.
6. 씨앗(복선)을 심고, 적절한 시점에 회수하세요.

한국어로 응답하세요.`;
}

export function buildDirectorEvaluationPrompt(
  director: StoryDirectorState,
  playerStats: PlayerStats,
  day: number,
  npcSummaries: Array<{ id: string; name: string; emotion: string; goal: string; playerRel: number }>,
  recentDayLogs: string[],
  playerActivities: string
): string {
  const parts: string[] = [];

  parts.push(`게임 상태:`);
  parts.push(`- ${day}일차/112일, ${director.currentPhase} 페이즈`);
  parts.push(`- 현재 긴장도: ${director.tensionLevel.toFixed(1)}/10 (목표: ${director.phaseTargetTension.toFixed(1)})`);
  parts.push(`- 마지막 선택지 제시 후: ${director.daysSinceLastChoice}일`);
  parts.push(`- 마지막 위기 후: ${director.daysSinceLastCrisis}일`);

  parts.push(`\n플레이어 스탯:`);
  parts.push(`- 준비도: ${playerStats.knowledge}, 체력: ${playerStats.energy}, 사회성: ${playerStats.social}`);
  parts.push(`- 재정: ${playerStats.finances}, 스펙: ${playerStats.career}, 멘탈: ${playerStats.mental}`);
  parts.push(`- 오늘 활동: ${playerActivities}`);

  // Danger zones
  const dangerStats: string[] = [];
  if (playerStats.energy < 25) dangerStats.push("체력 위험");
  if (playerStats.mental < 25) dangerStats.push("멘탈 위험");
  if (playerStats.finances < 25) dangerStats.push("재정 위험");
  if (playerStats.social < 25) dangerStats.push("사회성 위험");
  if (dangerStats.length > 0) {
    parts.push(`⚠️ 위험 영역: ${dangerStats.join(", ")}`);
  }

  // Active threads
  if (director.activeThreads.length > 0) {
    parts.push(`\n진행 중인 스토리:`);
    for (const thread of director.activeThreads) {
      parts.push(`- [${thread.status}] "${thread.title}": ${thread.summary} (관련 NPC: ${thread.involvedNPCs.join(", ")})`);
    }
  } else {
    parts.push(`\n진행 중인 스토리: 없음 (새로운 스토리를 시작해야 합니다)`);
  }

  // Planted seeds
  const readySeeds = director.plantedSeeds.filter((s) => s.payoffReady);
  if (readySeeds.length > 0) {
    parts.push(`\n회수 가능한 복선:`);
    for (const seed of readySeeds) {
      parts.push(`- ${seed.description} (${seed.plantedOnDay}일차에 심음, 관련: ${seed.relatedNPCs.join(", ")})`);
    }
  }

  // NPC summaries
  parts.push(`\nNPC 현황:`);
  for (const npc of npcSummaries) {
    parts.push(`- ${npc.name}: 감정=${npc.emotion}, 목표="${npc.goal}", 플레이어 관계=${npc.playerRel}/100`);
  }

  // Recent events
  if (recentDayLogs.length > 0) {
    parts.push(`\n최근 3일 요약:`);
    for (const log of recentDayLogs) {
      parts.push(`- ${log}`);
    }
  }

  parts.push(`\n이 상황을 평가하고 개입을 결정하세요.`);

  return parts.join("\n");
}
