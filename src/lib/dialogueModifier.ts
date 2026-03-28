/**
 * Dialogue Modifier — adjusts NPC dialogue tone based on friendship AND romance level
 *
 * Instead of writing multiple dialogue variants per scene, this system
 * dynamically adds/replaces small tone markers in dialogue text based
 * on the player's friendship and romance tiers with the speaking NPC.
 *
 * VN pattern: same scene, different feel based on relationship.
 */

import type { CharacterRelationship } from '@/store/types';

interface ToneModifier {
  greeting: string;
  reaction: string;
}

// Friendship tones (platonic warmth progression)
const NPC_FRIEND_TONE: Record<string, Record<string, ToneModifier>> = {
  jaemin: {
    stranger: { greeting: '', reaction: '' },
    acquaintance: { greeting: '', reaction: '' },
    friend: { greeting: '(재민이가 반갑게 손을 흔든다) ', reaction: '' },
    close_friend: { greeting: '(재민이가 팔을 두르며 다가온다) ', reaction: ' 재민이가 편하게 웃었다.' },
    best_friend: { greeting: '(재민이가 "야 왔어?" 하며 자연스럽게 옆에 앉는다) ', reaction: ' 말 없이도 통하는 사이다.' },
  },
  minji: {
    stranger: { greeting: '', reaction: '' },
    acquaintance: { greeting: '(민지가 잠깐 눈을 마주친다) ', reaction: '' },
    friend: { greeting: '(민지가 고개를 끄덕이며 인사한다) ', reaction: '' },
    close_friend: { greeting: '(민지가 살짝 미소 짓는다 — 흔한 일이 아니다) ', reaction: ' 민지의 눈이 부드러워졌다.' },
    best_friend: { greeting: '(민지가 "왔어?" 하며 자리를 비켜준다) ', reaction: ' 경쟁자이자 가장 든든한 동료.' },
  },
  soyeon: {
    stranger: { greeting: '', reaction: '' },
    acquaintance: { greeting: '(소연 선배가 가볍게 인사한다) ', reaction: '' },
    friend: { greeting: '(소연 선배가 따뜻하게 웃으며 다가온다) ', reaction: '' },
    close_friend: { greeting: '(소연 선배가 "우리 후배~" 하며 반겨준다) ', reaction: ' 선배의 따뜻함이 전해진다.' },
    best_friend: { greeting: '(소연 선배가 "보고 싶었어" 하며 반겨준다) ', reaction: ' 가족 같은 사이.' },
  },
  hyunwoo: {
    stranger: { greeting: '', reaction: '' },
    acquaintance: { greeting: '(현우가 "어, 왔어?" 한다) ', reaction: '' },
    friend: { greeting: '(현우가 쿨하게 인사한다) ', reaction: '' },
    close_friend: { greeting: '(현우가 주먹 인사를 건넨다 👊) ', reaction: ' 현우 특유의 편안함.' },
    best_friend: { greeting: '(현우: "야 기다렸어!") ', reaction: ' 이 형, 진짜 좋은 사람이다.' },
  },
};

// Romance tones (romantic tension progression — OVERRIDES friendship when active)
const NPC_ROMANCE_TONE: Record<string, Record<string, ToneModifier>> = {
  jaemin: {
    interest: { greeting: '(재민이가 괜히 머리를 만진다) ', reaction: ' ...왜 자꾸 의식하게 되지.' },
    crush: { greeting: '(재민이가 눈을 마주치다 황급히 돌린다) ', reaction: ' 심장이 뛰는 건 운동한 탓이겠지.' },
    dating: { greeting: '(재민이가 살짝 손을 잡는다) ', reaction: ' 손이 따뜻했다.' },
    deep_love: { greeting: '(재민이가 "보고 싶었어" 하며 안는다) ', reaction: ' 이 사람이 내 전부야.' },
  },
  minji: {
    interest: { greeting: '(민지가 평소보다 자주 이쪽을 본다) ', reaction: ' ...뭐지, 이 느낌.' },
    crush: { greeting: '(민지가 살짝 붉어진 채 "...왔어?" 한다) ', reaction: ' 쿨한 척해도 귀 끝이 빨갛다.' },
    dating: { greeting: '(민지가 작게 미소 지으며 손가락을 건다) ', reaction: ' "...바보." 하지만 손은 놓지 않았다.' },
    deep_love: { greeting: '(민지가 "기다렸어" 하며 품에 안긴다) ', reaction: ' 이 사람 앞에선 모든 벽이 무너진다.' },
  },
  soyeon: {
    interest: { greeting: '(소연 선배가 유난히 살갑다) ', reaction: ' 선배의 미소가 유독 따뜻해 보였다.' },
    crush: { greeting: '(소연 선배가 "오늘 좀 멋있다?" 하며 웃는다) ', reaction: ' 선배... 그런 말 하면 안 되는데.' },
    dating: { greeting: '(소연 선배가 팔짱을 끼며 다가온다) ', reaction: ' 선배의 향기가 가까워지자 심장이 뛴다.' },
    deep_love: { greeting: '(소연 선배가 "자기야~" 하며 볼에 뽀뽀한다) ', reaction: ' 세상에서 제일 따뜻한 사람.' },
  },
  hyunwoo: {
    interest: { greeting: '(현우가 유독 밝게 웃는다) ', reaction: ' 저 웃음... 왜 자꾸 떠올리지.' },
    crush: { greeting: '(현우가 "너 올 줄 알았어" 하며 윙크한다) ', reaction: ' 심장 소리가 안 들렸으면 좋겠다.' },
    dating: { greeting: '(현우가 자연스럽게 어깨에 팔을 두른다) ', reaction: ' "오늘 노래 너한테 불러줄게."' },
    deep_love: { greeting: '(현우가 기타로 세레나데를 시작한다 🎵) ', reaction: ' 이 사람의 음악은 곧 사랑 고백이다.' },
  },
};

