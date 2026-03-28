'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
// Note: new store (stores/game-store) available for future Sprint 3-6 engine integration
import { simulateWeek } from '@/lib/gameEngine';
import { ACTIVITIES } from '@/data/activities';
// calculateTension available if needed for legacy AI path
import HUDBar from '@/components/game/HUDBar';
import StatsSidebar from '@/components/game/StatsSidebar';
import SchedulePlanner from '@/components/game/SchedulePlanner';
import ActionPhase from '@/components/game/ActionPhase';
import SceneRenderer from '@/components/vn/SceneRenderer';
import WeekSummary from '@/components/game/WeekSummary';
import PrologueSequence from '@/components/game/PrologueSequence';
import SugangsincheongEvent from '@/components/game/SugangsincheongEvent';
import FestivalEvent from '@/components/game/FestivalEvent';
import ExamEvent from '@/components/game/ExamEvent';
import MTEvent from '@/components/game/MTEvent';
import KakaoMessages, { generateKakaoMessages } from '@/components/game/KakaoMessages';
import WeeklyOverview from '@/components/game/WeeklyOverview';
import WeekTitleCard from '@/components/game/WeekTitleCard';
import ScheduleViewer from '@/components/game/ScheduleViewer';
import RelationshipPanel from '@/components/game/RelationshipPanel';
import PauseMenu from '@/components/game/PauseMenu';
import CrisisEvent, { detectCrisis } from '@/components/game/CrisisEvent';
import OrientationEvent from '@/components/game/OrientationEvent';
import type { Choice, PlayerStats, Scene, WeekSchedule, DayKey } from '@/store/types';
import type { DayGroup } from '@/components/game/ActionPhase';
// NPC engine imports available for future AI integration
// import { initializeNPCs } from '@/engine/data/npc-initializer';
// import { CORE_NPC_SHEETS } from '@/engine/data/core-npcs';
import { checkAchievements } from '@/lib/achievements';
import { triggerDialogueGeneration } from '@/lib/weeklyDialogueCache';
import { triggerNarrationGeneration } from '@/lib/activityNarrationCache';
import { triggerAiCampusGeneration, getOverheardConversation } from '@/lib/livingCampus';

