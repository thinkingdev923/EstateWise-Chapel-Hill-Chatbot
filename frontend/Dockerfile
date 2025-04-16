# Stage 1: Build the application
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
# If you use a lockfile (e.g., package-lock.json or yarn.lock), copy them as well.
COPY package*.json ./
RUN npm install

# Copy the remaining application files to the container
COPY . .

# Build the Next.js application (this will output the build in the .next folder)
RUN npm run build

# Stage 2: Create the production image
FROM node:18-alpine

WORKDIR /app

# Copy only production dependencies' definitions
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy the built Next.js output and any public assets from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Optionally copy other necessary files (e.g., next.config.js)
COPY --from=builder /app/next.config.js ./

# Expose the port that the Next.js app uses (default is 3000)
EXPOSE 3000

# Start the application using the "start" script defined in package.json
CMD ["npm", "start"]
