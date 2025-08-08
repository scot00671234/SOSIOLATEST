# FORCE DOCKERFILE USAGE - DISABLE ALL AUTO-DETECTION
# PURE NODE.JS SERVER - NO STATIC SITE, NO CADDY, NO PROXY
# This is a full-stack Express.js application with built-in static serving
# DO NOT ADD CADDY OR ANY REVERSE PROXY - THE APP HANDLES EVERYTHING

# Use Ubuntu base to avoid Alpine shell issues
FROM node:18-bullseye

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production=false

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove devDependencies
RUN npm ci --production --ignore-scripts && npm cache clean --force

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the application (migration runs in nixpacks build phase)
CMD ["npm", "start"]