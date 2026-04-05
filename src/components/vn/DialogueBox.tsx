'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCharacterName } from '@/data/characters';

interface DialogueBoxProps {
  characterId: string | null;
  text: string;
  onContinue: () => void;
}

const CHARACTER_COLOR_MAP: Record<string, string> = {
  soyeon: '#F5A0B5',
  jaemin: '#4ECDC4',
  'prof-kim': '#FFD166',
  minji: '#FF6B6B',
  hyunwoo: '#A78BFA',
  boss: '#4ECDC4',
};

const TYPEWRITER_INTERVAL_MS = 30;

export default function DialogueBox({ characterId, text, onContinue }: DialogueBoxProps) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTypewriter = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Reset typewriter when text changes
  useEffect(() => {
    setDisplayedLength(0);
    setIsComplete(false);
  }, [text]);

  // Run typewriter effect
  useEffect(() => {
    if (isComplete) {
      clearTypewriter();
      return;
    }

    intervalRef.current = setInterval(() => {
      setDisplayedLength((prev) => {
        if (prev >= text.length) {
          setIsComplete(true);
          return prev;
        }
        return prev + 1;
      });
    }, TYPEWRITER_INTERVAL_MS);

    return clearTypewriter;
  }, [text, isComplete, clearTypewriter]);

  const handleClick = useCallback(() => {
    if (!isComplete) {
      // Skip to full text
      clearTypewriter();
      setDisplayedLength(text.length);
      setIsComplete(true);
    } else {
      onContinue();
    }
  }, [isComplete, text.length, clearTypewriter, onContinue]);

  const speakerName = characterId ? getCharacterName(characterId) : '나레이션';
  const accentColor = characterId ? CHARACTER_COLOR_MAP[characterId] ?? '#8B95A8' : undefined;

  const nameStyle = accentColor
    ? { backgroundColor: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}55` }
    : undefined;

  return (
    <div
      className="glass-dialogue rounded-t-2xl w-full max-w-5xl mx-auto px-6 py-5 cursor-pointer select-none"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Speaker name */}
      <div className="mb-3">
        <span
          className="inline-block px-3 py-1 rounded-full text-sm font-semibold"
          style={nameStyle ?? { color: 'var(--color-txt-secondary)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          {speakerName}
        </span>
      </div>

      {/* Dialogue text */}
      <p className="text-xl leading-relaxed break-keep text-txt-primary min-h-[3.5rem]" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
        {text.slice(0, displayedLength)}
        {!isComplete && (
          <span className="inline-block w-0.5 h-5 bg-txt-primary ml-0.5 animate-pulse align-middle" />
        )}
      </p>

      {/* Continue indicator */}
      {isComplete && (
        <div className="flex justify-end mt-2">
          <svg
            className="w-5 h-5 text-teal animate-pulse-glow"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
