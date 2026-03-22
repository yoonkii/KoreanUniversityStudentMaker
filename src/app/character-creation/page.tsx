'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import type { Gender } from '@/store/types';

const MAJORS = [
  '컴퓨터공학과', '경영학과', '심리학과', '디자인학과',
  '영문학과', '기계공학과', '생명과학과', '법학과',
];

export default function CharacterCreation() {
  const router = useRouter();
  const { createPlayer, setPhase } = useGameStore();

  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('female');
  const [major, setMajor] = useState('컴퓨터공학과');

  const handleStart = () => {
    if (!name.trim()) return;
    createPlayer({ name: name.trim(), gender, major });
    setPhase('planning');
    router.push('/game');
  };

  const portraitSrc = `/assets/characters/player/neutral-${gender}.png`;

  return (
    <div className="min-h-[100dvh] bg-navy flex items-center justify-center p-4 relative">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="/assets/backgrounds/dorm/clean.png"
          alt=""
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/40" />
      </div>

      <div className="relative z-10 glass-strong rounded-2xl max-w-3xl w-full p-8 md:p-12 animate-fade-in-up">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Portrait Preview */}
          <div className="flex-shrink-0 flex flex-col items-center gap-4">
            <div className="w-48 h-64 md:w-56 md:h-72 rounded-2xl overflow-hidden glass">
              <img
                src={portraitSrc}
                alt="Player character"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-txt-secondary">미리보기</p>
          </div>

          {/* Form */}
          <div className="flex-1 space-y-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-txt-primary tracking-tight break-keep">
                캐릭터 생성
              </h2>
              <p className="text-txt-secondary mt-2 break-keep leading-relaxed">
                새 학기가 시작됩니다. 당신은 누구인가요?
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-txt-secondary mb-2">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                className="w-full bg-surface-light text-txt-primary px-4 py-3 rounded-xl border border-white/10 focus:border-teal/50 focus:outline-none transition-colors placeholder:text-txt-secondary/50"
                placeholder="이름을 입력하세요"
                maxLength={10}
                autoFocus
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-semibold text-txt-secondary mb-2">성별</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setGender('female')}
                  className={`py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                    gender === 'female'
                      ? 'bg-pink text-white shadow-lg shadow-pink/20'
                      : 'glass text-txt-secondary hover:text-txt-primary'
                  }`}
                >
                  여성
                </button>
                <button
                  onClick={() => setGender('male')}
                  className={`py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                    gender === 'male'
                      ? 'bg-teal text-white shadow-lg shadow-teal/20'
                      : 'glass text-txt-secondary hover:text-txt-primary'
                  }`}
                >
                  남성
                </button>
              </div>
            </div>

            {/* Major */}
            <div>
              <label className="block text-sm font-semibold text-txt-secondary mb-2">전공</label>
              <div className="grid grid-cols-2 gap-2">
                {MAJORS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMajor(m)}
                    className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                      major === m
                        ? 'bg-lavender/20 text-lavender border border-lavender/30'
                        : 'glass text-txt-secondary hover:text-txt-primary'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Start */}
            <button
              onClick={handleStart}
              disabled={!name.trim()}
              className="w-full bg-teal hover:bg-teal/90 disabled:bg-surface-light disabled:text-txt-secondary text-navy font-bold py-4 px-6 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:hover:scale-100 text-lg"
            >
              입학하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
