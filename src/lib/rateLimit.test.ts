import { describe, it, expect } from 'vitest';
import { checkRateLimit } from './rateLimit';

function makeRequest(ip: string): Request {
  return new Request('http://localhost/api/test', {
    headers: { 'x-forwarded-for': ip },
  });
}

describe('checkRateLimit (in-memory fallback)', () => {
  // Use unique IPs per test to avoid cross-test interference

  it('should allow the first request', async () => {
    const result = await checkRateLimit(makeRequest('10.0.0.1'));
    expect(result).toBeNull();
  });

  it('should allow requests under the limit', async () => {
    const ip = '10.0.0.2';
    // Send 10 requests (the limit)
    for (let i = 0; i < 10; i++) {
      const result = await checkRateLimit(makeRequest(ip));
      expect(result).toBeNull();
    }
  });

  it('should return 429 when over the limit', async () => {
    const ip = '10.0.0.3';
    // Send 10 requests (fills the bucket)
    for (let i = 0; i < 10; i++) {
      await checkRateLimit(makeRequest(ip));
    }

    // 11th request should be rate limited
    const result = await checkRateLimit(makeRequest(ip));
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);

    const body = await result!.json();
    expect(body.error).toContain('Too many requests');
  });
});
