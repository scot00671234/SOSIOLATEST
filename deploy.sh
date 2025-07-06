#!/bin/bash

# Exit on any error
set -e

echo "Starting deployment..."

# Wait for database to be ready
echo "Waiting for database connection..."
sleep 5

# Run database migrations with retries
echo "Running database migrations..."
for i in {1..3}; do
  if npx drizzle-kit push; then
    echo "Database migration successful"
    break
  else
    echo "Migration attempt $i failed, retrying in 5 seconds..."
    sleep 5
  fi
done

# Start the application
echo "Starting application..."
exec node dist/index.js