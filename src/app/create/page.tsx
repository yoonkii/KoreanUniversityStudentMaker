"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/stores/game-store";
import { useGameStore as useLegacyStore } from "@/store/gameStore";
import type { MajorType } from "@/engine/types/stats";
import {
  MAJOR_LABELS,
  MAJOR_STAT_OVERRIDES,
  BASE_STATS,
  STAT_LABELS,
  STAT_KEYS,
} from "@/engine/types/stats";
import type { StorytellerMode } from "@/engine/types/story";
import { STORYTELLER_CONFIGS } from "@/engine/data/storyteller-modes";
import { StatBar } from "@/components/ui/stat-bar";

const MAJORS: MajorType[] = ["engineering", "business", "humanities", "arts"];
const STORYTELLER_MODES: StorytellerMode[] = ["cassandra", "randy", "phoebe"];

const UNIVERSITIES = [
  "서울대학교",
  "연세대학교",
  "고려대학교",
  "성균관대학교",
  "한양대학교",
  "중앙대학교",
  "경희대학교",
  "건국대학교",
];

export default function CreatePage() {
  const router = useRouter();
  const initializeGame = useGameStore((s) => s.initializeGame);
  const setGamePhase = useGameStore((s) => s.setGamePhase);
  const legacyCreatePlayer = useLegacyStore((s) => s.createPlayer);

  const [name, setName] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [university, setUniversity] = useState(UNIVERSITIES[0]);
  const [major, setMajor] = useState<MajorType>("engineering");
  const [storyteller, setStoryteller] =
    useState<StorytellerMode>("cassandra");
  const lang = "ko";

  const previewStats = {
    ...BASE_STATS,
    ...MAJOR_STAT_OVERRIDES[major],
  };

  const handleStart = () => {
    if (!name.trim() || isComposing) return;
    // Write to NEW store (Sprint 3-6 AI engine)
    initializeGame(name.trim(), university, major, storyteller, lang);
    setGamePhase("playing");
    // Write to OLD store (Sprint 1-2 VN engine) so game page works
    legacyCreatePlayer({ name: name.trim(), gender: "male", major });
    router.push("/game");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">
            🎓 캐릭터 생성
          </h1>
          <p className="text-gray-500 mt-2">
            당신의 대학 생활이 시작됩니다
          </p>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600">이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={(e) => {
              setIsComposing(false);
              setName((e.target as HTMLInputElement).value);
            }}
            placeholder="이름을 입력하세요"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none text-lg"
          />
        </div>

        {/* University */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600">대학교</label>
          <select
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none text-lg bg-white"
          >
            {UNIVERSITIES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        {/* Major */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600">전공</label>
          <div className="grid grid-cols-2 gap-3">
            {MAJORS.map((m) => (
              <button
                key={m}
                onClick={() => setMajor(m)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  major === m
                    ? "border-indigo-500 bg-indigo-50 shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-bold text-gray-800">
                  {MAJOR_LABELS[m].ko}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {MAJOR_LABELS[m].en}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Stat Preview */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="text-sm font-semibold text-gray-600 mb-3">
            스탯 미리보기
          </div>
          <div className="grid grid-cols-2 gap-3">
            {STAT_KEYS.map((key) => (
              <StatBar
                key={key}
                statKey={key}
                value={previewStats[key]}
                lang={lang}
                compact
              />
            ))}
          </div>
        </div>

        {/* Storyteller Mode */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600">
            스토리텔러 모드
          </label>
          <div className="grid grid-cols-3 gap-3">
            {STORYTELLER_MODES.map((mode) => {
              const config = STORYTELLER_CONFIGS[mode];
              return (
                <button
                  key={mode}
                  onClick={() => setStoryteller(mode)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    storyteller === mode
                      ? "border-indigo-500 bg-indigo-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-bold text-gray-800">
                    {config.label.ko}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {config.description.ko}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={!name.trim()}
          className={`w-full py-4 rounded-xl font-bold text-xl transition-all ${
            name.trim()
              ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl active:scale-[0.98]"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          학기 시작! 🚀
        </button>
      </div>
    </div>
  );
}
