import type { NPCCharacterSheet, NPCLiveState } from "../types/npc";
import { CORE_NPC_SHEETS } from "./core-npcs";
import { createInitialEmotionalState } from "../ai/emotion-model";
import { createEmptyMemory } from "../ai/memory-manager";

/**
 * Create initial live state for all core NPCs.
 */
export function initializeNPCs(): {
  sheets: Record<string, NPCCharacterSheet>;
  states: Record<string, NPCLiveState>;
} {
  const sheets: Record<string, NPCCharacterSheet> = {};
  const states: Record<string, NPCLiveState> = {};

  for (const sheet of CORE_NPC_SHEETS) {
    sheets[sheet.id] = sheet;

    // Initial relationship levels vary by role
    const baseRelLevel: Record<string, number> = {
      roommate: 40,
      classmate: 25,
      senior: 20,
      professor: 15,
      work_colleague: 30,
      club_member: 20,
      romantic_interest: 15,
      rival: 20,
    };

    const initialAttitudes: Record<string, string> = {
      roommate: "같은 방 쓰는 사이. 아직 서로 잘 모르지만 나쁘지 않다.",
      classmate: "같은 과 동기. 이름은 아는 정도.",
      senior: "학과 선배. 가끔 마주치는 사이.",
      professor: "담당 교수님. 학생 중 한 명일 뿐.",
      work_colleague: "같은 알바 동료. 일하면서 조금씩 알아가는 중.",
      club_member: "동아리에서 본 얼굴. 아직 친하진 않다.",
      romantic_interest: "교양 수업에서 몇 번 본 사람. 왠지 눈이 간다.",
      rival: "같은 과 동기. 묘하게 신경 쓰인다.",
    };

    // Initialize NPC-to-NPC relationships
    const npcRelationships: Record<string, { level: number; attitude: string }> = {};
    for (const otherSheet of CORE_NPC_SHEETS) {
      if (otherSheet.id === sheet.id) continue;
      npcRelationships[otherSheet.id] = {
        level: 20 + Math.floor(Math.random() * 20),
        attitude: "아직 잘 모르는 사이.",
      };
    }

    // Special NPC-to-NPC relationships
    if (sheet.id === "npc_minsu") {
      npcRelationships["npc_dongho"] = { level: 55, attitude: "같은 동아리. 잘 어울린다." };
    }
    if (sheet.id === "npc_jiwon") {
      npcRelationships["npc_taehyun"] = { level: 35, attitude: "같은 과 경쟁자. 은근 신경 쓰인다." };
    }
    if (sheet.id === "npc_taehyun") {
      npcRelationships["npc_jiwon"] = { level: 30, attitude: "1등을 다투는 상대. 인정하기 싫지만 실력 있다." };
    }

    states[sheet.id] = {
      npcId: sheet.id,
      emotion: createInitialEmotionalState(),
      relationshipToPlayer: {
        level: baseRelLevel[sheet.role] ?? 20,
        attitude: initialAttitudes[sheet.role] ?? "처음 보는 사이.",
        trust: baseRelLevel[sheet.role] ?? 20,
      },
      npcRelationships,
      memory: createEmptyMemory(),
      currentGoal: sheet.goals[0] ?? "평범하게 하루 보내기",
      currentLocation: sheet.primaryLocationIds[0] ?? "campus_outdoor",
      recentDecisions: [],
      secretKnowledge: [],
    };
  }

  return { sheets, states };
}
