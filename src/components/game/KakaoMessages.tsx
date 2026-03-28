'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { PlayerStats, KakaoReplyOption } from '@/store/types';
import { useGameStore } from '@/store/gameStore';
import { logAIThought } from '@/lib/aiThoughtsLog';

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
  affectionType: 'friendship' | 'romance';
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

// isGift flag marks gift replies → these boost romance instead of friendship
const NPC_REPLY_OPTIONS: Record<string, (KakaoReplyOption & { isGift?: boolean })[]> = {
  jaemin: [
    { id: 'jaemin-1', text: 'ㅋㅋ 치킨 시키자!', affectionChange: 2, statEffects: { money: -10000 } },
    { id: 'jaemin-2', text: '미안 바빠서...', affectionChange: 0 },
    { id: 'jaemin-3', text: '야 진짜 힘들어. 얘기하자.', affectionChange: 3, statEffects: { stress: -5 } },
    { id: 'jaemin-gift', text: '🎁 선물 보내기 (게임 기프티콘)', affectionChange: 2, statEffects: { money: -25000 }, isGift: true },
  ],
  soyeon: [
    { id: 'soyeon-1', text: '네! 같이 먹어요 😊', affectionChange: 2 },
    { id: 'soyeon-2', text: '요즘 좀 바빠서...', affectionChange: 0 },
    { id: 'soyeon-gift', text: '🎁 선물 보내기 (카페 기프티콘)', affectionChange: 2, statEffects: { money: -20000 }, isGift: true },
  ],
  minji: [
    { id: 'minji-1', text: '응 확인했어. 같이 하자!', affectionChange: 2, statEffects: { knowledge: 1 } },
    { id: 'minji-2', text: '아직 안 봤는데...', affectionChange: 0 },
    { id: 'minji-gift', text: '🎁 선물 보내기 (문구 세트)', affectionChange: 2, statEffects: { money: -15000 }, isGift: true },
  ],
  hyunwoo: [
    { id: 'hyunwoo-1', text: '좋아요 선배!', affectionChange: 2, statEffects: { money: -10000 } },
    { id: 'hyunwoo-2', text: '요즘 좀 바빠요...', affectionChange: 0 },
    { id: 'hyunwoo-gift', text: '🎁 선물 보내기 (기타 피크)', affectionChange: 2, statEffects: { money: -18000 }, isGift: true },
  ],
};

interface SelectedReply {
  npcId: string;
  option: KakaoReplyOption;
}

