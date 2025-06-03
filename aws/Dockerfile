####################################################################
# 1) Backend build stage (named “backend-build”)
####################################################################
FROM node:18-alpine AS backend-build

# Create backend working directory
WORKDIR /app/backend

# Copy only package files first for faster npm install
COPY server/package*.json ./
# Copy tsconfig (if using TS) or other build files
COPY server/tsconfig*.json ./

# Install dependencies (production + dev if needed)
RUN npm install

# Copy backend source code
COPY server/ ./

# Build backend (if using TypeScript)
RUN npm run build

####################################################################
# 2) Frontend build stage (named “frontend-build”)
####################################################################
FROM node:18-alpine AS frontend-build

# Create frontend working directory
WORKDIR /app/frontend

# Copy only package.json and lockfile for faster install
COPY frontend/package*.json ./
COPY frontend/next.config.js ./

# Install dependencies
RUN npm install

# Copy all frontend source
COPY frontend/ ./

# Build frontend (Next.js)
RUN npm run build

####################################################################
# 3) Final “backend” image (production)
####################################################################
FROM node:18-alpine AS backend

WORKDIR /app/backend

# Copy built artifacts from backend-build
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/node_modules ./node_modules
# Copy any other needed files (e.g. views, swagger specs, etc.)
COPY --from=backend-build /app/backend/src/utils/swagger.json ./dist/utils/swagger.json
# Copy .env.example or any other runtime config (the real secrets should be passed as ENV in ECS)
COPY --from=backend-build /app/backend/.env.example ./dist/.env.example

# Expose backend port
EXPOSE 3001

# This image will run the compiled files in /dist
ENV NODE_ENV=production
CMD ["node", "dist/server.js"]

####################################################################
# 4) Final “frontend” image (production)
####################################################################
FROM node:18-alpine AS frontend

WORKDIR /app/frontend

# Copy build output and dependencies
COPY --from=frontend-build /app/frontend/.next ./.next
COPY --from=frontend-build /app/frontend/node_modules ./node_modules
COPY --from=frontend-build /app/frontend/public ./public
COPY --from=frontend-build /app/frontend/next.config.js ./

# If you have any environment‐specific files (e.g. custom _document), copy them too
# For me I just need the pages directory...
# COPY --from=frontend-build /app/frontend/pages ./pages

# Expose Next.js default port
EXPOSE 3000

ENV NODE_ENV=production
# In production, Next.js defaults to 'next start'
CMD ["npx", "next", "start", "-p", "3000"]
