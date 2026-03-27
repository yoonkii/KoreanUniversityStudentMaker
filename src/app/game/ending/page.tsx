"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { useGameStore as useNewStore } from "@/stores/game-store";
import type { PlayerStats } from "@/store/types";
import { ACHIEVEMENTS } from "@/lib/achievements";

/** Determine the player archetype from final stats + relationships */
function determineArchetype(stats: PlayerStats, relationships?: Record<string, { affection: number }>): string {
  // ── Hidden/surprise endings (checked first — rare, rewarding) ──

  // "캠퍼스 커플" — dating an NPC to soulmate level
  const soulmates = relationships ? Object.entries(relationships).filter(([, r]) => r.affection >= 90) : [];
  if (soulmates.length > 0 && stats.charm >= 60) return "campus_couple";

  // "교수님의 제자" — high knowledge + prof-kim relationship
  if (stats.knowledge >= 80 && (relationships?.['prof-kim']?.affection ?? 0) >= 70) return "professors_protege";

  // "동아리 스타" — high charm + hyunwoo soulmate
  if (stats.charm >= 70 && (relationships?.['hyunwoo']?.affection ?? 0) >= 80) return "club_star";

  // "완벽한 선후배" — soyeon close friend + high knowledge
  if ((relationships?.['soyeon']?.affection ?? 0) >= 80 && stats.knowledge >= 60 && stats.social >= 60) return "perfect_mentorship";

  // "룸메 브로맨스" — jaemin soulmate + low stress
  if ((relationships?.['jaemin']?.affection ?? 0) >= 85 && stats.stress < 30) return "bromance";

  // ── Standard checks ──

  // Check for burnout (high stress, low everything)
  if (stats.stress > 80 && stats.health < 30) return "burnout";

  // Check for broke
  if (stats.money < 30000 && stats.stress > 60) return "broke";

  // Check for balanced (all stats within 20 of each other)
  const vals = [stats.knowledge, stats.health, stats.social, stats.charm];
  const range = Math.max(...vals) - Math.min(...vals);
  if (range < 20 && stats.stress < 50) return "balanced";

  const normalized: Record<string, number> = {
    scholar: stats.knowledge,
    social: stats.social,
    hustler: stats.money > 0 ? Math.min(100, stats.money / 10000) : 0,
    wellness: stats.health,
    chill: 100 - stats.stress,
    charm: stats.charm,
  };

  let maxKey = "scholar";
  let maxVal = 0;
  for (const [key, val] of Object.entries(normalized)) {
    if (val > maxVal) {
      maxKey = key;
      maxVal = val;
    }
  }

  return maxKey;
}

interface Archetype {
  ko: string;
  en: string;
  emoji: string;
  description: string;
  futureFlash: string;
}

