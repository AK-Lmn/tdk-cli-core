FROM oven/bun:latest

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN bun install

# Copy source code
COPY src ./src

# Set environment variables
ENV NODE_ENV=development
ENV SERVICE_NAME=test-otel-service
ENV SERVICE_VERSION=1.0.0
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://signoz.beauty-crm.localhost:4317
ENV PORT=4200

# Expose port
EXPOSE 4200

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD bun run -e "fetch('http://localhost:4200/health').then(r => r.ok ? process.exit(0) : process.exit(1))"

# Start the service
CMD ["bun", "run", "src/index.ts"]
