"use client";

import { useRouter } from "next/navigation";
import { useGameStore } from "@/stores/game-store";
import { NPCPortrait } from "@/components/game/npc-portrait";

export default function RelationshipsPage() {
  const router = useRouter();
  const { npcs, settings } = useGameStore();
  const lang = settings.language;

  const npcEntries = Object.entries(npcs.sheets).map(([id, sheet]) => ({
    id,
    sheet,
    state: npcs.states[id],
  }));

  const getRoleLabel = (role: string) => {
    const labels: Record<string, { ko: string; en: string }> = {
      roommate: { ko: "룸메이트", en: "Roommate" },
      classmate: { ko: "같은 과", en: "Classmate" },
      senior: { ko: "선배", en: "Senior" },
      professor: { ko: "교수", en: "Professor" },
      work_colleague: { ko: "알바 동료", en: "Work Colleague" },
      club_member: { ko: "동아리", en: "Club Member" },
      romantic_interest: { ko: "관심 있는 사람", en: "Romantic Interest" },
      rival: { ko: "라이벌", en: "Rival" },
    };
    return labels[role]?.[lang] ?? role;
  };

  const getRelColor = (level: number) => {
    if (level >= 80) return "text-pink-500";
    if (level >= 60) return "text-green-500";
    if (level >= 40) return "text-blue-500";
    if (level >= 20) return "text-yellow-500";
    return "text-gray-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-800 text-2xl"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {lang === "ko" ? "인간관계" : "Relationships"}
          </h1>
        </div>

        <div className="flex flex-col gap-4">
          {npcEntries.map(({ id, sheet, state }) => (
            <div
              key={id}
              className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 flex items-start gap-4"
            >
              <NPCPortrait npcId={id} npcName={sheet.name} size="lg" />

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-800 text-lg">
                    {sheet.name}
                  </h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {getRoleLabel(sheet.role)}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mt-1">
                  {sheet.major} · {sheet.year > 0 ? `${sheet.year}학년` : ""}
                </p>

                {/* Relationship bars */}
                {state && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-12">
                        {lang === "ko" ? "호감" : "Like"}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-pink-400 transition-all"
                          style={{ width: `${state.relationshipToPlayer.level}%` }}
                        />
                      </div>
                      <span className={`text-xs font-mono font-bold ${getRelColor(state.relationshipToPlayer.level)}`}>
                        {Math.round(state.relationshipToPlayer.level)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-12">
                        {lang === "ko" ? "신뢰" : "Trust"}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-400 transition-all"
                          style={{ width: `${state.relationshipToPlayer.trust}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-blue-500 font-bold">
                        {Math.round(state.relationshipToPlayer.trust)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 italic mt-1">
                      &ldquo;{state.relationshipToPlayer.attitude}&rdquo;
                    </p>

                    {/* Emotion */}
                    <p className="text-xs text-gray-400">
                      {lang === "ko" ? "감정" : "Mood"}: {state.emotion.primary} ({state.emotion.primaryIntensity}/10)
                      {state.emotion.stressLevel > 5 && " ⚡"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
