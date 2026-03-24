'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Scene, Choice, SceneCharacter } from '@/store/types';
import BackgroundLayer from './BackgroundLayer';
import CharacterPortrait from './CharacterPortrait';
import DialogueBox from './DialogueBox';
import ChoiceList from './ChoiceList';

interface SceneRendererProps {
  scene: Scene;
  onSceneEnd: (choice?: Choice) => void;
}

export default function SceneRenderer({ scene, onSceneEnd }: SceneRendererProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [characterStates, setCharacterStates] = useState<Map<string, string>>(new Map());
  const [showChoices, setShowChoices] = useState(false);

  const { dialogue, choices, characters, location, backgroundVariant } = scene;
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
  }, [scene, characters]);

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
      onSceneEnd(choice);
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
        {showChoices && choices && choices.length > 0 ? (
          <ChoiceList choices={choices} onChoose={handleChoose} />
        ) : currentLine ? (
          <DialogueBox
            characterId={currentLine.characterId}
            text={currentLine.text}
            onContinue={advanceDialogue}
          />
        ) : null}
      </div>
    </div>
  );
}
