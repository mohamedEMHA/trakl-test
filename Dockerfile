# Dockerfile for React Native development / EAS builds
# This allows containerized builds and is scanned by Hadolint, Checkov, KICS, and Trivy
#
# Usage:
#   docker build -t trakl-dev .
#   docker run --rm -it trakl-dev

FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy application source
COPY . .

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose Metro bundler port
EXPOSE 8081

# Healthcheck for Metro bundler
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8081 || exit 1

# Start Metro bundler
CMD ["npm", "start"]
