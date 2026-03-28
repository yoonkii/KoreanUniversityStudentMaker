/**
 * Campus Simulation — generates a "living campus" with dozens of NPCs
 * who have schedules, moods, and create chance encounters.
 *
 * Zero API cost — deterministic based on week/stats/relationships.
 * Creates the feeling of a breathing, populated university.
 */

import type { PlayerStats, CharacterRelationship } from '@/store/types';

// ─── Background NPCs (not main characters) ───
// These are students, staff, and professors who populate the campus

export interface CampusNpc {
  id: string;
  name: string;
  role: string;
  personality: string;
}

const CAMPUS_NPCS: CampusNpc[] = [
  { id: 'yunhee', name: '김윤희', role: '같은 과 동기', personality: '조용한 모범생' },
  { id: 'dongwook', name: '박동욱', role: '같은 과 동기', personality: '운동을 좋아하는 듬직한 친구' },
  { id: 'sumin', name: '최수민', role: '옆 과 친구', personality: '밝고 활발한 성격' },
  { id: 'jihoon', name: '한지훈', role: '동아리 후배', personality: '예의 바른 신입생' },
  { id: 'eunji', name: '정은지', role: '과대표', personality: '리더십 강한 언니' },
  { id: 'taehyuk', name: '이태혁', role: '알바 동료', personality: '유머러스한 2학년' },
  { id: 'nayoung', name: '서나영', role: '도서관 단골', personality: '책벌레 같은 4학년' },
  { id: 'seojin', name: '강서진', role: '체육관 단골', personality: '헬스 마니아' },
  { id: 'minho', name: '윤민호', role: '학생회 임원', personality: '정치적이고 사교적' },
  { id: 'haeri', name: '임해리', role: '카페 직원', personality: '음악을 좋아하는 조용한 성격' },
  { id: 'prof_lee', name: '이정민 교수', role: '교양 교수', personality: '재미있는 강의로 유명' },
  { id: 'prof_park', name: '박현주 교수', role: '학과장', personality: '무서운 겉모습, 다정한 속' },
  { id: 'ajumma', name: '학식 아주머니', role: '학식당 직원', personality: '학생들 밥 많이 주는 다정한 분' },
  { id: 'guard', name: '경비 아저씨', role: '기숙사 경비', personality: '밤에 나가는 학생 걱정하는 분' },
  { id: 'sunbae_kim', name: '김 선배', role: '4학년 선배', personality: '취준생, 약간 우울' },
  // ─── Extended roster (cycle 26) ───
  { id: 'chaeyoung', name: '류채영', role: '같은 과 동기', personality: '패션에 관심 많은 세련된 친구' },
  { id: 'woojin', name: '김우진', role: '과 선배', personality: '게임 좋아하는 3학년' },
  { id: 'haeun', name: '이하은', role: '교환학생', personality: '호기심 많은 외국어 전공' },
  { id: 'janitor', name: '청소 아저씨', role: '환경미화원', personality: '아침 일찍 학교를 깨끗이 하시는 분' },
  { id: 'librarian', name: '사서 선생님', role: '도서관 사서', personality: '조용하지만 책 추천을 잘 해주심' },
  { id: 'delivery', name: '배달 기사님', role: '배달원', personality: '학교 앞 배달 전문, 학생들에게 친절' },
  { id: 'couple_a', name: '커플 A', role: '캠퍼스 커플', personality: '항상 붙어 다니는 선배 커플' },
  { id: 'freshman', name: '신입생', role: '1학년 후배', personality: '모든 게 신기한 눈으로 캠퍼스를 돌아다님' },
];

// ─── Campus Location Types ───
type CampusLocation = 'classroom' | 'library' | 'cafeteria' | 'cafe' | 'gym' | 'club_room' | 'dorm' | 'campus_path';

// ─── Encounter Generation ───

export interface CampusEncounter {
  npcName: string;
  npcRole: string;
  location: CampusLocation;
  dialogue: string;
  mood: 'happy' | 'neutral' | 'stressed' | 'sad';
}

interface CampusGossip {
  text: string;
  source: string;
}

/**
 * Generate campus encounters for the current activity.
 * Based on activity type, week, player stats, and a seeded random.
 */