function getFriendTier(friendship: number): string {
  if (friendship >= 80) return 'best_friend';
  if (friendship >= 60) return 'close_friend';
  if (friendship >= 40) return 'friend';
  if (friendship >= 20) return 'acquaintance';
  return 'stranger';
}

function getRomanceTier(romance: number): string {
  if (romance >= 70) return 'deep_love';
  if (romance >= 45) return 'dating';
  if (romance >= 25) return 'crush';
  if (romance >= 10) return 'interest';
  return 'none';
}

/**
 * Get a greeting prefix for an NPC based on relationship level.
 * Romance tones override friendship tones when active.
 */
export function getRelationshipGreeting(
  characterId: string,
  relationships: Record<string, CharacterRelationship>,
): string {
  const rel = relationships[characterId];
  if (!rel) return '';
  const romance = rel.romance ?? 0;
  const friendship = rel.friendship ?? rel.affection ?? 0;

  // Romance overrides friendship for greeting tone
  if (romance >= 10) {
    const rTier = getRomanceTier(romance);
    const rGreeting = NPC_ROMANCE_TONE[characterId]?.[rTier]?.greeting;
    if (rGreeting) return rGreeting;
  }

  const fTier = getFriendTier(friendship);
  return NPC_FRIEND_TONE[characterId]?.[fTier]?.greeting ?? '';
}

/**
 * Get a reaction suffix for an NPC based on relationship level.
 * Romance tones override friendship tones when active.
 */
export function getRelationshipReaction(
  characterId: string,
  relationships: Record<string, CharacterRelationship>,
): string {
  const rel = relationships[characterId];
  if (!rel) return '';
  const romance = rel.romance ?? 0;
  const friendship = rel.friendship ?? rel.affection ?? 0;

  if (romance >= 10) {
    const rTier = getRomanceTier(romance);
    const rReaction = NPC_ROMANCE_TONE[characterId]?.[rTier]?.reaction;
    if (rReaction) return rReaction;
  }

  const fTier = getFriendTier(friendship);
  return NPC_FRIEND_TONE[characterId]?.[fTier]?.reaction ?? '';
}

/**
 * Get a memory callback insertion — an NPC referencing a shared experience.
 * Returns null 70% of the time to keep it special.
 */
