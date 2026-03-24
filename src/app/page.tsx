"use client";

import { useRouter } from "next/navigation";
import { useGameStore } from "@/stores/game-store";

export default function Home() {
  const router = useRouter();
  const gamePhase = useGameStore((s) => s.gamePhase);
  const resetGame = useGameStore((s) => s.resetGame);

  const handleNewGame = () => {
    resetGame();
    router.push("/create");
  };

  const handleContinue = () => {
    router.push("/game");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 flex items-center justify-center">
      <div className="text-center flex flex-col items-center gap-8">
        <div className="text-8xl">🎓</div>
        <h1 className="text-5xl font-bold text-gray-800 tracking-tight">
          한국 대학생 메이커
        </h1>
        <p className="text-xl text-gray-500 max-w-md">
          학점, 인간관계, 알바, 연애, 취업...
          <br />
          당신의 대학 생활, 어떻게 보내시겠습니까?
        </p>

        <div className="flex flex-col gap-3 w-64 mt-4">
          <button
            onClick={handleNewGame}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
          >
            새 게임
          </button>

          {gamePhase === "playing" && (
            <button
              onClick={handleContinue}
              className="w-full py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg border-2 border-indigo-200 hover:border-indigo-400 transition-all active:scale-[0.98]"
            >
              이어하기
            </button>
          )}
        </div>

        <div className="text-xs text-gray-400 mt-8">
          Princess Maker + Rimworld + Persona
          <br />
          AI-Driven Emergent University Life Simulator
        </div>
      </div>
    </div>
  );
}
