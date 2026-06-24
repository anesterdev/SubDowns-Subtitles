# Stage 1: Builder
FROM node:24-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Build the Vite frontend application and backend server
RUN npm run build

# Stage 2: Runner
FROM node:24-alpine
WORKDIR /app

# Configure environment
ENV NODE_ENV=production
ENV PORT=3069

# Copy built assets and production dependencies from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev --ignore-scripts

EXPOSE 3069

# Start the minified backend server natively
CMD ["node", "dist/server.mjs"]
