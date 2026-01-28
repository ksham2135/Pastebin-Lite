import { redis, createPaste as redisCreatePaste } from './redis';
import { nanoid } from 'nanoid';
import { NextRequest } from 'next/server';
import { getNowMs } from './time';

export interface Paste {
  id: string;
  content: string;
  created_at_ms: number;
  expires_at_ms: number | null;
  max_views: number | null;
  views_used: number;
}

export interface PasteCreateRequest {
  content: string;
  ttl_seconds?: number;
  max_views?: number;
}

export interface PasteResponse {
  content: string;
  remaining_views: number | null;
  expires_at: string | null;
}

/**
 * Generate a unique, URL-safe ID for a paste
 */
function generatePasteId(): string {
  return nanoid(12);
}

/**
 * Store a paste in Redis
 */
export async function createPaste(
  req: PasteCreateRequest,
  request?: NextRequest
): Promise<Paste> {
  const { content, ttl_seconds, max_views } = req;

  // Validate content
  if (!content || typeof content !== 'string' || content.trim() === '') {
    throw new Error('Content is required and must be a non-empty string');
  }

  // Validate ttl_seconds
  if (ttl_seconds !== undefined) {
    if (!Number.isInteger(ttl_seconds) || ttl_seconds < 1) {
      throw new Error('ttl_seconds must be an integer >= 1');
    }
  }

  // Validate max_views
  if (max_views !== undefined) {
    if (!Number.isInteger(max_views) || max_views < 1) {
      throw new Error('max_views must be an integer >= 1');
    }
  }

  const now = getNowMs(request);
  const id = generatePasteId();

  const paste: Paste = {
    id,
    content,
    created_at_ms: now,
    expires_at_ms: ttl_seconds ? now + ttl_seconds * 1000 : null,
    max_views: max_views ?? null,
    views_used: 0,
  };

  // Store in Redis with TTL (stored as an object: content, expiresAt, viewsLeft)
  await redisCreatePaste(id, content, ttl_seconds, max_views ?? -1);

  return paste;
}

/**
 * Retrieve a paste by ID, incrementing views atomically
 */
export async function getPasteAndIncrement(
  id: string,
  request?: NextRequest
): Promise<Paste | null> {
  const key = `paste:${id}`;
  const now = getNowMs(request);

  // Get the paste
  const data = await redis.get(key);
  if (!data) {
    return null;
  }

  const paste: Paste = JSON.parse(data as string);

  // Check expiration
  if (paste.expires_at_ms !== null && now >= paste.expires_at_ms) {
    // Paste expired, delete it
    await redis.del(key);
    return null;
  }

  // Check view limit
  if (paste.max_views !== null && paste.views_used >= paste.max_views) {
    return null;
  }

  // Increment views atomically using Lua script
  const luaScript = `
    local key = KEYS[1]
    local data = redis.call('GET', key)
    if not data then
      return nil
    end
    local paste = cjson.decode(data)
    paste.views_used = paste.views_used + 1
    redis.call('SET', key, cjson.encode(paste))
    return cjson.encode(paste)
  `;

  const result = await redis.eval(luaScript, {
    keys: [key],
  });

  if (!result) {
    return null;
  }

  return JSON.parse(result as string);
}

/**
 * Get a paste without incrementing views (for internal checks)
 */
export async function getPasteWithoutIncrement(
  id: string,
  request?: NextRequest
): Promise<Paste | null> {
  const key = `paste:${id}`;
  const now = getNowMs(request);

  const data = await redis.get(key);
  if (!data) {
    return null;
  }

  const paste: Paste = JSON.parse(data as string);

  // Check expiration
  if (paste.expires_at_ms !== null && now >= paste.expires_at_ms) {
    await redis.del(key);
    return null;
  }

  return paste;
}

/**
 * Convert a Paste to a PasteResponse
 */
export function pasteToResponse(paste: Paste): PasteResponse {
  const remaining_views =
    paste.max_views !== null
      ? Math.max(0, paste.max_views - paste.views_used)
      : null;

  const expires_at =
    paste.expires_at_ms !== null
      ? new Date(paste.expires_at_ms).toISOString()
      : null;

  return {
    content: paste.content,
    remaining_views,
    expires_at,
  };
}
