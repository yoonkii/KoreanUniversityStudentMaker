'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { CHARACTERS } from '@/data/characters';

interface CharacterPortraitProps {
  characterId: string;
  expression: string;
  position: 'left' | 'center' | 'right';
  isActive: boolean;
}

const POSITION_CLASSES: Record<CharacterPortraitProps['position'], string> = {
  left: 'left-4 md:left-12',
  center: 'left-1/2 -translate-x-1/2',
  right: 'right-4 md:right-12',
};

// Entrance animation direction per position
const ENTER_FROM: Record<CharacterPortraitProps['position'], string> = {
  left: '-translate-x-24 opacity-0',
  center: 'translate-y-12 opacity-0',
  right: 'translate-x-24 opacity-0',
};

// Map Sprint 3-6 NPC IDs to Sprint 1-2 character asset IDs
const NPC_TO_ASSET: Record<string, string> = {
  minsu: 'jaemin',
  jiwon: 'minji',
  hyunwoo: 'hyunwoo',
  prof_kim: 'prof-kim',
  soyeon: 'soyeon',
  dongho: 'jaemin',
  yuna: 'minji',
  taehyun: 'boss',
};

function SilhouetteFallback({ isActive }: { isActive: boolean }) {
  return (
    <svg viewBox="0 0 200 400" className="w-full h-full" style={{ opacity: isActive ? 0.8 : 0.4 }}>
      <defs>
        <linearGradient id="silGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="80" r="40" fill="url(#silGrad)" />
      <path d="M 60 120 Q 60 180 40 300 L 160 300 Q 140 180 140 120 Z" fill="url(#silGrad)" />
      <text x="100" y="90" textAnchor="middle" fill="white" fontSize="36" fontWeight="bold">?</text>
    </svg>
  );
}

export default function CharacterPortrait({
  characterId,
  expression,
  position,
  isActive,
}: CharacterPortraitProps) {
  const [imgError, setImgError] = useState(false);
  const [entered, setEntered] = useState(false);
  const [expressionPulse, setExpressionPulse] = useState(false);
  const prevExpressionRef = useRef(expression);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Expression change pulse
  useEffect(() => {
    if (prevExpressionRef.current !== expression) {
      prevExpressionRef.current = expression;
      setExpressionPulse(true);
      const timer = setTimeout(() => setExpressionPulse(false), 300);
      return () => clearTimeout(timer);
    }
  }, [expression]);

  // Reset imgError when expression changes so valid expressions recover
  useEffect(() => {
    setImgError(false);
  }, [expression]);

  const mappedId = NPC_TO_ASSET[characterId] ?? characterId;
  // Validate expression against character's known expressions, fallback to neutral
  const charDef = CHARACTERS[characterId];
  const validExpression = charDef?.expressions.includes(expression) ? expression : 'neutral';
  const src = `/assets/characters/${mappedId}/${validExpression}.png`;

  const positionClass = POSITION_CLASSES[position];
  const enterClass = entered ? '' : ENTER_FROM[position];
  const activeClass = isActive
    ? 'opacity-100 scale-100'
    : 'opacity-60 scale-[0.94] brightness-80';
  const pulseClass = expressionPulse ? 'scale-[1.03]' : '';

  return (
    <div
      className={`absolute bottom-0 ${positionClass} w-[200px] md:w-[280px] lg:w-[320px] h-[500px] md:h-[600px] lg:h-[700px] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${activeClass} ${enterClass} ${pulseClass}`}
    >
      {imgError ? (
        <SilhouetteFallback isActive={isActive} />
      ) : (
        <Image
          src={src}
          alt={`${characterId} - ${expression}`}
          fill
          className="object-contain object-bottom drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]"
          sizes="(max-width: 768px) 50vw, 33vw"
          onError={() => {
            setImgError(true);
          }}
        />
      )}
    </div>
  );
}
