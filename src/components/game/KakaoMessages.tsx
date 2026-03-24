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

// Map character IDs to available portrait assets
const CHAR_PORTRAITS: Record<string, string> = {
  jaemin: '/assets/characters/jaemin/happy.png',
  soyeon: '/assets/characters/soyeon/neutral.png',
  minji: '/assets/characters/minji/neutral.png',
  hyunwoo: '/assets/characters/hyunwoo/neutral.png',
  'prof-kim': '/assets/characters/prof-kim/neutral.png',
  minsu: '/assets/characters/jaemin/laughing.png',
  jiwon: '/assets/characters/minji/neutral.png',
  dongho: '/assets/characters/jaemin/neutral.png',
  yuna: '/assets/characters/minji/happy.png',
  taehyun: '/assets/characters/boss/neutral.png',
};

function getTimeString(): string {
  const h = Math.floor(Math.random() * 12) + 8;
  const m = Math.floor(Math.random() * 60);
  return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}`;
}

export default function KakaoMessages({ messages, onDismiss }: KakaoMessagesProps) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount < messages.length) {
      const timer = setTimeout(() => {
        setVisibleCount(v => v + 1);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [visibleCount, messages.length]);

  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#B2C7D9] rounded-2xl overflow-hidden shadow-2xl">
        {/* KakaoTalk header */}
        <div className="bg-[#B2C7D9] px-4 py-3 flex items-center justify-between">
          <button onClick={onDismiss} className="text-gray-600 text-sm">←</button>
          <span className="font-bold text-gray-800 text-sm">카카오톡</span>
          <div className="w-4" />
        </div>

        {/* Messages */}
        <div className="bg-[#B2C7D9] px-4 py-3 min-h-[300px] max-h-[60vh] overflow-y-auto flex flex-col gap-3">
          {messages.slice(0, visibleCount).map((msg, i) => (
            <div key={i} className="flex gap-2 items-start animate-slide-up">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                {CHAR_PORTRAITS[msg.senderId] ? (
                  <Image
                    src={CHAR_PORTRAITS[msg.senderId]}
                    alt={msg.senderName}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500">
                    {msg.senderName[0]}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-600 font-medium">{msg.senderName}</span>
                <div className="flex items-end gap-1">
                  <div className="bg-white rounded-xl rounded-tl-none px-3 py-2 text-sm text-gray-800 max-w-[250px] shadow-sm">
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-gray-500 flex-shrink-0">{msg.timestamp}</span>
                </div>
              </div>
            </div>
          ))}

          {visibleCount < messages.length && (
            <div className="flex gap-1 justify-center py-2">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="bg-white px-4 py-3 flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-400">
            메시지를 입력하세요...
          </div>
          <button
            onClick={onDismiss}
            className="bg-[#FEE500] text-gray-800 px-4 py-2 rounded-full text-sm font-bold hover:bg-[#FDD835] transition-colors"
          >
            확인
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}

/**
 * Generate context-aware KakaoTalk messages based on game state.
 * Called between weeks to simulate NPC messaging.
 */
export function generateKakaoMessages(
  currentWeek: number,
  relationships: Record<string, { affection: number }>,
  stats: { stress: number; social: number; gpa: number },
): KakaoMessage[] {
  const messages: KakaoMessage[] = [];

  // Roommate always messages
  if (currentWeek >= 2) {
    const stressMsg = stats.stress > 60
      ? '야 너 요즘 너무 무리하는 거 아니야? 오늘 치킨이나 시키자 🍗'
      : '이번 주 동아리 MT 간다면서? 나도 갈건데 ㅋㅋ';
    messages.push({
      senderId: 'jaemin',
      senderName: '김민수 (룸메)',
      text: stressMsg,
      timestamp: getTimeString(),
      isRead: false,
    });
  }

  // High-affection NPCs message
  for (const [charId, rel] of Object.entries(relationships)) {
    if (rel.affection >= 50 && Math.random() < 0.5) {
      const texts: Record<string, string[]> = {
        soyeon: ['오늘 알바 끝나고 편의점 앞에서 하늘 봤는데 예뻤어', '다음에 같이 공부할래? 시험 범위 모르겠어...'],
        minji: ['교수님이 다음 주 과제 내신다는데 들었어?', '도서관 자리 맡아놨는데 올래?'],
        hyunwoo: ['후배야, 다음 주에 밥 한번 먹자. 조언해줄 거 있어', '취업 설명회 같이 갈 사람?'],
      };
      const charTexts = texts[charId] ?? ['잘 지내?'];
      messages.push({
        senderId: charId,
        senderName: charId === 'soyeon' ? '한소연' : charId === 'hyunwoo' ? '박현우 선배' : charId,
        text: charTexts[Math.floor(Math.random() * charTexts.length)],
        timestamp: getTimeString(),
        isRead: false,
      });
    }
  }

  // Low-GPA warning from professor
  if (stats.gpa < 40 && currentWeek >= 4) {
    messages.push({
      senderId: 'prof-kim',
      senderName: '김서영 교수님',
      text: '학생, 성적이 걱정됩니다. 다음 주 면담 시간에 한번 와주세요.',
      timestamp: getTimeString(),
      isRead: false,
    });
  }

  return messages;
}
