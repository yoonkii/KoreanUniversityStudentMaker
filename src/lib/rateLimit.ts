import { NextResponse } from 'next/server';

const MAX_REQUESTS = 10;
const WINDOW_MS = 60_000; // 1 minute

const ipRequestMap = new Map<string, { count: number; resetAt: number }>();

// Periodically clean stale entries to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipRequestMap) {
    if (now > entry.resetAt) {
      ipRequestMap.delete(ip);
    }
  }
}, 60_000);

export function checkRateLimit(request: Request): NextResponse | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown';
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
      { status: 429 }
    );
  }

  return null;
}
