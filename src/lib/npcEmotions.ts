/**
 * NPC Emotions System — NPCs have feelings about the player
 *
 * After each week, NPC moods and opinions update based on:
 * - Player's stats (민지 respects high knowledge, 재민 worries about high stress)
 * - Interaction frequency (neglect → annoyed/worried)
 * - Shared activities (spending time → happy)
 * - Romance level (dating → special reactions)
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
  const fr = rel.friendship ?? rel.affection ?? 0;
  const rom = rel.romance ?? 0;

  switch (npcId) {
    case 'jaemin': {
      // 재민 — cares about friendship, worries about you, casual
      if (rom >= 45) return { mood: 'happy', opinion: '같이 있으면 심장이 미친 듯이 뛰어... 이게 진짜 행복이구나.', respectDelta: 2 };
      if (rom >= 25) return { mood: 'happy', opinion: '걔 볼 때마다 괜히 웃음이 나와... 이거 설마?', respectDelta: 1 };
      if (weeksSince >= 3) return { mood: 'worried', opinion: '요즘 왜 안 보이지... 바쁜가?', respectDelta: 0 };
      if (stats.stress > 75) return { mood: 'worried', opinion: '걔 요즘 많이 힘들어 보여. 걱정된다.', respectDelta: 0 };
      if (fr >= 60) return { mood: 'happy', opinion: '내 최고의 룸메! 대학 와서 제일 잘한 게 같은 방 쓴 거야.', respectDelta: 1 };
      if (stats.social >= 60) return { mood: 'happy', opinion: '걔 인싸됐더라ㅋㅋ 나도 끼워줘!', respectDelta: 0 };
      return { mood: 'neutral', opinion: '같은 방 쓰는 애. 나쁘지 않아.', respectDelta: 0 };
    }
    case 'minji': {
      // 민지 — respects competence, competitive, romance requires respect
      if (rom >= 45) return { mood: 'happy', opinion: '...솔직히, 걔 옆에 있으면 나도 모르게 웃게 돼. 이상하지?', respectDelta: 2 };
      if (rom >= 25) return { mood: 'impressed', opinion: '걔가 자꾸 신경 쓰여... 왜 이러는 거지.', respectDelta: 1 };
      if (stats.knowledge >= 70) return { mood: 'impressed', opinion: '...인정해. 걔 진짜 열심히 한다.', respectDelta: 2 };
      if (stats.knowledge >= 50 && fr >= 40) return { mood: 'neutral', opinion: '경쟁할 만한 상대. 나쁘지 않아.', respectDelta: 1 };
      if (stats.knowledge < 25) return { mood: 'annoyed', opinion: '공부 안 하면서 뭐 하고 다니는 거야.', respectDelta: -1 };
      if (weeksSince >= 4) return { mood: 'neutral', opinion: '...누구였더라? 같은 과인 건 알겠는데.', respectDelta: -1 };
      if (stats.charm >= 60 && fr >= 30) return { mood: 'jealous', opinion: '요즘 걔 인기 많던데... 공부는 하고?', respectDelta: 0 };
      return { mood: 'neutral', opinion: '같은 과야. 딱히 관심은 없어.', respectDelta: 0 };
    }
    case 'soyeon': {
      // 소연 — nurturing, proud of growth, romance is gentle
      if (rom >= 45) return { mood: 'happy', opinion: '이 후배... 언제부터 이렇게 가슴이 뛰었을까. 선배로서 안 되는 건데.', respectDelta: 2 };
      if (rom >= 25) return { mood: 'happy', opinion: '그 후배 볼 때마다 기분이 좋아져... 이건 그냥 선배 마음이겠지?', respectDelta: 1 };
      if (stats.health < 30) return { mood: 'worried', opinion: '후배 건강이 걱정돼... 밥 좀 먹여야 하는데.', respectDelta: 0 };
      if (stats.stress > 70) return { mood: 'worried', opinion: '무리하고 있는 것 같아. 한 번 얘기해봐야겠다.', respectDelta: 0 };
      if (stats.knowledge >= 60 && stats.social >= 40) return { mood: 'impressed', opinion: '잘 크고 있다. 기특한 후배야.', respectDelta: 2 };
      if (fr >= 50) return { mood: 'happy', opinion: '내가 이 후배를 진짜 좋아하는 건 비밀.', respectDelta: 1 };
      if (weeksSince >= 3) return { mood: 'neutral', opinion: '요즘 안 보이네. 잘 지내고 있으려나.', respectDelta: 0 };
      return { mood: 'neutral', opinion: '귀여운 후배. 좀 더 챙겨줘야겠다.', respectDelta: 0 };
    }
    case 'hyunwoo': {
      // 현우 — values passion, charm, free spirit
      if (rom >= 45) return { mood: 'happy', opinion: '걔랑 같이 있으면 음악이 더 잘 들려. 이런 감정은 처음이야.', respectDelta: 2 };
      if (rom >= 25) return { mood: 'happy', opinion: '걔 생각하면 노래가 나와... 이게 작곡 영감인가?', respectDelta: 1 };
      if (stats.charm >= 60) return { mood: 'impressed', opinion: '걔 분위기 있더라. 무대에 서면 빛날 타입이야.', respectDelta: 2 };
      if (fr >= 50 && stats.social >= 50) return { mood: 'happy', opinion: '좋은 후배 만났다. 같이 있으면 즐겁다.', respectDelta: 1 };
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
