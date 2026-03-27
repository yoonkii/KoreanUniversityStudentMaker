'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface KakaoMessage {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

interface KakaoMessagesProps {
  messages: KakaoMessage[];
  onDismiss: () => void;
}

const CHAR_PORTRAITS: Record<string, string> = {
  jaemin: '/assets/characters/jaemin/happy.png',
  soyeon: '/assets/characters/soyeon/neutral.png',
  minji: '/assets/characters/minji/neutral.png',
  hyunwoo: '/assets/characters/hyunwoo/neutral.png',
  'prof-kim': '/assets/characters/prof-kim/neutral.png',
};

export default function KakaoMessages({ messages, onDismiss }: KakaoMessagesProps) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount < messages.length) {
      const timer = setTimeout(() => setVisibleCount(v => v + 1), 800);
      return () => clearTimeout(timer);
    }
  }, [visibleCount, messages.length]);

  return (
    <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4 cursor-pointer" onClick={onDismiss}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-[#3B1E54] px-4 py-3 flex items-center justify-between">
          <span className="text-white/50 text-sm">←</span>
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <span className="font-bold text-white text-sm">카카오톡</span>
          </div>
          <div className="w-4" />
        </div>

        {/* Messages */}
        <div className="bg-[#1a1030] px-4 py-4 min-h-[280px] max-h-[55vh] overflow-y-auto flex flex-col gap-4">
          {messages.slice(0, visibleCount).map((msg, i) => (
            <div
              key={i}
              className="flex gap-3 items-start"
              style={{
                animation: 'kakao-slide-up 0.3s ease-out',
              }}
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

        {/* Bottom bar */}
        <div className="bg-[#1a1030] border-t border-white/10 px-4 py-3 flex items-center gap-2">
          <div className="flex-1 bg-white/5 rounded-full px-4 py-2 text-sm text-white/30 border border-white/10">
            메시지를 입력하세요...
          </div>
          <button
            onClick={onDismiss}
            className="bg-teal/80 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-teal transition-colors active:scale-[0.96]"
          >
            확인
          </button>
        </div>
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
  stats: { stress: number; social: number; gpa: number },
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
  if (stats.gpa < 40 && currentWeek >= 4) {
    messages.push({ senderId: 'prof-kim', senderName: '김 교수님', text: '학생, 성적이 걱정됩니다. 면담 시간에 한번 와주세요.', timestamp: '방금', isRead: false });
  }
  return messages;
}
