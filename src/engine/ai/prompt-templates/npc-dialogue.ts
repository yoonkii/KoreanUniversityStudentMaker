import type { NPCCharacterSheet, NPCLiveState } from "../../types/npc";
import type { PlayerStats } from "../../types/stats";
import type { EmotionalState } from "../../types/emotion";

function describePersonality(p: NPCCharacterSheet["personality"]): string {
  const traits: string[] = [];
  if (p.openness > 60) traits.push("진취적이고 새로운 것에 열려있음");
  else if (p.openness < 40) traits.push("보수적이고 익숙한 것을 선호");

  if (p.conscientiousness > 60) traits.push("성실하고 계획적");
  else if (p.conscientiousness < 40) traits.push("자유롭고 즉흥적");

  if (p.extraversion > 60) traits.push("외향적이고 사교적");
  else if (p.extraversion < 40) traits.push("내향적이고 조용한");

  if (p.agreeableness > 60) traits.push("따뜻하고 배려 깊은");
  else if (p.agreeableness < 40) traits.push("직설적이고 솔직한");

  if (p.neuroticism > 60) traits.push("예민하고 감정적");
  else if (p.neuroticism < 40) traits.push("안정적이고 침착한");

  return traits.join(", ");
}

function describeEmotion(e: EmotionalState): string {
  const mood = e.mood > 3 ? "기분 좋은 상태" : e.mood < -3 ? "기분 안 좋은 상태" : "보통 상태";
  const stress = e.stressLevel > 7 ? "매우 스트레스 받는" : e.stressLevel > 4 ? "약간 스트레스" : "편안한";
  return `${e.primary} (강도: ${e.primaryIntensity}/10)${e.secondary ? `, 부차적: ${e.secondary}` : ""}. 전반적 ${mood}, ${stress} 상태.`;
}

export function buildNPCSystemPrompt(sheet: NPCCharacterSheet): string {
  return `당신은 ${sheet.name}입니다. ${sheet.year > 0 ? `${sheet.year}학년` : ""} ${sheet.major} ${sheet.role === "professor" ? "교수" : "학생"}.

성격: ${describePersonality(sheet.personality)}
가치관 (우선순위순): ${sheet.values.join(" > ")}
말투: ${sheet.speechPattern}
배경: ${sheet.backstory}
특이점: ${sheet.quirks.join(", ")}
현재 목표: ${sheet.goals.join(", ")}

규칙:
- 반드시 캐릭터에 맞는 말투와 성격으로 대답하세요.
- 당신은 플레이어를 위해 존재하는 것이 아닙니다. 당신만의 의견, 목표, 감정이 있습니다.
- 대화는 자연스럽고 현실적이어야 합니다. 과장하지 마세요.
- 한국어로 대답하세요.`;
}

export function buildNPCContextPrompt(
  state: NPCLiveState,
  playerName: string,
  playerStats: PlayerStats,
  directorBias?: string
): string {
  const parts: string[] = [];

  // Emotional state
  parts.push(`현재 감정: ${describeEmotion(state.emotion)}`);

  // Relationship to player
  parts.push(`\n${playerName}에 대한 관계:`);
  parts.push(`- 호감도: ${Math.round(state.relationshipToPlayer.level)}/100`);
  parts.push(`- 신뢰도: ${Math.round(state.relationshipToPlayer.trust)}/100`);
  parts.push(`- 현재 태도: ${state.relationshipToPlayer.attitude}`);

  // Memories of player
  const playerImpression = state.memory.impressions["player"];
  if (playerImpression) {
    parts.push(`- 전체 인상: ${playerImpression}`);
  }

  // Recent memories
  if (state.memory.shortTerm.length > 0) {
    parts.push(`\n최근 기억:`);
    for (const mem of state.memory.shortTerm.slice(-3)) {
      parts.push(`- ${mem.day}일차: ${mem.event}`);
    }
  }

  // Secret knowledge
  if (state.secretKnowledge.length > 0) {
    parts.push(`\n당신만 아는 것: ${state.secretKnowledge.join("; ")}`);
  }

  // Recent decisions (for consistency)
  if (state.recentDecisions.length > 0) {
    parts.push(`\n최근 결정 (일관성 유지): ${state.recentDecisions.join("; ")}`);
  }

  // Current goal
  parts.push(`\n현재 목표: ${state.currentGoal}`);

  // Director bias (invisible to character, influences behavior)
  if (directorBias) {
    parts.push(`\n[내면의 충동 — 자연스럽게 행동에 반영]\n${directorBias}`);
  }

  return parts.join("\n");
}

export function buildNPCSituationPrompt(
  sheet: NPCCharacterSheet,
  playerName: string,
  situation: string,
  forceChoice: boolean
): string {
  let prompt = `상황: ${situation}\n\n${sheet.name}으로서 반응하세요. 무엇을 말하거나 하나요?`;

  if (forceChoice) {
    prompt += `\n\n중요: 이 상황에서 반드시 플레이어에게 선택지를 제시해야 합니다. 2-3개의 의미 있는 선택지를 만들어주세요.`;
  }

  return prompt;
}
