"use client";

import { useRouter } from "next/navigation";
import { useGameStore } from "@/stores/game-store";
import { useGameStore as useLegacyStore } from "@/store/gameStore";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const gamePhase = useGameStore((s) => s.gamePhase);
  const resetGame = useGameStore((s) => s.resetGame);
  const legacyReset = useLegacyStore((s) => s.resetGame);
  const legacyPlayer = useLegacyStore((s) => s.player);

  const handleNewGame = () => {
    resetGame();
    legacyReset();
    router.push("/create");
  };

  const handleContinue = () => {
    router.push("/game");
  };

  const canContinue = gamePhase === "playing" || legacyPlayer !== null;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background — campus sunset with dark overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/backgrounds/campus/sunset.png"
          alt="Campus at sunset"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a]/70 to-[#0a0e1a]/30" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 z-5 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10 animate-float"
            style={{
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Character silhouettes at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center items-end pointer-events-none">
        <div className="relative w-32 h-48 opacity-40 -mr-4 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <Image
            src="/assets/characters/soyeon/neutral.png"
            alt=""
            fill
            className="object-contain object-bottom"
          />
        </div>
        <div className="relative w-40 h-56 opacity-50 z-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Image
            src="/assets/characters/jaemin/happy.png"
            alt=""
            fill
            className="object-contain object-bottom"
          />
        </div>
        <div className="relative w-32 h-48 opacity-40 -ml-4 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
          <Image
            src="/assets/characters/minji/neutral.png"
            alt=""
            fill
            className="object-contain object-bottom"
          />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center flex flex-col items-center gap-6 animate-fade-in-up">
          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight drop-shadow-2xl">
            한국 대학생 메이커
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-md leading-relaxed">
            학점, 인간관계, 알바, 연애, 취업...
            <br />
            <span className="text-white/90 font-medium">당신의 대학 4년, 지금 시작됩니다</span>
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-3 w-72 mt-6">
            <button
              onClick={handleNewGame}
              className="w-full py-4 bg-white/15 backdrop-blur-md text-white rounded-2xl font-bold text-lg
                         border border-white/20 hover:bg-white/25 hover:border-white/40
                         shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]
                         transition-all duration-300 active:scale-[0.97]"
            >
              새 게임
            </button>

            {canContinue && (
              <button
                onClick={handleContinue}
                className="w-full py-4 bg-white/5 backdrop-blur-md text-white/80 rounded-2xl font-bold text-lg
                           border border-white/10 hover:bg-white/15 hover:text-white hover:border-white/25
                           transition-all duration-300 active:scale-[0.97]"
              >
                이어하기
              </button>
            )}
          </div>

          {/* Subtle tagline */}
          <p className="text-xs text-white/30 mt-8 tracking-wider">
            AI-DRIVEN EMERGENT UNIVERSITY LIFE SIMULATOR
          </p>
        </div>
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-20px) translateX(5px); opacity: 0.8; }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; opacity: 0; }
      `}</style>
    </div>
  );
}
