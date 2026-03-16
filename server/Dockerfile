# ============================================================
# Ingeniables Blocks - Arduino Compilation Server
# Multi-stage build: install arduino-cli + cores + libraries
# ============================================================

FROM node:20-slim AS base

# Install dependencies for arduino-cli
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install arduino-cli (install to /tmp to avoid rm -rf bin deleting /bin)
RUN cd /tmp \
    && curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh \
    && mv bin/arduino-cli /usr/local/bin/ \
    && rm -rf /tmp/bin

# Initialize arduino-cli and install AVR core + libraries in one layer
# NOTE: ESP32 core excluded for now (adds ~5GB). Add when plan supports larger images.
RUN arduino-cli config init \
    && arduino-cli core update-index \
    && arduino-cli core install arduino:avr \
    && arduino-cli lib install "DHT sensor library" \
    && arduino-cli lib install "Adafruit Unified Sensor" \
    && arduino-cli lib install "Adafruit NeoPixel" \
    && arduino-cli lib install "Adafruit SSD1306" \
    && arduino-cli lib install "Adafruit GFX Library" \
    && arduino-cli lib install "Servo" \
    && arduino-cli lib install "IRremote" \
    && arduino-cli lib install "LiquidCrystal I2C" \
    && arduino-cli lib install "SD" \
    && arduino-cli cache clean

# ============================================================
# Application stage
# ============================================================
FROM base AS app

WORKDIR /app

# Copy package files (context is repo root)
COPY server/package.json server/package-lock.json* ./

# Install ALL deps (including devDependencies for tsc)
RUN npm install

# Copy source and compile TypeScript
COPY server/tsconfig.json ./
COPY server/src/ ./src/
RUN npx tsc

# Remove devDependencies after build
RUN npm prune --production

# Create temp directories
RUN mkdir -p /tmp/sketches /tmp/compile-cache

# Environment
ENV PORT=3100
ENV TEMP_DIR=/tmp/sketches
ENV CACHE_DIR=/tmp/compile-cache
ENV NODE_ENV=production

EXPOSE 3100

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:3100/health || exit 1

CMD ["node", "dist/index.js"]
