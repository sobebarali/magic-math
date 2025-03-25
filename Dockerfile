FROM denoland/deno:1.37.0

# Set working directory
WORKDIR /app

# Copy configuration files
COPY deno.json .

# Copy application source
COPY src/ ./src/
COPY public/ ./public/
COPY main.ts .

# Cache npm dependencies
RUN deno cache --reload npm:redis@4.7.0

# Cache the dependencies
RUN deno cache main.ts

# Port to expose
EXPOSE 5000

# Command to run the application
CMD ["run", "--allow-net", "--allow-env", "--allow-read", "main.ts"] 