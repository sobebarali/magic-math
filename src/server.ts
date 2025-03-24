import { serve } from "https://deno.land/std@0.216.0/http/server.ts";
import { createHandler } from "./api/index.ts";
import { initRedisClient, closeRedisClient } from "./utils/redis_client.ts";

/**
 * Starts the server on the specified port, with automatic fallback if port is in use
 */
export const startServer = async (initialPort: number): Promise<void> => {
  // Initialize Redis client
  try {
    await initRedisClient();
  } catch (error: unknown) {
    console.warn("Redis initialization failed, continuing without caching:", error);
  }

  // Register shutdown handler to close Redis connection
  Deno.addSignalListener("SIGINT", async () => {
    console.log("Shutting down gracefully...");
    await closeRedisClient();
    Deno.exit(0);
  });

  const handler = createHandler();
  let port = initialPort;
  const MAX_PORT_ATTEMPTS = 10;
  
  for (let attempt = 0; attempt < MAX_PORT_ATTEMPTS; attempt++) {
    try {
      console.log(`Attempting to start Magic Math API on http://127.0.0.1:${port}`);
      await serve(handler, { port });
      // If serve doesn't throw, we've successfully started
      return;
    } catch (error: unknown) {
      // Check if error is because address is in use
      if (error instanceof Deno.errors.AddrInUse) {
        console.log(`Port ${port} is already in use. Trying next port...`);
        port++;
      } else {
        // For other errors, just throw them
        await closeRedisClient(); // Close Redis connection on error
        throw error;
      }
    }
  }
  
  await closeRedisClient(); // Close Redis connection if we couldn't start the server
  throw new Error(`Could not find an available port after ${MAX_PORT_ATTEMPTS} attempts.`);
}; 