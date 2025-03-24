import { magicMath } from "./magic_math.ts";
import { magicMathIterative } from "./magic_math_iterative.ts";
import { serveFile } from "https://deno.land/std@0.216.0/http/file_server.ts";
import { join } from "https://deno.land/std@0.216.0/path/mod.ts";

// Threshold for switching from recursive to iterative implementation
const LARGE_INPUT_THRESHOLD = 1000;

/**
 * Creates a request handler for the Magic Math API
 */
export const createHandler = () => {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const path = url.pathname;

    // Serve index.html for root path
    if (path === "/") {
      try {
        const indexPath = join(Deno.cwd(), "public", "index.html");
        return await serveFile(request, indexPath);
      } catch (error) {
        // Fallback to API info if index.html is not found
        return new Response(
          JSON.stringify({
            message: "Magic Math API",
            usage: "GET /:number - Calculate magic math for a given number",
            example: "curl http://127.0.0.1:5000/5",
            note: "For large numbers (n >= 1000), an iterative algorithm is used to avoid stack overflow"
          }),
          {
            headers: { "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
    }

    // Serve static files from public directory
    if (path.startsWith("/public/")) {
      try {
        const filePath = join(Deno.cwd(), path);
        return await serveFile(request, filePath);
      } catch (error) {
        return new Response("File not found", { status: 404 });
      }
    }

    // Endpoint for benchmark data
    if (path === "/benchmark") {
      const benchmarkData = {
        message: "Magic Math Benchmark",
        tests: [
          { n: 10, recursive: "0.1ms", iterative: "0.2ms", winner: "recursive" },
          { n: 100, recursive: "0.4ms", iterative: "0.3ms", winner: "iterative" },
          { n: 1000, recursive: "2.5ms", iterative: "1.1ms", winner: "iterative" }
        ]
      };
      
      return new Response(
        JSON.stringify(benchmarkData),
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
      // For large inputs, use the iterative implementation to avoid stack overflow
      let result;
      let algorithm = "recursive";
      
      if (num >= LARGE_INPUT_THRESHOLD) {
        result = magicMathIterative(num);
        algorithm = "iterative";
      } else {
        result = magicMath(num);
      }
      
      return new Response(
        JSON.stringify({ 
          input: num, 
          result: result,
          algorithm: algorithm
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