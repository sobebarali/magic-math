import { startServer } from "./src/server.ts";

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