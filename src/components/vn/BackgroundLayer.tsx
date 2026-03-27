import Image from 'next/image';
import { useGameStore } from '@/store/gameStore';

interface BackgroundLayerProps {
  location: string;
  variant: string;
}

/**
 * Context-aware background selection — picks the best variant
 * based on game state (exam week, time, stress level, etc.)
 */
function getContextualVariant(location: string, variant: string, week: number, stress: number): string {
  // Exam weeks: use exam-specific backgrounds
  if ((week === 7 || week === 8 || week === 14 || week === 15) && location === 'classroom') {
    return 'exam';
  }

  // High stress: messy dorm
  if (location === 'dorm' && stress > 65) {
    return 'messy';
  }

  // Exam season: crowded library
  if (location === 'library' && (week >= 6 && week <= 8 || week >= 13)) {
    return 'crowded';
  }

  // Late weeks: campus at sunset/night for emotional scenes
  if (location === 'campus' && week >= 14) {
    return 'sunset';
  }

  return variant;
}

export default function BackgroundLayer({ location, variant }: BackgroundLayerProps) {
  const currentWeek = useGameStore((s) => s.currentWeek);
  const stress = useGameStore((s) => s.stats?.stress ?? 0);

  const contextualVariant = getContextualVariant(location, variant, currentWeek, stress);
  const src = `/assets/backgrounds/${location}/${contextualVariant}.png`;

  return (
    <div className="absolute inset-0 z-0">
      <Image
        src={src}
        alt={`${location} - ${contextualVariant}`}
        fill
        priority
        className="object-cover w-full h-full"
        sizes="100vw"
        onError={(e) => {
          // Fallback to original variant if contextual doesn't exist
          (e.target as HTMLImageElement).src = `/assets/backgrounds/${location}/${variant}.png`;
        }}
      />
      <div className="absolute inset-0 bg-black/30" />
    </div>
  );
}