const ARCHETYPES: Record<string, Archetype> = {
  scholar: {
    ko: "학점러",
    en: "The Scholar",
    emoji: "📚",
    description: "도서관이 제2의 집이었던 당신. 교수님들도 이름을 기억하는 모범생이 되었습니다.",
    futureFlash: "2학기에 성적 장학금을 받고, 교수님 연구실에서 학부연구생 자리를 제안받는다. 대학원 진학의 문이 열리기 시작한다.",
  },
  social: {
    ko: "인싸",
    en: "The Social Butterfly",
    emoji: "🦋",
    description: "캠퍼스 어디를 가도 아는 얼굴이 있었죠. 당신의 대학 생활은 사람들로 가득 찼습니다.",
    futureFlash: "학생회 선거에 출마하게 된다. 넓은 인맥이 자산이 되어 학교 행사를 이끌며, 졸업 후 대기업 인사팀에서 스카우트 제의가 온다.",
  },
  hustler: {
    ko: "알바왕",
    en: "The Hustler",
    emoji: "💰",
    description: "학비도 생활비도 직접 벌었습니다. 사회생활의 기초를 단단히 다진 한 학기였어요.",
    futureFlash: "카페 사장님의 추천으로 스타트업 인턴 기회를 얻는다. 현장 경험과 경제 감각이 빛을 발하며, 창업을 꿈꾸기 시작한다.",
  },
  wellness: {
    ko: "건강왕",
    en: "The Wellness King",
    emoji: "💪",
    description: "운동과 자기관리를 게을리하지 않았어요. 몸도 마음도 건강한 한 학기를 보냈습니다.",
    futureFlash: "교내 체육대회에서 두각을 나타내고, 건강한 루틴이 공부 효율까지 높여준다. 2학기에는 학점도 체력도 함께 오른다.",
  },
  chill: {
    ko: "마이웨이",
    en: "The Free Spirit",
    emoji: "🌊",
    description: "남들의 시선에 흔들리지 않고 자신만의 페이스를 지켰어요. 여유로운 대학 생활의 정석.",
    futureFlash: "방학 동안 혼자 제주도 한 달 살기를 떠난다. 그곳에서 만난 사람들과의 인연이 인생의 방향을 바꾸게 된다.",
  },
  charm: {
    ko: "매력쟁이",
    en: "The Charmer",
    emoji: "✨",
    description: "자연스러운 매력으로 모두의 시선을 사로잡았어요. 캠퍼스의 숨은 스타!",
    futureFlash: "학교 홍보 영상 모델로 발탁된다. SNS 팔로워가 늘어나며, 예상치 못한 인플루언서의 길이 열린다.",
  },
  balanced: {
    ko: "밸런스 달인",
    en: "The Well-Rounded",
    emoji: "⚖️",
    description: "학점, 인맥, 건강, 여유... 모든 걸 균형 있게 챙긴 당신은 진정한 대학생활 고수입니다.",
    futureFlash: "누구보다 안정적인 대학 생활을 이어간다. 후배들의 롤모델이 되어, 졸업할 때는 여러 기업에서 러브콜을 받는다.",
  },
  burnout: {
    ko: "번아웃 생존자",
    en: "The Burnout Survivor",
    emoji: "🔥",
    description: "힘겨운 학기였지만 포기하지 않았어요. 이 경험이 당신을 더 강하게 만들 거예요.",
    futureFlash: "방학 동안 마음을 추스르고, 상담센터의 도움으로 회복한다. 그 경험이 나중에 후배들에게 위로의 말이 된다.",
  },
  broke: {
    ko: "가난한 철학자",
    en: "The Broke Philosopher",
    emoji: "🍜",
    description: "통장은 텅 비었지만 경험은 가득! 라면의 소중함을 깨달은 한 학기였습니다.",
    futureFlash: "가성비의 달인이 된 당신은 절약 블로그를 시작한다. '대학생 월 30만원으로 살기' 글이 입소문을 타며 뜻밖의 수입이 생긴다.",
  },
  // ── Hidden Endings ──
  campus_couple: {
    ko: "캠퍼스 커플",
    en: "The Campus Couple",
    emoji: "💑",
    description: "대학에서 진정한 사랑을 찾았어요. 캠퍼스를 함께 걸으며 추억을 만든 소중한 학기.",
    futureFlash: "2학기에도 함께 수강신청을 하고, 도서관 옆자리에 앉아 공부한다. 졸업 후에도 이어질 인연의 시작이다.",
  },
  professors_protege: {
    ko: "교수님의 제자",
    en: "The Professor's Protégé",
    emoji: "🎓",
    description: "뛰어난 실력으로 교수님의 눈에 띄었어요. 학문의 길이 열리기 시작합니다.",
    futureFlash: "학부연구생으로 합류하고, 교수님의 학회 발표에 공동저자로 이름을 올린다. 대학원 추천서도 약속받는다.",
  },
  club_star: {
    ko: "동아리 스타",
    en: "The Club Star",
    emoji: "🎸",
    description: "동아리에서 없어서는 안 될 존재가 되었어요. 무대 위의 당신은 빛났습니다.",
    futureFlash: "축제 무대에서의 공연 영상이 SNS에서 화제가 된다. 외부 공연 초대가 이어지며, 진로의 새로운 가능성을 발견한다.",
  },
  perfect_mentorship: {
    ko: "완벽한 선후배",
    en: "The Perfect Mentorship",
    emoji: "🤝",
    description: "선배의 가르침과 당신의 노력이 만나 최고의 시너지를 만들었어요.",
    futureFlash: "소연 선배의 인맥으로 인턴십 기회를 얻고, 당신도 후배들에게 같은 도움을 주겠다고 결심한다. 선후배의 아름다운 전통이 이어진다.",
  },
  bromance: {
    ko: "평생 룸메",
    en: "The Lifelong Roommate",
    emoji: "🏠",
    description: "재민이와 함께한 기숙사 생활은 대학의 가장 소중한 기억이 되었어요.",
    futureFlash: "방학에도 재민이네 집에 놀러 가고, 2학기에도 같은 방을 신청한다. 졸업 후에도 가장 먼저 연락하는 친구가 된다.",
  },
};

