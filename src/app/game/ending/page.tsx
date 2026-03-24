"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/stores/game-store";
import { StatBar } from "@/components/ui/stat-bar";
import { STAT_KEYS, STAT_LABELS } from "@/engine/types/stats";

export default function EndingPage() {
  const router = useRouter();
  const store = useGameStore();
  const { player, settings, story } = store;
  const lang = settings.language;

  const [ending, setEnding] = useState("");
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [archetype, setArchetype] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function generateEnding() {
      try {
        const res = await fetch("/api/ai/ending", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerName: player.name,
            university: player.university,
            major: player.major,
            stats: player.stats,
            rollingSummary: story.rollingSummary,
            storytellerMode: settings.storytellerMode,
            language: lang,
          }),
        });
        const data = await res.json();
        setEnding(data.ending);
        setGrades(data.grades);
        setArchetype(data.archetype);
      } catch {
        setEnding(
          lang === "ko"
            ? "한 학기가 끝났다. 돌이켜보면, 많은 것을 배웠다."
            : "The semester is over. Looking back, you learned a lot."
        );
      }
      setIsLoading(false);
    }
    generateEnding();
  }, [player, settings, story, lang]);

  const archetypeLabels: Record<string, { ko: string; en: string; emoji: string }> = {
    gpa: { ko: "학점러", en: "The Scholar", emoji: "📚" },
    social: { ko: "인싸", en: "The Social Butterfly", emoji: "🦋" },
    finances: { ko: "알바왕", en: "The Hustler", emoji: "💰" },
    career: { ko: "스펙충", en: "The Resume Builder", emoji: "💼" },
    energy: { ko: "건강왕", en: "The Wellness King", emoji: "💪" },
    mental: { ko: "마이웨이", en: "The Free Spirit", emoji: "🌊" },
  };

  const arch = archetypeLabels[archetype] ?? archetypeLabels.gpa;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white/10 backdrop-blur-md rounded-3xl p-8 text-white flex flex-col gap-8">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 animate-pulse">🎓</div>
            <p className="text-indigo-200 animate-pulse">
              {lang === "ko" ? "학기를 되돌아보는 중..." : "Reflecting on the semester..."}
            </p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className="text-6xl mb-2">{arch.emoji}</div>
              <h1 className="text-3xl font-bold">{arch[lang]}</h1>
              <p className="text-indigo-200 mt-1">
                {player.name} · {player.university}
              </p>
            </div>

            {/* Report Card */}
            <div className="bg-white/10 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-indigo-200 mb-3">
                {lang === "ko" ? "최종 성적표" : "Final Report Card"}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {STAT_KEYS.map((key) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm text-indigo-200">
                      {STAT_LABELS[key][lang]}
                    </span>
                    <span className="font-bold text-lg">
                      {grades[key] ?? "?"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stat bars */}
            <div className="bg-white/10 rounded-2xl p-4">
              <div className="flex flex-col gap-2">
                {STAT_KEYS.map((key) => (
                  <StatBar
                    key={key}
                    statKey={key}
                    value={player.stats[key]}
                    lang={lang}
                    compact
                  />
                ))}
              </div>
            </div>

            {/* Ending narrative */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="text-white/90 leading-relaxed whitespace-pre-wrap">
                {ending}
              </div>
            </div>

            <button
              onClick={() => {
                store.resetGame();
                router.push("/");
              }}
              className="w-full py-4 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-lg transition-all"
            >
              {lang === "ko" ? "메인으로 돌아가기" : "Back to Main"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
