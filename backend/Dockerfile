# 1) Builder stage
FROM node:18-slim AS builder
WORKDIR /app

# Copy manifests
COPY package.json package-lock.json tsconfig.json ./

# Copy source
COPY src/ src/
COPY public/ public/

# Install deps and compile TypeScript (ignore any errors & always succeed)
RUN npm install && npm run build || true

# 2) Runtime stage
FROM node:18-slim
WORKDIR /app

# Metadata labels
LABEL org.opencontainers.image.title="estatewise-backend"
LABEL org.opencontainers.image.version="1.1.0"
LABEL org.opencontainers.image.description="Backend for EstateWise, an AI-powered real estate chatbot that learns from past conversations."

# Copy compiled app and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Expose port if needed
EXPOSE 3000

# Launch the server
CMD ["node", "dist/server.js"]
