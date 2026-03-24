'use client';

import { useState } from 'react';
import Image from 'next/image';

interface CharacterPortraitProps {
  characterId: string;
  expression: string;
  position: 'left' | 'center' | 'right';
  isActive: boolean;
}

const POSITION_CLASSES: Record<CharacterPortraitProps['position'], string> = {
  left: 'left-4 md:left-16',
  center: 'left-1/2 -translate-x-1/2',
  right: 'right-4 md:right-16',
};

// Map Sprint 3-6 NPC IDs to Sprint 1-2 character asset IDs
const NPC_TO_ASSET: Record<string, string> = {
  minsu: 'jaemin',      // roommate → jaemin (closest male student)
  jiwon: 'minji',       // classmate → minji (studious female)
  hyunwoo: 'hyunwoo',   // senior → hyunwoo (already exists!)
  prof_kim: 'prof-kim', // professor → prof-kim (already exists!)
  soyeon: 'soyeon',     // work colleague → soyeon (already exists!)
  dongho: 'jaemin',     // club member → jaemin (male)
  yuna: 'minji',        // romantic interest → minji (female)
  taehyun: 'boss',      // rival → boss (competitive male)
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
      {/* Head */}
      <circle cx="100" cy="80" r="40" fill="url(#silGrad)" />
      {/* Body */}
      <path d="M 60 120 Q 60 180 40 300 L 160 300 Q 140 180 140 120 Z" fill="url(#silGrad)" />
      {/* Question mark */}
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

  // Try mapped asset ID first, then raw characterId
  const mappedId = NPC_TO_ASSET[characterId] ?? characterId;
  const src = `/assets/characters/${mappedId}/${expression}.png`;
  const fallbackSrc = `/assets/characters/${mappedId}/neutral.png`;

  const positionClass = POSITION_CLASSES[position];
  const activeClass = isActive
    ? 'opacity-100 scale-100'
    : 'opacity-50 scale-95 brightness-75';

  return (
    <div
      className={`absolute bottom-0 ${positionClass} h-[400px] md:h-[500px] lg:h-[600px] transition-all duration-500 ease-out ${activeClass}`}
    >
      {imgError ? (
        <SilhouetteFallback isActive={isActive} />
      ) : (
        <Image
          src={src}
          alt={`${characterId} - ${expression}`}
          fill
          className="object-contain object-bottom"
          sizes="(max-width: 768px) 50vw, 33vw"
          onError={() => {
            // Try neutral expression, then silhouette
            if (!src.includes('neutral')) {
              setImgError(false);
              // Will retry with the component's natural re-render
            } else {
              setImgError(true);
            }
          }}
        />
      )}
    </div>
  );
}
