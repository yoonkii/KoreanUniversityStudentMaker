'use client';

import { useGameStore } from '@/store/gameStore';
import { CHARACTERS } from '@/data/characters';
import GlassPanel from '@/components/ui/GlassPanel';
import Image from 'next/image';

interface RelationshipPanelProps {
  onClose: () => void;
}

function getTierInfo(affection: number): { label: string; emoji: string; color: string; tier: string } {
  if (affection >= 90) return { label: '소울메이트', emoji: '💕', color: 'text-pink', tier: 'soulmate' };
  if (affection >= 70) return { label: '절친', emoji: '💛', color: 'text-gold', tier: 'close_friend' };
  if (affection >= 50) return { label: '친구', emoji: '😊', color: 'text-teal', tier: 'friend' };
  if (affection >= 25) return { label: '아는 사이', emoji: '🤝', color: 'text-txt-secondary', tier: 'acquaintance' };
  return { label: '모르는 사이', emoji: '👤', color: 'text-txt-secondary/50', tier: 'stranger' };
}

/** Active tier bonus descriptions per NPC */
const TIER_BONUS_LABELS: Record<string, Record<string, string>> = {
  minji: { friend: '준비도 +10% 활성중', close_friend: '준비도 +20% 활성중', soulmate: '시험 GPA +0.3 활성중' },
  jaemin: { friend: '스트레스 -2 활성중', close_friend: '스트레스 -5, 용돈 +15K 활성중', soulmate: '번아웃 보호 활성중' },
  soyeon: { friend: '인맥 +10% 활성중', close_friend: '인맥 +15% 활성중', soulmate: '매력 +15% 활성중' },
  hyunwoo: { friend: '매력 +10% 활성중', close_friend: '동아리 비용 할인 활성중', soulmate: '축제 보너스 활성중' },
};

export default function RelationshipPanel({ onClose }: RelationshipPanelProps) {
  const relationships = useGameStore((s) => s.relationships);

  const npcList = Object.values(CHARACTERS).map((char) => {
    const rel = relationships[char.id];
    return {
      ...char,
      affection: rel?.affection ?? 0,
      encounters: rel?.encounters ?? 0,
    };
  }).sort((a, b) => b.affection - a.affection);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <GlassPanel variant="strong" className="p-5 animate-modal-enter">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-txt-primary">👥 인간관계</h3>
            <button onClick={onClose} className="text-xs text-txt-secondary hover:text-txt-primary cursor-pointer">닫기</button>
          </div>

          <div className="flex flex-col gap-3">
            {npcList.map((npc) => {
              const tier = getTierInfo(npc.affection);
              const hasRelation = npc.encounters > 0;
              return (
                <div
                  key={npc.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${hasRelation ? 'bg-white/5' : 'bg-white/[0.02] opacity-50'}`}
                >
                  {/* Portrait */}
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-white/10">
                    <Image
                      src={`/assets/characters/${npc.id}/neutral.png`}
                      alt={npc.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-txt-primary">{npc.name}</span>
                      <span className="text-[10px] text-txt-secondary/60">{npc.role === 'caring_mentor' ? '선배' : npc.role === 'supportive_friend' ? '룸메이트' : npc.role === 'competitive_rival' ? '라이벌' : npc.role === 'cool_senior' ? '동아리 선배' : npc.role === 'strict_mentor' ? '교수' : npc.role === 'warm_boss' ? '사장님' : ''}</span>
                    </div>
                    {hasRelation && (
                      <>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-pink/40 rounded-full transition-all duration-500"
                              style={{ width: `${npc.affection}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-medium ${tier.color}`}>{tier.emoji} {tier.label}</span>
                        </div>
                        {TIER_BONUS_LABELS[npc.id]?.[tier.tier] && (
                          <p className="text-[9px] text-teal/60 mt-0.5">
                            ✦ {TIER_BONUS_LABELS[npc.id][tier.tier]}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Affection number */}
                  {hasRelation && (
                    <span className="text-xs font-mono text-txt-secondary/50">{npc.affection}</span>
                  )}
                </div>
              );
            })}
          </div>

          {Object.keys(relationships).length === 0 && (
            <p className="text-sm text-txt-secondary/50 text-center py-4">아직 만난 사람이 없습니다</p>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}
