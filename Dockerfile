# syntax=docker/dockerfile:1
# Multi-stage production build for SpeakPath AI
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN cd client && npm install
RUN cd ../server && npm install

# Copy source code
COPY client ./client
COPY server ./server

# Build both client and server
RUN npm run build

# Stage 2: Production runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy server package & production dependencies
COPY --from=builder /app/server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Copy compiled outputs
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

# Expose web & websocket port
EXPOSE 5000

# Start server
CMD ["node", "server/dist/index.js"]
