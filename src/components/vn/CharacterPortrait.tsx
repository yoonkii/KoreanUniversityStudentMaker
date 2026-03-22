'use client';

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

export default function CharacterPortrait({
  characterId,
  expression,
  position,
  isActive,
}: CharacterPortraitProps) {
  const src = `/assets/characters/${characterId}/${expression}.png`;
  const positionClass = POSITION_CLASSES[position];
  const activeClass = isActive
    ? 'opacity-100 scale-100'
    : 'opacity-50 scale-95 brightness-75';

  return (
    <div
      className={`absolute bottom-0 ${positionClass} h-[400px] md:h-[500px] lg:h-[600px] transition-all duration-500 ease-out ${activeClass}`}
    >
      <Image
        src={src}
        alt={`${characterId} - ${expression}`}
        fill
        className="object-contain object-bottom"
        sizes="(max-width: 768px) 50vw, 33vw"
      />
    </div>
  );
}