export function getMemoryCallback(
  characterId: string,
  relationships: Record<string, CharacterRelationship>,
): string | null {
  const rel = relationships[characterId];
  if (!rel || !rel.memories || rel.memories.length === 0) return null;
  if (Math.random() > 0.3) return null;

  const lastMemory = rel.memories[rel.memories.length - 1];
  const romance = rel.romance ?? 0;

  // Romance-specific memory callbacks
  const ROMANCE_MEMORY: Record<string, Record<string, string>> = {
    jaemin: {
      hangout: '(재민이가 머쓱하게) 저번에 같이 있었던 거... 자꾸 생각나.',
      date: '(재민이가 귀까지 빨개지며) 그... 그때 데이트... 또 가고 싶다.',
    },
    minji: {
      hangout: '(민지가 눈을 피하며) 저번에... 나쁘지 않았어. 솔직히.',
      date: '(민지가 작게) 그때... 좋았어. 또 가자... 라고 해도 되지?',
    },
    soyeon: {
      hangout: '(소연 선배가 부드럽게) 저번에 같이 있었던 거 즐거웠어. 또 보자.',
      date: '(소연 선배가 살짝 붉어지며) 그때 데이트... 꿈 같았어.',
    },
    hyunwoo: {
      hangout: '(현우가 쿨하게) 저번에 같이 논 거 최고였어!',
      date: '(현우가 진지하게) 다음 데이트 때 좋은 데 데려갈게. 약속.',
    },
  };

  // Friendship memory callbacks
  const FRIEND_MEMORY: Record<string, Record<string, string>> = {
    jaemin: {
      hangout: '(재민이가 웃으며) 저번에 같이 놀았던 거 진짜 재밌었어!',
      date: '(재민이가 눈을 피하며) 그... 저번에 둘이 갔던 거... 또 가자.',
      studied: '(재민이) 같이 공부했던 거 도움 많이 됐어, 고마워.',
      club: '(재민이) 동아리에서 같이한 거 기억나? 좋았어.',
    },
    minji: {
      hangout: '(민지가 약간 웃으며) ...저번에 같이 있었던 거, 나쁘지 않았어.',
      date: '(민지가 살짝 붉어지며) 그때... 좋았어. 솔직히.',
      studied: '(민지) 같이 공부할 때 집중이 잘 됐어. 또 하자.',
      club: '(민지) 동아리에서 봤을 때 의외였어. 그런 면도 있구나.',
    },
    soyeon: {
      hangout: '(소연 선배가 미소 지으며) 저번에 같이 밥 먹은 거 즐거웠어~',
      date: '(소연 선배가 부드럽게) 그때 같이 걸었던 거... 기억나.',
      studied: '(소연 선배) 같이 공부하니까 효율 좋더라? 후배가 열심히 하니 기특해.',
      club: '(소연 선배) 동아리에서 열심히 하는 모습 보기 좋았어.',
    },
    hyunwoo: {
      hangout: '(현우가 주먹을 내밀며) 저번에 같이 논 거 최고였어!',
      date: '(현우가 쿨하게) 다음에 또 가자. 좋은 데 알아.',
      studied: '(현우) 너 공부도 잘하더라. 의외인데?',
      club: '(현우) 합주할 때 호흡 잘 맞았어. 역시!',
    },
  };

  const memType = lastMemory.split('_')[0];

  // Use romance callbacks for date memories when romance ≥ 10
  if (romance >= 10 && (memType === 'date' || memType === 'hangout')) {
    return ROMANCE_MEMORY[characterId]?.[memType] ?? FRIEND_MEMORY[characterId]?.[memType] ?? null;
  }

  return FRIEND_MEMORY[characterId]?.[memType] ?? null;
}

/**
 * Get a bonus line — extra dialogue for deep relationships.
 * Romance bonus lines trigger for romance ≥ 25 (crush+).
 * Friendship bonus lines trigger for friendship ≥ 60 (close friend+).
 */
