"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/stores/game-store";
import { useGameStore as useLegacyStore } from "@/store/gameStore";
import type { MajorType } from "@/engine/types/stats";
import { MAJOR_LABELS } from "@/engine/types/stats";
import type { StorytellerMode } from "@/engine/types/story";
import type { DreamType } from "@/store/types";
import Image from "next/image";

const MAJORS: { type: MajorType; emoji: string; vibe: string; effect: string; statHint: string }[] = [
  { type: "engineering", emoji: "⚙️", vibe: "공과대학", effect: "수업의 준비도 효과 +20%. 민지와 같은 과!", statHint: "📚 준비도↑" },
  { type: "business", emoji: "📊", vibe: "경영대학", effect: "알바 수입 +20%. 네트워킹 효과 ↑", statHint: "💰 돈↑ 👥 인맥↑" },
  { type: "humanities", emoji: "📚", vibe: "인문대학", effect: "매력 성장 +20%. 소연 선배와 같은 과!", statHint: "✨ 매력↑" },
  { type: "arts", emoji: "🎨", vibe: "예술대학", effect: "동아리 효과 +20%. 현우 선배와 친해지기 쉬움!", statHint: "🎵 매력↑ 스트레스↓" },
];

const DREAMS: { id: string; label: string; emoji: string; hint: string; bonus: string; gameplay: string }[] = [
  { id: "scholar", label: "학자의 꿈", emoji: "🎓", hint: "최고의 학점으로 인정받고 싶다", bonus: "준비도 +10", gameplay: "공부 효과 ↑, 김 교수님과 친해지기 쉬움, 장학금 엔딩 가능" },
  { id: "social", label: "인맥왕", emoji: "🤝", hint: "캠퍼스에서 모르는 사람 없는 인싸", bonus: "인맥 +10, 매력 +5", gameplay: "친구/데이트 효과 ↑, 모든 NPC 친밀도 보너스, 로맨스 엔딩 유리" },
  { id: "balance", label: "갓생러", emoji: "⚖️", hint: "공부도 놀기도 운동도 다 잘하고 싶다", bonus: "체력 +5, 준비도 +3, 인맥 +3", gameplay: "콤보 보너스 ↑, 밸런스 엔딩 유리, 위기 저항력 ↑" },
  { id: "freedom", label: "마이웨이", emoji: "🌊", hint: "남의 눈치 안 보고 나만의 길", bonus: "스트레스 -10, 매력 +5", gameplay: "스트레스 회복 ↑, 탐험/자기관리 효과 ↑, 숨겨진 엔딩 해금 유리" },
];

