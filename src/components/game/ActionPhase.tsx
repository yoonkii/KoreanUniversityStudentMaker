'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import type { PlayerStats, CharacterRelationship } from '@/store/types';
import { generateEncounters, generateGossip, type CampusEncounter } from '@/lib/campusSimulation';
import { findNpcsAtLocation, getOverheardConversation } from '@/lib/livingCampus';
import { getSpecificLocation, getLocationFlavor } from '@/lib/campusLocations';
import { getNpcContextualLine } from '@/lib/weeklyDialogueCache';
import { getInnerMonologue } from '@/lib/innerMonologue';
import { getActivityFlavorText } from '@/lib/activityFlavor';
import { getActivityResult } from '@/lib/activityResults';
import { useGameStore } from '@/store/gameStore';

interface DayActivity {
  name: string;
  icon: string;
  timeSlot: string;
  statEffects: Partial<PlayerStats>;
  targetNpcId?: string;
  targetNpcName?: string;
  skipped?: boolean;
}

export interface DayGroup {
  dayName: string;
  activities: DayActivity[];
}

interface ActionPhaseProps {
  days: DayGroup[];
  currentStats: PlayerStats;
  onComplete: () => void;
  speed?: 1 | 2;
}

const STAT_LABELS: Record<keyof PlayerStats, string> = {
  knowledge: '준비도',
  money: '재정',
  health: '체력',
  social: '인맥',
  stress: '스트레스',
  charm: '매력',
};

const TIME_LABELS: Record<string, string> = {
  morning: '🌅 오전',
  afternoon: '☀️ 오후',
  evening: '🌙 저녁',
};

const NPC_PORTRAITS: Record<string, string> = {
  jaemin: '/assets/characters/jaemin/happy.png',
  minji: '/assets/characters/minji/neutral.png',
  soyeon: '/assets/characters/soyeon/neutral.png',
  hyunwoo: '/assets/characters/hyunwoo/neutral.png',
};

// Week-specific NPC encounter overrides (take priority over generic lines)
function getWeekSpecificLine(activityKeyword: string, npcId: string, week: number): string | null {
  // Exam weeks — everyone talks about exams
  if ((week >= 6 && week <= 8) || (week >= 13 && week <= 15)) {
    const examLines: Record<string, Record<string, string>> = {
      jaemin: { '공부': '재민: "야 이 범위 다 외워야 해? 죽겠다..."', '수업': '재민이가 교수님한테 시험 범위 질문하고 있다.', '휴식': '재민: "시험 기간에 쉬어도 돼? ...나도 쉬고 싶다."' },
      minji: { '공부': '민지가 형광펜으로 빼곡히 밑줄 긋고 있다. 무섭다.', '수업': '민지: "이 부분 시험에 나온다. 집중해."' },
      soyeon: { '공부': '소연 선배: "작년 시험 유형 알려줄까? 비슷하게 나와."' },
    };
    return examLines[npcId]?.[activityKeyword] ?? null;
  }
  // Early semester — everything is new and exciting
  if (week <= 3) {
    const earlyLines: Record<string, Record<string, string>> = {
      jaemin: {
        '수업': '재민: "야 이 강의실 어디야? 건물이 다 똑같아ㅋㅋ"',
        '공부': '재민이가 도서관 자리를 찾느라 헤매고 있다. "여기 처음인데 어디 앉아?"',
        '운동': '재민: "헬스장 무료래! 같이 가자 오늘!"',
        '휴식': '재민이가 기숙사 와이파이 비번을 물어보고 있다.',
      },
      minji: {
        '수업': '민지가 첫 수업인데 벌써 교재에 포스트잇을 붙여놨다.',
        '공부': '민지: "도서관 3층이 가장 조용해. 참고해."',
      },
      soyeon: {
        '수업': '소연 선배가 복도에서 "첫 수업 어때? 재밌지?" 하고 물었다.',
        '공부': '소연 선배: "1학년 때 공부 습관 잡는 게 제일 중요해. 화이팅!"',
      },
      hyunwoo: {
        '동아리': '현우: "오늘 첫 모임이야! 긴장하지 마, 다 처음이니까."',
      },
    };
    return earlyLines[npcId]?.[activityKeyword] ?? null;
  }

  // Festival week — everyone is excited
  if (week === 9) {
    const festLines: Record<string, string> = {
      jaemin: '재민: "축제다! 오늘 뭐 볼 거야? 공연 라인업 봤어?"',
      hyunwoo: '현우: "우리 밴드 공연 보러 와! 최선을 다할게!"',
      minji: '민지가 의외로 축제를 즐기고 있다. "...나쁘지 않네."',
      soyeon: '소연 선배: "축제는 대학 생활의 꽃이야! 즐겨~"',
    };
    return festLines[npcId] ?? null;
  }
  return null;
}

