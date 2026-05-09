#!/bin/bash

# Load Environment Variables
if [ -f .env.prod ]; then
    export $(cat .env.prod | xargs)
fi

echo "🚀 Starting Deployment for RAO Travels..."

# Pull Latest Images
docker-compose -f docker-compose.prod.yml pull

# Start Containers with Zero Downtime (using old containers while new ones start)
docker-compose -f docker-compose.prod.yml up -d --remove-orphans

# Clean up old images
docker image prune -f

echo "✅ Deployment Successful!"
