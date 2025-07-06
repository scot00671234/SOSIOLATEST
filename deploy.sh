#!/bin/bash

# Exit on any error
set -e

echo "Starting deployment..."

# Run database migrations
echo "Running database migrations..."
npm run db:push

# Start the application
echo "Starting application..."
npm run start