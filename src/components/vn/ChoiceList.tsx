'use client';

import type { Choice, CharacterRelationship } from '@/store/types';
import type { PlayerStats } from '@/store/types';

function getTierLabel(minAffection: number): string {
  if (minAffection >= 90) return '소울메이트';
  if (minAffection >= 70) return '절친';
  if (minAffection >= 50) return '친구';
  if (minAffection >= 25) return '아는 사이';
  return '모르는 사이';
}

interface ChoiceListProps {
  choices: Choice[];
  onChoose: (choice: Choice) => void;
  relationships?: Record<string, CharacterRelationship>;
}

const STAT_LABELS: Record<keyof PlayerStats, string> = {
  knowledge: '준비도',
  money: '돈',
  health: '체력',
  social: '인맥',
  stress: '스트레스',
  charm: '매력',
};

function formatStatValue(key: keyof PlayerStats, value: number): string {
  if (key === 'money') {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value.toLocaleString('ko-KR')}원`;
  }
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value}`;
}

export default function ChoiceList({ choices, onChoose, relationships }: ChoiceListProps) {
  return (
    <div className="glass-dialogue rounded-t-2xl w-full max-w-5xl mx-auto px-6 py-5">
      <p className="text-sm text-txt-secondary mb-4">선택지를 골라주세요</p>
      <div className="flex flex-col gap-3">
        {choices.map((choice, index) => {
          const statEntries = Object.entries(choice.statEffects) as [keyof PlayerStats, number][];

          // Check relationship requirement
          const req = choice.requiredRelationship;
          const meetsRequirement = !req || (relationships?.[req.characterId]?.affection ?? 0) >= req.minAffection;
          const requiredTierLabel = req ? getTierLabel(req.minAffection) : '';

          return (
            <button
              key={choice.id}
              onClick={() => meetsRequirement && onChoose(choice)}
              disabled={!meetsRequirement}
              title={!meetsRequirement ? `${req!.characterId}와(과) ${requiredTierLabel} 이상 필요` : undefined}
              className={`glass rounded-xl px-5 py-4 text-left flex items-start gap-4 transition-all duration-300 ${
                meetsRequirement
                  ? 'hover:scale-[1.02] hover:border-teal/50 active:scale-[0.98] cursor-pointer'
                  : 'opacity-40 cursor-not-allowed grayscale'
              }`}
            >
              {/* Numbered badge */}
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-teal/20 text-teal flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>

              <div className="flex-1 min-w-0">
                {/* Choice text */}
                <p className="text-base text-txt-primary break-keep">{choice.text}</p>

                {/* Locked indicator */}
                {!meetsRequirement && req && (
                  <p className="text-xs text-coral/70 mt-1">
                    🔒 {req.characterId}와(과) {requiredTierLabel} 이상 필요
                  </p>
                )}

                {/* Stat impact preview */}
                {statEntries.length > 0 && (
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                    {statEntries.map(([stat, value]) => (
                      <span
                        key={stat}
                        className={`text-xs ${value > 0 ? 'text-teal' : 'text-coral'}`}
                      >
                        {STAT_LABELS[stat]} {formatStatValue(stat, value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
