FROM denoland/deno:1.37.0

# Set working directory
WORKDIR /app

# Copy configuration files
COPY deno.json .

# Copy application source
COPY src/ ./src/
COPY public/ ./public/
COPY main.ts .

# Add Redis client dependency
RUN deno add npm:redis@4.7.0

# Cache the dependencies
RUN deno cache main.ts

# Port to expose
EXPOSE 5000

# Command to run the application
CMD ["run", "--allow-net", "--allow-env", "--allow-read", "main.ts"] 