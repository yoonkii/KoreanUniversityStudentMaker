'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Scene, Choice, SceneCharacter } from '@/store/types';
import { ACTIVITY_COLORS, type ActivityColorKey } from '@/data/activity-colors';
import { useAIDialogue } from '@/hooks/useAIDialogue';
import { useGameStore } from '@/store/gameStore';
import BackgroundLayer from './BackgroundLayer';
import StatChangePopup from './StatChangePopup';
import CharacterPortrait from './CharacterPortrait';
import DialogueBox from './DialogueBox';
import ChoiceList from './ChoiceList';

/** Derive an activity key from a scene's location string */
function locationToActivity(location: string): ActivityColorKey {
  const l = location.toLowerCase();
  if (l.includes('class') || l.includes('lecture') || l.includes('campus')) return 'class';
  if (l.includes('library') || l.includes('study')) return 'study';
  if (l.includes('gym') || l.includes('field') || l.includes('exercise')) return 'exercise';
  if (l.includes('cafe') || l.includes('restaurant') || l.includes('friend')) return 'social';
  if (l.includes('date') || l.includes('park')) return 'date';
  if (l.includes('club') || l.includes('band') || l.includes('music')) return 'club';
  if (l.includes('work') || l.includes('part')) return 'parttime';
  if (l.includes('dorm') || l.includes('home') || l.includes('rest')) return 'rest';
  return 'social';
}

/** Map backgroundVariant to a Korean time-of-day label */
function variantToTimeLabel(variant: string): string {
  if (variant === 'night' || variant === 'evening') return '저녁';
  if (variant === 'morning') return '오전';
  return '오후';
}

interface SceneRendererProps {
  scene: Scene;
  onSceneEnd: (choice?: Choice) => void;
  /** Optional override for the activity key shown in the banner */
  activityId?: ActivityColorKey;
  /** Optional override for the time label shown in the banner (e.g. "월요일 오전") */
  timeLabel?: string;
  /** Enable AI dialogue enhancement (default: true) */
  enableAIDialogue?: boolean;
}

export default function SceneRenderer({ scene, onSceneEnd, activityId, timeLabel, enableAIDialogue = true }: SceneRendererProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [characterStates, setCharacterStates] = useState<Map<string, string>>(new Map());
  const [showChoices, setShowChoices] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [pendingChoice, setPendingChoice] = useState<Choice | null>(null);

  const resolvedActivity = activityId ?? locationToActivity(scene.location);
  const resolvedTime = timeLabel ?? variantToTimeLabel(scene.backgroundVariant);
  const activity = ACTIVITY_COLORS[resolvedActivity];

  // Hide banner after 3s
  useEffect(() => {
    setBannerVisible(true);
    const t = setTimeout(() => setBannerVisible(false), 3000);
    return () => clearTimeout(t);
  }, [scene.id]);

  const relationships = useGameStore((s) => s.relationships);
  const { dialogue: aiDialogue, isLoading: isAILoading } = useAIDialogue(scene, enableAIDialogue);
  const { choices, characters, location, backgroundVariant } = scene;
  const dialogue = aiDialogue;
  const currentLine = dialogue[currentLineIndex];
  const isLastLine = currentLineIndex >= dialogue.length - 1;

  // Initialize character expression states from scene definition
  useEffect(() => {
    const initialStates = new Map<string, string>();
    for (const char of characters) {
      initialStates.set(char.characterId, char.expression);
    }
    setCharacterStates(initialStates);
    setCurrentLineIndex(0);
    setShowChoices(false);
  }, [scene]); // characters is derived from scene; key={scene.id} handles identity

  // Update character expression when a dialogue line specifies one
  useEffect(() => {
    if (!currentLine) return;

    if (currentLine.expression && currentLine.characterId) {
      setCharacterStates((prev) => {
        const next = new Map(prev);
        next.set(currentLine.characterId!, currentLine.expression!);
        return next;
      });
    }
  }, [currentLine]);

  const advanceDialogue = useCallback(() => {
    if (isLastLine) {
      if (choices && choices.length > 0) {
        setShowChoices(true);
      } else {
        onSceneEnd();
      }
    } else {
      setCurrentLineIndex((prev) => prev + 1);
    }
  }, [isLastLine, choices, onSceneEnd]);

  const handleChoose = useCallback(
    (choice: Choice) => {
      // Show stat popup before ending scene
      if (choice.statEffects && Object.values(choice.statEffects).some(v => v !== 0)) {
        setPendingChoice(choice);
        setShowChoices(false);
      } else {
        onSceneEnd(choice);
      }
    },
    [onSceneEnd],
  );

  // Deadlock fallback: if stuck on same line for 30s, auto-advance
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!showChoices) {
        advanceDialogue();
      }
    }, 30_000);
    return () => clearTimeout(timeout);
  }, [currentLineIndex, showChoices, advanceDialogue]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === ' ' || e.key === 'Enter') {
        // Only advance if choices are NOT showing (let ChoiceList handle its own input)
        if (!showChoices) {
          e.preventDefault();
          advanceDialogue();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showChoices, advanceDialogue]);

  // Build display characters with updated expressions
  const displayCharacters: (SceneCharacter & { currentExpression: string })[] = characters.map(
    (char) => ({
      ...char,
      currentExpression: characterStates.get(char.characterId) ?? char.expression,
    }),
  );

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden">
      {/* Z-30: Activity banner — slides in from top */}
      <div style={{ transform: bannerVisible ? 'translateY(0)' : 'translateY(-110%)', transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)', backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', borderBottom: `2px solid ${activity.color}` }} className="absolute top-0 left-0 right-0 z-30 flex items-center gap-3 px-5 py-3">
        <span className="text-2xl leading-none">{activity.icon}</span>
        <span style={{ color: activity.color }} className="font-bold text-base tracking-wide">{activity.label}</span>
        <span className="text-white/40 text-sm">—</span>
        <span className="text-white/70 text-sm">{resolvedTime}</span>
        <div style={{ backgroundColor: activity.color }} className="ml-auto h-1.5 w-1.5 rounded-full animate-pulse" />
      </div>

      {/* Z-0: Background */}
      <BackgroundLayer location={location} variant={backgroundVariant} />

      {/* Z-10: Character portraits */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {displayCharacters.map((char) => (
          <CharacterPortrait
            key={char.characterId}
            characterId={char.characterId}
            expression={char.currentExpression}
            position={char.position}
            isActive={currentLine?.characterId === char.characterId}
          />
        ))}
      </div>

      {/* Z-20: Dialogue box or choice list */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-4">
        {isAILoading && !currentLine ? (
          <div className="glass-dialogue rounded-2xl px-6 py-4 text-white/50 text-sm animate-pulse">...</div>
        ) : pendingChoice ? (
          /* Hide dialogue while stat popup is showing to prevent click-through */
          null
        ) : showChoices && choices && choices.length > 0 ? (
          <ChoiceList choices={choices} onChoose={handleChoose} relationships={relationships} stats={useGameStore.getState().stats} />
        ) : currentLine ? (
          <DialogueBox
            characterId={currentLine.characterId}
            text={currentLine.text}
            onContinue={advanceDialogue}
          />
        ) : null}
      </div>

      {/* Stat change popup after choice */}
      {pendingChoice && (
        <StatChangePopup
          statEffects={pendingChoice.statEffects}
          onDone={() => {
            const choice = pendingChoice;
            setPendingChoice(null);
            onSceneEnd(choice);
          }}
        />
      )}
    </div>
  );
}
