import { magicMath } from "./magic_math.ts";

/**
 * Creates a request handler for the Magic Math API
 */
export const createHandler = () => {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const path = url.pathname;

    // Root path returns usage information
    if (path === "/") {
      return new Response(
        JSON.stringify({
          message: "Magic Math API",
          usage: "GET /:number - Calculate magic math for a given number",
          example: "curl http://127.0.0.1:5000/5",
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Extract the number from the path
    const match = path.match(/^\/(-?\d+)$/);
    if (!match) {
      return new Response(
        JSON.stringify({ error: "Invalid path. Use /:number format." }),
        {
          headers: { "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const num = parseInt(match[1], 10);
    
    try {
      const result = magicMath(num);
      return new Response(
        JSON.stringify({ 
          input: num, 
          result: result 
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          headers: { "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
  };
}; 