export function generateEncounters(
  activityName: string,
  week: number,
  stats: PlayerStats,
  relationships: Record<string, CharacterRelationship>,
): CampusEncounter[] {
  const encounters: CampusEncounter[] = [];
  const seed = week * 31 + activityName.length * 7;

  // Pick location based on activity
  const location = activityToLocation(activityName);

  // Select 1-2 background NPCs for this location
  const eligibleNpcs = CAMPUS_NPCS.filter(npc => npcLikelyAt(npc, location, week));
  const shuffled = [...eligibleNpcs].sort((a, b) => seededRandom(seed + a.id.length) - seededRandom(seed + b.id.length));
  const selected = shuffled.slice(0, Math.min(2, shuffled.length));

  for (const npc of selected) {
    // Only 40% chance to actually encounter each NPC (keeps it fresh)
    if (seededRandom(seed + npc.id.charCodeAt(0) + week) > 0.7) continue; // 70% chance — campus is busy

    const mood = getNpcMood(npc, week, stats);
    const dialogue = generateNpcDialogue(npc, location, week, stats, mood);
    encounters.push({ npcName: npc.name, npcRole: npc.role, location, dialogue, mood });
  }

  return encounters;
}

/**
 * Generate campus gossip — overheard conversations, rumors, atmosphere.
 * One gossip item per week, contextual to game state.
 */
export function generateGossip(week: number, stats: PlayerStats): CampusGossip | null {
  const gossipPool: { text: string; source: string; condition: () => boolean }[] = [
    { text: '중간고사 범위가 엄청 넓다는 소문이 돌고 있다...', source: '과 단톡방', condition: () => week >= 5 && week <= 7 },
    { text: '"올해 축제 라인업 대박이래!" 복도에서 들려오는 소리.', source: '캠퍼스 소문', condition: () => week === 8 },
    { text: '"XX과에서 커플이 또 생겼대" 학식당에서 들린 수다.', source: '학식당 소문', condition: () => week >= 3 },
    { text: '에브리타임에 "학식 오늘 맛있음" 글이 올라왔다.', source: '에브리타임', condition: () => true },
    { text: '"요즘 도서관 자리 잡기 전쟁이다..." 한숨 소리가 들린다.', source: '도서관 앞', condition: () => week >= 6 },
    { text: '취업 특강 포스터가 새로 붙었다. 4학년 선배들 표정이 진지하다.', source: '게시판', condition: () => week >= 10 },
    { text: '"교수님이 과제 하나 더 내신대..." 단톡방이 술렁인다.', source: '과 단톡방', condition: () => week >= 4 && week <= 13 },
    { text: '기숙사 로비에 "기말 화이팅!" 응원 배너가 걸렸다.', source: '기숙사', condition: () => week >= 13 },
    { text: '"이번 학기 진짜 빨리 간다..." 다들 같은 말을 한다.', source: '카페', condition: () => week >= 10 },
    { text: '교내 공모전 포스터가 붙었다. 상금이 꽤 크다.', source: '게시판', condition: () => week >= 8 && week <= 12 },
    { text: '강의평가 기간이 다가오고 있다. 솔직하게 쓸까...', source: '에브리타임', condition: () => week >= 14 },
    { text: stats.social >= 60 ? '"쟤 요즘 인싸됐다" 라는 소문이 돌고 있다.' : '"쟤 맨날 혼자 다닌다" 라는 소문이 들렸다.', source: '캠퍼스 소문', condition: () => week >= 5 },
  ];

  const eligible = gossipPool.filter(g => g.condition());
  if (eligible.length === 0) return null;

  const idx = ((week * 17 + 3) >>> 0) % eligible.length;
  return { text: eligible[idx].text, source: eligible[idx].source };
}

// ─── Helper Functions ───

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function activityToLocation(activityName: string): CampusLocation {
  const n = activityName.toLowerCase();
  if (n.includes('수업') || n.includes('lecture')) return 'classroom';
  if (n.includes('공부') || n.includes('도서관')) return 'library';
  if (n.includes('알바')) return 'cafe';
  if (n.includes('동아리')) return 'club_room';
  if (n.includes('운동')) return 'gym';
  if (n.includes('휴식')) return 'dorm';
  if (n.includes('친구') || n.includes('데이트')) return 'cafeteria';
  return 'campus_path';
}

