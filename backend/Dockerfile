# Stage 1: Build the application
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm install

# Copy all source files to the container
COPY . .

# Build the TypeScript code (outputs to the "dist" folder)
RUN npm run build

# Stage 2: Create the production image
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy the compiled output from the builder stage
COPY --from=builder /app/dist ./dist

# If you have any static assets or additional configuration, copy them as needed.
# For example:
# COPY --from=builder /app/config ./config

# Expose the port your server listens on (adjust the port if needed)
EXPOSE 3000

# Run the compiled application
CMD ["node", "dist/server.js"]
