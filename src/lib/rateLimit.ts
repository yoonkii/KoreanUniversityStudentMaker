import { NextResponse } from 'next/server';

const MAX_REQUESTS = 10;
const WINDOW_MS = 60_000; // 1 minute

// ---------------------------------------------------------------------------
// In-memory fallback rate limiter (used when Upstash env vars are not set)
// ---------------------------------------------------------------------------

const ipRequestMap = new Map<string, { count: number; resetAt: number }>();

// Periodically clean stale entries to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of ipRequestMap) {
      if (now > entry.resetAt) {
        ipRequestMap.delete(ip);
      }
    }
  }, 60_000);
}

function checkInMemoryRateLimit(ip: string): NextResponse | null {
  const now = Date.now();
  const entry = ipRequestMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRequestMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Upstash Redis rate limiter (used when env vars are configured)
// ---------------------------------------------------------------------------

let upstashRateLimiter: { limit: (identifier: string) => Promise<{ success: boolean }> } | null = null;

function getUpstashRateLimiter() {
  if (upstashRateLimiter !== null) return upstashRateLimiter;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  // Dynamic import to avoid bundling Upstash when not in use
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Ratelimit } = require('@upstash/ratelimit') as typeof import('@upstash/ratelimit');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require('@upstash/redis') as typeof import('@upstash/redis');

    const redis = new Redis({ url, token });

    upstashRateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_REQUESTS, '60 s'),
      analytics: false,
    });

    return upstashRateLimiter;
  } catch {
    // If Upstash packages fail to load, fall back to in-memory
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API — same signature as original
// ---------------------------------------------------------------------------

export async function checkRateLimit(request: Request): Promise<NextResponse | null> {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown';

  const limiter = getUpstashRateLimiter();

  if (limiter) {
    try {
      const { success } = await limiter.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 },
        );
      }
      return null;
    } catch {
      // If Upstash call fails, fall through to in-memory
      return checkInMemoryRateLimit(ip);
    }
  }

  return checkInMemoryRateLimit(ip);
}
