import { magicMath, magicMathIterative, LARGE_INPUT_THRESHOLD } from "../algorithms/index.ts";
import { serveFile } from "https://deno.land/std@0.216.0/http/file_server.ts";
import { join } from "https://deno.land/std@0.216.0/path/mod.ts";
import { getBenchmarkData } from "../utils/benchmark_data.ts";
import { getFromCache, setInCache, isRedisConnected } from "../utils/redis_client.ts";
import { applyRateLimit } from "../utils/rate_limiter.ts";
import { logger } from "../utils/logger.ts";

// Type definition for cached result
interface CachedResult {
  input: number;
  result: number;
  algorithm: string;
  cache?: string;
}

/**
 * Creates a request handler for the Magic Math API
 */
export const createHandler = () => {
  return async (request: Request): Promise<Response> => {
    // Apply rate limiting
    const { rateLimited, headers: rateLimitHeaders } = await applyRateLimit(request);
    
    // If rate limited, return 429 Too Many Requests
    if (rateLimited) {
      return new Response(
        JSON.stringify({ 
          error: "Too many requests. Please try again later.",
          documentation: "See X-RateLimit-* headers for details"
        }),
        {
          headers: { 
            "Content-Type": "application/json",
            ...rateLimitHeaders
          },
          status: 429,
        }
      );
    }
    
    const url = new URL(request.url);
    const path = url.pathname;

    // Apply API versioning
    const apiVersion = "v1"; // Current version
    
    // Check if using versioned API path
    if (path.startsWith(`/api/${apiVersion}/`)) {
      // Strip version prefix to reuse existing handlers
      const versionedPath = path.replace(`/api/${apiVersion}`, "");
      
      // Create a new request with the modified path
      const newUrl = new URL(request.url);
      newUrl.pathname = versionedPath;
      
      const modifiedRequest = new Request(newUrl, request);
      return handleRequest(modifiedRequest, rateLimitHeaders);
    }
    
    // For backwards compatibility, still handle unversioned paths
    return handleRequest(request, rateLimitHeaders);
  };
};

/**
 * Handle API request with rate limit headers
 */
async function handleRequest(request: Request, rateLimitHeaders: Record<string, string>): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle static files and special routes
  if (path === "/" || path.startsWith("/public/") || path === "/swagger/index.html" || path === "/openapi.yaml") {
    return await handleStaticFiles(request, path);
  }

  // Handle benchmark data endpoint
  if (path === "/benchmark") {
    return addHeaders(handleBenchmarkData(), rateLimitHeaders);
  }
  
  // Handle batch calculations
  if (path === "/batch" && request.method === "POST") {
    return addHeaders(await handleBatchCalculations(request), rateLimitHeaders);
  }

  // Handle health check endpoint
  if (path === "/health") {
    return addHeaders(handleHealthCheck(), rateLimitHeaders);
  }

  // Handle magic math calculation
  const match = path.match(/^\/(-?\d+)$/);
  if (match) {
    return addHeaders(await handleMagicMathCalculation(match), rateLimitHeaders);
  }

  // Handle invalid path
  return addHeaders(
    new Response(
      JSON.stringify({ error: "Invalid path. Use /:number format." }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      }
    ),
    rateLimitHeaders
  );
}

/**
 * Add rate limit headers to response
 */
function addHeaders(response: Response, headers: Record<string, string>): Response {
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
  
  // Add rate limit headers
  for (const [key, value] of Object.entries(headers)) {
    newResponse.headers.set(key, value);
  }
  
  return newResponse;
}

/**
 * Handle serving static files
 */
async function handleStaticFiles(request: Request, path: string): Promise<Response> {
  try {
    // Determine the file path
    let filePath;
    if (path === "/") {
      filePath = join(Deno.cwd(), "public", "index.html");
    } else if (path === "/swagger/index.html") {
      filePath = join(Deno.cwd(), "public", "swagger", "index.html");
    } else if (path === "/openapi.yaml") {
      filePath = join(Deno.cwd(), "public", "openapi.yaml");
    } else {
      // Handle other paths, ensuring they only access files within public directory
      if (path.startsWith("/public/")) {
        filePath = join(Deno.cwd(), path);
      } else {
        return new Response("Access denied", { status: 403 });
      }
    }
    
    // Log the file path being accessed
    logger.debug(`Serving static file: ${filePath}`, { path });
    
    return await serveFile(request, filePath);
  } catch (error) {
    // Log the error
    logger.error(`Error serving static file: ${error instanceof Error ? error.message : String(error)}`, { 
      path,
      error
    });
    
    // Fallback to API info if file not found
    if (path === "/") {
      return new Response(
        JSON.stringify({
          message: "Magic Math API",
          usage: "GET /:number - Calculate magic math for a given number",
          example: "curl http://127.0.0.1:5000/5",
          note: `For large numbers (n >= ${LARGE_INPUT_THRESHOLD}), an iterative algorithm is used to avoid stack overflow`,
          versioned_api: "For versioned API, use /api/v1/:number"
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      return new Response(`File not found: ${path}`, { status: 404 });
    }
  }
}

/**
 * Handle health check endpoint
 */
function handleHealthCheck(): Response {
  return new Response(
    JSON.stringify({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      uptime: performance.now(),
      cache: isRedisConnected() ? "connected" : "disconnected"
    }),
    {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }
  );
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
 * Calculate magic math value with caching
 */
async function calculateMagicMathWithCache(num: number): Promise<CachedResult> {
  // Check cache first if Redis is connected
  if (isRedisConnected()) {
    const cacheKey = `magic_math:${num}`;
    const cachedResult = await getFromCache<CachedResult>(cacheKey);
    
    if (cachedResult) {
      // Add a cache hit indicator
      return { ...cachedResult, cache: "hit" };
    }
  }
  
  // Calculate the result if not in cache
  let result;
  let algorithm = "recursive";
  
  if (num >= LARGE_INPUT_THRESHOLD) {
    result = magicMathIterative(num);
    algorithm = "iterative";
  } else {
    result = magicMath(num);
  }
  
  const calculatedResult = { 
    input: num, 
    result, 
    algorithm,
    cache: "miss" 
  };
  
  // Cache the result if Redis is connected
  if (isRedisConnected()) {
    const cacheKey = `magic_math:${num}`;
    await setInCache(cacheKey, calculatedResult);
  }
  
  return calculatedResult;
}

/**
 * Handle batch calculations for multiple inputs
 */
async function handleBatchCalculations(request: Request): Promise<Response> {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    if (!Array.isArray(body.inputs)) {
      return new Response(
        JSON.stringify({ error: "Request body must contain an 'inputs' array" }),
        {
          headers: { "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    // Process each input with potential caching
    const resultsPromises = body.inputs.map(async (input: unknown) => {
      const num = typeof input === 'number' ? input : parseInt(String(input), 10);
      
      // Skip invalid inputs but continue processing valid ones
      if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
        return { input, error: "Input must be a non-negative integer" };
      }
      
      // Calculate the magic math value with caching
      try {
        return await calculateMagicMathWithCache(num);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { input: num, error: errorMessage };
      }
    });
    
    const results = await Promise.all(resultsPromises);
    
    return new Response(
      JSON.stringify({ results }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: `Failed to process batch request: ${errorMessage}` }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
}

/**
 * Handle magic math calculation
 */
async function handleMagicMathCalculation(match: RegExpMatchArray): Promise<Response> {
  const num = parseInt(match[1], 10);
  
  try {
    // Calculate magic math with caching
    const result = await calculateMagicMathWithCache(num);
    
    return new Response(
      JSON.stringify(result),
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