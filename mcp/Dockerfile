# syntax=docker/dockerfile:1.6

# Build stage
FROM node:20-bullseye AS build
WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src

RUN npm ci
RUN npm run build

# Runtime stage
FROM node:20-bullseye
ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY .env.example ./

USER node

ENTRYPOINT ["node", "dist/server.js"]
