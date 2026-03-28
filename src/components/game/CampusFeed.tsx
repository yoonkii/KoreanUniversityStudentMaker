'use client';

import { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { generateRumors } from '@/lib/rumorSystem';
import { logAIThought } from '@/lib/aiThoughtsLog';

interface FeedPost {
  id: string;
  author: string;
  authorEmoji: string;
  text: string;
  likes: number;
  timeAgo: string;
  isAnonymous: boolean;
  type: 'gossip' | 'question' | 'complaint' | 'flex' | 'npc';
}

interface CampusFeedProps {
  onClose: () => void;
}

const POST_TEMPLATES: FeedPost[] = [
  // Anonymous campus posts (feel like real 에브리타임)
  { id: 't1', author: '익명', authorEmoji: '🐱', text: '오늘 학식 진짜 맛없었다... 3900원 아까워', likes: 23, timeAgo: '3분 전', isAnonymous: true, type: 'complaint' },
  { id: 't2', author: '익명', authorEmoji: '🐶', text: '도서관 3층 조용한 줄 알았는데 커플이 대화함 ㅋㅋ', likes: 45, timeAgo: '12분 전', isAnonymous: true, type: 'complaint' },
  { id: 't3', author: '익명', authorEmoji: '🦊', text: '이번 학기 A+ 목표인 사람? 혼자 하기 외로운데 스터디 할 사람 🙋', likes: 12, timeAgo: '28분 전', isAnonymous: true, type: 'question' },
  { id: 't4', author: '익명', authorEmoji: '🐰', text: '캠퍼스 벚꽃 진짜 예쁘다... 사진 찍으러 가야지', likes: 67, timeAgo: '1시간 전', isAnonymous: true, type: 'flex' },
  { id: 't5', author: '익명', authorEmoji: '🐻', text: '알바 끝나고 수업 가는 건 진짜 힘든 일이다', likes: 89, timeAgo: '2시간 전', isAnonymous: true, type: 'complaint' },
  { id: 't6', author: '익명', authorEmoji: '🐧', text: '카페 바리스타 선배 진짜 잘생겼다... 매일 아아 사러 감', likes: 34, timeAgo: '3시간 전', isAnonymous: true, type: 'gossip' },
  { id: 't7', author: '익명', authorEmoji: '🐸', text: '중간고사 한 달 남았는데 아직 1장도 안 읽음 ㅋㅋㅋ', likes: 156, timeAgo: '5시간 전', isAnonymous: true, type: 'complaint' },
  { id: 't8', author: '익명', authorEmoji: '🦁', text: '동아리 MT 때 고백한 커플이 벌써 헤어졌대 ㅋㅋ', likes: 78, timeAgo: '6시간 전', isAnonymous: true, type: 'gossip' },
];

// NPC posts based on their personality
const NPC_POSTS: Record<string, string[]> = {
  jaemin: ['오늘 치킨 먹을 사람?? 기숙사 로비 7시!! 🍗', '새로 나온 게임 해봤는데 대박이다 ㅋㅋ', '야 시험 범위 아는 사람??'],
  minji: ['도서관 5층 창가 자리 내꺼임. 오지 마세요.', '오늘 공부 12시간 달성 💪', '과제 퀄리티에 대한 나의 기준은 타협 불가.'],
  soyeon: ['후배들~ 다음 주 학과 MT 신청 잊지 마세요! 💛', '카페 신메뉴 추천: 딸기 라떼 🍓', '졸업 전에 하고 싶은 일 리스트 업데이트 중...'],
  hyunwoo: ['이번 주 금요일 동아리 공연! 다들 와줘 🎸', '새벽 작업 중... 음악은 밤에 더 잘 된다', '누가 기타 줄 좀 빌려줄 수 있어?'],
};

export default function CampusFeed({ onClose }: CampusFeedProps) {
  const stats = useGameStore((s) => s.stats);
  const currentWeek = useGameStore((s) => s.currentWeek);
  const relationships = useGameStore((s) => s.relationships);
  const player = useGameStore((s) => s.player);

  // Generate contextual feed
  const posts = useMemo(() => {
    const feed: FeedPost[] = [];
    const NPC_KO: Record<string, string> = { jaemin: '이재민', minji: '한민지', soyeon: '박소연', hyunwoo: '정현우' };
    const NPC_EMOJI: Record<string, string> = { jaemin: '🏠', minji: '📚', soyeon: '💛', hyunwoo: '🎸' };

    // Add NPC posts for NPCs the player knows
    for (const [id, rel] of Object.entries(relationships)) {
      if ((rel.friendship ?? rel.affection ?? 0) >= 20 && NPC_POSTS[id]) {
        const lines = NPC_POSTS[id];
        const line = lines[currentWeek % lines.length];
        feed.push({
          id: `npc-${id}`,
          author: NPC_KO[id] ?? id,
          authorEmoji: NPC_EMOJI[id] ?? '👤',
          text: line,
          likes: 10 + Math.floor(Math.random() * 50),
          timeAgo: `${1 + Math.floor(Math.random() * 5)}시간 전`,
          isAnonymous: false,
          type: 'npc',
        });
      }
    }

    // Add rumor-based posts
    const rumors = generateRumors(currentWeek, stats, relationships);
    for (const rumor of rumors.slice(0, 2)) {
      feed.push({
        id: `rumor-${rumor.id}`,
        author: '익명',
        authorEmoji: '👀',
        text: rumor.text,
        likes: 20 + Math.floor(Math.random() * 80),
        timeAgo: `${2 + Math.floor(Math.random() * 8)}시간 전`,
        isAnonymous: true,
        type: 'gossip',
      });
    }

    // Fill with random campus posts
    const shuffled = [...POST_TEMPLATES].sort(() => Math.random() - 0.5);
    const toAdd = shuffled.slice(0, 4);
    feed.push(...toAdd);

    // Sort by "recency" (type priority)
    return feed.sort(() => Math.random() - 0.5).slice(0, 8);
  }, [currentWeek, relationships, stats]);

  useEffect(() => {
    logAIThought('campus', '에브리타임 피드 생성', `${posts.length}개 포스트 (NPC + 루머 + 익명)`);
  }, [posts.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="w-full max-w-md max-h-[80vh] bg-[#0f1923] rounded-2xl border border-white/10 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-teal/5">
          <div className="flex items-center gap-2">
            <span className="text-lg">📱</span>
            <h3 className="text-sm font-bold text-white">에브리타임</h3>
            <span className="text-[9px] text-teal/60 px-1.5 py-0.5 rounded bg-teal/10">우리 학교</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white cursor-pointer">×</button>
        </div>

        {/* Posts */}
        <div className="overflow-y-auto max-h-[65vh] divide-y divide-white/5">
          {posts.map((post) => (
            <div key={post.id} className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm">{post.authorEmoji}</span>
                <span className={`text-xs font-medium ${post.type === 'npc' ? 'text-teal' : 'text-white/50'}`}>
                  {post.author}
                </span>
                {post.isAnonymous && <span className="text-[8px] text-white/20 px-1 py-0.5 rounded bg-white/5">익명</span>}
                <span className="text-[9px] text-white/20 ml-auto">{post.timeAgo}</span>
              </div>
              <p className="text-sm text-white/80 leading-relaxed">{post.text}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] text-white/25">❤️ {post.likes}</span>
                <span className="text-[10px] text-white/25">💬 {Math.floor(post.likes * 0.3)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/5 text-center">
          <p className="text-[9px] text-white/15">{player?.name}님의 {currentWeek}주차 피드</p>
        </div>
      </div>
    </div>
  );
}