// Contextual NPC encounter lines — triggered by activity + NPC presence
const NPC_ENCOUNTER_LINES: Record<string, Record<string, string[]>> = {
  '수업': {
    minji: ['민지가 옆자리에 앉았다. "오늘 교수님 말 잘 들어."', '민지: "여기 필기 빌려줄까?"'],
    jaemin: ['재민이가 뒤에서 졸고 있다... 😴', '재민: "야 이거 시험 나와?"'],
    soyeon: ['소연 선배가 강의실 앞에서 손을 흔들었다.'],
  },
  '도서관': {
    minji: ['민지가 맞은편에서 집중하고 있다. 왠지 경쟁심이 생긴다.', '민지: "...조용히 해."'],
    soyeon: ['소연 선배: "여기서 공부하고 있었어? 나도 같이 할까?"'],
    jaemin: ['재민이가 옆에서 유튜브를 보고 있다. 집중이 안 된다...'],
  },
  '아르바이트': {
    hyunwoo: ['현우 선배가 카페에 손님으로 왔다. "후배 알바 중이었어?"'],
    jaemin: ['재민이가 "야 나도 알바 좀 소개해줘" 라고 카톡을 보냈다.'],
  },
  '동아리': {
    hyunwoo: ['현우: "오늘 합주 좋았어! 실력 늘었다?"', '현우: "다음 공연 준비하자!"'],
    soyeon: ['소연 선배가 동아리 MT 계획을 얘기하고 있다.'],
  },
  '운동': {
    jaemin: ['재민: "같이 뛸래? 1대1 농구!"', '재민이랑 같이 러닝을 했다.'],
    hyunwoo: ['현우 선배가 체육관에서 운동 중이다. "같이 하자!"'],
  },
  '휴식': {
    jaemin: ['재민: "야 치킨 시킬까?" 🍗', '재민이가 넷플릭스 추천을 해줬다.'],
  },
};

// ─── Mid-Activity Choice Events ───
// These pause the action phase and present a choice to the player
interface MidActivityChoice {
  id: string;
  prompt: string;
  options: { text: string; effects: Partial<PlayerStats>; flavor: string }[];
  activityKeyword: string; // Only triggers during matching activities
  probability: number;
}

