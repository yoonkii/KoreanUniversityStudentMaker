'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { PlayerStats, KakaoReplyOption } from '@/store/types';

interface KakaoMessage {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

interface ReplyData {
  repliedTo: string;
  affectionChange: number;
  statEffects?: Partial<PlayerStats>;
  ignoredNpcs: string[];
}

interface KakaoMessagesProps {
  messages: KakaoMessage[];
  onDismiss: (replyData?: ReplyData) => void;
}

const CHAR_PORTRAITS: Record<string, string> = {
  jaemin: '/assets/characters/jaemin/happy.png',
  soyeon: '/assets/characters/soyeon/neutral.png',
  minji: '/assets/characters/minji/neutral.png',
  hyunwoo: '/assets/characters/hyunwoo/neutral.png',
  'prof-kim': '/assets/characters/prof-kim/neutral.png',
};

const NPC_REPLY_OPTIONS: Record<string, KakaoReplyOption[]> = {
  jaemin: [
    { id: 'jaemin-1', text: 'ㅋㅋ 치킨 시키자!', affectionChange: 5, statEffects: { money: -10000 } },
    { id: 'jaemin-2', text: '미안 바빠서...', affectionChange: 1 },
    { id: 'jaemin-3', text: '야 진짜 힘들어. 얘기하자.', affectionChange: 8, statEffects: { stress: -5 } },
  ],
  soyeon: [
    { id: 'soyeon-1', text: '네! 같이 먹어요 😊', affectionChange: 5 },
    { id: 'soyeon-2', text: '요즘 좀 바빠서...', affectionChange: 1 },
  ],
  minji: [
    { id: 'minji-1', text: '응 확인했어. 같이 하자!', affectionChange: 5, statEffects: { knowledge: 1 } },
    { id: 'minji-2', text: '아직 안 봤는데...', affectionChange: 1 },
  ],
  hyunwoo: [
    { id: 'hyunwoo-1', text: '좋아요 선배!', affectionChange: 5, statEffects: { money: -10000 } },
    { id: 'hyunwoo-2', text: '요즘 좀 바빠요...', affectionChange: 1 },
  ],
};

interface SelectedReply {
  npcId: string;
  option: KakaoReplyOption;
}

export default function KakaoMessages({ messages, onDismiss }: KakaoMessagesProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [replyPhase, setReplyPhase] = useState(false);
  const [selectedReply, setSelectedReply] = useState<SelectedReply | null>(null);

  const allMessagesShown = visibleCount >= messages.length;

  useEffect(() => {
    if (visibleCount < messages.length) {
      const timer = setTimeout(() => setVisibleCount(v => v + 1), 800);
      return () => clearTimeout(timer);
    }
  }, [visibleCount, messages.length]);

  const handleReplySelect = (npcId: string, option: KakaoReplyOption) => {
    setSelectedReply({ npcId, option });
  };

  const handleSend = () => {
    if (!selectedReply) return;
    const ignoredNpcs = messages
      .map(m => m.senderId)
      .filter(id => id !== selectedReply.npcId && id !== 'prof-kim');
    onDismiss({
      repliedTo: selectedReply.npcId,
      affectionChange: selectedReply.option.affectionChange,
      statEffects: selectedReply.option.statEffects,
      ignoredNpcs: [...new Set(ignoredNpcs)],
    });
  };

  const handleDismissOrReply = () => {
    if (allMessagesShown && !replyPhase && messages.length > 0) {
      setReplyPhase(true);
    } else if (!replyPhase || messages.length === 0) {
      onDismiss();
    }
  };

  const truncate = (text: string, max: number) =>
    text.length > max ? text.slice(0, max) + '...' : text;

  // Filter NPCs that have reply options (exclude prof-kim)
  const replyableMessages = messages.filter(m => NPC_REPLY_OPTIONS[m.senderId]);

  return (
    <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-[#3B1E54] px-4 py-3 flex items-center justify-between">
          <span className="text-white/50 text-sm">←</span>
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <span className="font-bold text-white text-sm">
              {replyPhase ? '답장 선택' : '카카오톡'}
            </span>
          </div>
          <div className="w-4" />
        </div>

        {!replyPhase ? (
          <>
            {/* Messages */}
            <div className="bg-[#1a1030] px-4 py-4 min-h-[280px] max-h-[55vh] overflow-y-auto flex flex-col gap-4">
              {messages.slice(0, visibleCount).map((msg, i) => (
                <div
                  key={i}
                  className="flex gap-3 items-start"
                  style={{ animation: 'kakao-slide-up 0.3s ease-out' }}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-white/10 border border-white/10">
                    {CHAR_PORTRAITS[msg.senderId] ? (
                      <Image
                        src={CHAR_PORTRAITS[msg.senderId]}
                        alt={msg.senderName}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white/50">
                        {msg.senderName[0]}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <span className="text-xs text-white/50 font-medium">{msg.senderName}</span>
                    <div className="flex items-end gap-2">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl rounded-tl-none px-3.5 py-2.5 text-sm text-white/90 max-w-[240px] border border-white/5">
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-white/30 flex-shrink-0 pb-0.5">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {visibleCount < messages.length && (
                <div className="flex gap-1.5 justify-center py-2">
                  <div className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>

            {/* Bottom bar - message phase */}
            <div className="bg-[#1a1030] border-t border-white/10 px-4 py-3 flex items-center gap-2">
              <div className="flex-1 bg-white/5 rounded-full px-4 py-2 text-sm text-white/30 border border-white/10">
                메시지를 입력하세요...
              </div>
              <button
                onClick={handleDismissOrReply}
                className="bg-teal/80 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-teal transition-colors active:scale-[0.96]"
              >
                {allMessagesShown && messages.length > 0 ? '답장하기' : '확인'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Reply phase */}
            <div className="bg-[#1a1030] px-3 py-4 min-h-[280px] max-h-[55vh] overflow-y-auto flex flex-col gap-3">
              {replyableMessages.length === 0 ? (
                <div className="text-center text-white/40 text-sm py-8">
                  답장할 수 있는 메시지가 없습니다.
                </div>
              ) : (
                replyableMessages.map((msg) => {
                  const options = NPC_REPLY_OPTIONS[msg.senderId] ?? [];
                  const isSelected = selectedReply?.npcId === msg.senderId;
                  const isOtherSelected = selectedReply !== null && !isSelected;

                  return (
                    <div
                      key={msg.senderId}
                      className={`rounded-xl border p-3 transition-all duration-200 ${
                        isSelected
                          ? 'border-teal/60 bg-teal/10'
                          : isOtherSelected
                            ? 'border-white/5 bg-white/[0.02] opacity-40'
                            : 'border-white/10 bg-white/5'
                      }`}
                    >
                      {/* NPC header */}
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-white/10 border border-white/10">
                          {CHAR_PORTRAITS[msg.senderId] ? (
                            <Image
                              src={CHAR_PORTRAITS[msg.senderId]}
                              alt={msg.senderName}
                              width={32}
                              height={32}
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white/50">
                              {msg.senderName[0]}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-white/70">{msg.senderName}</div>
                          <div className="text-[11px] text-white/30 truncate">
                            {truncate(msg.text, 30)}
                          </div>
                        </div>
                      </div>

                      {/* Reply options */}
                      <div className="flex flex-col gap-1.5">
                        {options.map((opt) => {
                          const isThisSelected = selectedReply?.npcId === msg.senderId && selectedReply?.option.id === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => !isOtherSelected && handleReplySelect(msg.senderId, opt)}
                              disabled={isOtherSelected}
                              className={`text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                                isThisSelected
                                  ? 'bg-teal/30 text-white border border-teal/50'
                                  : isOtherSelected
                                    ? 'bg-white/[0.03] text-white/20 border border-transparent cursor-not-allowed'
                                    : 'bg-white/[0.06] text-white/80 border border-white/5 hover:bg-white/10 hover:border-white/15 active:scale-[0.98]'
                              }`}
                            >
                              {opt.text}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom bar - reply phase */}
            <div className="bg-[#1a1030] border-t border-white/10 px-4 py-3 flex items-center gap-2">
              <button
                onClick={() => {
                  setReplyPhase(false);
                  setSelectedReply(null);
                }}
                className="text-white/40 px-4 py-2 rounded-full text-sm hover:text-white/60 transition-colors"
              >
                뒤로
              </button>
              <div className="flex-1" />
              {selectedReply ? (
                <button
                  onClick={handleSend}
                  className="bg-teal text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-teal/90 transition-colors active:scale-[0.96] animate-pulse"
                >
                  보내기
                </button>
              ) : (
                <button
                  onClick={() => onDismiss()}
                  className="text-white/30 px-5 py-2 rounded-full text-sm border border-white/10 hover:text-white/50 transition-colors"
                >
                  무시하기
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes kakao-slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export function generateKakaoMessages(
  currentWeek: number,
  relationships: Record<string, { affection: number }>,
  stats: { stress: number; social: number; knowledge: number },
): KakaoMessage[] {
  const messages: KakaoMessage[] = [];
  if (currentWeek >= 2) {
    const stressMsg = stats.stress > 60
      ? '야 너 요즘 너무 무리하는 거 아니야? 오늘 치킨이나 시키자 🍗'
      : '이번 주 동아리 모임 간다면서? 나도 갈건데 ㅋㅋ';
    messages.push({ senderId: 'jaemin', senderName: '이재민 (룸메)', text: stressMsg, timestamp: '방금', isRead: false });
  }
  for (const [charId, rel] of Object.entries(relationships)) {
    if (rel.affection >= 50 && charId !== 'jaemin') {
      const texts: Record<string, string> = {
        soyeon: '다음에 같이 밥 먹어요!',
        minji: '다음 수업 과제 확인했어?',
        hyunwoo: '후배야, 다음 주에 밥 한번 먹자.',
      };
      messages.push({ senderId: charId, senderName: charId === 'soyeon' ? '박소연' : charId === 'minji' ? '최민지' : '김현우', text: texts[charId] ?? '잘 지내?', timestamp: '방금', isRead: false });
    }
  }
  if (stats.knowledge < 40 && currentWeek >= 4) {
    messages.push({ senderId: 'prof-kim', senderName: '김 교수님', text: '학생, 성적이 걱정됩니다. 면담 시간에 한번 와주세요.', timestamp: '방금', isRead: false });
  }
  return messages;
}
