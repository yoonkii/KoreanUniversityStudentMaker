/**
 * NPC Emotions System — NPCs have feelings about the player
 *
 * After each week, NPC moods and opinions update based on:
 * - Player's stats (민지 respects high knowledge, 재민 worries about high stress)
 * - Interaction frequency (neglect → annoyed/worried)
 * - Shared activities (spending time → happy)
 * - Player achievements (impressed by milestones)
 */

import type { PlayerStats, CharacterRelationship } from '@/store/types';

type NpcMood = 'happy' | 'neutral' | 'annoyed' | 'worried' | 'impressed' | 'jealous';

interface MoodUpdate {
  mood: NpcMood;
  opinion: string;
  respectDelta: number;
}

/**
 * Calculate how each NPC feels about the player this week.
 * Called during advanceWeek to update NPC emotional states.
 */
export function calculateNpcMood(
  npcId: string,
  stats: PlayerStats,
  rel: CharacterRelationship,
  currentWeek: number,
): MoodUpdate {
  const weeksSince = rel.lastInteraction ? currentWeek - rel.lastInteraction : 99;
  const aff = rel.affection;

  switch (npcId) {
    case 'jaemin': {
      // 재민 — cares about friendship, worries about you, casual
      if (weeksSince >= 3) return { mood: 'worried', opinion: '요즘 왜 안 보이지... 바쁜가?', respectDelta: 0 };
      if (stats.stress > 75) return { mood: 'worried', opinion: '걔 요즘 많이 힘들어 보여. 걱정된다.', respectDelta: 0 };
      if (aff >= 70) return { mood: 'happy', opinion: '내 최고의 룸메! 대학 와서 제일 잘한 게 같은 방 쓴 거야.', respectDelta: 1 };
      if (stats.social >= 60) return { mood: 'happy', opinion: '걔 인싸됐더라ㅋㅋ 나도 끼워줘!', respectDelta: 0 };
      return { mood: 'neutral', opinion: '같은 방 쓰는 애. 나쁘지 않아.', respectDelta: 0 };
    }
    case 'minji': {
      // 민지 — respects competence, competitive, notices academics
      if (stats.knowledge >= 70) return { mood: 'impressed', opinion: '...인정해. 걔 진짜 열심히 한다.', respectDelta: 2 };
      if (stats.knowledge >= 50 && aff >= 50) return { mood: 'neutral', opinion: '경쟁할 만한 상대. 나쁘지 않아.', respectDelta: 1 };
      if (stats.knowledge < 25) return { mood: 'annoyed', opinion: '공부 안 하면서 뭐 하고 다니는 거야.', respectDelta: -1 };
      if (weeksSince >= 4) return { mood: 'neutral', opinion: '...누구였더라? 같은 과인 건 알겠는데.', respectDelta: -1 };
      if (stats.charm >= 60 && aff >= 40) return { mood: 'jealous', opinion: '요즘 걔 인기 많던데... 공부는 하고?', respectDelta: 0 };
      return { mood: 'neutral', opinion: '같은 과야. 딱히 관심은 없어.', respectDelta: 0 };
    }
    case 'soyeon': {
      // 소연 — nurturing, proud of growth, worried about wellbeing
      if (stats.health < 30) return { mood: 'worried', opinion: '후배 건강이 걱정돼... 밥 좀 먹여야 하는데.', respectDelta: 0 };
      if (stats.stress > 70) return { mood: 'worried', opinion: '무리하고 있는 것 같아. 한 번 얘기해봐야겠다.', respectDelta: 0 };
      if (stats.knowledge >= 60 && stats.social >= 40) return { mood: 'impressed', opinion: '잘 크고 있다. 기특한 후배야.', respectDelta: 2 };
      if (aff >= 60) return { mood: 'happy', opinion: '내가 이 후배를 진짜 좋아하는 건 비밀.', respectDelta: 1 };
      if (weeksSince >= 3) return { mood: 'neutral', opinion: '요즘 안 보이네. 잘 지내고 있으려나.', respectDelta: 0 };
      return { mood: 'neutral', opinion: '귀여운 후배. 좀 더 챙겨줘야겠다.', respectDelta: 0 };
    }
    case 'hyunwoo': {
      // 현우 — values passion, charm, free spirit
      if (stats.charm >= 60) return { mood: 'impressed', opinion: '걔 분위기 있더라. 무대에 서면 빛날 타입이야.', respectDelta: 2 };
      if (aff >= 60 && stats.social >= 50) return { mood: 'happy', opinion: '좋은 후배 만났다. 같이 있으면 즐겁다.', respectDelta: 1 };
      if (stats.stress > 80) return { mood: 'worried', opinion: '좀 쉬어. 인생 길어. 음악이라도 들어봐.', respectDelta: 0 };
      if (weeksSince >= 4) return { mood: 'annoyed', opinion: '동아리 안 나오더라... 잠수 탄 건가.', respectDelta: -1 };
      return { mood: 'neutral', opinion: '후배. 아직은 잘 모르겠어.', respectDelta: 0 };
    }
    default:
      return { mood: 'neutral', opinion: '', respectDelta: 0 };
  }
}

/**
 * Get an NPC's current mood emoji for display.
 */
export function getMoodEmoji(mood: NpcMood): string {
  switch (mood) {
    case 'happy': return '😊';
    case 'annoyed': return '😤';
    case 'worried': return '😟';
    case 'impressed': return '🤩';
    case 'jealous': return '😒';
    default: return '😐';
  }
}