export default function GameScreen() {
  const router = useRouter();
  const {
    phase,
    setPhase,
    player,
    stats,
    currentWeek,
    currentSceneIndex,
    setCurrentSceneIndex,
    schedule: currentSchedule,
    sceneQueue,
    setSceneQueue,
    setWeekStatDeltas,
    updateStats,
    updateRelationship,
    relationships,
    advanceWeek,
  } = useGameStore();

  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const hydrated = useGameStore((s) => s._hasHydrated);
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup abort controller on unmount
  useEffect(() => { return () => { abortRef.current?.abort(); }; }, []);

  // ESC key toggles pause menu
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowPauseMenu((prev) => !prev);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const [prologueDone, setPrologueDone] = useState(false);
  const [otDone, setOTDone] = useState(false); // Orientation before 수강신청
  const [sugangsincheongDone, setSugangsincheongDone] = useState(false);
  const [mtDone, setMTDone] = useState(false);
  const [festivalDone, setFestivalDone] = useState(false);
  const [examDone, setExamDone] = useState(false);
  const [crisisDismissed, setCrisisDismissed] = useState(false);
  const [showWeeklyOverview, setShowWeeklyOverview] = useState(false);
  const [showWeekTitle, setShowWeekTitle] = useState(true); // show on first load
  const [showScheduleViewer, setShowScheduleViewer] = useState(false);
  const [showRelationships, setShowRelationships] = useState(false);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showActionPhase, setShowActionPhase] = useState(false);
  const [actionDays, setActionDays] = useState<DayGroup[]>([]);
  const [kakaoMessages, setKakaoMessages] = useState<{senderId:string;senderName:string;text:string;timestamp:string;isRead:boolean}[]>([]);
  const [showKakao, setShowKakao] = useState(false);

  // Redirect if no player (only after hydration)
  useEffect(() => {
    if (!hydrated) return;
    if (!player) {
      router.push('/');
    }
  }, [hydrated, player, router]);

  // After action phase completes, proceed to scenes or summary
  const pendingScenesRef = useRef<Scene[]>([]);
  const pendingScheduleRef = useRef<WeekSchedule | null>(null);

  const handleActionComplete = useCallback(async () => {
    setShowActionPhase(false);
    const hardcodedScenes = pendingScenesRef.current;
    const confirmedSchedule = pendingScheduleRef.current;

    // Try AI contextual scene first (references actual schedule), fall back to hardcoded
    if (confirmedSchedule) {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      setIsLoadingAI(true);

      let aiScene: Scene | null = null;
      try {
        const ctxRes = await fetch('/api/ai/contextual-scene', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            schedule: confirmedSchedule,
            playerStats: stats,
            currentWeek,
            relationships,
          }),
        });
        if (ctxRes.ok) {
          aiScene = await ctxRes.json();
        }
      } catch {
        // AI unavailable — will fall back to hardcoded
      }

      clearTimeout(timeoutId);
      setIsLoadingAI(false);
      if (controller.signal.aborted) return;

      if (aiScene) {
        // AI scene succeeded — use it (schedule-contextual, unique each time)
        setSceneQueue([aiScene]);
        setPhase('simulation');
        return;
      }
    }

    // Fallback: use hardcoded scenes
    if (hardcodedScenes.length > 0) {
      setSceneQueue(hardcodedScenes);
      setPhase('simulation');
    } else {
      // No scenes at all — go to summary
      updateStats(useGameStore.getState().weekStatDeltas);
      setPhase('summary');
    }
  }, [stats, relationships, currentWeek, setSceneQueue, setPhase, updateStats]);

  // Handle schedule completion -- simulate the week
  const handleScheduleComplete = useCallback(async (confirmedSchedule: WeekSchedule) => {
    if (isLoadingAI) return; // prevent double-submit

    const { statDeltas, scenes, combos, weeklyEvent, npcInteractions, dateOutcomes, friendOutcomes } = simulateWeek(
      confirmedSchedule, currentWeek, stats, { relationships },
    );
    setWeekStatDeltas(statDeltas);
    useGameStore.getState().setWeekCombos(combos);
    useGameStore.getState().setWeeklyEvent(weeklyEvent);
    setCurrentSceneIndex(0);

    // Snapshot relationships before changes (for tier milestone detection in WeekSummary)
    const currentRels = useGameStore.getState().relationships;
    const prevSnapshot: Record<string, import('@/store/types').CharacterRelationship> = {};
    for (const [id, rel] of Object.entries(currentRels)) {
      prevSnapshot[id] = { ...rel };
    }
    useGameStore.setState({ previousRelationships: prevSnapshot });

    // Apply NPC friendship/romance bumps from social activities + add memories
    const ACTIVITY_MEMORIES: Record<string, string> = {
      friends: 'hangout', date: 'date', club: 'club_together', study: 'studied_together',
    };
    for (const [npcId, gains] of Object.entries(npcInteractions)) {
      if (gains.friendship > 0) updateRelationship(npcId, gains.friendship, 'friendship');
      if (gains.romance > 0) updateRelationship(npcId, gains.romance, 'romance');
      // Find what activity triggered this interaction
      for (const day of Object.values(confirmedSchedule)) {
        for (const slot of day) {
          if (slot.targetNpcId === npcId && ACTIVITY_MEMORIES[slot.activityId]) {
            useGameStore.getState().addNpcMemory(npcId, `${ACTIVITY_MEMORIES[slot.activityId]}_w${currentWeek}`);
          }
        }
      }
    }

    // Build day-grouped activity list for ActionPhase (all 3 activities per day, 7 days)
    const ACTIVITY_EMOJI: Record<string, string> = {
      lecture: '📖', study: '📚', parttime: '💼', club: '🎵',
      date: '💕', exercise: '🏃', rest: '😴', friends: '👫',
    };
    const NPC_NAMES: Record<string, string> = {
      jaemin: '이재민', minji: '한민지', soyeon: '박소연', hyunwoo: '정현우',
    };
    const DAY_NAMES = ['월요일','화요일','수요일','목요일','금요일','토요일','일요일'];
    const DAY_ORDER: DayKey[] = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    const dayGroups: DayGroup[] = [];
    for (let i = 0; i < DAY_ORDER.length; i++) {
      const day = DAY_ORDER[i];
      const daySlots = confirmedSchedule[day] ?? [];
      if (daySlots.length === 0) continue;
      const activities = daySlots.map((slot) => {
        const act = ACTIVITIES[slot.activityId];
        // Use NPC-specific effects if targeting an NPC
        let effects = act?.statEffects ?? {};
        if (slot.targetNpcId && act?.npcVariants) {
          const variant = act.npcVariants.find(v => v.npcId === slot.targetNpcId);
          if (variant) effects = variant.statEffects;
        }
        // Find date/friend outcome for this specific NPC+day combo
        const dateOutcome = slot.activityId === 'date' && slot.targetNpcId
          ? dateOutcomes.find(d => d.npcId === slot.targetNpcId && d.day === day)
          : undefined;
        const friendOutcome = slot.activityId !== 'date' && slot.targetNpcId
          ? friendOutcomes.find(f => f.npcId === slot.targetNpcId && f.day === day)
          : undefined;
        return {
          name: act?.name ?? slot.activityId,
          icon: ACTIVITY_EMOJI[slot.activityId] ?? '📋',
          timeSlot: slot.timeSlot,
          statEffects: effects,
          targetNpcId: slot.targetNpcId,
          targetNpcName: slot.targetNpcId ? NPC_NAMES[slot.targetNpcId] : undefined,
          dateOutcome: dateOutcome ? { type: dateOutcome.type, reason: dateOutcome.reason, romanceGain: dateOutcome.romanceGain } : undefined,
          friendOutcome: friendOutcome ? { type: friendOutcome.type, friendshipGain: friendOutcome.friendshipGain } : undefined,
        };
      });
      dayGroups.push({ dayName: DAY_NAMES[i], activities });
    }

    // Store pending data for after action phase
    pendingScenesRef.current = scenes;
    pendingScheduleRef.current = confirmedSchedule;

    if (dayGroups.length > 0) {
      setActionDays(dayGroups);
      setShowActionPhase(true);
      // Trigger Gemini narration generation in background
      triggerNarrationGeneration(dayGroups, currentWeek, stats, relationships);
    } else if (scenes.length > 0) {
      setSceneQueue(scenes);
      setPhase('simulation');
    } else {
      updateStats(statDeltas);
      setPhase('summary');
    }
  }, [currentWeek, stats, relationships, setWeekStatDeltas, setCurrentSceneIndex, setPhase, updateStats, isLoadingAI]);

  // Handle scene end -- move to next scene or summary
  const handleSceneEnd = useCallback((choice?: Choice) => {
    const scene = sceneQueue[currentSceneIndex];

    // Apply choice effects
    if (choice) {
      updateStats(choice.statEffects);
      choice.relationshipEffects?.forEach(({ characterId, change, type }) => {
        updateRelationship(characterId, change, type ?? 'friendship');
      });
    }

    // Record event in history for AI memory
    if (scene) {
      const summary = scene.dialogue?.[0]?.text?.slice(0, 80) ?? scene.location;
      const npcInvolved = scene.characters?.[0]?.characterId;
      useGameStore.getState().addEventHistory({ week: currentWeek, summary, npcInvolved, choiceMade: choice?.text });
    }

    const nextIndex = currentSceneIndex + 1;
    if (nextIndex < sceneQueue.length) {
      setCurrentSceneIndex(nextIndex);
    } else {
      // All scenes done -- apply weekly stat deltas and show summary
      const weekDeltas = useGameStore.getState().weekStatDeltas;
      updateStats(weekDeltas);

      // Check for newly unlocked achievements
      const store = useGameStore.getState();
      const newAch = checkAchievements(store.stats, store.relationships, currentWeek, store.unlockedAchievements);
      for (const a of newAch) {
        store.addUnlockedAchievement(a.id, a.title, a.emoji);
      }

      setPhase('summary');
    }
  }, [currentSceneIndex, sceneQueue, currentWeek, setCurrentSceneIndex, updateStats, updateRelationship, setPhase]);

  // Handle KakaoTalk dismiss → apply reply effects, then advance week (or go to ending)
  const handleKakaoDismiss = useCallback((replyData?: { repliedTo: string; affectionChange: number; affectionType: 'friendship' | 'romance'; statEffects?: Partial<import('@/store/types').PlayerStats>; ignoredNpcs: string[] }) => {
    setShowKakao(false);
    setKakaoMessages([]);

    if (replyData) {
      // Apply friendship or romance change for the NPC we replied to
      updateRelationship(replyData.repliedTo, replyData.affectionChange, replyData.affectionType);
      // Apply stat effects (e.g. money cost, stress relief)
      if (replyData.statEffects) {
        updateStats(replyData.statEffects);
      }
      // Ignored NPCs lose a small amount of affection
      for (const npcId of replyData.ignoredNpcs) {
        updateRelationship(npcId, -1);
      }
    }

    if (currentWeek >= 16) {
      router.push('/game/ending');
    } else {
      setShowWeeklyOverview(true);
    }
  }, [currentWeek, router, updateRelationship, updateStats]);

  // Handle week advance — NPC KakaoTalk messages (romance-aware)
  const handleWeekContinue = useCallback(() => {
    const msgs = generateKakaoMessages(currentWeek, relationships, stats);
    if (currentWeek >= 16) {
      router.push('/game/ending');
    } else if (msgs.length > 0) {
      setKakaoMessages(msgs);
      setShowKakao(true);
    } else {
      setShowWeeklyOverview(true);
    }
  }, [relationships, currentWeek, router, stats]);

  const goalWarnings = useGameStore((state) => state.goalWarnings);
  const tierNotification = useGameStore((state) => state.tierNotification);
  const clearTierNotification = useGameStore((state) => state.clearTierNotification);
  const newAchievements = useGameStore((state) => state.newAchievements);

  // All hooks MUST be above this line — React requires stable hook order
  if (!hydrated) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-navy">
        <div className="animate-spin w-12 h-12 border-4 border-teal border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!player) return null;

  const showPrologue = currentWeek === 1 && !prologueDone;
  const showOT = currentWeek === 1 && prologueDone && !otDone;
  const showSugangsincheong = currentWeek === 1 && prologueDone && otDone && !sugangsincheongDone;
  const showMT = currentWeek === 4 && !mtDone;
  const showFestival = currentWeek === 9 && !festivalDone;
  const showExam = (currentWeek === 7 || currentWeek === 14) && !examDone;
  const hasCrisis = !crisisDismissed && detectCrisis(stats, currentWeek, relationships) !== null;
  const currentScene = sceneQueue[currentSceneIndex];

  // Stress visual intensity: subtle red vignette when stress > 60
  const stressIntensity = Math.max(0, (stats.stress - 60) / 40); // 0 at 60, 1 at 100

  // Visual effects based on character state
  const healthDesaturation = stats.health < 30 ? `saturate(${0.4 + (stats.health / 30) * 0.6})` : undefined;
  const stressShake = stats.stress >= 90 ? 'animate-subtle-shake' : '';

  return (
    <div className={`min-h-[100dvh] bg-navy relative ${stressShake}`} style={healthDesaturation ? { filter: healthDesaturation } : undefined}>
      {/* Semester phase ambient glow — subtle color shift by season */}
      <div className="fixed inset-0 pointer-events-none z-0 transition-all duration-1000" style={{
        background: currentWeek <= 3 ? 'radial-gradient(ellipse at 50% 0%, rgba(245,160,181,0.04) 0%, transparent 60%)' // 봄 — cherry blossom pink
          : currentWeek <= 6 ? 'radial-gradient(ellipse at 50% 0%, rgba(78,205,196,0.03) 0%, transparent 60%)' // 초여름 — fresh teal
          : currentWeek <= 8 ? 'radial-gradient(ellipse at 50% 0%, rgba(255,107,107,0.04) 0%, transparent 60%)' // 시험 — tense red
          : currentWeek === 9 ? 'radial-gradient(ellipse at 50% 0%, rgba(255,209,102,0.05) 0%, transparent 60%)' // 축제 — warm gold
          : currentWeek <= 13 ? 'radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.03) 0%, transparent 60%)' // 가을 — lavender
          : 'radial-gradient(ellipse at 50% 0%, rgba(255,107,107,0.05) 0%, transparent 60%)', // 기말 — intense red
      }} />
      {/* Save indicator */}
      {showSaveIndicator && (
        <div className="fixed bottom-4 right-4 z-50 px-3 py-1.5 rounded-lg bg-teal/20 text-teal text-xs font-medium backdrop-blur-sm border border-teal/20 animate-fade-in-up">
          💾 {currentWeek}주차 저장됨
        </div>
      )}

      {/* Stress vignette overlay */}
      {stressIntensity > 0 && (
        <div
          className="fixed inset-0 pointer-events-none z-30 transition-opacity duration-1000"
          style={{
            background: `radial-gradient(ellipse at center, transparent 50%, rgba(255, 80, 80, ${stressIntensity * 0.15}) 100%)`,
            opacity: 1,
          }}
        />
      )}

      {/* Relationship tier notification toast */}
      {tierNotification && (() => {
        const NPC_KO: Record<string, string> = {
          soyeon: '박소연', jaemin: '이재민', minji: '한민지',
          hyunwoo: '정현우', 'prof-kim': '김 교수', boss: '이사장님',
        };
        const TIER_EMOJI: Record<string, string> = {
          acquaintance: '🤝', friend: '😊', close_friend: '💛', soulmate: '💕',
        };
        // NPC-specific tier descriptions for personal feel
        const NPC_TIER_DESC: Record<string, Record<string, string>> = {
          jaemin: {
            acquaintance: '같은 방을 쓰는 사이. 이름은 기억한다.',
            friend: '편하게 라면도 나눠 먹는 사이가 됐다.',
            close_friend: '새벽에 인생 얘기를 나눌 수 있는 친구.',
            soulmate: '룸메를 넘어, 평생 갈 친구가 됐다.',
          },
          minji: {
            acquaintance: '같은 과에서 얼굴은 안다.',
            friend: '라이벌이면서 동시에 든든한 스터디 메이트.',
            close_friend: '경쟁 뒤에 숨은 진심을 알게 됐다.',
            soulmate: '가장 이해받는 느낌. 말 안 해도 통한다.',
          },
          soyeon: {
            acquaintance: '따뜻한 선배. 이름을 기억해줬다.',
            friend: '선배의 진심 어린 조언이 힘이 된다.',
            close_friend: '선후배를 넘어 진짜 언니/오빠 같은 존재.',
            soulmate: '졸업해도 이어질 인연. 인생의 멘토.',
          },
          hyunwoo: {
            acquaintance: '동아리에서 알게 된 쿨한 선배.',
            friend: '같이 합주하며 웃는 사이.',
            close_friend: '음악과 인생을 나누는 형/누나.',
            soulmate: '무대 위에서 눈빛만으로 통하는 사이.',
          },
        };
        const TIER_DESC_DEFAULT: Record<string, string> = {
          acquaintance: '서로 이름을 기억하게 되었다',
          friend: '편하게 대화할 수 있는 사이가 되었다',
          close_friend: '속 깊은 이야기를 나눌 수 있게 되었다',
          soulmate: '무엇이든 함께할 수 있는 소중한 사람이 되었다',
        };
        const name = NPC_KO[tierNotification.characterId] ?? tierNotification.characterId;
        const emoji = TIER_EMOJI[tierNotification.newTier] ?? '💫';
        const desc = NPC_TIER_DESC[tierNotification.characterId]?.[tierNotification.newTier]
          ?? TIER_DESC_DEFAULT[tierNotification.newTier]
          ?? '관계가 깊어졌습니다';
        return (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
            <div className="glass-strong px-6 py-4 rounded-xl flex items-center gap-3 shadow-2xl border border-pink/30">
              <span className="text-3xl">{emoji}</span>
              <div>
                <div className="text-sm font-bold text-pink">{name} — {tierNotification.label}</div>
                <div className="text-xs text-txt-secondary">{desc}</div>
              </div>
              <button onClick={clearTierNotification} className="text-txt-secondary hover:text-txt-primary ml-2 cursor-pointer">✕</button>
            </div>
          </div>
        );
      })()}

      {/* Achievement toast — immediate celebration on unlock */}
      {newAchievements.length > 0 && phase !== 'summary' && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 animate-slide-up">
          {newAchievements.slice(0, 2).map((ach) => (
            <div key={ach.id} className="glass-strong px-5 py-3 rounded-xl flex items-center gap-3 shadow-2xl border border-gold/30 animate-bounce-once">
              <span className="text-2xl">{ach.emoji}</span>
              <div>
                <div className="text-xs font-bold text-gold">업적 달성! <span className="text-gold/50 font-normal">{currentWeek}주차</span></div>
                <div className="text-sm text-txt-primary">{ach.title}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prologue sequence (week 1 only, before planning) */}
      {phase === 'planning' && showPrologue && (
        <PrologueSequence onComplete={() => setPrologueDone(true)} />
      )}

      {/* OT (orientation) — meet classmates before 수강신청 */}
      {phase === 'planning' && showOT && (
        <OrientationEvent onComplete={() => setOTDone(true)} />
      )}

      {/* 수강신청 mini-game (week 1 only, after OT) */}
      {phase === 'planning' && showSugangsincheong && (
        <SugangsincheongEvent onComplete={() => setSugangsincheongDone(true)} />
      )}

      {/* Crisis event — fires when stats reach critical levels (PM2 forced consequences) */}
      {phase === 'planning' && hasCrisis && !showPrologue && !showSugangsincheong && (
        <CrisisEvent onDismiss={() => setCrisisDismissed(true)} />
      )}

      {/* MT event (week 4 — overrides normal scheduling) */}
      {phase === 'planning' && showMT && (
        <MTEvent onComplete={(effects) => {
          setMTDone(true);
          setWeekStatDeltas(effects);
          // Check achievements after event stats applied
          const s = useGameStore.getState();
          const newAch = checkAchievements(s.stats, s.relationships, currentWeek, s.unlockedAchievements);
          for (const a of newAch) s.addUnlockedAchievement(a.id, a.title, a.emoji);
          setPhase('summary');
        }} />
      )}

      {/* 축제 event (week 9 — overrides normal scheduling, PM2 Harvest Festival pattern) */}
      {phase === 'planning' && showFestival && (
        <FestivalEvent onComplete={(effects) => {
          setFestivalDone(true);
          setWeekStatDeltas(effects);
          const s = useGameStore.getState();
          const newAch = checkAchievements(s.stats, s.relationships, currentWeek, s.unlockedAchievements);
          for (const a of newAch) s.addUnlockedAchievement(a.id, a.title, a.emoji);
          setPhase('summary');
        }} />
      )}

      {/* 중간/기말고사 exam event (weeks 7, 14 — overrides normal scheduling) */}
      {phase === 'planning' && showExam && (
        <ExamEvent
          type={currentWeek === 7 ? 'midterm' : 'finals'}
          onComplete={(effects) => {
            setExamDone(true);
            setWeekStatDeltas(effects);
            const s = useGameStore.getState();
            const newAch = checkAchievements(s.stats, s.relationships, currentWeek, s.unlockedAchievements);
            for (const a of newAch) s.addUnlockedAchievement(a.id, a.title, a.emoji);
            setPhase('summary');
          }}
        />
      )}

      {/* KakaoTalk messages from NPCs after weekly summary */}
      {showKakao && kakaoMessages.length > 0 && (
        <KakaoMessages messages={kakaoMessages} onDismiss={handleKakaoDismiss} />
      )}

      {/* HUD -- always visible except during scenes */}
      {phase !== 'simulation' && <HUDBar />}

      {/* Quick-access buttons (visible except during scenes) */}
      {phase !== 'simulation' && (
        <div className="fixed top-3 right-4 z-40 flex gap-1.5">
          <button
            onClick={() => setShowPauseMenu(true)}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 text-txt-secondary hover:text-txt-primary transition-all cursor-pointer backdrop-blur-sm"
            title="메뉴 (ESC)"
          >
            ⚙️
          </button>
          <button
            onClick={() => setShowRelationships(true)}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 text-txt-secondary hover:text-txt-primary transition-all cursor-pointer backdrop-blur-sm"
            title="인간관계"
          >
            👥
          </button>
          {currentSchedule && (
            <button
              onClick={() => setShowScheduleViewer(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 text-txt-secondary hover:text-txt-primary transition-all cursor-pointer backdrop-blur-sm"
              title="스케줄 보기"
            >
              📅
            </button>
          )}
        </div>
      )}

      {/* Pause menu */}
      {showPauseMenu && (
        <PauseMenu onClose={() => setShowPauseMenu(false)} />
      )}

      {/* Relationship panel */}
      {showRelationships && (
        <RelationshipPanel onClose={() => setShowRelationships(false)} />
      )}

      {/* Schedule viewer modal */}
      {showScheduleViewer && currentSchedule && (
        <ScheduleViewer
          schedule={currentSchedule}
          onClose={() => setShowScheduleViewer(false)}
          onReplan={phase === 'simulation' ? () => {
            setShowScheduleViewer(false);
            setPhase('planning');
          } : undefined}
        />
      )}

      {/* Stats sidebar -- visible during planning and summary, hidden during action phase */}
      {(phase === 'planning' || phase === 'summary') && !showActionPhase && <StatsSidebar />}

      {/* Main content */}
      {phase === 'planning' && !showActionPhase && !showPrologue && !showSugangsincheong && !showMT && !showFestival && !showExam && !hasCrisis && (
        <div className="lg:ml-72 pt-16 animate-fade-in-up">
          {/* Character status card (PM2 pattern: always show the character) */}
          <div className="px-3 sm:px-4 mb-2">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5">
              <span className="text-2xl">
                {stats.stress >= 80 ? '😰' : stats.stress >= 50 ? '😓' : stats.health < 30 ? '🤒' : stats.social >= 60 ? '😊' : '🙂'}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-txt-primary">{player?.name ?? '학생'}</span>
                <span className="text-xs text-txt-secondary ml-2">
                  {stats.stress >= 80 ? '지쳐 보인다...' : stats.health < 30 ? '컨디션이 안 좋다' : stats.knowledge >= 70 ? '의욕이 넘친다!' : stats.social >= 60 ? '기분이 좋아 보인다' : '이번 주도 화이팅'}
                </span>
              </div>
              <span className="text-[10px] text-txt-secondary/50">{currentWeek}주차</span>
            </div>
          </div>

          {/* Goal warnings */}
          {goalWarnings.length > 0 && (
            <div className="px-4 md:px-8 mb-4 flex flex-col gap-2">
              {goalWarnings.map((w, i) => (
                <div key={i} className="glass px-4 py-2.5 rounded-xl text-sm text-amber-300 border border-amber-500/20">{w}</div>
              ))}
            </div>
          )}
          <SchedulePlanner onComplete={handleScheduleComplete} />
        </div>
      )}

      {/* Activity vignettes (PM2-style action phase) */}
      {showActionPhase && (
        <ActionPhase
          days={actionDays}
          currentStats={stats}
          onComplete={handleActionComplete}
        />
      )}

      {/* AI loading indicator with gameplay tips */}
      {isLoadingAI && (
        <div className="flex items-center justify-center h-[100dvh]">
          <div className="text-center animate-fade-in-up max-w-sm px-4">
            <div className="animate-spin w-10 h-10 border-3 border-teal border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-txt-secondary text-sm">AI가 이야기를 만들고 있어요...</p>
            <p className="text-txt-secondary/30 text-xs mt-3 italic leading-relaxed">
              {(() => {
                const tips = [
                  '💡 우정과 사랑은 별개예요. 친해진다고 연인이 되는 건 아니에요.',
                  '💡 스트레스가 70을 넘으면 모든 능력치 상승이 반감돼요.',
                  '💡 에너지를 초과하면 체력이 크게 떨어져요. 휴식도 중요!',
                  '💡 2주 이상 데이트를 안 하면 사랑 감정이 식어요. 💔',
                  '💡 수업+공부를 같은 주에 넣으면 "효율적 학습" 콤보!',
                  '💡 데이트는 우정 40+, 매력 40+ 필요. NPC별 조건도 달라요.',
                  '💡 시험 때 연인이 있으면 특별한 응원 전략이 열려요.',
                  '💡 카카오톡에서 선물을 보내면 사랑 감정이 올라가요.',
                  '💡 인간관계 패널(HUD)에서 로맨스 조건을 확인하세요.',
                  '💡 숨겨진 엔딩이 5개 있어요. NPC 관계에 주목!',
                  '💡 데이트가 어색하게 끝날 수도 있어요. 초반엔 30% 확률!',
                  '💡 NPC 초대를 수락하면 우정이나 사랑이 올라가요.',
                ];
                return tips[currentWeek % tips.length];
              })()}
            </p>
          </div>
        </div>
      )}

      {phase === 'simulation' && currentScene && (
        <SceneRenderer
          key={currentScene.id}
          scene={currentScene}
          onSceneEnd={handleSceneEnd}
        />
      )}

      {phase === 'summary' && !showKakao && !showWeeklyOverview && (
        <div className="lg:ml-72 pt-16 animate-fade-in-up">
          <WeekSummary onContinue={handleWeekContinue} />
        </div>
      )}

      {/* Weekly overview — breathing room between weeks */}
      {showWeeklyOverview && (
        <WeeklyOverview onContinue={() => {
          setShowWeeklyOverview(false);
          advanceWeek();
          setShowWeekTitle(true);
          // Trigger background Gemini generation for next week (2 API calls total)
          triggerDialogueGeneration(currentWeek + 1, stats, relationships);
          const recentEvts = useGameStore.getState().eventHistory.slice(-3).map(e => e.summary).join(', ');
          triggerAiCampusGeneration(currentWeek + 1, stats, relationships, recentEvts);
          setMTDone(false); setFestivalDone(false); setExamDone(false); setCrisisDismissed(false);
          // Show save indicator briefly
          setShowSaveIndicator(true);
          setTimeout(() => setShowSaveIndicator(false), 2000);
        }} />
      )}

      {/* Week title card — brief cinematic moment at start of each week */}
      {phase === 'planning' && showWeekTitle && !showPrologue && (
        <WeekTitleCard week={currentWeek} onDone={() => setShowWeekTitle(false)} />
      )}
    </div>
  );
}
