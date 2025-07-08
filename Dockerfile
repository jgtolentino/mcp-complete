FROM node:20-alpine

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ sqlite

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create directories
RUN mkdir -p /app/data /app/logs

# Expose port
EXPOSE 10000

# Start the application
CMD ["node", "src/server.js"]