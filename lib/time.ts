import { NextRequest } from 'next/server';

/**
 * getNowMs(request):
 * 
 * IF process.env.TEST_MODE === "1"
 *   - Read request header: "x-test-now-ms"
 *   - If header exists, parse as integer and use as current time
 *   - If header missing, fall back to system time
 * ELSE
 *   - Always use system time
 */
export function getNowMs(request?: NextRequest): number {
  const isTestMode = process.env.TEST_MODE === '1';

  if (isTestMode && request) {
    const testNowMs = request.headers.get('x-test-now-ms');
    if (testNowMs) {
      const parsed = parseInt(testNowMs, 10);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
  }

  return Date.now();
}