const MID_ACTIVITY_CHOICES: MidActivityChoice[] = [
  {
    id: 'study_distraction',
    prompt: '공부 중에 핸드폰 알림이 울렸다. SNS에 재밌는 글이 올라왔다.',
    activityKeyword: '공부',
    probability: 0.2,
    options: [
      { text: '무시하고 공부 계속', effects: { knowledge: 3, stress: 3 }, flavor: '집중력을 유지했다. 한 챕터를 더 끝냈다.' },
      { text: '잠깐만 볼게... (30분 후)', effects: { stress: -5, knowledge: -2 }, flavor: '30분이 1시간이 됐다... 하지만 스트레스는 풀렸다.' },
    ],
  },
  {
    id: 'gym_challenge',
    prompt: '체육관에서 누군가가 "한 판 붙을래요?" 라고 말을 걸어왔다.',
    activityKeyword: '운동',
    probability: 0.2,
    options: [
      { text: '좋아! 한 판 하자', effects: { health: 5, charm: 3, stress: 2 }, flavor: '치열한 경기 끝에 간신히 이겼다! 스포츠맨십이 빛난다.' },
      { text: '아, 오늘은 혼자 할게요', effects: { health: 2, stress: -2 }, flavor: '편하게 내 페이스대로 운동했다.' },
    ],
  },
  {
    id: 'parttime_difficult_customer',
    prompt: '"이거 내가 주문한 거 아닌데요?" 진상 손님이 왔다.',
    activityKeyword: '알바',
    probability: 0.2,
    options: [
      { text: '죄송합니다, 바로 바꿔드릴게요', effects: { charm: 3, stress: 5 }, flavor: '사장님이 "잘 처리했어" 하며 칭찬했다.' },
      { text: '확인해보니 맞는데요...', effects: { stress: 3, charm: -1, money: 5000 }, flavor: '약간 어색했지만, 실수가 아니었다는 걸 증명했다.' },
    ],
  },
  {
    id: 'lecture_question',
    prompt: '교수님이 갑자기 "이 문제 풀 사람?" 하고 교실을 둘러봤다.',
    activityKeyword: '수업',
    probability: 0.15,
    options: [
      { text: '손을 든다 ✋', effects: { knowledge: 4, charm: 3, stress: 4 }, flavor: '떨리는 마음으로 답했는데... 맞았다! 교수님이 끄덕였다.' },
      { text: '눈을 피한다 👀', effects: { stress: -1 }, flavor: '다른 학생이 대답했다. 조용히 넘어갔다.' },
    ],
  },
  {
    id: 'club_solo_offer',
    prompt: '선배가 "다음 공연에서 솔로 파트 해볼래?" 하고 물었다.',
    activityKeyword: '동아리',
    probability: 0.15,
    options: [
      { text: '해볼게요!', effects: { charm: 5, stress: 8, social: 3 }, flavor: '긴장되지만 흥분된다. 연습이 더 필요할 것 같다.' },
      { text: '아직 실력이 부족해서...', effects: { stress: -3, social: 1 }, flavor: '선배가 이해한다는 듯 웃었다. "다음에 하자."' },
    ],
  },
  {
    id: 'rest_jaemin_invite',
    prompt: '재민이가 방문을 열며 "야 PC방 갈래? 쿠폰 있어!" 했다.',
    activityKeyword: '휴식',
    probability: 0.25,
    options: [
      { text: '가자! 🎮', effects: { social: 5, stress: -8, money: -5000, knowledge: -1 }, flavor: '3시간이 순식간에 지나갔다. 재밌었다!' },
      { text: '오늘은 좀 쉴래', effects: { health: 3, stress: -5 }, flavor: '혼자만의 조용한 시간. 이것도 필요하다.' },
    ],
  },
  {
    id: 'friend_gossip',
    prompt: '친구가 "야 너 그 소문 들었어?" 하고 귀엣말을 했다.',
    activityKeyword: '친구',
    probability: 0.2,
    options: [
      { text: '뭔데 뭔데? 😮', effects: { social: 4, charm: 2, knowledge: -1 }, flavor: '캠퍼스 소문통이 됐다. 정보력 +1.' },
      { text: '뒷담화는 별로...', effects: { charm: 2, social: -1 }, flavor: '친구가 "너 진짜 착하다" 라고 했다.' },
    ],
  },
  {
    id: 'study_eureka',
    prompt: '공부하다가 갑자기 이해가 안 되던 개념이 머릿속에서 연결됐다!',
    activityKeyword: '공부',
    probability: 0.12,
    options: [
      { text: '이거다! 정리해두자 📝', effects: { knowledge: 5, charm: 1, stress: -2 }, flavor: '완벽한 요약 노트가 완성됐다. 뿌듯하다.' },
      { text: '이해는 했는데 넘어가자', effects: { knowledge: 2, stress: -1 }, flavor: '대충 이해한 것 같다. 시험 때 기억나려나...' },
    ],
  },
  {
    id: 'parttime_regular',
    prompt: '단골 할머니가 오셨다. "학생, 오늘도 고생이야~" 하며 팁을 주시려 한다.',
    activityKeyword: '알바',
    probability: 0.15,
    options: [
      { text: '감사합니다, 할머니 💛', effects: { money: 5000, charm: 3, stress: -3 }, flavor: '할머니의 따뜻한 미소에 피로가 풀렸다.' },
      { text: '아니에요, 괜찮습니다', effects: { charm: 4 }, flavor: '할머니가 "착한 학생이네" 하며 칭찬하셨다.' },
    ],
  },
  {
    id: 'exercise_rain',
    prompt: '운동하려고 나왔는데 갑자기 비가 내리기 시작한다.',
    activityKeyword: '운동',
    probability: 0.15,
    options: [
      { text: '비 맞으며 달리기! 🌧️', effects: { health: 6, charm: 3, stress: -5 }, flavor: '영화 같은 순간이었다. 빗속 러닝.' },
      { text: '실내 운동으로 전환', effects: { health: 4, stress: -2 }, flavor: '체육관으로 옮겼다. 현명한 판단.' },
    ],
  },
  {
    id: 'date_sunset',
    prompt: '데이트 중에 캠퍼스 뒤편 언덕에서 석양이 아름답게 물들었다.',
    activityKeyword: '데이트',
    probability: 0.2,
    options: [
      { text: '"같이 보자" 하며 멈춘다 🌅', effects: { charm: 5, social: 3, stress: -8 }, flavor: '석양 아래 나란히 앉은 두 사람. 완벽한 순간.' },
      { text: '사진 찍어서 SNS에 올리기', effects: { charm: 4, social: 5, stress: -3 }, flavor: '좋아요가 폭발했다. 부러움을 사는 인스타.' },
    ],
  },
];

