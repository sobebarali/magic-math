FROM denoland/deno:1.37.0

# Set working directory
WORKDIR /app

# Copy dependency files
COPY deno.json .

# Copy application source code
COPY *.ts .

# Cache the dependencies
RUN deno cache main.ts

# Port to expose
EXPOSE 5000

# Command to run the application
CMD ["run", "--allow-net", "--allow-env", "main.ts"] 