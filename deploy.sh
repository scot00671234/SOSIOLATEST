#!/bin/bash

# Exit on any error
set -e

echo "Starting deployment..."

# Run database migrations
echo "Running database migrations..."
npx drizzle-kit push

# Start the application
echo "Starting application..."
node dist/index.js