export default function KakaoMessages({ messages, onDismiss }: KakaoMessagesProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [replyPhase, setReplyPhase] = useState(false);
  const [freeformInput, setFreeformInput] = useState('');
  const [aiChatting, setAiChatting] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ from: 'me' | 'npc'; text: string; npcId?: string }[]>([]);
  const [selectedReply, setSelectedReply] = useState<SelectedReply | null>(null);
  const [sendingAnimation, setSendingAnimation] = useState<{ myMessage: string; npcResponse: string } | null>(null);

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

  // NPC response lines after receiving your message
  const NPC_RESPONSES: Record<string, string[]> = {
    jaemin: ['ㅋㅋㅋ 알겠어!', '오 좋아 좋아!', 'ㅎㅎ 고마워~', '야 진짜? 최고다!'],
    minji: ['알겠어.', '...응.', '고마워.', 'ㅋ 그래.'],
    soyeon: ['알겠어요~ 😊', '네! 기대할게요!', '고마워 후배야 💛'],
    hyunwoo: ['오 ㅋㅋ 좋지!', '알겠어 후배!', 'ㅎㅎ 역시!'],
  };

  const handleSend = () => {
    if (!selectedReply) return;
    // Show send animation
    const npcId = selectedReply.npcId;
    const responses = NPC_RESPONSES[npcId] ?? ['👍'];
    const npcResponse = responses[Math.floor(Math.random() * responses.length)];
    setSendingAnimation({ myMessage: selectedReply.option.text, npcResponse });
    setReplyPhase(false);

    // After animation, dismiss
    setTimeout(() => {
      const ignoredNpcs = messages
        .map(m => m.senderId)
        .filter(id => id !== npcId && id !== 'prof-kim');
      const replyOption = selectedReply.option as KakaoReplyOption & { isGift?: boolean };
      onDismiss({
        repliedTo: npcId,
        affectionChange: replyOption.affectionChange,
        affectionType: replyOption.isGift ? 'romance' : 'friendship',
        statEffects: replyOption.statEffects,
        ignoredNpcs: [...new Set(ignoredNpcs)],
      });
    }, 2500);
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

  // Free-form AI chat with NPC
  const handleFreeformSend = async () => {
    if (!freeformInput.trim() || aiChatting) return;
    const msg = freeformInput.trim();
    setFreeformInput('');

    // Find which NPC to chat with (first message sender)
    const targetNpc = messages[0];
    if (!targetNpc) return;

    setChatMessages(prev => [...prev, { from: 'me', text: msg }]);
    setAiChatting(true);

    const rels = useGameStore.getState().relationships;
    const rel = rels[targetNpc.senderId];
    const fr = rel?.friendship ?? rel?.affection ?? 0;
    const rom = rel?.romance ?? 0;
    const getFTier = (f: number) => f >= 80 ? '베프' : f >= 60 ? '절친' : f >= 40 ? '친구' : f >= 20 ? '아는사이' : '모르는사이';
    const getRTier = (r: number) => r >= 45 ? '연인' : r >= 25 ? '설렘' : r >= 10 ? '관심' : '없음';
    const stats = useGameStore.getState().stats;
    const week = useGameStore.getState().currentWeek;
    const player = useGameStore.getState().player;

    try {
      const res = await fetch('/api/ai/npc-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npcId: targetNpc.senderId,
          playerMessage: msg,
          playerName: player?.name ?? '학생',
          friendshipTier: getFTier(fr),
          romanceTier: getRTier(rom),
          playerStats: { knowledge: stats.knowledge, stress: stats.stress, charm: stats.charm },
          currentWeek: week,
          recentMemories: rel?.memories?.slice(-3),
        }),
        signal: AbortSignal.timeout(6000),
      });
      const data = await res.json();
      if (data.reply) {
        setChatMessages(prev => [...prev, { from: 'npc', text: data.reply, npcId: targetNpc.senderId }]);
        logAIThought('npc-brain', `${targetNpc.senderName}와 자유 대화`, `"${msg}" → "${data.reply}"`);
      }
    } catch {
      setChatMessages(prev => [...prev, { from: 'npc', text: '...', npcId: targetNpc.senderId }]);
    }
    setAiChatting(false);
  };

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

        {sendingAnimation ? (
          /* Send animation — shows your sent message + NPC typing + response */
          <div className="bg-[#1a1030] px-4 py-4 min-h-[280px] max-h-[55vh] flex flex-col justify-end gap-3">
            {/* Your sent message (right-aligned) */}
            <div className="flex justify-end animate-fade-in">
              <div className="bg-teal/30 backdrop-blur-sm rounded-xl rounded-tr-none px-3.5 py-2.5 text-sm text-white/90 max-w-[240px] border border-teal/20">
                {sendingAnimation.myMessage}
              </div>
            </div>
            {/* NPC typing indicator → response */}
            <div className="flex gap-3 items-start animate-fade-in" style={{ animationDelay: '0.8s', opacity: 0, animationFillMode: 'forwards' }}>
              <div className="w-8 h-8 rounded-lg bg-white/10 flex-shrink-0" />
              <div className="bg-white/10 backdrop-blur-sm rounded-xl rounded-tl-none px-3.5 py-2.5 text-sm text-white/90 border border-white/5">
                {sendingAnimation.npcResponse}
              </div>
            </div>
            {/* Read receipt */}
            <div className="text-right text-[9px] text-teal/50 animate-fade-in" style={{ animationDelay: '1.2s', opacity: 0, animationFillMode: 'forwards' }}>
              읽음 ✓
            </div>
          </div>
        ) : !replyPhase ? (
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

            {/* AI chat messages (free-form conversation) */}
            {chatMessages.length > 0 && (
              <div className="bg-[#1a1030] px-4 py-2 border-t border-white/5">
                {chatMessages.map((cm, i) => (
                  <div key={i} className={`flex ${cm.from === 'me' ? 'justify-end' : 'justify-start'} mb-2`}>
                    <div className={`px-3 py-2 rounded-xl max-w-[240px] text-sm ${
                      cm.from === 'me'
                        ? 'bg-teal/20 text-white/90 rounded-br-none'
                        : 'bg-white/10 text-white/80 rounded-bl-none'
                    }`}>
                      {cm.text}
                    </div>
                  </div>
                ))}
                {aiChatting && (
                  <div className="flex gap-1.5 py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            )}

            {/* Bottom bar - real input for free-form AI chat */}
            <div className="bg-[#1a1030] border-t border-white/10 px-4 py-3 flex items-center gap-2">
              <input
                type="text"
                value={freeformInput}
                onChange={(e) => setFreeformInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleFreeformSend(); }}
                placeholder="자유롭게 메시지를 입력하세요..."
                className="flex-1 bg-white/5 rounded-full px-4 py-2 text-sm text-white/90 border border-white/10 outline-none focus:border-teal/40 placeholder:text-white/30"
                disabled={aiChatting}
                onClick={(e) => e.stopPropagation()}
              />
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

// ─── Romance-aware message generation ───

const NPC_NAMES_KR: Record<string, string> = {
  jaemin: '이재민 (룸메)', minji: '한민지', soyeon: '박소연 선배', hyunwoo: '정현우 선배',
};

// NPC-specific messages by romance tier
const ROMANCE_MESSAGES: Record<string, Record<string, string[]>> = {
  jaemin: {
    interest: ['야 오늘 뭐해?ㅋㅋ 갑자기 궁금해서', '편의점 갈건데 뭐 사다줄까?'],
    crush: ['야... 어제 꿈에 네가 나왔어. 아 아무것도 아니야!!', '오늘 유독 네가 보고 싶더라. 왜 그런지는 모르겠어 ㅋㅋ'],
    dating: ['보고 싶어... 빨리 와 ♥', '오늘 너 올 때까지 기다리고 있을게. 빨리 와!'],
    deep_love: ['사랑해. 오늘도 내일도 모레도.', '옆에 없으면 잠이 안 와. 빨리 돌아와.'],
  },
  minji: {
    interest: ['다음 과제 같이 할래? ...시간 되면.', '오늘 도서관 몇 시에 와? 궁금해서 물어보는 거야.'],
    crush: ['...너 오늘 좀 달라 보였어. 아 아무것도 아니야.', '자꾸 네 자리 쪽을 보게 돼. 짜증나.'],
    dating: ['오늘 같이 공부하자. ...공부만 하는 건 아닐 수도 있지만.', '바보. 보고 싶었어. 빨리 와.'],
    deep_love: ['너 없으면 공부가 안 돼. 책임져.', '...사랑해. 이 말 치는 데 10분 걸렸어.'],
  },
  soyeon: {
    interest: ['후배~ 오늘 점심 같이 먹을래? 😊', '요즘 잘 지내? 얼굴 보고 싶다~'],
    crush: ['자꾸 네 생각이 나서... 선배로서 이러면 안 되는데.', '오늘 우연히 만났으면 좋겠다. 왜 그런지는 나도 몰라.'],
    dating: ['오늘 데이트 어디 갈까? 💕 선배가 맛집 찾아놨어~', '보고 싶어... 빨리 만나자 ♥'],
    deep_love: ['자기야~ 오늘도 사랑해 💗', '졸업해도 너한테 갈 거야. 기다려줘.'],
  },
  hyunwoo: {
    interest: ['후배, 다음 합주 때 와봐. 새 곡 들려줄게.', '오늘 기분이 좋아서 연락했어 ㅎㅎ'],
    crush: ['너 생각하면서 곡 하나 썼어. 들어볼래?', '요즘 자꾸 네가 떠올라. 영감인가 봐 ㅎ'],
    dating: ['오늘 연습 끝나고 만나자. 보고 싶어 ♥', '너를 위한 세레나데 준비 중 🎵'],
    deep_love: ['넌 내 음악이야. 사랑해.', '졸업 공연 때 무대에서 고백할 거야. 기대해 ♥'],
  },
};

// Friendship messages (existing behavior, expanded)
const FRIEND_MESSAGES: Record<string, Record<string, string[]>> = {
  jaemin: {
    acquaintance: ['이번 주 동아리 모임 간다면서? 나도 갈건데 ㅋㅋ'],
    friend: ['야 치킨 먹으러 가자! 🍗', '오늘 게임 한 판 할래? ㅋㅋ'],
    close_friend: ['야 솔직히 너 없으면 이 학기 못 버텨 ㅋㅋ', '오늘 고민 있는데 나중에 얘기 좀 하자.'],
    best_friend: ['야 우리 졸업해도 연락하자. 진심이야.', '네가 내 대학 생활 최고의 선택이야 ㅋㅋ'],
  },
  minji: {
    acquaintance: ['다음 수업 과제 확인했어?'],
    friend: ['스터디 할 건데 같이 할래?', '도서관 자리 맡아놨어. 올 거지?'],
    close_friend: ['...고마워. 네가 있어서 외롭지 않았어.', '너 아니었으면 공부만 했을 텐데.'],
    best_friend: ['앞으로도 계속 곁에 있어 줄 거지?', '처음엔 라이벌인 줄 알았는데. 지금은 달라.'],
  },
  soyeon: {
    acquaintance: ['다음에 같이 밥 먹어요!'],
    friend: ['후배~ 요즘 잘 지내? 밥 사줄게~', '뭐 고민 있으면 언제든 연락해~'],
    close_friend: ['우리 후배 기특해~ 잘 크고 있어 😊', '선배로서 자랑스러워. 진짜야.'],
    best_friend: ['졸업하면 정말 보고 싶을 거야...', '네가 내 대학 생활 최고의 후배야 💛'],
  },
  hyunwoo: {
    acquaintance: ['후배야, 다음 주에 밥 한번 먹자.'],
    friend: ['다음 공연 보러 와! 자리 맡아놓을게 🎵', '오늘 기분 좋다~ 같이 놀러 갈래?'],
    close_friend: ['너 때문에 동아리가 더 재밌어졌어.', '졸업 공연, 너한테 꼭 보여주고 싶어.'],
    best_friend: ['너를 위한 곡을 쓰고 있어 🎸', '네가 없는 동아리는 상상이 안 돼.'],
  },
};

// Jealousy messages when you're romancing multiple NPCs
const JEALOUSY_MESSAGES: Record<string, string[]> = {
  jaemin: ['야... 요즘 다른 애랑도 많이 노는 거 같던데?', '나 말고 누구 만나는 거 아니지...?'],
  minji: ['...요즘 바쁜가 보네. 다른 사람이랑.', '나한테 관심 없으면 솔직히 말해.'],
  soyeon: ['후배, 요즘 다른 사람 많이 만나더라...? 선배 마음이 좀 그래.', '나 말고 다른 사람도 있는 거야...?'],
  hyunwoo: ['요즘 누구 만나? 솔직히 좀 신경 쓰여.', '너 다른 사람한테도 그런 거야...?'],
};

export function generateKakaoMessages(
  currentWeek: number,
  relationships: Record<string, { affection: number; friendship?: number; romance?: number; lastDateWeek?: number }>,
  stats: { stress: number; social: number; knowledge: number },
): KakaoMessage[] {
  const messages: KakaoMessage[] = [];
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  // Helper: get friendship/romance tiers
  const getFTier = (f: number) => f >= 80 ? 'best_friend' : f >= 60 ? 'close_friend' : f >= 40 ? 'friend' : f >= 20 ? 'acquaintance' : 'stranger';
  const getRTier = (r: number) => r >= 70 ? 'deep_love' : r >= 45 ? 'dating' : r >= 25 ? 'crush' : r >= 10 ? 'interest' : 'none';

  // Count how many NPCs have romance ≥ 10 (for jealousy detection)
  const romancingNpcs = Object.entries(relationships).filter(([, r]) => (r.romance ?? 0) >= 10);

  for (const [charId, rel] of Object.entries(relationships)) {
    const name = NPC_NAMES_KR[charId];
    if (!name) continue;

    const fr = rel.friendship ?? rel.affection ?? 0;
    const rom = rel.romance ?? 0;
    const fTier = getFTier(fr);
    const rTier = getRTier(rom);

    // Skip strangers
    if (fTier === 'stranger' && rTier === 'none') continue;

    // Jaemin always messages (roommate)
    if (charId === 'jaemin' && currentWeek >= 2) {
      if (rTier !== 'none') {
        // Romance message from Jaemin
        const msgs = ROMANCE_MESSAGES.jaemin[rTier];
        if (msgs) {
          messages.push({ senderId: 'jaemin', senderName: name, text: pick(msgs), timestamp: '방금', isRead: false });
          continue;
        }
      }
      // Friendship/stress message
      const stressMsg = stats.stress > 60
        ? '야 너 요즘 너무 무리하는 거 아니야? 오늘 치킨이나 시키자 🍗'
        : pick(FRIEND_MESSAGES.jaemin[fTier] ?? FRIEND_MESSAGES.jaemin.acquaintance);
      messages.push({ senderId: 'jaemin', senderName: name, text: stressMsg, timestamp: '방금', isRead: false });
      continue;
    }

    // Other NPCs: romance messages take priority over friendship
    if (rTier !== 'none' && ROMANCE_MESSAGES[charId]?.[rTier]) {
      // Jealousy check: if romancing multiple NPCs, 30% chance of jealousy message
      if (romancingNpcs.length > 1 && rom >= 15 && Math.random() < 0.3 && JEALOUSY_MESSAGES[charId]) {
        messages.push({ senderId: charId, senderName: name, text: pick(JEALOUSY_MESSAGES[charId]), timestamp: '방금', isRead: false });
      } else {
        messages.push({ senderId: charId, senderName: name, text: pick(ROMANCE_MESSAGES[charId][rTier]), timestamp: '방금', isRead: false });
      }
      continue;
    }

    // Friendship messages (need at least acquaintance)
    if (fr >= 20 && FRIEND_MESSAGES[charId]?.[fTier]) {
      messages.push({ senderId: charId, senderName: name, text: pick(FRIEND_MESSAGES[charId][fTier]), timestamp: '방금', isRead: false });
    }
  }

  // Prof Kim warning
  if (stats.knowledge < 40 && currentWeek >= 4) {
    messages.push({ senderId: 'prof-kim', senderName: '김 교수님', text: '학생, 성적이 걱정됩니다. 면담 시간에 한번 와주세요.', timestamp: '방금', isRead: false });
  }

  return messages;
}
