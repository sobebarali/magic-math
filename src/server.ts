import { serve } from "https://deno.land/std@0.216.0/http/server.ts";
import { createHandler } from "./api/index.ts";

/**
 * Starts the server on the specified port, with automatic fallback if port is in use
 */
export const startServer = async (initialPort: number): Promise<void> => {
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
        throw error;
      }
    }
  }
  
  throw new Error(`Could not find an available port after ${MAX_PORT_ATTEMPTS} attempts.`);
}; 