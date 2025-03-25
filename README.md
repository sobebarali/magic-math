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
docker build -t magic-math-api .
docker run -p 5000:5000 magic-math-api
```

### Using Docker Compose

Start the application with Docker Compose:

```bash
docker-compose up
```

Or run it in detached mode:

```bash
docker-compose up -d
```

## Web UI

The application includes a web interface accessible at the root URL:

```json
http://127.0.0.1:5000/
```

or if using Docker:

```json
http://127.0.0.1:5000/
```

The UI allows you to:

- Enter any non-negative integer
- See the calculated Magic Math result
- Visualize the entire Magic Math sequence up to your input

## API Endpoints

### Calculate Magic Math

```json
GET /:number
```

Example:

```bash
curl http://127.0.0.1:5000/5
```

Response:

```json
{
  "input": 5,
  "result": 26,
  "algorithm": "recursive"
}
```

For large inputs (n >= 1000), the API automatically switches to the iterative
algorithm:

```bash
curl http://127.0.0.1:5000/1000
```

Response:

```json
{
  "input": 1000,
  "result": 1116779790,
  "algorithm": "iterative"
}
```

### Batch Processing

```json
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
curl -X POST -H "Content-Type: application/json" -d '{"inputs":[0,1,2,3,4,5]}' http://127.0.0.1:5000/batch
```

Response:

```json
{
  "results": [
    { "input": 0, "result": 0, "algorithm": "recursive" },
    { "input": 1, "result": 1, "algorithm": "recursive" },
    { "input": 2, "result": 3, "algorithm": "recursive" },
    { "input": 3, "result": 7, "algorithm": "recursive" },
    { "input": 4, "result": 14, "algorithm": "recursive" },
    { "input": 5, "result": 26, "algorithm": "recursive" }
  ]
}
```

### Health Check

```json
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

```json
http://127.0.0.1:5000/swagger/index.html
```

### Versioned API

All endpoints are also available with versioning:

```json
GET /api/v1/:number
POST /api/v1/batch
```

### Benchmark Data

```json
GET /benchmark
```

Returns performance comparison data between recursive and iterative
implementations.

### Invalid Input Handling

The API will return a 400 error for negative or non-integer inputs.

Example:

```bash
curl http://127.0.0.1:5000/-1
```

Response:

```json
{
  "error": "Input must be a non-negative integer"
}
```

## Advanced Configuration

### Redis Caching

Enable Redis caching by setting the following environment variables:

```bash
# Redis connection URL
REDIS_URL=redis://localhost:6379

# Cache TTL in seconds (default: 3600)
CACHE_TTL=3600
```

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

The server will start at <http://127.0.0.1:5000> by default. If port 5000 is
already in use, the application will automatically try the next available port
(5001, 5002, etc.).

You can specify a custom port by setting the `PORT` environment variable:

```bash
# With Deno
PORT=8080 deno run --allow-net --allow-env --allow-read main.ts

# With Docker
docker run -p 8080:8080 -e PORT=8080 magic-math-api

# With Docker Compose (edit the PORT in docker-compose.yml)
```

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

This project uses custom Git hooks for Deno, similar to Husky in Node.js projects. These hooks ensure code quality and consistency:

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
