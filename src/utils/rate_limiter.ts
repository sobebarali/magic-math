/**
 * Simple in-memory rate limiter for API requests
 */

// Rate limit configuration
const RATE_LIMIT_WINDOW = parseInt(Deno.env.get("RATE_LIMIT_WINDOW") || "60000", 10); // 1 minute in ms
const RATE_LIMIT_MAX = parseInt(Deno.env.get("RATE_LIMIT_MAX") || "100", 10); // 100 requests per window

// Store for rate limiting data
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limits (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired rate limit entries
 */
const cleanupRateLimits = (): void => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
};

// Start cleanup process
setInterval(cleanupRateLimits, RATE_LIMIT_WINDOW);

/**
 * Check if a request is rate limited
 * @param identifier The identifier for rate limiting (IP address or API key)
 * @returns Object with limit information
 */
export const checkRateLimit = (identifier: string): { 
  limited: boolean; 
  remaining: number; 
  resetAt: number;
} => {
  const now = Date.now();
  
  // Get or create rate limit entry
  let entry = rateLimitStore.get(identifier);
  if (!entry || entry.resetAt <= now) {
    // Create new entry if none exists or if the window has expired
    entry = {
      count: 0,
      resetAt: now + RATE_LIMIT_WINDOW,
    };
    rateLimitStore.set(identifier, entry);
  }
  
  // Increment the counter
  entry.count++;
  
  // Check if over limit
  const limited = entry.count > RATE_LIMIT_MAX;
  const remaining = Math.max(0, RATE_LIMIT_MAX - entry.count);
  
  return {
    limited,
    remaining,
    resetAt: entry.resetAt,
  };
};

/**
 * Apply rate limiting middleware
 */
export const applyRateLimit = (request: Request): { 
  rateLimited: boolean;
  headers: Record<string, string>;
} => {
  // Get client IP or API key (fallback to a default in development)
  const clientIp = request.headers.get("x-forwarded-for") || 
                  request.headers.get("cf-connecting-ip") || 
                  "127.0.0.1";
  
  // Check rate limit
  const { limited, remaining, resetAt } = checkRateLimit(clientIp);
  
  // Set rate limit headers
  const headers = {
    "X-RateLimit-Limit": RATE_LIMIT_MAX.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": Math.floor(resetAt / 1000).toString(),
  };
  
  return { 
    rateLimited: limited,
    headers,
  };
}; 