import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";
import { getNowMs } from "./time";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!.trim(),
  token: process.env.UPSTASH_REDIS_REST_TOKEN!.trim(),
});

export async function getPaste(id: string, request?: NextRequest) {
  type StoredPaste = {
    content: string;
    expiresAt: number;
    viewsLeft: number;
  } | null;

  const paste = await redis.get<StoredPaste>(`paste:${id}`);
  if (!paste) return null;

  // Check if paste has expired (if expiresAt is set and in the past)
  const now = getNowMs(request);
  if (paste.expiresAt && now >= paste.expiresAt) {
    await redis.del(`paste:${id}`);
    return null;
  }

  // If viewsLeft is negative, treat as unlimited
  if (typeof paste.viewsLeft === 'number' && paste.viewsLeft >= 0) {
    if (paste.viewsLeft <= 0) {
      await redis.del(`paste:${id}`);
      return null;
    }

    // decrement and persist
    paste.viewsLeft = paste.viewsLeft - 1;

    // If this was the last view, delete the paste
    if (paste.viewsLeft <= 0) {
      await redis.del(`paste:${id}`);
    } else {
      await redis.set(`paste:${id}`, paste);
    }
  }

  // Return in API response format
  return {
    content: paste.content,
    remaining_views: paste.viewsLeft >= 0 ? paste.viewsLeft : null,
    expires_at: paste.expiresAt ? new Date(paste.expiresAt).toISOString() : null,
  };
}

export async function createPaste(
  id: string,
  content: string,
  ttlSeconds?: number,
  maxViews?: number
) {
  const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;

  const stored = {
    content,
    expiresAt,
    viewsLeft: typeof maxViews === 'number' ? maxViews : -1,
  };

  if (ttlSeconds) {
    await redis.set(`paste:${id}`, stored, { ex: ttlSeconds });
  } else {
    await redis.set(`paste:${id}`, stored);
  }
}
