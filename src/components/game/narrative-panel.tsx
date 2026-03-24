"use client";

import { useState, useEffect } from "react";
import type { StatDelta, StatKey } from "@/engine/types/stats";
import { STAT_LABELS } from "@/engine/types/stats";

interface NarrativeChoice {
  label: string;
  consequences: string;
}

interface NarrativePanelProps {
  narrative: string;
  speakerName?: string;
  choices?: NarrativeChoice[];
  statChanges?: StatDelta;
  onChoiceSelect?: (index: number) => void;
  onContinue?: () => void;
  lang: "ko" | "en";
}

export function NarrativePanel({
  narrative,
  speakerName,
  choices,
  statChanges,
  onChoiceSelect,
  onContinue,
  lang,
}: NarrativePanelProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedText("");
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      if (i < narrative.length) {
        setDisplayedText(narrative.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [narrative]);

  const handleClick = () => {
    if (isTyping) {
      setDisplayedText(narrative);
      setIsTyping(false);
    } else if (!choices && onContinue) {
      onContinue();
    }
  };

  return (
    <div
      className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 cursor-pointer min-h-[200px] flex flex-col"
      onClick={handleClick}
    >
      {speakerName && (
        <div className="text-sm font-bold text-indigo-600 mb-2">
          {speakerName}
        </div>
      )}

      <div className="flex-1 text-gray-800 leading-relaxed whitespace-pre-wrap text-base">
        {displayedText}
        {isTyping && <span className="animate-pulse">▋</span>}
      </div>

      {/* Stat changes display */}
      {statChanges && !isTyping && (
        <div className="mt-4 flex flex-wrap gap-2">
          {(Object.entries(statChanges) as [StatKey, number][]).map(
            ([key, val]) =>
              val !== 0 && (
                <span
                  key={key}
                  className={`text-xs px-2 py-1 rounded-full font-mono ${
                    val > 0
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {STAT_LABELS[key][lang]} {val > 0 ? "+" : ""}
                  {val}
                </span>
              )
          )}
        </div>
      )}

      {/* Choices */}
      {choices && !isTyping && (
        <div className="mt-4 flex flex-col gap-2">
          {choices.map((choice, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                onChoiceSelect?.(i);
              }}
              className="text-left p-3 rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all"
            >
              <div className="font-medium text-gray-800">{choice.label}</div>
              <div className="text-xs text-gray-500 mt-1">
                {choice.consequences}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Continue hint */}
      {!isTyping && !choices && (
        <div className="mt-3 text-xs text-gray-400 text-center">
          {lang === "ko" ? "클릭하여 계속" : "Click to continue"}
        </div>
      )}
    </div>
  );
}
