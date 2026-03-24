import type { ExpressionVariant } from "./emotion";

export interface CharacterArt {
  npcId: string;
  basePortrait: string; // base64
  expressions: Partial<Record<ExpressionVariant, string>>; // base64 per variant
  generatedAt: number; // timestamp
}

export interface BackgroundArt {
  locationId: string;
  day: string; // base64
  evening: string; // base64
  generatedAt: number;
}

export interface ArtCache {
  version: number;
  characters: Record<string, CharacterArt>;
  backgrounds: Record<string, BackgroundArt>;
  totalSizeKB: number;
}

export const ART_CACHE_VERSION = 1;
export const ART_CACHE_DB_NAME = "kusm-art-cache";
export const ART_CACHE_STORE_NAME = "art";
