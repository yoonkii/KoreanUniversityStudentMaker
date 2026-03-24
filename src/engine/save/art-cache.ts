import { ART_CACHE_DB_NAME, ART_CACHE_STORE_NAME, ART_CACHE_VERSION } from "../types/art";
import type { ArtCache, CharacterArt, BackgroundArt } from "../types/art";

/**
 * IndexedDB-based art cache for storing generated images.
 * Supports 50MB+ which is far more than localStorage's 5MB.
 */

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(ART_CACHE_DB_NAME, ART_CACHE_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ART_CACHE_STORE_NAME)) {
        db.createObjectStore(ART_CACHE_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getFromStore<T>(key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ART_CACHE_STORE_NAME, "readonly");
    const store = tx.objectStore(ART_CACHE_STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function putToStore<T>(key: string, value: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ART_CACHE_STORE_NAME, "readwrite");
    const store = tx.objectStore(ART_CACHE_STORE_NAME);
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ─── Character Art ───

export async function getCachedCharacterArt(
  npcId: string
): Promise<CharacterArt | null> {
  return getFromStore<CharacterArt>(`char_${npcId}`);
}

export async function cacheCharacterArt(art: CharacterArt): Promise<void> {
  await putToStore(`char_${art.npcId}`, art);
}

// ─── Background Art ───

export async function getCachedBackgroundArt(
  locationId: string
): Promise<BackgroundArt | null> {
  return getFromStore<BackgroundArt>(`bg_${locationId}`);
}

export async function cacheBackgroundArt(art: BackgroundArt): Promise<void> {
  await putToStore(`bg_${art.locationId}`, art);
}

// ─── Full Cache Status ───

export async function isArtCacheComplete(
  npcIds: string[],
  locationIds: string[]
): Promise<boolean> {
  for (const id of npcIds) {
    const art = await getCachedCharacterArt(id);
    if (!art || !art.basePortrait) return false;
  }
  for (const id of locationIds) {
    const art = await getCachedBackgroundArt(id);
    if (!art || !art.day) return false;
  }
  return true;
}

export async function clearArtCache(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ART_CACHE_STORE_NAME, "readwrite");
    const store = tx.objectStore(ART_CACHE_STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
