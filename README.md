# Magic Math API

A simple REST API that calculates Magic Math values. Magic Math is defined as:

- magic_math(0) = 0
- magic_math(1) = 1
- magic_math(N) = magic_math(N−1) + magic_math(N−2) + N

## Prerequisites

- [Deno](https://deno.com/) runtime (version 1.36.0 or later)
  
  OR
  
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) for containerized deployment

## Running the Application

### Using Deno (directly)

To start the server, run:

```bash
deno run --allow-net --allow-env main.ts
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

## Port Configuration

The server will start at http://127.0.0.1:5000 by default. If port 5000 is already in use, the application will automatically try the next available port (5001, 5002, etc.).

You can specify a custom port by setting the `PORT` environment variable:

```bash
# With Deno
PORT=8080 deno run --allow-net --allow-env main.ts

# With Docker
docker run -p 8080:8080 -e PORT=8080 magic-math-api

# With Docker Compose (edit the PORT in docker-compose.yml)
```

## API Usage

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
  "result": 26
}
```

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

## Running Tests

### Using Deno

```bash
deno test
```

### Using Docker

```bash
docker-compose run --rm magic-math-api test
```

## Implementation Notes

- The implementation uses memoization to avoid redundant calculations
- Large numbers might cause stack overflow due to the recursive nature of the function 
- The server automatically tries alternative ports if the default one is in use 
- Docker deployment includes hot-reloading for development 