export function getAffectionBonusLine(
  characterId: string,
  relationships: Record<string, CharacterRelationship>,
): string | null {
  const rel = relationships[characterId];
  if (!rel) return null;

  const friendship = rel.friendship ?? rel.affection ?? 0;
  const romance = rel.romance ?? 0;

  // Need at least close friend or crush level
  if (friendship < 60 && romance < 25) return null;

  // 25% chance to trigger
  if (Math.random() > 0.25) return null;

  // Romance lines (override friendship when romance is active)
  const ROMANCE_LINES: Record<string, Record<string, string[]>> = {
    jaemin: {
      crush: [
        '(재민이가 갑자기 조용해지며) ...야, 너 오늘 왜 이렇게 예뻐 보여?',
        '(재민이가 머쓱하게) 너 옆에 있으면 괜히 떨려. 왜 그런지 모르겠어.',
      ],
      dating: [
        '(재민이가 손을 잡으며) 이렇게 같이 있는 거... 매일이면 좋겠다.',
        '(재민이) 너 만나고 나서 매일이 설레. 진짜야.',
      ],
      deep_love: [
        '(재민이가 진지하게) 너 없는 미래는 상상이 안 돼. 계속 함께하자.',
        '(재민이) 사랑해. 이 말 하려고 용기 냈어.',
      ],
    },
    minji: {
      crush: [
        '(민지가 고개를 돌리며) ...자꾸 네 생각이 나. 공부에 집중이 안 돼.',
        '(민지) 너... 왜 자꾸 신경 쓰이는 거야. 짜증나.',
      ],
      dating: [
        '(민지가 작게 웃으며) 너랑 있으면... 지는 게 아까워지지 않아.',
        '(민지) 라이벌에서 연인이 될 줄은 몰랐어. 근데... 나쁘지 않아.',
      ],
      deep_love: [
        '(민지가 눈물을 참으며) 너 없으면 안 될 것 같아. 처음이야, 이런 감정.',
        '(민지) 졸업해도... 헤어지지 말자. 약속해.',
      ],
    },
    soyeon: {
      crush: [
        '(소연 선배가 웃으며) 후배한테 이런 감정 느끼면 안 되는데...',
        '(소연 선배) 자꾸 네 얼굴이 떠올라. 선배로서 안 되는 건데.',
      ],
      dating: [
        '(소연 선배가 팔짱 끼며) 우리 사이 후배-선배 아니지? 그냥... 연인이지.',
        '(소연 선배) 졸업해도 너한테 가고 싶어. 먼 곳이라도.',
      ],
      deep_love: [
        '(소연 선배가 눈물 글썽이며) 네가 내 대학 생활 전부야. 사랑해.',
        '(소연 선배) 졸업식 때... 울지 않을 자신이 없어.',
      ],
    },
    hyunwoo: {
      crush: [
        '(현우가 기타를 치다 멈추며) ...야, 너 때문에 가사가 자꾸 써져.',
        '(현우) 너 보면 기분이 좋아져. 이게 뭔 감정인지 아직 모르겠어.',
      ],
      dating: [
        '(현우가 노래하듯) 너를 위한 곡은 평생 써도 부족할 것 같아.',
        '(현우) 공연 때 맨 앞줄에 앉아줘. 너한테만 부르는 노래가 있어.',
      ],
      deep_love: [
        '(현우가 기타를 내려놓고 안으며) 너는 내 음악이야. 영원히.',
        '(현우) 무대보다 네 옆이 좋아. 그게 전부야.',
      ],
    },
  };

  // Friendship lines
  const FRIEND_LINES: Record<string, Record<string, string[]>> = {
    jaemin: {
      close_friend: [
        '(재민이가 조용히) 야... 너 옆에 있으면 편해. 진짜야.',
        '(재민이) 솔직히 너 없으면 이 학기 못 버텼을 거야.',
      ],
      best_friend: [
        '(재민이가 진지하게) 졸업해도 우리 연락하자. 약속.',
        '(재민이) 네가 내 대학 생활 최고의 선택이야.',
      ],
    },
    minji: {
      close_friend: [
        '(민지가 작게) ...고마워. 네가 있어서 외롭지 않았어.',
        '(민지) 너 아니었으면 공부만 했을 텐데. 다행이야.',
      ],
      best_friend: [
        '(민지가 진심으로) 처음엔 라이벌인 줄 알았는데... 지금은 달라.',
        '(민지) 앞으로도... 계속 곁에 있어 줄 거지?',
      ],
    },
    soyeon: {
      close_friend: [
        '(소연 선배) 이런 후배 만나서 선배 생활이 행복해.',
        '(소연 선배가 웃으며) 너를 가르치는 건 내 대학 생활 최고의 경험이야.',
      ],
      best_friend: [
        '(소연 선배가 눈가를 훔치며) 졸업하면... 정말 보고 싶을 거야.',
        '(소연 선배) 후배가 아니라 동생 같아. 진짜 소중해.',
      ],
    },
    hyunwoo: {
      close_friend: [
        '(현우가 진지하게) 너 때문에 동아리가 더 재밌어졌어.',
        '(현우) 졸업 공연, 너한테 꼭 보여주고 싶어.',
      ],
      best_friend: [
        '(현우가 기타를 내려놓으며) 너를 위한 곡을 쓰고 있어.',
        '(현우) 네가 없는 동아리는 상상이 안 돼.',
      ],
    },
  };

  // Romance lines take priority
  if (romance >= 25) {
    const rTier = romance >= 70 ? 'deep_love' : romance >= 45 ? 'dating' : 'crush';
    const lines = ROMANCE_LINES[characterId]?.[rTier];
    if (lines && lines.length > 0) return lines[Math.floor(Math.random() * lines.length)];
  }

  // Friendship lines
  const fTier = friendship >= 80 ? 'best_friend' : 'close_friend';
  const lines = FRIEND_LINES[characterId]?.[fTier];
  if (!lines || lines.length === 0) return null;
  return lines[Math.floor(Math.random() * lines.length)];
}
