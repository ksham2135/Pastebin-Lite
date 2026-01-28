import { NextResponse, NextRequest } from 'next/server';
import { redis } from '@/lib/redis';

/**
 * GET /api/healthz
 * 
 * Must respond quickly, return HTTP 200 with JSON,
 * and check Redis connectivity.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const pong = await redis.ping();
    
    if (pong !== 'PONG') {
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Healthz check failed:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
