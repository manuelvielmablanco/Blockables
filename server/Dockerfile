# ============================================================
# Ingeniables Blocks - Arduino Compilation Server
# Multi-stage build: install arduino-cli + cores + libraries
# ============================================================

FROM node:20-slim AS base

# Install dependencies for arduino-cli
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    python3 \
    python3-pip \
    python3-serial \
    && rm -rf /var/lib/apt/lists/*

# Install arduino-cli
RUN curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh \
    && mv bin/arduino-cli /usr/local/bin/ \
    && rm -rf bin

# Initialize arduino-cli config
RUN arduino-cli config init

# Add ESP32 board manager URL
RUN arduino-cli config add board_manager.additional_urls \
    https://espressif.github.io/arduino-esp32/package_esp32_index.json

# Update board index
RUN arduino-cli core update-index

# Install cores (this takes a while, especially ESP32)
RUN arduino-cli core install arduino:avr
RUN arduino-cli core install esp32:esp32

# Install libraries used by the block editor
RUN arduino-cli lib install "DHT sensor library" \
    && arduino-cli lib install "Adafruit Unified Sensor" \
    && arduino-cli lib install "Adafruit NeoPixel" \
    && arduino-cli lib install "Adafruit SSD1306" \
    && arduino-cli lib install "Adafruit GFX Library" \
    && arduino-cli lib install "Servo" \
    && arduino-cli lib install "IRremote" \
    && arduino-cli lib install "LiquidCrystal I2C" \
    && arduino-cli lib install "SD"

# ============================================================
# Application stage
# ============================================================
FROM base AS app

WORKDIR /app

# Copy package files
COPY package.json ./
RUN npm install --production

# Copy compiled source (or use tsx for dev)
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript
RUN npx tsc

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