export default function CreatePage() {
  const router = useRouter();
  const initializeGame = useGameStore((s) => s.initializeGame);
  const setGamePhase = useGameStore((s) => s.setGamePhase);
  const legacyCreatePlayer = useLegacyStore((s) => s.createPlayer);

  const [step, setStep] = useState(0); // 0: name+gender, 1: major, 2: dream, 3: confirm
  const [name, setName] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [major, setMajor] = useState<MajorType>("engineering");
  const [dream, setDream] = useState<string>("balance");

  const handleStart = () => {
    if (!name.trim() || isComposing || !gender) return;
    initializeGame(name.trim(), "한국대학교", major, "cassandra" as StorytellerMode, "ko");
    setGamePhase("playing");
    legacyCreatePlayer({ name: name.trim(), gender, major, dream: dream as DreamType });
    router.push("/game");
  };

  const selectedMajor = MAJORS.find((m) => m.type === major)!;
  const selectedDream = DREAMS.find((d) => d.id === dream)!;

  // New Game+ detection
  const completionCount = typeof window !== 'undefined' ? parseInt(localStorage.getItem('kusm-completions') ?? '0', 10) : 0;
  const collectedArchetypes = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('kusm-archetypes') ?? '[]') as string[] : [];
  const isNewGamePlus = completionCount > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#1a1040] to-[#2a1535] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background character — show selected gender */}
      {gender && (
        <div className="absolute bottom-0 right-0 w-64 h-96 opacity-20 pointer-events-none">
          <Image src={`/assets/characters/player/neutral-${gender}.png`} alt="" fill className="object-contain object-bottom" />
        </div>
      )}

      <div className="w-full max-w-md relative z-10">
        {/* Step 0: Name */}
        {step === 0 && (
          <div className="flex flex-col gap-6 animate-fade-in-up">
            <div className="text-center">
              {isNewGamePlus ? (
                <>
                  <p className="text-gold/60 text-xs mb-1">✨ NEW GAME+ ({completionCount}회차) — 엔딩 수집: {collectedArchetypes.length}/14</p>
                  <p className="text-white/40 text-sm mb-2">
                    {completionCount >= 5 ? '베테랑의 귀환. 남은 엔딩을 찾아서.' :
                     completionCount >= 2 ? '다시 시작하는 학기. 이번엔 다른 길을.' :
                     '다시 시작하는 학기. 경험이 빛을 발한다.'}
                  </p>
                </>
              ) : (
                <p className="text-white/40 text-sm mb-2">새 학기가 시작됩니다</p>
              )}
              <h1 className="text-3xl font-bold text-white">당신의 이름은?</h1>
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={(e) => {
                setIsComposing(false);
                setName((e.target as HTMLInputElement).value);
              }}
              onKeyDown={(e) => { if (e.key === 'Enter' && name.trim() && !isComposing && gender) setStep(1); }}
              placeholder="이름을 입력하세요"
              autoFocus
              className="w-full px-5 py-4 rounded-2xl border-2 border-white/20 bg-white/5 text-white text-center text-xl placeholder-white/30 focus:border-teal focus:outline-none backdrop-blur-md"
            />

            {/* Gender selection */}
            <div className="flex gap-3">
              {([
                { value: 'male' as const, emoji: '👨‍🎓', label: '남학생' },
                { value: 'female' as const, emoji: '👩‍🎓', label: '여학생' },
              ]).map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGender(g.value)}
                  className={`flex-1 py-4 rounded-xl border-2 text-center transition-all cursor-pointer active:scale-[0.97] ${
                    gender === g.value
                      ? 'border-teal bg-teal/15 text-teal'
                      : 'border-white/15 bg-white/5 text-white/60 hover:border-white/30'
                  }`}
                >
                  <span className="text-3xl block mb-1">{g.emoji}</span>
                  <span className="text-sm font-medium">{g.label}</span>
                </button>
              ))}
            </div>

            <p className="text-center text-xs text-white/20">한국대학교 신입생</p>

            <button
              onClick={() => setStep(1)}
              disabled={!name.trim() || !gender}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${name.trim() && gender ? 'bg-teal/20 text-teal border border-teal/30 hover:bg-teal/30 cursor-pointer active:scale-[0.98]' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
            >
              다음
            </button>
          </div>
        )}

        {/* Step 1: Major */}
        {step === 1 && (
          <div className="flex flex-col gap-6 animate-fade-in-up">
            <div className="text-center">
              <p className="text-white/40 text-sm mb-2">{name}님, 반갑습니다</p>
              <h1 className="text-2xl font-bold text-white">전공을 선택하세요</h1>
            </div>

            <div className="flex flex-col gap-3">
              {MAJORS.map((m) => (
                <button
                  key={m.type}
                  onClick={() => { setMajor(m.type); setStep(2); }}
                  className={`flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all cursor-pointer active:scale-[0.98] ${major === m.type ? 'border-teal bg-teal/10' : 'border-white/15 bg-white/5 hover:border-white/30'}`}
                >
                  <span className="text-3xl">{m.emoji}</span>
                  <div className="flex-1">
                    <div className="font-bold text-white">{m.vibe}</div>
                    <div className="text-xs text-teal/70 mt-0.5">{m.effect}</div>
                    <div className="text-[10px] text-white/30 mt-0.5">{m.statHint}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Dream */}
        {step === 2 && (
          <div className="flex flex-col gap-6 animate-fade-in-up">
            <div className="text-center">
              <p className="text-white/40 text-sm mb-2">{MAJOR_LABELS[major].ko} {name}</p>
              <h1 className="text-2xl font-bold text-white">이번 학기의 목표는?</h1>
            </div>

            <div className="flex flex-col gap-3">
              {DREAMS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => { setDream(d.id); setStep(3); }}
                  className="flex items-center gap-4 px-5 py-4 rounded-xl border-2 border-white/15 bg-white/5 hover:border-teal/40 hover:bg-teal/5 text-left transition-all cursor-pointer active:scale-[0.98]"
                >
                  <span className="text-3xl">{d.emoji}</span>
                  <div className="flex-1">
                    <div className="font-bold text-white">{d.label}</div>
                    <div className="text-xs text-white/50 mt-0.5">{d.hint}</div>
                    <div className="text-[10px] text-teal/60 mt-1">{d.gameplay}</div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal/15 text-teal mt-1 inline-block">{d.bonus}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="flex flex-col gap-6 animate-fade-in-up">
            <div className="text-center">
              <span className="text-5xl block mb-3">🎓</span>
              <h1 className="text-2xl font-bold text-white mb-1">한국대학교</h1>
              <p className="text-lg text-white/70">{MAJORS.find(m => m.type === major)?.vibe} · {name} ({gender === 'female' ? '여' : '남'})</p>
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                <span>{selectedDream.emoji}</span>
                <span className="text-sm text-white/60">{selectedDream.label}</span>
              </div>
            </div>

            {/* Stat preview — uses OLD store stat system (the actual gameplay stats) */}
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-3">초기 능력치</p>
              {(() => {
                const dreamBonus: Record<string, Record<string, number>> = {
                  scholar: { knowledge: 10 },
                  social: { social: 10, charm: 5 },
                  balance: { health: 5, knowledge: 3, social: 3 },
                  freedom: { stress: -10, charm: 5 },
                };
                const bonus = dreamBonus[dream] ?? {};
                const baseStats = { knowledge: 50, health: 70, social: 40, stress: 20, charm: 40, money: 500000 };
                const preview = { ...baseStats };
                for (const [k, v] of Object.entries(bonus)) {
                  if (k in preview) (preview as Record<string, number>)[k] += v;
                }
                const statDisplay = [
                  { key: 'knowledge', label: '준비도', value: preview.knowledge },
                  { key: 'health', label: '체력', value: preview.health },
                  { key: 'social', label: '인맥', value: preview.social },
                  { key: 'stress', label: '스트레스', value: preview.stress },
                  { key: 'charm', label: '매력', value: preview.charm },
                  { key: 'money', label: '자금', value: preview.money },
                ];
                return (
                  <div className="grid grid-cols-3 gap-2">
                    {statDisplay.map(({ key, label, value }) => (
                      <div key={key} className="text-center">
                        <div className="text-lg font-bold text-teal">
                          {key === 'money' ? `${(value/10000).toFixed(0)}만` : value}
                        </div>
                        <div className="text-[10px] text-white/40">{label}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Narrative context */}
            <div className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5">
              <p className="text-sm text-white/50 leading-relaxed italic">
                3월의 첫째 주. 벚꽃이 흩날리는 캠퍼스.
                <br />
                {name}의 대학 생활이 시작된다.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="px-6 py-3 rounded-xl text-sm text-white/50 hover:text-white/80 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
              >
                다시 만들기
              </button>
              <button
                onClick={handleStart}
                className="flex-1 py-3 rounded-xl font-bold text-lg bg-teal/20 text-teal border border-teal/30 hover:bg-teal/30 transition-all cursor-pointer active:scale-[0.98]"
              >
                학기 시작!
              </button>
            </div>
          </div>
        )}

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {[0, 1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-all ${s === step ? 'bg-teal w-6' : s < step ? 'bg-teal/40' : 'bg-white/15'}`}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
}
