# Use Node.js 20 LTS
FROM node:20-alpine

# Install bash for our deploy script
RUN apk add --no-cache bash

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Make deploy script executable
RUN chmod +x deploy.sh

# Expose port
EXPOSE 5000

# Set NODE_ENV to production
ENV NODE_ENV=production

# Start with our deploy script
CMD ["bash", "deploy.sh"]