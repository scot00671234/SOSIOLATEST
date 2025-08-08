# Alternative Dockerfile in case nixpacks doesn't work
# This ensures a pure Node.js deployment without any static site detection

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

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]