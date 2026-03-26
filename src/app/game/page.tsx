'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { useGameStore as useNewStore } from '@/stores/game-store';
import { simulateWeek } from '@/lib/gameEngine';
import { calculateTension } from '@/lib/tensionFormula';
import HUDBar from '@/components/game/HUDBar';
import StatsSidebar from '@/components/game/StatsSidebar';
import SchedulePlanner from '@/components/game/SchedulePlanner';
import SceneRenderer from '@/components/vn/SceneRenderer';
import WeekSummary from '@/components/game/WeekSummary';
import OnboardingOverlay from '@/components/game/OnboardingOverlay';
import SugangsincheongEvent from '@/components/game/SugangsincheongEvent';
import KakaoMessages from '@/components/game/KakaoMessages';
import type { Choice, PlayerStats, Scene, WeekSchedule } from '@/store/types';
import { initializeNPCs } from '@/engine/data/npc-initializer';
import { CORE_NPC_SHEETS } from '@/engine/data/core-npcs';

/**
 * Fetch an AI-generated scene from the game director API.
 * Returns a Scene on success, or null if the API is unavailable / fails.
 */
async function fetchAIScene(
  playerStats: PlayerStats,
  relationships: Record<string, unknown>,
  currentWeek: number,
  tension: number,
): Promise<Scene | null> {
  try {
    const response = await fetch('/api/game-director', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerStats,
        relationships,
        currentWeek,
        tension,
        recentEvents: [],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();

    // Construct a Scene from the API response
    const scene: Scene = {
      id: `ai_week${currentWeek}_${Date.now()}`,
      location: data.location ?? 'campus',
      backgroundVariant: data.backgroundVariant ?? 'day',
      characters: Array.isArray(data.characters) ? data.characters : [],
      dialogue: Array.isArray(data.dialogue)
        ? data.dialogue.map((line: { characterId?: string | null; text: string; expression?: string }) => ({
            characterId: line.characterId ?? null,
            text: line.text,
            expression: line.expression,
          }))
        : [],
      choices: Array.isArray(data.choices)
        ? data.choices.map((choice: { id: string; text: string; statEffects: Record<string, number>; relationshipEffects?: { characterId: string; change: number }[] }) => ({
            id: choice.id,
            text: choice.text,
            statEffects: choice.statEffects ?? {},
            relationshipEffects: choice.relationshipEffects,
          }))
        : undefined,
    };

    // Validate the scene has at least some dialogue
    if (scene.dialogue.length === 0) return null;

    return scene;
  } catch {
    return null;
  }
}

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
    sceneQueue,
    setSceneQueue,
    setWeekStatDeltas,
    updateStats,
    updateRelationship,
    relationships,
    advanceWeek,
  } = useGameStore();

  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup abort controller on unmount
  useEffect(() => { return () => { abortRef.current?.abort(); }; }, []);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [sugangsincheongDone, setSugangsincheongDone] = useState(false);
  const [kakaoMessages, setKakaoMessages] = useState<{senderId:string;senderName:string;text:string;timestamp:string;isRead:boolean}[]>([]);
  const [showKakao, setShowKakao] = useState(false);

  // Detect hydration: once component mounts on client, Zustand has loaded from localStorage
  useEffect(() => {
    // Small delay to ensure Zustand persist has finished rehydrating
    const timer = setTimeout(() => setHydrated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Redirect if no player (only after hydration)
  useEffect(() => {
    if (!hydrated) return;
    if (!player) {
      router.push('/');
    }
  }, [hydrated, player, router]);

  // Show spinner while hydrating
  if (!hydrated) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-navy">
        <div className="animate-spin w-12 h-12 border-4 border-teal border-t-transparent rounded-full" />
      </div>
    );
  }

  // Handle schedule completion -- simulate the week
  const handleScheduleComplete = useCallback(async (confirmedSchedule: WeekSchedule) => {
    if (isLoadingAI) return; // prevent double-submit

    const { statDeltas, scenes } = simulateWeek(confirmedSchedule, currentWeek, stats);
    setWeekStatDeltas(statDeltas);
    setCurrentSceneIndex(0);

    if (scenes.length > 0) {
      // Hardcoded scenes available (weeks 1-2)
      setSceneQueue(scenes);
      setPhase('simulation');
    } else {
      // No hardcoded scenes -- try 3-tier AI engine (Sprint 3-6) first, fall back to legacy
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoadingAI(true);

      // Initialize NPCs in the new store if not already done
      const newState = useNewStore.getState();
      if (Object.keys(newState.npcs.sheets).length === 0) {
        const { sheets, states } = initializeNPCs();
        useNewStore.getState().registerNPCs(sheets, states);
      }

      // Try the 3-tier AI engine: story director → NPC brains → simulation
      let aiScene: Scene | null = null;
      try {
        // Call story director for tension evaluation
        const directorRes = await fetch('/api/ai/story-director', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            director: useNewStore.getState().story.director,
            playerStats: stats,
            day: currentWeek * 7,
            npcSummaries: CORE_NPC_SHEETS.slice(0, 4).map(npc => ({
              id: npc.id, name: npc.name,
              emotion: 'anticipation (3/10)',
              goal: npc.goals[0], playerRel: 30,
            })),
            recentDayLogs: useGameStore.getState().eventHistory.slice(-10).map(e => `${e.week}주차: ${e.summary}${e.choiceMade ? ` (선택: ${e.choiceMade})` : ''}`),
            playerActivities: Object.values(confirmedSchedule).flat().map((s: { activityId: string }) => s.activityId).join(', '),
          }),
        });

        if (directorRes.ok) {
          const director = await directorRes.json();

          // Pick an NPC to encounter based on director intervention
          const targetNPC = director.interventions?.[0]?.targetNPC
            ? CORE_NPC_SHEETS.find(n => n.id === director.interventions[0].targetNPC)
            : CORE_NPC_SHEETS[Math.floor(Math.random() * CORE_NPC_SHEETS.length)];

          if (targetNPC) {
            // Call NPC brain with director bias
            const npcRes = await fetch('/api/ai/npc-brain', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                sheet: targetNPC,
                state: useNewStore.getState().npcs.states[targetNPC.id] ?? {
                  npcId: targetNPC.id,
                  emotion: { primary: 'anticipation', primaryIntensity: 3, secondary: null, secondaryIntensity: 0, mood: 2, stressLevel: 2 },
                  relationshipToPlayer: { level: 30, attitude: '아직 잘 모르는 사이.', trust: 30 },
                  npcRelationships: {}, memory: { shortTerm: [], longTerm: [], impressions: {} },
                  currentGoal: targetNPC.goals[0], currentLocation: targetNPC.primaryLocationIds[0],
                  recentDecisions: [], secretKnowledge: [],
                },
                playerName: player?.name ?? '학생',
                playerStats: stats,
                situation: `${currentWeek}주차. 캠퍼스에서 ${targetNPC.name}을(를) 만났다.`,
                directorBias: director.interventions?.[0]?.description,
                thinkingLevel: director.interventions?.[0]?.suggestedThinkingLevel ?? 'low',
                forceChoice: director.choiceRequired,
              }),
            });

            if (npcRes.ok) {
              const npcData = await npcRes.json();
              aiScene = {
                id: `ai_3tier_w${currentWeek}_${Date.now()}`,
                location: targetNPC.primaryLocationIds[0] ?? 'campus',
                backgroundVariant: 'day',
                characters: [{
                  characterId: targetNPC.id.replace('npc_', ''),
                  expression: npcData.emotion?.type === 'joy' ? 'happy' : 'neutral',
                  position: 'center' as const,
                }],
                dialogue: [{
                  characterId: targetNPC.id.replace('npc_', ''),
                  text: npcData.dialogue ?? '...',
                }],
                choices: npcData.choice ? npcData.choice.options.map((opt: { label: string; consequences: string }, i: number) => ({
                  id: `choice_${i}`,
                  text: opt.label,
                  statEffects: npcData.statModifiers ?? {},
                  relationshipEffects: [{ characterId: targetNPC.id.replace('npc_', ''), change: npcData.relationshipDelta ?? 0 }],
                })) : undefined,
              };
            }
          }
        }
      } catch (e) {
        console.warn('3-tier AI engine failed, falling back to legacy:', e);
      }

      // Fall back to legacy AI director if 3-tier failed
      if (!aiScene) {
        const tension = calculateTension(stats, relationships, currentWeek);
        aiScene = await fetchAIScene(stats, relationships, currentWeek, tension);
      }

      setIsLoadingAI(false);
      if (controller.signal.aborted) return; // user navigated away or double-submitted

      if (aiScene) {
        setSceneQueue([aiScene]);
        setPhase('simulation');
      } else {
        updateStats(statDeltas);
        setPhase('summary');
      }
    }
  }, [currentWeek, stats, relationships, setWeekStatDeltas, setSceneQueue, setCurrentSceneIndex, setPhase, updateStats]);

  // Handle scene end -- move to next scene or summary
  const handleSceneEnd = useCallback((choice?: Choice) => {
    const scene = sceneQueue[currentSceneIndex];

    // Apply choice effects
    if (choice) {
      updateStats(choice.statEffects);
      choice.relationshipEffects?.forEach(({ characterId, change }) => {
        updateRelationship(characterId, change);
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
      setPhase('summary');
    }
  }, [currentSceneIndex, sceneQueue, currentWeek, setCurrentSceneIndex, updateStats, updateRelationship, setPhase]);

  // Handle KakaoTalk dismiss → then advance week
  const handleKakaoDismiss = useCallback(() => {
    setShowKakao(false);
    setKakaoMessages([]);
    advanceWeek();
  }, [advanceWeek]);

  // Handle week advance — show KakaoTalk messages from NPCs first if any
  const handleWeekContinue = useCallback(() => {
    const NPC_NAMES: Record<string, string> = {
      soyeon: '박소연', jaemin: '이재민', minji: '최민지',
      hyunwoo: '김현우', 'prof-kim': '김 교수',
    };
    const NPC_MSGS: Record<string, string[]> = {
      soyeon: ['이번 주도 고생 많았어요! 다음에 같이 밥 먹어요 😊', '시험 준비는 잘 되고 있어요?'],
      jaemin: ['야 오늘 넘 힘들었다ㅠ 내일 밥은 같이 먹자!', '요즘 어때? 연락 좀 하자~'],
      minji: ['이번 주 수업 노트 공유해줄 수 있어요?', '같이 스터디 해요!'],
      hyunwoo: ['주말에 같이 농구 한 판 어때?', '오늘 동아리 회의 있는 거 알지?'],
      'prof-kim': ['이번 과제 결과 확인해보세요', '다음 수업 질문 있으면 준비해오세요'],
    };
    const msgs = Object.entries(relationships)
      .filter(([, rel]) => rel.affection > 25 && rel.encounters > 0)
      .slice(0, 3)
      .map(([charId, rel]) => {
        const msgArr = NPC_MSGS[charId] ?? ['안녕하세요!'];
        return {
          senderId: charId,
          senderName: NPC_NAMES[charId] ?? charId,
          text: msgArr[rel.encounters % msgArr.length],
          timestamp: '방금',
          isRead: false,
        };
      });
    if (msgs.length > 0) {
      setKakaoMessages(msgs);
      setShowKakao(true);
    } else {
      advanceWeek();
    }
  }, [advanceWeek, relationships]);

  const goalWarnings = useGameStore((state) => state.goalWarnings);
  const tierNotification = useGameStore((state) => state.tierNotification);
  const clearTierNotification = useGameStore((state) => state.clearTierNotification);

  if (!player) return null;

  const showOnboarding = currentWeek === 1 && !onboardingDone;
  const showSugangsincheong = currentWeek === 1 && onboardingDone && !sugangsincheongDone;
  const currentScene = sceneQueue[currentSceneIndex];

  return (
    <div className="min-h-[100dvh] bg-navy relative">
      {/* Relationship tier notification toast */}
      {tierNotification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div className="glass-strong px-6 py-3 rounded-xl flex items-center gap-3 shadow-2xl border border-teal/30">
            <span className="text-2xl">💫</span>
            <div>
              <div className="text-sm font-bold text-teal">{tierNotification.label} 달성!</div>
              <div className="text-xs text-txt-secondary">{tierNotification.characterId}와(과)의 관계가 깊어졌습니다</div>
            </div>
            <button onClick={clearTierNotification} className="text-txt-secondary hover:text-txt-primary ml-2">✕</button>
          </div>
        </div>
      )}

      {/* Onboarding tutorial (week 1 only, before planning) */}
      {phase === 'planning' && showOnboarding && (
        <OnboardingOverlay onComplete={() => setOnboardingDone(true)} />
      )}

      {/* 수강신청 mini-game (week 1 only, after onboarding) */}
      {phase === 'planning' && showSugangsincheong && (
        <SugangsincheongEvent onComplete={() => setSugangsincheongDone(true)} />
      )}

      {/* KakaoTalk messages from NPCs after weekly summary */}
      {showKakao && kakaoMessages.length > 0 && (
        <KakaoMessages messages={kakaoMessages} onDismiss={handleKakaoDismiss} />
      )}

      {/* HUD -- always visible except during scenes */}
      {phase !== 'simulation' && <HUDBar />}

      {/* Stats sidebar -- visible during planning and summary */}
      {(phase === 'planning' || phase === 'summary') && <StatsSidebar />}

      {/* Main content */}
      {phase === 'planning' && !showOnboarding && !showSugangsincheong && (
        <div className="lg:ml-72 pt-16">
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

      {/* AI loading indicator */}
      {isLoadingAI && (
        <div className="flex items-center justify-center h-[100dvh]">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-teal border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-txt-secondary text-lg">AI Game Director is creating your story...</p>
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

      {phase === 'summary' && (
        <div className="lg:ml-72 pt-16">
          <WeekSummary onContinue={handleWeekContinue} />
        </div>
      )}
    </div>
  );
}
