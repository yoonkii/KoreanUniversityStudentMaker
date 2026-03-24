"use client";

import { useEffect, useState } from "react";
import { getCachedCharacterArt } from "@/engine/save/art-cache";
import type { ExpressionVariant } from "@/engine/types/emotion";

interface NPCPortraitProps {
  npcId: string;
  npcName: string;
  expression?: ExpressionVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "w-12 h-12",
  md: "w-20 h-20",
  lg: "w-32 h-32",
};

export function NPCPortrait({
  npcId,
  npcName,
  expression = "neutral",
  size = "md",
  className = "",
}: NPCPortraitProps) {
  const [imageData, setImageData] = useState<string | null>(null);

  useEffect(() => {
    async function loadArt() {
      try {
        const art = await getCachedCharacterArt(npcId);
        if (art) {
          const expressionImage = art.expressions[expression] ?? art.basePortrait;
          if (expressionImage) {
            setImageData(expressionImage);
            return;
          }
        }
      } catch {
        // IndexedDB not available
      }
      setImageData(null);
    }
    loadArt();
  }, [npcId, expression]);

  const sizeClass = SIZE_CLASSES[size];

  if (imageData) {
    return (
      <img
        src={`data:image/png;base64,${imageData}`}
        alt={npcName}
        className={`${sizeClass} rounded-full object-cover border-2 border-white shadow-lg ${className}`}
      />
    );
  }

  // Fallback: colored circle with initials
  const colors = [
    "bg-pink-400",
    "bg-blue-400",
    "bg-green-400",
    "bg-purple-400",
    "bg-yellow-400",
    "bg-red-400",
    "bg-indigo-400",
    "bg-teal-400",
  ];
  const colorIndex =
    npcId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    colors.length;

  return (
    <div
      className={`${sizeClass} rounded-full ${colors[colorIndex]} flex items-center justify-center text-white font-bold shadow-lg border-2 border-white ${className}`}
    >
      <span className={size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-lg"}>
        {npcName.charAt(0)}
      </span>
    </div>
  );
}
