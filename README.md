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

## Prerequisites

- [Deno](https://deno.com/) runtime (version 1.36.0 or later)
  
  OR
  
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) for containerized deployment

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
docker run -p 8080:5000 magic-math-api
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

```
http://127.0.0.1:5000/
```

or if using Docker:

```
http://127.0.0.1:8080/
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

For large inputs (n >= 1000), the API automatically switches to the iterative algorithm:

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

### Benchmark Data

```
GET /benchmark
```

Returns performance comparison data between recursive and iterative implementations.

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

## Port Configuration

The server will start at http://127.0.0.1:5000 by default. If port 5000 is already in use, the application will automatically try the next available port (5001, 5002, etc.).

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