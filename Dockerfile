# Stage 1: Build the application
FROM node:22-slim AS build-stage

WORKDIR /app

# Copy only necessary files first to cache layers
COPY package*.json ./
COPY .env .env

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Allow more memory during build
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build the app
RUN npm run build


# Stage 2: Production image
FROM node:22-slim

WORKDIR /app

# Install wkhtmltopdf only (skip unnecessary recommends)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    wkhtmltopdf \
    ca-certificates \
    && apt-get purge --auto-remove -y && \
    rm -rf /var/lib/apt/lists/* /usr/share/doc /usr/share/man

# Copy only necessary files
COPY --from=build-stage /app/dist ./dist
COPY --from=build-stage /app/package*.json ./
COPY --from=build-stage /app/static ./static

# Install production dependencies only
RUN npm install --production --silent && npm cache clean --force

# Ensure proper permissions
RUN chown -R node:node /app && \
    find /app -type d -exec chmod 755 {} \; && \
    find /app -type f -exec chmod 644 {} \;

USER node

EXPOSE 8008

CMD ["node", "dist/main"]
