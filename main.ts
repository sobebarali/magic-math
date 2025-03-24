import { serve } from "https://deno.land/std@0.216.0/http/server.ts";
import { createHandler } from "./api.ts";

// Function to start server with automatic port selection if default is in use
const startServer = async (initialPort: number): Promise<void> => {
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

// Start the server if this module is executed directly
if (import.meta.main) {
  // Try to get port from environment variable or use default
  const DEFAULT_PORT = 5000;
  const PORT = parseInt(Deno.env.get("PORT") || String(DEFAULT_PORT), 10);
  
  try {
    await startServer(PORT);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to start server: ${errorMessage}`);
    Deno.exit(1);
  }
} 