function npcLikelyAt(npc: CampusNpc, location: CampusLocation, week: number): boolean {
  // Each NPC has preferred locations
  const locationPrefs: Record<string, CampusLocation[]> = {
    yunhee: ['classroom', 'library'],
    dongwook: ['gym', 'cafeteria', 'campus_path'],
    sumin: ['cafeteria', 'cafe', 'campus_path'],
    jihoon: ['club_room', 'classroom'],
    eunji: ['classroom', 'cafeteria', 'library'],
    taehyuk: ['cafe', 'cafeteria'],
    nayoung: ['library'],
    seojin: ['gym'],
    minho: ['cafeteria', 'campus_path', 'classroom'],
    haeri: ['cafe', 'club_room'],
    prof_lee: ['classroom', 'campus_path'],
    prof_park: ['classroom', 'library'],
    ajumma: ['cafeteria'],
    guard: ['dorm'],
    sunbae_kim: ['library', 'cafe'],
    chaeyoung: ['cafeteria', 'cafe', 'campus_path'],
    woojin: ['club_room', 'dorm', 'cafeteria'],
    haeun: ['classroom', 'cafeteria', 'campus_path'],
    janitor: ['campus_path', 'classroom'],
    librarian: ['library'],
    delivery: ['dorm', 'cafeteria'],
    couple_a: ['campus_path', 'cafeteria', 'cafe'],
    freshman: ['classroom', 'campus_path', 'cafeteria'],
  };
  const prefs = locationPrefs[npc.id] ?? ['campus_path'];
  return prefs.includes(location);
}

function getNpcMood(npc: CampusNpc, week: number, _stats: PlayerStats): 'happy' | 'neutral' | 'stressed' | 'sad' {
  // Exam weeks: everyone is stressed
  if ([7, 8, 14, 15].includes(week)) return npc.id === 'seojin' ? 'neutral' : 'stressed';
  // Festival week: everyone is happy
  if (week === 9) return 'happy';
  // 4학년 선배 always a bit sad
  if (npc.id === 'sunbae_kim') return week >= 10 ? 'sad' : 'stressed';
  // Default by personality
  if (npc.personality.includes('밝') || npc.personality.includes('활발')) return 'happy';
  return 'neutral';
}

