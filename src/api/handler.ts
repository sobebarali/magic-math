import { magicMath, magicMathIterative, LARGE_INPUT_THRESHOLD } from "../algorithms/index.ts";
import { serveFile } from "https://deno.land/std@0.216.0/http/file_server.ts";
import { join } from "https://deno.land/std@0.216.0/path/mod.ts";
import { getBenchmarkData } from "../utils/benchmark_data.ts";

/**
 * Creates a request handler for the Magic Math API
 */
export const createHandler = () => {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle static files and special routes
    if (path === "/" || path.startsWith("/public/")) {
      return await handleStaticFiles(request, path);
    }

    // Handle benchmark data endpoint
    if (path === "/benchmark") {
      return handleBenchmarkData();
    }

    // Handle magic math calculation
    const match = path.match(/^\/(-?\d+)$/);
    if (match) {
      return handleMagicMathCalculation(match);
    }

    // Handle invalid path
    return new Response(
      JSON.stringify({ error: "Invalid path. Use /:number format." }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      }
    );
  };
};

/**
 * Handle serving static files
 */
async function handleStaticFiles(request: Request, path: string): Promise<Response> {
  try {
    // Determine the file path
    let filePath;
    if (path === "/") {
      filePath = join(Deno.cwd(), "public", "index.html");
    } else {
      filePath = join(Deno.cwd(), path);
    }
    return await serveFile(request, filePath);
  } catch (_error) {
    // Fallback to API info if file not found
    if (path === "/") {
      return new Response(
        JSON.stringify({
          message: "Magic Math API",
          usage: "GET /:number - Calculate magic math for a given number",
          example: "curl http://127.0.0.1:5000/5",
          note: `For large numbers (n >= ${LARGE_INPUT_THRESHOLD}), an iterative algorithm is used to avoid stack overflow`
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      return new Response("File not found", { status: 404 });
    }
  }
}

/**
 * Handle benchmark data endpoint
 */
function handleBenchmarkData(): Response {
  return new Response(
    JSON.stringify(getBenchmarkData()),
    {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }
  );
}

/**
 * Handle magic math calculation
 */
function handleMagicMathCalculation(match: RegExpMatchArray): Response {
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
} 