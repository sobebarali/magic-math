import { createClient } from "npm:redis@4.7.0";

/**
 * Redis client configuration
 */
const REDIS_URL = Deno.env.get("REDIS_URL") || "redis://localhost:6379";
const CACHE_TTL = parseInt(Deno.env.get("CACHE_TTL") || "3600", 10); // Default: 1 hour

/**
 * Redis client instance
 */
let redisClient: ReturnType<typeof createClient> | null = null;
let isConnected = false;

/**
 * Initialize Redis client
 */
export const initRedisClient = async (): Promise<void> => {
  if (redisClient) return;

  try {
    console.log(`Connecting to Redis at ${REDIS_URL}...`);
    redisClient = createClient({
      url: REDIS_URL,
    });

    // Handle connection events
    redisClient.on("error", (err) => {
      console.error("Redis client error:", err);
      isConnected = false;
    });

    redisClient.on("connect", () => {
      console.log("Redis client connected");
      isConnected = true;
    });

    await redisClient.connect();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to connect to Redis: ${errorMessage}`);
    isConnected = false;
    // Don't throw to allow the application to work without Redis
  }
};

/**
 * Check if Redis is connected
 */
export const isRedisConnected = (): boolean => isConnected;

/**
 * Close Redis client connection
 */
export const closeRedisClient = async (): Promise<void> => {
  if (redisClient && isConnected) {
    await redisClient.quit();
    isConnected = false;
    redisClient = null;
  }
};

/**
 * Get value from cache
 */
export const getFromCache = async <T>(key: string): Promise<T | null> => {
  if (!redisClient || !isConnected) return null;

  try {
    const data = await redisClient.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to get from cache: ${errorMessage}`);
    return null;
  }
};

/**
 * Set value in cache
 */
export const setInCache = async <T>(key: string, value: T, ttl = CACHE_TTL): Promise<boolean> => {
  if (!redisClient || !isConnected) return false;

  try {
    await redisClient.set(key, JSON.stringify(value), { EX: ttl });
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to set in cache: ${errorMessage}`);
    return false;
  }
};

/**
 * Delete value from cache
 */
export const deleteFromCache = async (key: string): Promise<boolean> => {
  if (!redisClient || !isConnected) return false;

  try {
    await redisClient.del(key);
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to delete from cache: ${errorMessage}`);
    return false;
  }
};

/**
 * Flush all cache
 */
export const flushCache = async (): Promise<boolean> => {
  if (!redisClient || !isConnected) return false;

  try {
    await redisClient.flushDb();
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to flush cache: ${errorMessage}`);
    return false;
  }
}; 