function generateNpcDialogue(
  npc: CampusNpc,
  location: CampusLocation,
  week: number,
  stats: PlayerStats,
  mood: string,
): string {
  // Context-aware dialogue generation
  const dialogueMap: Record<string, Record<CampusLocation, string[]>> = {
    yunhee: {
      classroom: ['윤희가 필기를 열심히 하고 있다. 손 안 쉬는 타입이다.', '윤희: "오늘 교수님 말씀 중요한 거 같은데, 녹음해도 되나?"'],
      library: ['윤희가 자리를 잡고 4시간째 미동도 없다.', '윤희: "...여기 원래 이렇게 조용해?"'],
      cafeteria: [], cafe: [], gym: [], club_room: [], dorm: [], campus_path: [],
    },
    dongwook: {
      gym: ['동욱: "같이 한 세트 할래? 오늘 가슴 날이야!"', '동욱이 러닝머신에서 전력질주 중이다.'],
      cafeteria: ['동욱: "닭가슴살이 또 떨어졌어..." 급식판을 보며 한숨.'],
      campus_path: ['동욱이 운동복 차림으로 뛰어가고 있다. "나중에 봐!"'],
      classroom: [], library: [], cafe: [], club_room: [], dorm: [],
    },
    sumin: {
      cafeteria: ['수민: "야 여기 앉아! 오늘 학식 괜찮아!"', '수민이 친구들이랑 시끌벅적하게 웃고 있다.'],
      cafe: ['수민이 아이스 아메리카노를 들고 과제 중이다. "이거 언제 끝나지..."'],
      campus_path: ['수민: "오늘 날씨 좋다! 잔디밭에서 놀까?"'],
      classroom: [], library: [], gym: [], club_room: [], dorm: [],
    },
    ajumma: {
      cafeteria: [
        stats.health < 40 ? '아주머니: "아이고 학생, 밥을 좀 먹어야지! 많이 줄게."' : '아주머니: "오늘 뭐 먹을래? 오늘 돈까스 맛있어~"',
        '아주머니가 밥을 푸짐하게 퍼주셨다. 행복하다.',
      ],
      classroom: [], library: [], cafe: [], gym: [], club_room: [], dorm: [], campus_path: [],
    },
    guard: {
      dorm: [
        week >= 13 ? '경비 아저씨: "요즘 밤새는 학생이 많네... 건강 챙겨!"' : '경비 아저씨: "오늘도 고생이야~ 일찍 들어와!"',
      ],
      classroom: [], library: [], cafe: [], cafeteria: [], gym: [], club_room: [], campus_path: [],
    },
    sunbae_kim: {
      library: [
        mood === 'sad' ? '김 선배가 이력서를 쓰다가 한숨을 쉬고 있다...' : '김 선배: "후배야, 1학년 때 놀지 마. 진심이야."',
      ],
      cafe: ['김 선배가 카페에서 노트북을 들여다보고 있다. "취업 준비... 끝이 없네."'],
      classroom: [], cafeteria: [], gym: [], club_room: [], dorm: [], campus_path: [],
    },
    eunji: {
      classroom: ['은지 언니: "다음 주 과 MT 참석 확인해줘! 단톡 확인했지?"'],
      cafeteria: ['은지 언니가 과대표답게 여러 테이블을 돌며 인사하고 있다.'],
      library: ['은지 언니도 공부 중이다. 과대표도 시험은 어쩔 수 없나 보다.'],
      cafe: [], gym: [], club_room: [], dorm: [], campus_path: [],
    },
    prof_lee: {
      classroom: ['이 교수님이 농담으로 수업을 시작한다. 분위기가 좋다.', '이 교수님: "인생에서 학점보다 중요한 게 있어요. 근데 학점도 중요해요."'],
      campus_path: ['이 교수님이 커피를 들고 산책 중이다. 가볍게 인사했다.'],
      library: [], cafe: [], cafeteria: [], gym: [], club_room: [], dorm: [],
    },
    haeri: {
      cafe: ['해리가 카페에서 이어폰을 끼고 일하면서 콧노래를 부르고 있다.'],
      club_room: ['해리: "이 곡 들어봐! 우리 다음 공연에 넣으면 어떨까?"'],
      classroom: [], library: [], cafeteria: [], gym: [], dorm: [], campus_path: [],
    },
    chaeyoung: {
      cafeteria: ['채영: "오늘 학식 비주얼 별로다... 밖에서 먹을까?"'],
      cafe: ['채영이 새 옷을 입고 왔다. "어때? 할인 받아서 샀어!"'],
      campus_path: ['채영이 지나가면서 반갑게 손을 흔들었다.'],
      classroom: [], library: [], gym: [], club_room: [], dorm: [],
    },
    woojin: {
      club_room: ['우진 선배: "주말에 롤 한 판 할 사람?"'],
      dorm: ['우진 선배 방에서 게임 소리가 들린다... 밤새 하는 건가.'],
      cafeteria: ['우진 선배: "학식 라면이 최고야. 반박 불가."'],
      classroom: [], library: [], cafe: [], gym: [], campus_path: [],
    },
    haeun: {
      classroom: ['하은: "한국어 아직 어렵다... 이 단어 뭐야?" 열심히 필기하고 있다.'],
      cafeteria: ['하은이 한국 음식을 신기해하며 먹고 있다. "이거 맛있어!"'],
      campus_path: ['하은이 캠퍼스 사진을 찍고 있다. "여기 너무 예뻐!"'],
      library: [], cafe: [], gym: [], club_room: [], dorm: [],
    },
    janitor: {
      campus_path: ['청소 아저씨가 낙엽을 쓸고 계신다. 가볍게 인사했다.'],
      classroom: ['청소 아저씨: "학생들 쓰레기 좀 제대로 버려줬으면..."'],
      library: [], cafe: [], cafeteria: [], gym: [], club_room: [], dorm: [],
    },
    librarian: {
      library: [
        '사서 선생님: "이 책 추천해요. 요즘 학생들한테 인기 많아요."',
        '사서 선생님이 조용히 새 책을 정리하고 계신다.',
      ],
      classroom: [], cafe: [], cafeteria: [], gym: [], club_room: [], dorm: [], campus_path: [],
    },
    couple_a: {
      campus_path: ['앞에서 커플이 팔짱 끼고 걸어가고 있다. ...부럽다.'],
      cafeteria: ['커플이 한 그릇을 나눠 먹고 있다. 주변에서 부러운 시선.'],
      cafe: ['카페 구석에서 커플이 달달하게 대화하고 있다.'],
      classroom: [], library: [], gym: [], club_room: [], dorm: [],
    },
    freshman: {
      classroom: ['후배가 건물을 못 찾아 헤매고 있다. "선배, 여기 어디예요?"'],
      campus_path: ['신입생들이 단체로 캠퍼스 투어를 하고 있다.'],
      cafeteria: ['후배가 학식 메뉴판을 진지하게 읽고 있다.'],
      library: [], cafe: [], gym: [], club_room: [], dorm: [],
    },
  };

  const lines = dialogueMap[npc.id]?.[location] ?? [];
  if (lines.length === 0) {
    // Fallback generic lines
    const generic = [
      `${npc.name}과(와) 눈이 마주쳤다. 가볍게 인사했다.`,
      `${npc.name}이(가) 지나가면서 고개를 끄덕였다.`,
      `${npc.name}: "안녕!"`,
    ];
    return generic[((week * 13 + npc.id.length) >>> 0) % generic.length];
  }

  return lines[((week * 7 + npc.id.charCodeAt(0)) >>> 0) % lines.length];
}
