import type { NPCCharacterSheet, NPCLiveState } from "../../types/npc";

interface NPCSimContext {
  id: string;
  name: string;
  personality: string;
  currentEmotion: string;
  currentGoal: string;
  location: string;
  relationshipsToOthers: Array<{ name: string; level: number; attitude: string }>;
}

export function buildSimulationSystemPrompt(): string {
  return `당신은 한국 대학 생활 시뮬레이션의 NPC 상호작용 시뮬레이터입니다.
플레이어가 없는 동안 NPC들 사이에서 일어나는 일을 시뮬레이션합니다.

규칙:
1. 대부분의 날은 특별한 일이 없습니다. 무의미한 상호작용을 만들지 마세요.
2. 의미 있는 일만 보고하세요: 관계 변화, 새로운 비밀, 스토리 진전
3. NPC들의 성격과 현재 감정에 맞게 행동하세요
4. 플레이어가 나중에 자연스럽게 발견할 수 있는 것들을 만들어주세요
5. 한 번에 0-2개의 상호작용만 보고하세요
6. 한국어로 응답하세요`;
}

export function buildSimulationPrompt(
  npcs: NPCSimContext[],
  playerActivities: string,
  directorGuidance?: string,
  activeThreads?: string[]
): string {
  const parts: string[] = [];

  parts.push(`오늘 플레이어는 "${playerActivities}" 활동을 합니다.`);
  parts.push(`그 동안 다음 NPC들은 각자의 일과를 보냅니다:\n`);

  for (const npc of npcs) {
    parts.push(`${npc.name} (${npc.personality}):`);
    parts.push(`  감정: ${npc.currentEmotion}`);
    parts.push(`  목표: ${npc.currentGoal}`);
    parts.push(`  위치: ${npc.location}`);
    if (npc.relationshipsToOthers.length > 0) {
      for (const rel of npc.relationshipsToOthers) {
        parts.push(`  → ${rel.name}: ${rel.level}/100 (${rel.attitude})`);
      }
    }
    parts.push("");
  }

  if (activeThreads && activeThreads.length > 0) {
    parts.push(`진행 중인 스토리: ${activeThreads.join("; ")}`);
  }

  if (directorGuidance) {
    parts.push(`\n디렉터 지침: ${directorGuidance}`);
  }

  parts.push(`\nNPC들 사이에서 오늘 의미 있는 일이 있었나요? 0-2개만 보고하세요.`);

  return parts.join("\n");
}

export function buildNPCSimContext(
  sheet: NPCCharacterSheet,
  state: NPCLiveState,
  allSheets: Record<string, NPCCharacterSheet>
): NPCSimContext {
  const personality = [
    state.emotion.stressLevel > 6 ? "스트레스 받는" : "",
    sheet.personality.extraversion > 60 ? "외향적" : "내향적",
    sheet.personality.agreeableness > 60 ? "따뜻한" : "직설적",
  ].filter(Boolean).join(", ");

  const relationships = Object.entries(state.npcRelationships)
    .filter(([id]) => allSheets[id])
    .map(([id, rel]) => ({
      name: allSheets[id].name,
      level: rel.level,
      attitude: rel.attitude,
    }));

  return {
    id: sheet.id,
    name: sheet.name,
    personality,
    currentEmotion: `${state.emotion.primary} (${state.emotion.primaryIntensity}/10)`,
    currentGoal: state.currentGoal,
    location: state.currentLocation,
    relationshipsToOthers: relationships,
  };
}