// 17% random event chance per activity
const RANDOM_EVENTS = [
  { text: '교수님이 갑자기 퀴즈를 냈다!', effects: { knowledge: 3, stress: 5 } },
  { text: '친구가 커피를 사줬다 ☕', effects: { social: 2, stress: -3 } },
  { text: '버스를 놓쳐서 뛰어갔다...', effects: { health: -3, stress: 2 } },
  { text: '도서관에서 예쁜/멋진 사람을 봤다', effects: { charm: 1, stress: -1 } },
  { text: '편의점 세일! 돈을 아꼈다 💰', effects: { money: 5000 } },
  { text: '갑자기 비가 와서 우산을 못 챙겼다 🌧️', effects: { health: -2, stress: 3 } },
  { text: '동아리 선배가 밥을 사줬다 🍚', effects: { social: 3, money: 8000, stress: -2 } },
  { text: '수업 중에 졸다가 들켰다... 😴', effects: { knowledge: -2, stress: 5 } },
];

// Time-of-day atmosphere — changes gradient overlay and ambient text
const TIME_ATMOSPHERE: Record<string, { gradient: string; ambientText: string }> = {
  morning: {
    gradient: 'from-blue-900/40 via-navy/60 to-navy/80',
    ambientText: '아침 햇살이 캠퍼스를 비추고 있다.',
  },
  afternoon: {
    gradient: 'from-amber-900/20 via-navy/60 to-navy/80',
    ambientText: '오후의 따뜻한 햇빛이 비추고 있다.',
  },
  evening: {
    gradient: 'from-indigo-900/50 via-navy/70 to-navy/90',
    ambientText: '해가 지고 캠퍼스에 가로등이 켜졌다.',
  },
};

function getActivityBackground(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('수업') || n.includes('lecture')) return '/assets/backgrounds/classroom/daytime.png';
  if (n.includes('공부') || n.includes('study') || n.includes('도서관')) return '/assets/backgrounds/library/quiet.png';
  if (n.includes('알바') || n.includes('카페')) return '/assets/backgrounds/cafe/counter.png';
  if (n.includes('동아리') || n.includes('club')) return '/assets/backgrounds/club-room/normal.png';
  if (n.includes('데이트') || n.includes('date')) return '/assets/backgrounds/campus/sunset.png';
  if (n.includes('운동') || n.includes('exercise')) return '/assets/backgrounds/campus/day.png';
  if (n.includes('휴식') || n.includes('rest')) return '/assets/backgrounds/dorm/clean.png';
  if (n.includes('친구') || n.includes('friend')) return '/assets/backgrounds/cafe/seating.png';
  return '/assets/backgrounds/campus/day.png';
}

