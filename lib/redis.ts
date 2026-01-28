import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getPaste(id: string) {
  type StoredPaste = {
    content: string;
    expiresAt: number;
    viewsLeft: number;
  } | null;

  const paste = await redis.get<StoredPaste>(`paste:${id}`);
  if (!paste) return null;

  // If viewsLeft is negative, treat as unlimited
  if (typeof paste.viewsLeft === 'number' && paste.viewsLeft >= 0) {
    if (paste.viewsLeft <= 1) {
      await redis.del(`paste:${id}`);
      return null;
    }

    // decrement and persist
    paste.viewsLeft = paste.viewsLeft - 1;
    await redis.set(`paste:${id}`, paste);
  }

  return paste;
}

export async function createPaste(
  id: string,
  content: string,
  ttlSeconds?: number,
  maxViews?: number
) {
  const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Date.now();

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
