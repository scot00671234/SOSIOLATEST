# PURE NODE.JS SERVER - NO STATIC SITE, NO CADDY, NO PROXY
# This is a full-stack Express.js application with built-in static serving
# DO NOT ADD CADDY OR ANY REVERSE PROXY - THE APP HANDLES EVERYTHING

FROM node:18-alpine

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

# Run database migration and start the application
CMD ["sh", "-c", "node scripts/migrate-db.js && npm start"]