export default function ActionPhase({ days, currentStats, onComplete, speed = 1 }: ActionPhaseProps) {
  const [currentDayIndex, setCurrentDayIndex] = useState(-1);
  const [revealedActivities, setRevealedActivities] = useState(0);
  const [randomEvent, setRandomEvent] = useState<string | null>(null);
  const [npcEncounter, setNpcEncounter] = useState<string | null>(null);
  const [campusEncounter, setCampusEncounter] = useState<CampusEncounter | null>(null);
  const [gossip, setGossip] = useState<string | null>(null);
  const [activeChoice, setActiveChoice] = useState<MidActivityChoice | null>(null);
  const [choiceFlavor, setChoiceFlavor] = useState<string | null>(null);
  const [monologue, setMonologue] = useState<string | null>(null);
  const [runningStats, setRunningStats] = useState<PlayerStats>({ ...currentStats });
  const currentWeek = useGameStore((s) => s.currentWeek);
  const relationships = useGameStore((s) => s.relationships);
  const [gameSpeed, setGameSpeed] = useState(2);
  const [isSkipping, setIsSkipping] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Slower pacing: 2.5s per day at 2x, 4s at 1x — gives time to observe
  const dayDelay = gameSpeed === 2 ? 2500 : 4000;
  const actRevealDelay = gameSpeed === 2 ? 500 : 800;

  // processDay ref for use in choice handler (avoids block-scope issue)
  const processDayRef = useRef<(idx: number) => void>(() => {});

  const processDay = useCallback((dayIdx: number) => {
    if (dayIdx >= days.length) {
      onComplete();
      return;
    }

    setCurrentDayIndex(dayIdx);
    setRevealedActivities(0);
    setRandomEvent(null);
    setNpcEncounter(null);
    setCampusEncounter(null);
    setChoiceFlavor(null);
    setMonologue(null);

    const day = days[dayIdx];

    // Inner monologue — VN-style character thoughts
    const mainActivity = day.activities.find(a => !a.skipped);
    const evHistory = useGameStore.getState().eventHistory;
    const thought = mainActivity ? getInnerMonologue(runningStats, currentWeek + dayIdx, mainActivity.name, evHistory) : null;
    if (thought) {
      setTimeout(() => setMonologue(thought), actRevealDelay * day.activities.length + 100);
    }
    const actCount = day.activities.length;

    // Reveal activities one by one with stat ticking
    for (let i = 0; i < actCount; i++) {
      setTimeout(() => {
        setRevealedActivities(i + 1);
        // Tick running stats as each activity reveals
        const act = day.activities[i];
        if (act && !act.skipped) {
          setRunningStats(prev => {
            const next = { ...prev };
            for (const [k, v] of Object.entries(act.statEffects)) {
              if (v !== undefined) {
                const key = k as keyof PlayerStats;
                next[key] = key === 'money'
                  ? Math.max(0, next[key] + v)
                  : Math.max(0, Math.min(100, next[key] + v));
              }
            }
            return next;
          });
        }
      }, (i + 1) * actRevealDelay);
    }

    // NPC encounter check — contextual based on activity type
    const encounterTime = actCount * actRevealDelay + 300;
    setTimeout(() => {
      // Pick a random activity from today for encounter context
      const mainAct = day.activities.find(a => !a.skipped);
      if (mainAct) {
        // Try Gemini-generated contextual line first (from weekly cache)
        if (mainAct.targetNpcId) {
          const aiLine = getNpcContextualLine(mainAct.targetNpcId, currentWeek, mainAct.name);
          if (aiLine) {
            setNpcEncounter(`💬 ${aiLine}`);
          }
        }

        // Fallback to hardcoded NPC encounter lines (with week-specific overrides)
        if (!mainAct.targetNpcId || !getNpcContextualLine(mainAct.targetNpcId ?? '', currentWeek, mainAct.name)) {
          for (const [keyword, npcLines] of Object.entries(NPC_ENCOUNTER_LINES)) {
            if (mainAct.name.includes(keyword)) {
              const npcIds = Object.keys(npcLines);
              const eligible = npcIds.filter(() => Math.random() < 0.3);
              if (eligible.length > 0) {
                const npcId = eligible[0];
                // Try week-specific line first
                const weekLine = getWeekSpecificLine(keyword, npcId, currentWeek);
                if (weekLine) {
                  setNpcEncounter(weekLine);
                } else {
                  const lines = npcLines[npcId];
                  setNpcEncounter(lines[Math.floor(Math.random() * lines.length)]);
                }
              }
              break;
            }
          }
        }
      }
      // Living campus — find NPCs who are at the same location right now
      if (mainAct) {
        // Map activity name to location type
        const actLoc = mainAct.name.includes('수업') ? 'classroom'
          : mainAct.name.includes('공부') || mainAct.name.includes('도서관') ? 'library'
          : mainAct.name.includes('알바') ? 'cafe'
          : mainAct.name.includes('동아리') ? 'club_room'
          : mainAct.name.includes('운동') ? 'gym'
          : mainAct.name.includes('휴식') ? 'dorm'
          : mainAct.name.includes('친구') || mainAct.name.includes('데이트') ? 'cafeteria'
          : 'campus';
        const timeSlot = (mainAct.timeSlot === 'morning' ? 'morning' : mainAct.timeSlot === 'evening' ? 'evening' : 'afternoon') as 'morning' | 'afternoon' | 'evening';
        const nearbyNpcs = findNpcsAtLocation(actLoc, timeSlot, currentWeek);
        // Filter out targeted NPC (already shown) and pick one
        const otherNpcs = nearbyNpcs.filter(n => n.npcId !== mainAct.targetNpcId);
        if (otherNpcs.length > 0) {
          const npc = otherNpcs[0];
          setCampusEncounter({
            npcName: npc.npcName,
            npcRole: npc.activity,
            location: actLoc as 'classroom' | 'library' | 'cafeteria' | 'cafe' | 'gym' | 'club_room' | 'dorm' | 'campus_path',
            dialogue: npc.dialogue,
            mood: 'neutral',
          });
        } else {
          // Fallback to old system
          const campusEnc = generateEncounters(mainAct.name, currentWeek + dayIdx, runningStats, relationships);
          if (campusEnc.length > 0) setCampusEncounter(campusEnc[0]);
        }
      }

      // Also check for random event (lower chance since we have encounters)
      if (Math.random() < 0.08) {
        const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
        setRandomEvent(event.text);
      }

      // Show gossip/overheard on first day only
      if (dayIdx === 0) {
        const overheard = getOverheardConversation(currentWeek);
        if (overheard) {
          setGossip(overheard);
        } else {
          const g = generateGossip(currentWeek, runningStats);
          if (g) setGossip(g.text);
        }
      }

      // Check for mid-activity choice event (pauses the timer!)
      if (mainAct) {
        const eligible = MID_ACTIVITY_CHOICES.filter(c =>
          mainAct.name.includes(c.activityKeyword) && Math.random() < c.probability
        );
        if (eligible.length > 0) {
          // Pause! Show choice to player
          if (timerRef.current) clearTimeout(timerRef.current);
          setActiveChoice(eligible[0]);
          return; // Don't auto-advance — wait for player choice
        }
      }
    }, encounterTime);

    // Move to next day
    timerRef.current = setTimeout(() => processDay(dayIdx + 1), dayDelay);
  }, [days, dayDelay, actRevealDelay, onComplete]);

  // Keep ref in sync
  processDayRef.current = processDay;

  // Handle mid-activity choice selection
  const handleMidActivityChoice = useCallback((option: { text: string; effects: Partial<PlayerStats>; flavor: string }) => {
    setRunningStats(prev => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(option.effects)) {
        if (v !== undefined) {
          const key = k as keyof PlayerStats;
          next[key] = key === 'money' ? Math.max(0, next[key] + v) : Math.max(0, Math.min(100, next[key] + v));
        }
      }
      return next;
    });
    setChoiceFlavor(option.flavor);
    setActiveChoice(null);
    setTimeout(() => {
      setChoiceFlavor(null);
      processDayRef.current(currentDayIndex + 1);
    }, 2000);
  }, [currentDayIndex]);

  useEffect(() => {
    if (isSkipping) {
      if (timerRef.current) clearTimeout(timerRef.current);
      onComplete();
      return;
    }
    const timer = setTimeout(() => processDay(0), 400);
    return () => {
      clearTimeout(timer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isSkipping]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentDay = currentDayIndex >= 0 && currentDayIndex < days.length ? days[currentDayIndex] : null;
  const bgSrc = currentDay && currentDay.activities[0]
    ? getActivityBackground(currentDay.activities[0].name)
    : '/assets/backgrounds/campus/day.png';

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] bg-navy px-4 relative overflow-hidden">
      {/* Background with time-of-day atmosphere */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 opacity-20"
        style={{ backgroundImage: `url(${bgSrc})` }}
      />
      {(() => {
        const firstAct = currentDay?.activities[0];
        const timeAtmo = TIME_ATMOSPHERE[firstAct?.timeSlot ?? 'afternoon'] ?? TIME_ATMOSPHERE.afternoon;
        return <div className={`absolute inset-0 bg-gradient-to-t ${timeAtmo.gradient} transition-all duration-1000`} />;
      })()}

      {/* Speed controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-30">
        <button
          onClick={() => setGameSpeed(gameSpeed === 1 ? 2 : 1)}
          className="px-3 py-1.5 text-sm glass rounded-lg text-txt-secondary hover:text-txt-primary transition-colors"
        >
          {gameSpeed === 1 ? '×1' : '×2'}
        </button>
        <button
          onClick={() => setIsSkipping(true)}
          className="px-3 py-1.5 text-sm glass rounded-lg text-txt-secondary hover:text-txt-primary transition-colors"
        >
          건너뛰기 ⏭️
        </button>
      </div>

      {/* Day display */}
      {currentDay && (
        <div className="w-full max-w-md relative z-10 animate-fade-in">
          {/* Day header with specific location */}
          <h2 className="text-xl font-bold text-txt-primary text-center mb-1">
            {currentDay.dayName}
          </h2>
          {/* Show specific location for the first activity */}
          {currentDay.activities[0] && !currentDay.activities[0].skipped && (() => {
            const actType = currentDay.activities[0].name.includes('수업') ? 'lecture'
              : currentDay.activities[0].name.includes('공부') ? 'study'
              : currentDay.activities[0].name.includes('알바') ? 'parttime'
              : currentDay.activities[0].name.includes('운동') ? 'exercise'
              : currentDay.activities[0].name.includes('휴식') ? 'rest'
              : currentDay.activities[0].name.includes('동아리') ? 'club'
              : 'friends';
            const spot = getSpecificLocation(actType, currentWeek, currentDayIndex);
            return <p className="text-[9px] text-txt-secondary/30 text-center mb-1">📍 {spot.name}</p>;
          })()}
          {currentDayIndex === 0 && (
            <p className="text-[10px] text-txt-secondary/30 text-center mb-3">
              {currentWeek <= 3 ? '🌸 봄의 시작 — 캠퍼스가 활기를 띤다' :
               currentWeek <= 6 ? '🌿 4월의 캠퍼스 — 일상이 자리잡는 중' :
               currentWeek <= 8 ? '📝 시험 시즌 — 도서관이 붐빈다' :
               currentWeek === 9 ? '🎉 축제 주간 — 온 캠퍼스가 들뜬다' :
               currentWeek <= 11 ? '🍂 중반을 넘긴 학기 — 시간이 빠르다' :
               currentWeek <= 13 ? '❄️ 겨울이 다가온다 — 마무리의 시간' :
               '🎓 학기의 끝 — 종강이 보인다'}
            </p>
          )}

          {/* 3 activity rows */}
          <div className="flex flex-col gap-2">
            {currentDay.activities.map((activity, i) => (
              <div
                key={i}
                className={`glass-strong rounded-xl px-4 py-3 flex items-center gap-3 transition-all duration-300 ${
                  i < revealedActivities ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                } ${activity.skipped ? 'opacity-50 line-through' : ''}`}
              >
                {/* Time slot */}
                <span className="text-xs text-txt-secondary w-14 flex-shrink-0">
                  {TIME_LABELS[activity.timeSlot] ?? activity.timeSlot}
                </span>

                {/* Activity icon + name */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-lg">{activity.icon}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-txt-primary truncate">
                      {activity.skipped ? '😫 빠짐' : activity.name}
                    </span>
                    {activity.targetNpcName && !activity.skipped && (
                      <span className="text-[10px] text-pink">with {activity.targetNpcName}</span>
                    )}
                    {!activity.skipped && i < revealedActivities && (() => {
                      const flavor = activity.targetNpcName ? null : getActivityFlavorText(activity.name, currentWeek);
                      const result = getActivityResult(activity.name, currentWeek, i);
                      const text = flavor || result;
                      return text ? <span className="text-[9px] text-txt-secondary/40 italic truncate">{text}</span> : null;
                    })()}
                  </div>
                </div>

                {/* NPC portrait + affection indicator (if targeted) */}
                {activity.targetNpcId && NPC_PORTRAITS[activity.targetNpcId] && !activity.skipped ? (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {i < revealedActivities && <span className="text-[9px] text-pink font-bold">❤️</span>}
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-pink/30">
                      <Image src={NPC_PORTRAITS[activity.targetNpcId]} alt={activity.targetNpcName ?? ''} width={32} height={32} className="object-cover" />
                    </div>
                  </div>
                ) : null}

                {/* Stat chips */}
                {!activity.skipped && i < revealedActivities && (
                  <div className="flex gap-1 flex-shrink-0">
                    {Object.entries(activity.statEffects)
                      .filter(([, v]) => v !== 0)
                      .slice(0, 3)
                      .map(([key, value]) => (
                        <span
                          key={key}
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                            (key === 'stress' ? (value as number) < 0 : (value as number) > 0)
                              ? 'bg-teal/20 text-teal'
                              : 'bg-coral/20 text-coral'
                          }`}
                        >
                          {STAT_LABELS[key as keyof PlayerStats]?.[0]}{(value as number) > 0 ? '+' : ''}{value}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* NPC encounter — with portrait for targeted activities */}
          {npcEncounter && (
            <div className="mt-3 px-4 py-2.5 glass-strong rounded-xl border border-pink/20 animate-fade-in flex items-start gap-3">
              {(() => {
                // Try to find which NPC is speaking from the current day's targeted activity
                const targetNpc = currentDay?.activities.find(a => a.targetNpcId)?.targetNpcId;
                const NPC_DISPLAY: Record<string, string> = { jaemin: '재민', minji: '민지', soyeon: '소연', hyunwoo: '현우' };
                const name = targetNpc ? NPC_DISPLAY[targetNpc] : null;
                // Dynamic expression based on encounter content
                const expression = npcEncounter.includes('웃') || npcEncounter.includes('좋') || npcEncounter.includes('재밌') ? 'happy'
                  : npcEncounter.includes('걱정') || npcEncounter.includes('힘들') ? 'worried'
                  : 'neutral';
                const portrait = targetNpc ? `/assets/characters/${targetNpc}/${expression === 'worried' && targetNpc === 'jaemin' ? 'concerned' : expression === 'worried' && targetNpc === 'minji' ? 'frustrated' : expression === 'happy' && targetNpc === 'jaemin' ? 'happy' : expression === 'happy' && targetNpc === 'minji' ? 'friendly' : expression === 'happy' && targetNpc === 'soyeon' ? 'happy' : expression === 'happy' && targetNpc === 'hyunwoo' ? 'cool' : 'neutral'}.png` : null;
                return portrait ? (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-pink/30">
                      <Image src={portrait} alt={name ?? ''} width={32} height={32} className="object-cover object-top" />
                    </div>
                    <span className="text-[8px] text-pink/60 block text-center mt-0.5">{name}</span>
                  </div>
                ) : null;
              })()}
              <div className="flex-1">
                <p className="text-sm text-pink/90 leading-relaxed">{npcEncounter}</p>
              </div>
            </div>
          )}

          {/* Inner monologue — VN-style character thought */}
          {monologue && !npcEncounter && !campusEncounter && (
            <div className="mt-3 px-4 py-2 rounded-xl text-sm text-white/50 italic text-center animate-fade-in">
              💭 {monologue}
            </div>
          )}

          {/* Campus background NPC encounter — shows what they're DOING */}
          {campusEncounter && !npcEncounter && (
            <div className="mt-2 px-4 py-2.5 glass rounded-xl border border-white/5 animate-fade-in">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-txt-primary/60">{campusEncounter.npcName}</span>
                <span className="text-[9px] text-txt-secondary/30">· {campusEncounter.npcRole}</span>
              </div>
              <p className="text-xs text-txt-secondary/70 italic">&ldquo;{campusEncounter.dialogue}&rdquo;</p>
            </div>
          )}

          {/* Gossip — campus atmosphere */}
          {gossip && currentDayIndex === 0 && (
            <div className="mt-2 px-3 py-1.5 rounded-lg text-[10px] text-txt-secondary/50 italic">
              📢 {gossip}
            </div>
          )}

          {/* Random event */}
          {randomEvent && (
            <div className="mt-2 px-4 py-2 glass-strong rounded-xl text-sm text-txt-primary text-center animate-shake">
              ⚡ {randomEvent}
            </div>
          )}

          {/* Mini stat bar — shows real-time stat changes */}
          <div className="mt-4 grid grid-cols-3 gap-2 px-2">
            {([
              { key: 'knowledge' as const, label: '준비도', emoji: '📚' },
              { key: 'health' as const, label: '체력', emoji: '💚' },
              { key: 'stress' as const, label: '스트레스', emoji: '🔥' },
              { key: 'social' as const, label: '인맥', emoji: '👥' },
              { key: 'money' as const, label: '돈', emoji: '💰' },
              { key: 'charm' as const, label: '매력', emoji: '✨' },
            ]).map(({ key, label, emoji }) => {
              const val = runningStats[key];
              const prev = currentStats[key];
              const delta = val - prev;
              return (
                <div key={key} className="flex items-center gap-1 text-[10px]">
                  <span>{emoji}</span>
                  <span className="text-txt-secondary">{label}</span>
                  <span className={`font-mono font-bold ml-auto transition-all duration-300 ${
                    key === 'money'
                      ? (delta >= 0 ? 'text-teal' : 'text-coral')
                      : key === 'stress'
                        ? (delta <= 0 ? 'text-teal' : 'text-coral')
                        : (delta >= 0 ? 'text-teal' : 'text-coral')
                  }`}>
                    {key === 'money' ? `${Math.round(val / 1000)}K` : val}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mid-activity choice event — pauses the timer */}
      {activeChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="glass-strong rounded-2xl p-5 max-w-sm w-full">
            <p className="text-sm text-txt-primary mb-4 leading-relaxed">{activeChoice.prompt}</p>
            <div className="flex flex-col gap-2">
              {activeChoice.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleMidActivityChoice(opt)}
                  className="text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-teal/30 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <span className="text-sm text-txt-primary">{opt.text}</span>
                  <div className="flex gap-1.5 mt-1.5">
                    {Object.entries(opt.effects).filter(([,v]) => v !== 0).map(([k, v]) => (
                      <span key={k} className={`text-[10px] px-1.5 py-0.5 rounded ${
                        (k === 'stress' ? (v as number) < 0 : (v as number) > 0) ? 'bg-teal/10 text-teal' : 'bg-coral/10 text-coral'
                      }`}>
                        {STAT_LABELS[k as keyof PlayerStats]?.[0]}{(v as number) > 0 ? '+' : ''}{v}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Choice flavor text — shows briefly after choosing */}
      {choiceFlavor && !activeChoice && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="glass rounded-xl px-6 py-4 max-w-sm text-center animate-fade-in">
            <p className="text-sm text-txt-primary/80 italic">{choiceFlavor}</p>
          </div>
        </div>
      )}

      {/* Starting state */}
      {currentDayIndex === -1 && (
        <div className="text-center relative z-10">
          <div className="text-4xl mb-4 animate-pulse">📋</div>
          <p className="text-txt-secondary">일과 시작 중...</p>
        </div>
      )}

      {/* Progress dots (7 days) */}
      <div className="absolute bottom-8 flex gap-2 justify-center z-10">
        {days.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              i === currentDayIndex
                ? 'bg-teal scale-125'
                : i < currentDayIndex
                  ? 'bg-teal/40'
                  : 'bg-txt-secondary/20'
            }`}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
      `}</style>
    </div>
  );
}