function getLetterGrade(value: number, isMoney?: boolean): string {
  if (isMoney) {
    if (value >= 1000000) return "A+";
    if (value >= 700000) return "A";
    if (value >= 500000) return "B+";
    if (value >= 300000) return "B";
    if (value >= 100000) return "C";
    return "D";
  }
  if (value >= 90) return "A+";
  if (value >= 80) return "A";
  if (value >= 70) return "B+";
  if (value >= 60) return "B";
  if (value >= 50) return "C+";
  if (value >= 40) return "C";
  if (value >= 30) return "D+";
  return "D";
}

function getStressGrade(stress: number): string {
  // Lower stress is better
  if (stress <= 10) return "A+";
  if (stress <= 20) return "A";
  if (stress <= 35) return "B+";
  if (stress <= 50) return "B";
  if (stress <= 65) return "C";
  if (stress <= 80) return "D+";
  return "D";
}

const STAT_DISPLAY = [
  { key: "knowledge" as const, label: "준비도", icon: "📖" },
  { key: "health" as const, label: "체력", icon: "💚" },
  { key: "social" as const, label: "인맥", icon: "👥" },
  { key: "money" as const, label: "재정", icon: "💰", isMoney: true },
  { key: "stress" as const, label: "스트레스", icon: "🔥", isStress: true },
  { key: "charm" as const, label: "매력", icon: "✨" },
];

