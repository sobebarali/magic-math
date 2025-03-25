/**
 * Redis-based rate limiter for API requests
 */

import { isRedisConnected } from "./redis_client.ts";

// Rate limit configuration
const RATE_LIMIT_WINDOW = parseInt(Deno.env.get("RATE_LIMIT_WINDOW") || "60000", 10); // 1 minute in ms
const RATE_LIMIT_MAX = parseInt(Deno.env.get("RATE_LIMIT_MAX") || "100", 10); // 100 requests per window
const RATE_LIMIT_KEY_PREFIX = "rate_limit:";

// Fallback in-memory store for rate limits when Redis is not available
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for fallback
const fallbackRateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired rate limit entries in the fallback store
 */
const cleanupFallbackRateLimits = (): void => {
  const now = Date.now();
  for (const [key, entry] of fallbackRateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      fallbackRateLimitStore.delete(key);
    }
  }
};

// Start cleanup process for fallback store
setInterval(cleanupFallbackRateLimits, RATE_LIMIT_WINDOW);

/**
 * Import the Redis client functions directly to avoid circular dependencies
 */
import { getFromCache, setInCache } from "./redis_client.ts";

/**
 * Check if a request is rate limited using Redis
 * @param identifier The identifier for rate limiting (IP address or API key)
 * @returns Object with limit information
 */
export const checkRateLimit = async (identifier: string): Promise<{
  limited: boolean;
  remaining: number;
  resetAt: number;
}> => {
  const now = Date.now();
  const windowEnd = now + RATE_LIMIT_WINDOW;
  
  // If Redis is connected, use it for rate limiting
  if (isRedisConnected()) {
    return await checkRedisRateLimit(identifier, now, windowEnd);
  }
  
  // Fallback to in-memory rate limiting if Redis is not available
  return checkInMemoryRateLimit(identifier, now, windowEnd);
};

/**
 * Check rate limit using Redis
 */
async function checkRedisRateLimit(
  identifier: string,
  now: number,
  windowEnd: number
): Promise<{ limited: boolean; remaining: number; resetAt: number }> {
  const key = `${RATE_LIMIT_KEY_PREFIX}${identifier}`;
  
  // Get current rate limit data from Redis
  const entry = await getFromCache<{ count: number; resetAt: number }>(key);
  
  if (!entry || entry.resetAt <= now) {
    // Create new entry if none exists or if the window has expired
    const newEntry = {
      count: 1,
      resetAt: windowEnd
    };
    
    await setInCache(key, newEntry, Math.ceil(RATE_LIMIT_WINDOW / 1000));
    
    return {
      limited: false,
      remaining: RATE_LIMIT_MAX - 1,
      resetAt: windowEnd
    };
  }
  
  // Increment the counter
  const count = entry.count + 1;
  
  // Update the entry in Redis
  await setInCache(
    key,
    { count, resetAt: entry.resetAt },
    Math.ceil((entry.resetAt - now) / 1000)
  );
  
  // Check if over limit
  const limited = count > RATE_LIMIT_MAX;
  const remaining = Math.max(0, RATE_LIMIT_MAX - count);
  
  return {
    limited,
    remaining,
    resetAt: entry.resetAt
  };
}

/**
 * Check rate limit using in-memory store (fallback)
 */
function checkInMemoryRateLimit(
  identifier: string,
  now: number,
  windowEnd: number
): { limited: boolean; remaining: number; resetAt: number } {
  // Get or create rate limit entry
  let entry = fallbackRateLimitStore.get(identifier);
  if (!entry || entry.resetAt <= now) {
    // Create new entry if none exists or if the window has expired
    entry = {
      count: 0,
      resetAt: windowEnd
    };
    fallbackRateLimitStore.set(identifier, entry);
  }
  
  // Increment the counter
  entry.count++;
  
  // Check if over limit
  const limited = entry.count > RATE_LIMIT_MAX;
  const remaining = Math.max(0, RATE_LIMIT_MAX - entry.count);
  
  return {
    limited,
    remaining,
    resetAt: entry.resetAt
  };
}

/**
 * Apply rate limiting middleware
 */
export const applyRateLimit = async (request: Request): Promise<{
  rateLimited: boolean;
  headers: Record<string, string>;
}> => {
  // Get client IP or API key (fallback to a default in development)
  const clientIp = request.headers.get("x-forwarded-for") || 
                  request.headers.get("cf-connecting-ip") || 
                  "127.0.0.1";
  
  // Check rate limit
  const { limited, remaining, resetAt } = await checkRateLimit(clientIp);
  
  // Set rate limit headers
  const headers = {
    "X-RateLimit-Limit": RATE_LIMIT_MAX.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": Math.floor(resetAt / 1000).toString(),
    "X-RateLimit-Backend": isRedisConnected() ? "redis" : "memory"
  };
  
  return {
    rateLimited: limited,
    headers
  };
}; 