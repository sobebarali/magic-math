import { createClient } from "npm:redis@4.7.0";
import type { RedisClientType as _RedisClientType } from "npm:redis@4.7.0";
import { logger } from "./logger.ts";

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
let isClosing = false; // Add flag to track closing state

/**
 * Initialize Redis client
 */
export const initRedisClient = async (): Promise<void> => {
  if (redisClient) return;
  isClosing = false; // Reset closing flag on initialization

  try {
    logger.info(`Connecting to Redis at ${REDIS_URL}...`);
    redisClient = createClient({
      url: REDIS_URL,
    });

    // Handle connection events
    // Using type assertion to handle the event emitter methods
    (redisClient as unknown as { on: (event: string, listener: (...args: unknown[]) => void) => void }).on(
      "error", 
      (err: unknown) => {
        logger.error("Redis client error", { error: err });
        isConnected = false;
      }
    );

    (redisClient as unknown as { on: (event: string, listener: (...args: unknown[]) => void) => void }).on(
      "connect", 
      () => {
        logger.info("Redis client connected");
        isConnected = true;
      }
    );

    await redisClient.connect();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to connect to Redis: ${errorMessage}`, { error });
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
  // Check if already closing or closed
  if (isClosing || !redisClient || !isConnected) {
    return;
  }
  
  isClosing = true; // Set closing flag to prevent multiple close attempts
  
  try {
    logger.info("Closing Redis client connection");
    await redisClient.quit();
  } catch (error: unknown) {
    // Handle "client is closed" errors gracefully
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("client is closed")) {
      logger.debug("Redis client already closed");
    } else {
      logger.error(`Error closing Redis client: ${errorMessage}`, { error });
    }
  } finally {
    // Ensure we always mark as disconnected and null the client
    isConnected = false;
    redisClient = null;
    isClosing = false;
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
    logger.error(`Failed to get from cache: ${errorMessage}`, { error, key });
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
    logger.error(`Failed to set in cache: ${errorMessage}`, { error, key });
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
    logger.error(`Failed to delete from cache: ${errorMessage}`, { error, key });
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
    logger.error(`Failed to flush cache: ${errorMessage}`, { error });
    return false;
  }
}; 