export default function EndingPage() {
  const router = useRouter();
  const hydrated = useGameStore((s) => s._hasHydrated);
  const stats = useGameStore((s) => s.stats);
  const player = useGameStore((s) => s.player);
  const relationships = useGameStore((s) => s.relationships);
  const eventHistory = useGameStore((s) => s.eventHistory);
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements);
  const examResults = useGameStore((s) => s.examResults);
  const resetGame = useGameStore((s) => s.resetGame);
  const resetNewStore = useNewStore((s) => s.resetGame);

  const [showDetails, setShowDetails] = useState(false);
  const [animStep, setAnimStep] = useState(0);
  const [showMontage, setShowMontage] = useState(true);
  const [montageIndex, setMontageIndex] = useState(0);

  // Track completion count for New Game+ bonus
  useEffect(() => {
    if (!hydrated || !player) return;
    const count = parseInt(localStorage.getItem('kusm-completions') ?? '0', 10);
    localStorage.setItem('kusm-completions', String(count + 1));
    // Also store the archetype for collection tracking
    const collection = JSON.parse(localStorage.getItem('kusm-archetypes') ?? '[]') as string[];
    if (!collection.includes(archetypeKey)) {
      collection.push(archetypeKey);
      localStorage.setItem('kusm-archetypes', JSON.stringify(collection));
    }
  }, [hydrated, player]); // eslint-disable-line react-hooks/exhaustive-deps

  const archetypeKey = determineArchetype(stats, relationships);
  const archetype = ARCHETYPES[archetypeKey] ?? ARCHETYPES.balanced;

  // Memory montage — show event highlights before main reveal
  useEffect(() => {
    if (!hydrated || !player || !showMontage) return;
    const memories = eventHistory.slice(0, 6); // max 6 memories
    if (memories.length === 0) {
      setShowMontage(false);
      return;
    }
    const interval = setInterval(() => {
      setMontageIndex((prev) => {
        if (prev >= memories.length) {
          clearInterval(interval);
          setTimeout(() => setShowMontage(false), 800);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [hydrated, player, showMontage, eventHistory]);

  // Staggered reveal animation (only after montage ends)
  useEffect(() => {
    if (!hydrated || !player || showMontage) return;
    const timers = [
      setTimeout(() => setAnimStep(1), 500),  // archetype
      setTimeout(() => setAnimStep(2), 1200), // grades
      setTimeout(() => setAnimStep(3), 1800), // stats
      setTimeout(() => setAnimStep(4), 2400), // description
      setTimeout(() => setAnimStep(5), 3000), // buttons
    ];
    return () => timers.forEach(clearTimeout);
  }, [hydrated, player, showMontage]);

  // Redirect only after hydration
  useEffect(() => {
    if (!hydrated) return;
    if (!player) router.push("/");
  }, [hydrated, player, router]);

  // Relationship summary
  const friendCount = Object.values(relationships).filter(
    (r) => r.affection >= 50
  ).length;
  const closeFriends = Object.values(relationships).filter(
    (r) => r.affection >= 70
  ).length;

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-[#0a0e1a]">
        <div className="text-6xl animate-pulse">🎓</div>
      </div>
    );
  }

  // Generate personalized semester highlights
  const highlights: { emoji: string; text: string }[] = [];

  // Stat-based highlights
  // Use exam GPA if available for highlights
  const semGpa = examResults?.semesterGpa;
  if (semGpa && semGpa >= 3.5) highlights.push({ emoji: '🏆', text: `학기 GPA ${semGpa.toFixed(2)} — 장학금 후보에 오를 만큼 뛰어난 성적을 받았다.` });
  else if (semGpa && semGpa < 2.0) highlights.push({ emoji: '😰', text: `학기 GPA ${semGpa.toFixed(2)} — 학사경고의 그림자가 드리웠던 학기였다.` });
  else if (stats.knowledge >= 80) highlights.push({ emoji: '🏆', text: '꾸준한 공부로 시험 준비가 완벽했다.' });
  else if (stats.knowledge <= 30) highlights.push({ emoji: '😰', text: '시험 준비가 부족했던 학기였다.' });

  if (stats.social >= 70) highlights.push({ emoji: '🎭', text: '캠퍼스 곳곳에서 인사하는 사람이 생겼다.' });
  else if (stats.social <= 20) highlights.push({ emoji: '🌙', text: '혼자만의 시간이 많았던 조용한 학기였다.' });

  if (stats.charm >= 70) highlights.push({ emoji: '💫', text: '어딜 가든 시선을 끄는 매력의 소유자가 되었다.' });

  if (stats.money >= 1000000) highlights.push({ emoji: '💎', text: '알바의 신이 되어 통장 잔고가 두둑해졌다.' });
  else if (stats.money <= 50000) highlights.push({ emoji: '🍜', text: '학기 말에는 라면으로 버텨야 했다.' });

  if (stats.stress >= 80) highlights.push({ emoji: '🔥', text: '번아웃 직전까지 갔지만 끝까지 포기하지 않았다.' });
  else if (stats.stress <= 20) highlights.push({ emoji: '🧘', text: '마음의 평화를 유지하며 여유로운 학기를 보냈다.' });

  if (stats.health >= 85) highlights.push({ emoji: '💪', text: '꾸준한 운동으로 체력이 크게 향상되었다.' });
  else if (stats.health <= 25) highlights.push({ emoji: '🤒', text: '무리한 일정에 몸이 많이 상했다.' });

  // Relationship-based highlights
  if (closeFriends >= 2) highlights.push({ emoji: '💕', text: '평생 갈 절친을 만든 학기였다.' });
  else if (friendCount === 0) highlights.push({ emoji: '🚶', text: '깊은 관계를 맺지 못한 것이 아쉬움으로 남는다.' });

  // Event count highlight
  if (eventHistory.length >= 10) highlights.push({ emoji: '📸', text: '매주가 이벤트였던 정신없이 바쁜 학기!' });

  // Cap at 4 highlights for clean display
  const displayHighlights = highlights.slice(0, 4);

  // Dream vs Reality comparison
  const DREAM_INFO: Record<string, { label: string; emoji: string; matchArchetypes: string[] }> = {
    scholar: { label: '학자의 꿈', emoji: '🎓', matchArchetypes: ['scholar'] },
    social: { label: '인맥왕', emoji: '🤝', matchArchetypes: ['social', 'charm'] },
    balance: { label: '갓생러', emoji: '⚖️', matchArchetypes: ['balanced'] },
    freedom: { label: '마이웨이', emoji: '🌊', matchArchetypes: ['chill', 'charm'] },
  };
  const playerDream = player?.dream;
  const dreamInfo = playerDream ? DREAM_INFO[playerDream] : null;
  const dreamAchieved = dreamInfo?.matchArchetypes.includes(archetypeKey) ?? false;

  if (!player) return null;

  // Memory montage screen
  if (showMontage) {
    const memories = eventHistory.slice(0, 6);
    return (
      <div className="min-h-[100dvh] bg-[#0a0e1a] flex items-center justify-center p-4" onClick={() => setShowMontage(false)}>
        <div className="text-center max-w-md">
          {memories.slice(0, montageIndex).map((ev, i) => (
            <div
              key={i}
              className="mb-4 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className="text-white/20 text-xs">{ev.week}주차</span>
              <p className="text-white/50 text-sm leading-relaxed">{ev.summary}</p>
              {ev.choiceMade && (
                <p className="text-teal-400/40 text-xs mt-0.5">→ {ev.choiceMade}</p>
              )}
            </div>
          ))}
          {montageIndex <= memories.length && (
            <p className="text-white/15 text-xs mt-8 animate-pulse">추억이 스쳐 지나간다...</p>
          )}
        </div>
        <style jsx>{`
          @keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; opacity: 0; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-[#0a0e1a] via-[#1a1040] to-[#2a1535] flex items-start sm:items-center justify-center p-4 py-8 sm:py-4 overflow-y-auto">
      <div className="w-full max-w-2xl flex flex-col gap-4 sm:gap-6">
        {/* Epilogue text — cinematic bridge */}
        <div
          className={`text-center transition-all duration-1500 ${
            animStep >= 0 ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="text-sm text-white/30 leading-relaxed italic">
            16주가 지나갔다. 벚꽃이 흩날리던 캠퍼스는 어느새 녹음이 짙어졌다.
            <br />
            {player.name}의 1학기가 끝났다.
          </p>
        </div>

        {/* Header — archetype reveal */}
        <div
          className={`text-center transition-all duration-1000 ${
            animStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="text-5xl sm:text-7xl mb-2 sm:mb-3">{archetype.emoji}</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">{archetype.ko}</h1>
          <p className="text-sm sm:text-lg text-white/50">{archetype.en}</p>
          <p className="text-white/70 mt-2">
            {player.name} · {player.major === "engineering" ? "공대" : player.major === "business" ? "경영" : player.major === "humanities" ? "인문" : "예체능"}
          </p>
        </div>

        {/* Dream vs Reality */}
        {dreamInfo && (
          <div
            className={`rounded-2xl p-5 transition-all duration-1000 ${dreamAchieved ? 'bg-teal-500/10 border border-teal-500/20' : 'bg-white/5 border border-white/10'} ${animStep >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 mb-1">입학 때의 꿈</p>
                <p className="text-sm text-white/70">{dreamInfo.emoji} {dreamInfo.label}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/40 mb-1">결과</p>
                <p className="text-sm text-white/70">{archetype.emoji} {archetype.ko}</p>
              </div>
            </div>
            <div className={`mt-3 pt-3 border-t ${dreamAchieved ? 'border-teal-500/20' : 'border-white/10'}`}>
              <p className={`text-sm font-medium text-center ${dreamAchieved ? 'text-teal-400' : 'text-white/50'}`}>
                {dreamAchieved
                  ? '✨ 꿈을 이루었습니다! 입학 때의 목표를 달성했어요.'
                  : `예상과 다른 길을 걸었지만, 그것도 나쁘지 않은 결과입니다.`}
              </p>
            </div>
          </div>
        )}

        {/* Report Card */}
        <div
          className={`bg-white/10 backdrop-blur-md rounded-2xl p-5 transition-all duration-1000 ${
            animStep >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h3 className="text-sm font-bold text-white/60 mb-4">최종 성적표</h3>
          {/* Semester GPA from exam results */}
          {examResults?.semesterGpa && (
            <div className="flex items-center justify-center gap-3 mb-4 p-3 bg-gold/10 rounded-xl border border-gold/20">
              <span className="text-gold text-sm font-medium">학기 GPA</span>
              <span className="text-2xl font-bold text-gold">{examResults.semesterGpa.toFixed(2)}</span>
              <span className="text-white/40 text-sm">/ 4.50</span>
              {examResults.midtermGpa && (
                <span className="text-xs text-white/30 ml-2">
                  (중간 {examResults.midtermGpa.toFixed(2)}{examResults.finalsGpa ? ` · 기말 ${examResults.finalsGpa.toFixed(2)}` : ''})
                </span>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {STAT_DISPLAY.map(({ key, label, icon, isMoney, isStress }) => {
              const grade = isStress
                ? getStressGrade(stats[key])
                : getLetterGrade(stats[key], isMoney);
              const gradeColor =
                grade.startsWith("A") ? "text-teal-400" :
                grade.startsWith("B") ? "text-blue-400" :
                grade.startsWith("C") ? "text-yellow-400" : "text-red-400";
              return (
                <div
                  key={key}
                  className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2"
                >
                  <span className="text-sm text-white/70">
                    {icon} {label}
                  </span>
                  <span className={`font-bold text-lg ${gradeColor}`}>
                    {grade}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Final Stats */}
        <div
          className={`bg-white/10 backdrop-blur-md rounded-2xl p-5 transition-all duration-1000 ${
            animStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h3 className="text-sm font-bold text-white/60 mb-4">최종 능력치</h3>
          <div className="flex flex-col gap-3">
            {STAT_DISPLAY.map(({ key, label, isMoney }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-sm text-white/60 w-20">{label}</span>
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-teal-300 rounded-full transition-all duration-1000"
                    style={{
                      width: `${isMoney ? Math.min(100, stats[key] / 10000) : stats[key]}%`,
                    }}
                  />
                </div>
                <span className="text-sm text-white/80 w-16 text-right font-mono">
                  {isMoney
                    ? `₩${stats[key].toLocaleString("ko-KR")}`
                    : stats[key]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        {unlockedAchievements.length > 0 && (
          <div
            className={`bg-white/10 backdrop-blur-md rounded-2xl p-5 transition-all duration-1000 ${
              animStep >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h3 className="text-sm font-bold text-white/60 mb-3">
              달성한 업적 ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {ACHIEVEMENTS.map((a) => {
                const unlocked = unlockedAchievements.includes(a.id);
                return (
                  <div
                    key={a.id}
                    className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 ${
                      unlocked
                        ? "bg-gold/20 text-gold border border-gold/30"
                        : "bg-white/5 text-white/20 border border-white/5"
                    }`}
                    title={a.description}
                  >
                    <span>{unlocked ? a.emoji : "🔒"}</span>
                    <span>{a.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Archetype description */}
        <div
          className={`bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 transition-all duration-1000 ${
            animStep >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-white/90 leading-relaxed text-lg">
            {archetype.description}
          </p>

          {/* Personalized semester narrative — YOUR story */}
          {(() => {
            const name = player?.name ?? '학생';
            const lines: string[] = [];

            // Opening
            lines.push(`${name}의 1학기는 그렇게 지나갔다.`);

            // Relationship highlights
            const bestFriend = Object.entries(relationships)
              .filter(([, r]) => r.affection >= 60)
              .sort(([, a], [, b]) => b.affection - a.affection)[0];
            const NPC_KO: Record<string, string> = { jaemin: '재민', minji: '민지', soyeon: '소연 선배', hyunwoo: '현우 선배' };
            if (bestFriend) {
              const bfName = NPC_KO[bestFriend[0]] ?? bestFriend[0];
              if (bestFriend[1].affection >= 85) {
                lines.push(`${bfName}과(와)의 우정은 학기의 가장 소중한 선물이었다.`);
              } else {
                lines.push(`${bfName}과(와) 함께한 시간이 기억에 남는다.`);
              }
            }

            // Stat journey highlights
            const startStats = useGameStore.getState().startingStats;
            if (startStats) {
              const knowledgeGain = stats.knowledge - startStats.knowledge;
              if (knowledgeGain >= 40) lines.push('처음엔 아무것도 몰랐지만, 이제는 자신감이 생겼다.');
              else if (knowledgeGain >= 20) lines.push('조금씩이지만, 확실히 성장하고 있다는 걸 느꼈다.');
            }

            if (stats.stress > 70) lines.push('쉽지 않은 학기였다. 하지만 포기하지 않았다.');
            else if (stats.stress < 30) lines.push('여유로운 학기였다. 나만의 페이스를 찾았다.');

            if (stats.money > 500000) lines.push('경제적으로도 안정을 찾았다.');
            else if (stats.money < 50000) lines.push('통장은 빈약했지만, 그래도 버텨냈다.');

            // Event count
            if (eventHistory.length >= 15) lines.push('수많은 순간들이 추억이 되어 가슴에 남았다.');
            else if (eventHistory.length >= 8) lines.push('하나하나가 소중한 기억들이다.');

            // Closing
            lines.push('이제 방학이다. 다음 학기에는 어떤 이야기가 기다리고 있을까.');

            return (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-white/50 leading-relaxed italic">
                  {lines.join(' ')}
                </p>
              </div>
            );
          })()}

          {/* Future flash — what happens next */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-white/40 mb-1.5">그 후...</p>
            <p className="text-sm text-white/60 leading-relaxed italic">
              {archetype.futureFlash}
            </p>
          </div>

          {/* Relationship and event summary */}
          {(friendCount > 0 || eventHistory.length > 0) && (
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-4 text-sm text-white/60">
              {friendCount > 0 && (
                <span>
                  👥 친구 {friendCount}명{closeFriends > 0 && ` (절친 ${closeFriends}명)`}
                </span>
              )}
              {eventHistory.length > 0 && (
                <span>📖 추억 {eventHistory.length}개</span>
              )}
            </div>
          )}

          {/* NPC-specific memories */}
          {(() => {
            const NPC_MEMORIES: Record<string, { high: string; mid: string }> = {
              soyeon: { high: '소연 선배와 나눈 진심 어린 대화들이 오래 기억에 남을 것 같다.', mid: '소연 선배의 따뜻한 조언이 힘이 됐다.' },
              jaemin: { high: '재민이와 함께한 기숙사 생활. 평생 잊지 못할 친구다.', mid: '같은 과 재민이와 많은 추억을 쌓았다.' },
              minji: { high: '민지. 라이벌이었지만, 서로를 가장 잘 이해하는 사이가 됐다.', mid: '민지와의 건전한 경쟁이 나를 성장시켰다.' },
              hyunwoo: { high: '현우 선배와 동아리에서 보낸 시간. 진짜 "대학 생활"이었다.', mid: '현우 선배 덕분에 동아리 활동이 즐거웠다.' },
            };
            const memories: string[] = [];
            for (const [id, texts] of Object.entries(NPC_MEMORIES)) {
              const rel = relationships[id];
              if (!rel) continue;
              if (rel.affection >= 70) memories.push(texts.high);
              else if (rel.affection >= 40) memories.push(texts.mid);
            }
            if (memories.length === 0) return null;
            return (
              <div className="mt-3 flex flex-col gap-1.5">
                {memories.slice(0, 2).map((mem, i) => (
                  <p key={i} className="text-xs text-white/40 italic">— {mem}</p>
                ))}
              </div>
            );
          })()}

          {/* Expandable event history */}
          {eventHistory.length > 0 && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mt-3 text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              {showDetails ? "접기 ▲" : "추억 돌아보기 ▼"}
            </button>
          )}
          {showDetails && eventHistory.length > 0 && (
            <div className="mt-3 flex flex-col gap-2 max-h-48 overflow-y-auto">
              {eventHistory.map((ev, i) => (
                <div
                  key={i}
                  className="text-sm text-white/50 bg-white/5 rounded-lg px-3 py-2"
                >
                  <span className="text-white/30 mr-2">{ev.week}주차</span>
                  {ev.summary}
                  {ev.choiceMade && (
                    <span className="text-teal-400/60 ml-2">→ {ev.choiceMade}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Semester highlights */}
        {displayHighlights.length > 0 && (
          <div
            className={`bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 transition-all duration-1000 ${
              animStep >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h3 className="text-sm font-bold text-white/60 mb-3">학기 하이라이트</h3>
            <div className="flex flex-col gap-2">
              {displayHighlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="text-base flex-shrink-0">{h.emoji}</span>
                  <span className="text-white/70 leading-relaxed">{h.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Growth comparison — before/after stats */}
        {(() => {
          const startingStats = useGameStore.getState().startingStats;
          if (!startingStats) return null;
          const GROWTH_STATS: { key: keyof import('@/store/types').PlayerStats; label: string; emoji: string }[] = [
            { key: 'knowledge', label: '준비도', emoji: '📚' },
            { key: 'health', label: '체력', emoji: '💚' },
            { key: 'social', label: '인맥', emoji: '👥' },
            { key: 'charm', label: '매력', emoji: '✨' },
            { key: 'stress', label: '스트레스', emoji: '🔥' },
          ];
          return (
            <div
              className={`bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 transition-all duration-1000 ${
                animStep >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <h3 className="text-sm font-bold text-white/60 mb-3">📊 성장 기록</h3>
              <div className="flex flex-col gap-2">
                {GROWTH_STATS.map(({ key, label, emoji }) => {
                  const start = startingStats[key];
                  const end = stats[key];
                  const delta = end - start;
                  const isGood = key === 'stress' ? delta < 0 : delta > 0;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-sm w-5">{emoji}</span>
                      <span className="text-xs text-white/50 w-16">{label}</span>
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-xs text-white/30 w-8 text-right">{key === 'money' ? `${Math.round(start/10000)}만` : start}</span>
                        <span className="text-white/20">→</span>
                        <span className="text-xs text-white/70 w-8">{key === 'money' ? `${Math.round(end/10000)}만` : end}</span>
                        <span className={`text-xs font-bold ${isGood ? 'text-teal' : 'text-coral'}`}>
                          ({delta > 0 ? '+' : ''}{delta})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Replay teaser — other paths */}
        <div
          className={`bg-white/[0.03] backdrop-blur-md rounded-2xl p-5 border border-white/5 transition-all duration-1000 ${
            animStep >= 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-xs text-white/30 mb-3">다른 가능성이 있었을지도...</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ARCHETYPES)
              .filter(([key]) => key !== archetypeKey)
              .slice(0, 4)
              .map(([key, arch]) => (
                <div key={key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-white/25 text-xs">
                  <span>{arch.emoji}</span>
                  <span>{arch.ko}</span>
                  <span className="text-white/15">?</span>
                </div>
              ))}
          </div>
        </div>

        {/* Play record */}
        <div
          className={`flex justify-center gap-6 text-center transition-all duration-1000 ${
            animStep >= 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div>
            <div className="text-lg font-bold text-white">{eventHistory.length}</div>
            <div className="text-[10px] text-white/30">추억</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">{unlockedAchievements.length}</div>
            <div className="text-[10px] text-white/30">업적</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">{friendCount}</div>
            <div className="text-[10px] text-white/30">친구</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">{closeFriends}</div>
            <div className="text-[10px] text-white/30">절친</div>
          </div>
        </div>

        {/* Action buttons */}
        <div
          className={`flex flex-col gap-3 transition-all duration-1000 ${
            animStep >= 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <button
            onClick={() => {
              resetGame();
              resetNewStore();
              router.push("/");
            }}
            className="w-full py-4 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-xl font-bold text-lg text-white border border-white/20 transition-all active:scale-[0.98]"
          >
            새 학기 시작하기
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 text-white/50 hover:text-white/80 text-sm transition-colors"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
