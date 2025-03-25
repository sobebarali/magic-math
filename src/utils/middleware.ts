import { generateTraceId, logger } from "./logger.ts";

/**
 * Middleware for adding trace IDs to requests and logging request info
 */
export function createRequestLoggerMiddleware() {
  return async (request: Request, next: (request: Request) => Promise<Response>): Promise<Response> => {
    const startTime = performance.now();
    
    // Generate a trace ID for this request
    const traceId = generateTraceId();
    
    // Create a context for all logs in this request
    const requestContext = {
      traceId,
      method: request.method,
      path: new URL(request.url).pathname,
      userAgent: request.headers.get("user-agent") || "unknown"
    };
    
    // Log request received
    logger.info(`Request received`, requestContext);
    
    // Create a new request with trace ID header
    const requestWithTraceId = new Request(request.url, {
      method: request.method,
      headers: new Headers(request.headers),
      body: request.body,
      redirect: request.redirect,
      integrity: request.integrity,
      keepalive: request.keepalive
    });
    
    // Add trace ID to headers
    requestWithTraceId.headers.set("X-Trace-ID", traceId);
    
    try {
      // Pass to next handler
      const response = await next(requestWithTraceId);
      
      // Calculate request duration
      const duration = performance.now() - startTime;
      
      // Log response info
      logger.info(`Request completed`, {
        ...requestContext,
        status: response.status,
        duration: `${duration.toFixed(2)}ms`
      });
      
      // Add trace ID to response headers
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
      
      newResponse.headers.set("X-Trace-ID", traceId);
      
      return newResponse;
    } catch (error) {
      // Calculate request duration even for errors
      const duration = performance.now() - startTime;
      
      // Log error information
      logger.error(`Request failed`, {
        ...requestContext,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duration: `${duration.toFixed(2)}ms`
      });
      
      // Return error response with trace ID
      const errorResponse = new Response(
        JSON.stringify({
          error: "Internal server error",
          traceId
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "X-Trace-ID": traceId
          }
        }
      );
      
      return errorResponse;
    }
  };
} 