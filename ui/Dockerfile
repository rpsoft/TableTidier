# Use Node.js 20 official image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY ui/package.json ui/package-lock.json ./
RUN npm install

# Copy application files
COPY ui ./

# Build the Next.js application
RUN npm run build

# Use a lightweight Node.js 20 runtime
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy built files
COPY --from=builder /app ./

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
