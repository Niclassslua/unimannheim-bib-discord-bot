# syntax=docker/dockerfile:1.7
FROM node:20-alpine

# Install small tools and tzdata
RUN apk add --no-cache dumb-init tzdata ca-certificates
ENV NODE_ENV=production TZ=Europe/Berlin

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY src ./src
COPY resources ./resources

# Security: non-root user
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

# Start bot
CMD ["dumb-init", "node", "src/index.js"]