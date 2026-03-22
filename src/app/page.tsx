'use client';

import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';

export default function TitleScreen() {
  const { gameStarted, resetGame } = useGameStore();

  return (
    <div className="min-h-[100dvh] bg-navy flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="/assets/backgrounds/campus/sunset.png"
          alt=""
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent" />
      </div>

      {/* Decorative floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-teal/10 blur-3xl animate-float" />
      <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-pink/10 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

      {/* Title & Menu */}
      <div className="relative z-10 text-center space-y-8 px-4 animate-fade-in-up">
        <div className="space-y-3">
          <p className="text-sm tracking-widest text-teal uppercase">Korean University Student Maker</p>
          <h1 className="text-5xl md:text-7xl font-bold text-txt-primary tracking-tight leading-tight break-keep">
            대학생 만들기
          </h1>
          <p className="text-lg text-txt-secondary max-w-md mx-auto break-keep leading-relaxed">
            당신만의 대학 생활 이야기를 만들어보세요
          </p>
        </div>

        <div className="glass-strong rounded-2xl max-w-sm mx-auto p-8 space-y-4">
          <Link href="/character-creation" onClick={() => resetGame()}>
            <button className="w-full bg-teal hover:bg-teal/90 text-navy font-bold py-4 px-6 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-lg">
              새 게임 시작
            </button>
          </Link>

          {gameStarted && (
            <Link href="/game">
              <button className="w-full glass text-txt-primary font-semibold py-4 px-6 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] mt-4">
                이어하기
              </button>
            </Link>
          )}
        </div>

        <p className="text-xs text-txt-secondary/50">
          AI-Powered Visual Novel &middot; v0.1.0
        </p>
      </div>
    </div>
  );
}
