FROM node:24-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Build the Vite frontend application
RUN npm run build

# Strip all development dependencies (Vite, Sass, etc.) to keep image small
RUN npm prune --production

# Configure environment
ENV NODE_ENV=production
ENV PORT=3069
EXPOSE 3069 9000

# Start the minified backend server natively
CMD ["node", "dist/server.mjs"]
