'use client';

import { useGameStore, getRelationshipTier, getRomanceTier } from '@/store/gameStore';
import { CHARACTERS } from '@/data/characters';
import GlassPanel from '@/components/ui/GlassPanel';
import Image from 'next/image';

interface RelationshipPanelProps {
  onClose: () => void;
}

const FRIEND_TIER_INFO: Record<string, { label: string; emoji: string; color: string }> = {
  best_friend: { label: '베프', emoji: '💛', color: 'text-gold' },
  close_friend: { label: '절친', emoji: '😊', color: 'text-teal' },
  friend: { label: '친구', emoji: '🤝', color: 'text-sky-400' },
  acquaintance: { label: '아는 사이', emoji: '👋', color: 'text-txt-secondary' },
  stranger: { label: '모르는 사이', emoji: '👤', color: 'text-txt-secondary/50' },
};

const ROMANCE_TIER_INFO: Record<string, { label: string; emoji: string }> = {
  deep_love: { label: '사랑', emoji: '💗' },
  dating: { label: '연인', emoji: '💕' },
  crush: { label: '설렘', emoji: '💓' },
  interest: { label: '관심', emoji: '💭' },
  none: { label: '', emoji: '' },
};

/** NPC romance chemistry hints — what each NPC needs to start romance */
const ROMANCE_HINTS: Record<string, { hint: string; met: (stats: { knowledge: number; charm: number; stress: number }, respect: number) => boolean }> = {
  jaemin: { hint: '매력 30+ 필요', met: (s) => s.charm >= 30 },
  minji: { hint: '준비도 50+ & 존경 60+ 필요', met: (s, r) => s.knowledge >= 50 && r >= 60 },
  soyeon: { hint: '스트레스 40 미만 필요', met: (s) => s.stress < 40 },
  hyunwoo: { hint: '매력 50+ 필요', met: (s) => s.charm >= 50 },
};

/** Active tier bonus descriptions per NPC */
const TIER_BONUS_LABELS: Record<string, Record<string, string>> = {
  minji: { friend: '준비도 +10% 활성중', close_friend: '준비도 +20% 활성중', best_friend: '시험 GPA +0.3 활성중' },
  jaemin: { friend: '스트레스 -2 활성중', close_friend: '스트레스 -5, 용돈 +15K 활성중', best_friend: '번아웃 보호 활성중' },
  soyeon: { friend: '인맥 +10% 활성중', close_friend: '인맥 +15% 활성중', best_friend: '매력 +15% 활성중' },
  hyunwoo: { friend: '매력 +10% 활성중', close_friend: '동아리 비용 할인 활성중', best_friend: '축제 보너스 활성중' },
};

export default function RelationshipPanel({ onClose }: RelationshipPanelProps) {
  const relationships = useGameStore((s) => s.relationships);
  const stats = useGameStore((s) => s.stats);

  const npcList = Object.values(CHARACTERS).map((char) => {
    const rel = relationships[char.id];
    return {
      ...char,
      friendship: rel?.friendship ?? rel?.affection ?? 0,
      romance: rel?.romance ?? 0,
      encounters: rel?.encounters ?? 0,
      mood: rel?.mood,
      opinion: rel?.opinion,
    };
  }).sort((a, b) => Math.max(b.friendship, b.romance) - Math.max(a.friendship, a.romance));

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
              const fTier = getRelationshipTier(npc.friendship);
              const rTier = getRomanceTier(npc.romance);
              const fInfo = FRIEND_TIER_INFO[fTier];
              const rInfo = ROMANCE_TIER_INFO[rTier];
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
                        {/* Friendship bar */}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-sky-400/60 w-4">우정</span>
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-sky-400/50 rounded-full transition-all duration-500"
                              style={{ width: `${npc.friendship}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-medium ${fInfo.color}`}>{fInfo.emoji} {fInfo.label}</span>
                        </div>
                        {/* Romance bar (only show if romance > 0) */}
                        {npc.romance > 0 && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-pink/60 w-4">사랑</span>
                            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-pink/50 rounded-full transition-all duration-500"
                                style={{ width: `${npc.romance}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-medium text-pink">{rInfo.emoji} {rInfo.label}</span>
                          </div>
                        )}
                        {/* Mood */}
                        {npc.opinion && (
                          <p className="text-[9px] text-txt-secondary/40 mt-0.5 italic truncate">&ldquo;{npc.opinion}&rdquo;</p>
                        )}
                        {TIER_BONUS_LABELS[npc.id]?.[fTier] && (
                          <p className="text-[9px] text-teal/60 mt-0.5">
                            ✦ {TIER_BONUS_LABELS[npc.id][fTier]}
                          </p>
                        )}
                        {/* Romance chemistry hint — show what NPC needs */}
                        {npc.friendship >= 20 && ROMANCE_HINTS[npc.id] && (() => {
                          const hint = ROMANCE_HINTS[npc.id];
                          const respect = relationships[npc.id]?.respect ?? 50;
                          const isMet = hint.met(stats, respect);
                          return (
                            <p className={`text-[9px] mt-0.5 ${isMet ? 'text-pink/50' : 'text-txt-secondary/30'}`}>
                              {isMet ? '💕 로맨스 가능' : `🔒 ${hint.hint}`}
                            </p>
                          );
                        })()}
                      </>
                    )}
                  </div>
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
