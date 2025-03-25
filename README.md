# Magic Math API

A simple REST API that calculates Magic Math values. Magic Math is defined as:

- magic_math(0) = 0
- magic_math(1) = 1
- magic_math(N) = magic_math(N−1) + magic_math(N−2) + N

## Features

- **REST API** for calculating Magic Math values
- **Interactive Web UI** for visualizing the Magic Math sequence
- **Dual Implementations**:
  - Recursive with memoization (default for values < 1000)
  - Iterative (for large values to avoid stack overflow)
- **Performance Benchmarking** to compare algorithm efficiency
- **Automatic Port Selection** if default port is busy
- **Docker/Docker Compose Support** for easy deployment
- **Batch Processing** for calculating multiple values in a single request
- **Redis Caching** for improved performance on frequently requested values
- **Rate Limiting** to prevent abuse
- **API Versioning** for future compatibility
- **OpenAPI/Swagger Documentation** for easy API exploration
- **CI/CD Pipeline** with GitHub Actions for automated testing and deployment
- **Health Check Endpoints** for monitoring

## Prerequisites

- [Deno](https://deno.com/) runtime (version 1.36.0 or later)

  OR

- [Docker](https://www.docker.com/) and
  [Docker Compose](https://docs.docker.com/compose/) for containerized
  deployment

## Running the Application

### Using Deno (directly)

To start the server, run:

```bash
deno run --allow-net --allow-env --allow-read main.ts
```

Or use the predefined task:

```bash
deno task dev
```

### Using Docker

Build and run the Docker container:

```bash
# Build the Docker image
docker build -t magic-math-api .

# Run the container with Redis disabled
docker run -p 5001:5000 -e REDIS_URL="" magic-math-api

# Or with a specific port
docker run -p 8080:5000 -e PORT=5000 -e REDIS_URL="" magic-math-api
```

> **Note**: Port 5000 may already be in use on some systems. You can use a different port like 5001 as shown above.

### Using Docker Compose (Recommended)

The recommended way to run the application is with Docker Compose, which automatically sets up both the API and Redis server:

```bash
# Start the application with Docker Compose
docker-compose up

# Or run it in detached mode
docker-compose up -d
```

By default, the application will be accessible at `http://localhost:5001/` as configured in the `docker-compose.yml` file.

To stop the services:

```bash
# Stop the containers but preserve data
docker-compose down

# Stop the containers and remove volumes (clears Redis data)
docker-compose down -v
```

## Web UI

The application includes a web interface accessible at the root URL:

```
http://localhost:5001/
```

The UI allows you to:

- Enter any non-negative integer
- See the calculated Magic Math result
- Visualize the entire Magic Math sequence up to your input

## API Endpoints

### Calculate Magic Math

```
GET /:number
```

Example:

```bash
curl http://localhost:5001/5
```

Response:

```json
{
  "input": 5,
  "result": 26,
  "algorithm": "recursive",
  "cache": "miss"
}
```

For large inputs (n >= 1000), the API automatically switches to the iterative
algorithm:

```bash
curl http://localhost:5001/1000
```

Response:

```json
{
  "input": 1000,
  "result": 1116779790,
  "algorithm": "iterative",
  "cache": "miss"
}
```

### Batch Processing

```
POST /batch
```

Request body:

```json
{
  "inputs": [0, 1, 2, 3, 4, 5]
}
```

Example:

```bash
curl -X POST -H "Content-Type: application/json" -d '{"inputs":[0,1,2,3,4,5]}' http://localhost:5001/batch
```

Response:

```json
{
  "results": [
    { "input": 0, "result": 0, "algorithm": "recursive", "cache": "miss" },
    { "input": 1, "result": 1, "algorithm": "recursive", "cache": "miss" },
    { "input": 2, "result": 3, "algorithm": "recursive", "cache": "miss" },
    { "input": 3, "result": 7, "algorithm": "recursive", "cache": "miss" },
    { "input": 4, "result": 14, "algorithm": "recursive", "cache": "miss" },
    { "input": 5, "result": 26, "algorithm": "recursive", "cache": "miss" }
  ]
}
```

### Health Check

```
GET /health
```

Response:

```json
{
  "status": "healthy",
  "timestamp": "2023-12-01T12:34:56.789Z",
  "uptime": 3600000,
  "cache": "connected"
}
```

### API Documentation

Swagger UI is available at:

```
http://localhost:5001/swagger/index.html
```

### Versioned API

All endpoints are also available with versioning:

```
GET /api/v1/:number
POST /api/v1/batch
```

Example:

```bash
curl http://localhost:5001/api/v1/5
```

### Benchmark Data

```
GET /benchmark
```

Returns performance comparison data between recursive and iterative
implementations.

### Invalid Input Handling

The API will return a 400 error for negative or non-integer inputs.

Example:

```bash
curl http://localhost:5001/-1
```

Response:

```json
{
  "error": "Input must be a non-negative integer"
}
```

## Advanced Configuration

### Redis Caching

The application is configured to use Redis for caching when available. When using Docker Compose, Redis is automatically set up and connected.

If you're running the application without Docker Compose, you can enable Redis caching by setting the following environment variables:

```bash
# Redis connection URL
REDIS_URL=redis://localhost:6379

# Cache TTL in seconds (default: 3600)
CACHE_TTL=3600
```

To disable Redis completely (use in-memory caching only):

```bash
# With Deno
REDIS_URL="" deno run --allow-net --allow-env --allow-read main.ts

# With Docker
docker run -p 5001:5000 -e REDIS_URL="" magic-math-api
```

With Docker Compose, Redis is already configured and will be used automatically. To check if Redis is connected, access the health endpoint:

```bash
curl http://localhost:5001/health
```

If Redis is connected, you'll see `"cache": "connected"` in the response.

### Rate Limiting

The API includes robust rate limiting with Redis support:

```bash
# Maximum requests per window
RATE_LIMIT_MAX=100

# Rate limit window in milliseconds (default: 60000 - 1 minute)
RATE_LIMIT_WINDOW=60000
```

The rate limiter automatically uses Redis when available, with the following
benefits:

- Distributed rate limiting across multiple API instances
- Persistence across server restarts
- Automatic fallback to in-memory rate limiting if Redis is unavailable

Rate limit headers are included in all responses:

```json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1631234567
X-RateLimit-Backend: redis
```

## Port Configuration

The server will start at `http://localhost:5000` by default. If port 5000 is
already in use, the application will automatically try the next available port
(5001, 5002, etc.).

You can specify a custom port by setting the `PORT` environment variable:

```bash
# With Deno
PORT=8080 deno run --allow-net --allow-env --allow-read main.ts

# With Docker
docker run -p 8080:8080 -e PORT=8080 magic-math-api

# With Docker Compose
# Edit the ports section in docker-compose.yml:
# ports:
#   - "8080:5000"
# And then run:
docker-compose up -d
```

> **Note**: In the current configuration, the Docker Compose setup uses port 5001 on the host machine to avoid conflicts with port 5000, which is commonly used by other services.

## Running Tests

### Using Deno

```bash
# Run all tests
deno task test

# Run only iterative implementation tests
deno task test:iterative
```

### Using Docker

```bash
docker-compose run --rm magic-math-api test
```

## Performance Benchmarking

Compare the performance of different Magic Math implementations:

```bash
# Run benchmark with default values (n=30, 5 runs)
deno task benchmark

# Run benchmark with large values (n=500, 3 runs)
deno task benchmark:large

# Custom benchmark (n=100, 10 runs)
deno run --allow-net --allow-env benchmark.ts 100 10
```

## Implementation Notes

- The recursive implementation uses memoization to avoid redundant calculations
- The iterative implementation avoids stack overflow for large inputs
- For values ≥ 1000, the API automatically uses the iterative implementation
- The server automatically tries alternative ports if the default one is in use
- Docker deployment includes hot-reloading for development

## Development Workflow

### Git Hooks

This project uses custom Git hooks for Deno, similar to Husky in Node.js
projects. These hooks ensure code quality and consistency:

- **Pre-commit Hook**: Automatically runs formatting and linting on staged files
- **Post-merge Hook**: Refreshes dependencies when package configuration changes

#### Installing Hooks

Hooks are automatically installed when you run:

```bash
deno task hooks:install
```

#### Bypassing Hooks

If needed, you can bypass hooks using the `--no-verify` flag:

```bash
git commit -m "Your commit message" --no-verify
```

For more details, see the [hooks documentation](hooks/README.md).

### Code Formatting

To format your code:

```bash
deno fmt
```

### Linting

To lint your code:

```bash
deno lint
```

## Troubleshooting

### Port Already in Use

If you see an error like `Error response from daemon: Ports are not available: exposing port TCP 0.0.0.0:5000 -> 0.0.0.0:0: listen tcp 0.0.0.0:5000: bind: address already in use`, you can:

1. Change the port mapping in docker-compose.yml:
   ```yml
   ports:
     - "5001:5000"  # Use port 5001 on host instead of 5000
   ```

2. Or stop the process using port 5000:
   ```bash
   # Find process using port 5000
   lsof -i :5000
   
   # Kill the process
   kill -9 [PID]
   ```

### Redis Connection Issues

If you see Redis connection errors but the application is still working, this is normal behavior when Redis is not available. The application will fall back to in-memory caching.

To ensure Redis is running properly with Docker Compose:

```bash
# Check Redis container status
docker ps | grep redis

# View Redis logs
docker logs magic-math-redis
```

### Platform Warning in Docker

If you see a warning like `The requested image's platform (linux/amd64) does not match the detected host platform (linux/arm64/v8)`, you can:

1. Specify the platform when building:
   ```bash
   docker build --platform linux/arm64 -t magic-math-api .
   ```

2. Or modify the Dockerfile to use a platform-specific image:
   ```dockerfile
   FROM --platform=linux/arm64 denoland/deno:1.37.0
   ```

This warning typically appears when running on Apple Silicon (M1/M2/M3) Macs but doesn't affect functionality in most cases.

### For Developers: Working with Deno npm Dependencies

The project uses Redis from npm. If you need to add or update npm dependencies:

```bash
# Cache the npm dependency (don't use 'deno add')
deno cache --reload npm:redis@4.7.0

# Import in your code
import { createClient } from "npm:redis@4.7.0";
```
