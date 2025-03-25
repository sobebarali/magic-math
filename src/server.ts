import { serve } from "https://deno.land/std@0.216.0/http/server.ts";
import { createHandler } from "./api/index.ts";
import { closeRedisClient, initRedisClient } from "./utils/redis_client.ts";
import { createRequestLoggerMiddleware } from "./utils/middleware.ts";
import { logger } from "./utils/logger.ts";

// Track shutdown state
let isShuttingDown = false;

/**
 * Starts the server on the specified port, with automatic fallback if port is in use
 */
export const startServer = async (initialPort: number): Promise<void> => {
  // Initialize Redis client
  try {
    await initRedisClient();
  } catch (error: unknown) {
    logger.warn("Redis initialization failed, continuing without caching", {
      error,
    });
  }

  // Register shutdown handler to close Redis connection
  Deno.addSignalListener("SIGINT", async () => {
    // Prevent multiple shutdown attempts
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    logger.info("Shutting down gracefully...");

    try {
      await closeRedisClient();
    } catch (error) {
      logger.error("Error during shutdown", { error });
    }

    Deno.exit(0);
  });

  // Create the API request handler
  const apiHandler = createHandler();

  // Create the logging middleware
  const requestLoggerMiddleware = createRequestLoggerMiddleware();

  // Combine middleware with handler
  const handler = (request: Request) => {
    return requestLoggerMiddleware(request, apiHandler);
  };

  let port = initialPort;
  const MAX_PORT_ATTEMPTS = 10;

  for (let attempt = 0; attempt < MAX_PORT_ATTEMPTS; attempt++) {
    try {
      logger.info(
        `Attempting to start Magic Math API on http://127.0.0.1:${port}`,
      );
      await serve(handler, { port });
      // If serve doesn't throw, we've successfully started
      return;
    } catch (error: unknown) {
      // Check if error is because address is in use
      if (error instanceof Deno.errors.AddrInUse) {
        logger.warn(`Port ${port} is already in use. Trying next port...`);
        port++;
      } else {
        // For other errors, just throw them
        await closeRedisClient(); // Close Redis connection on error
        logger.error("Failed to start server", { error });
        throw error;
      }
    }
  }

  await closeRedisClient(); // Close Redis connection if we couldn't start the server
  throw new Error(
    `Could not find an available port after ${MAX_PORT_ATTEMPTS} attempts.`,
  );
};
