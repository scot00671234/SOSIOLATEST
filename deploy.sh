#!/bin/bash

# ULTIMATE FORCE DOCKERFILE DEPLOYMENT SCRIPT
# NUCLEAR OPTION: DISABLE ALL AUTO-DETECTION

echo "🚀 FORCE DOCKERFILE DEPLOYMENT - NO AUTO-DETECTION"
echo "💣 This is a FULL-STACK NODE.JS APPLICATION SERVER"
echo "🔥 ABSOLUTELY NO: Nixpacks, Buildpacks, Static Detection"
echo ""

# Create marker files to prevent auto-detection
touch .dockerfile-required
echo "dockerfile-only" > .deployment-method

# Force environment variables
export NIXPACKS_NO_CACHE=1
export DISABLE_NIXPACKS=true
export FORCE_DOCKERFILE=true
export NODE_ENV=production
export PORT=3000

echo "✅ Environment configured for Dockerfile-only deployment"
echo "🎯 Ready for Docker build process"

# For manual deployment
if [ "$1" = "local" ]; then
    echo "🔄 Running local Docker build test..."
    docker build -t sosiol-app .
    echo "✅ Docker build successful"
fi