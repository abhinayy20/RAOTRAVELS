#!/bin/bash

if [ -z "$1" ]; then
    echo "❌ Error: Please provide a version/tag to rollback to."
    echo "Usage: ./rollback.sh <tag>"
    exit 1
fi

TAG=$1

echo "⏪ Rolling back to version: $TAG..."

# Update Image Tags in Compose (temporary env override)
export BACKEND_TAG=$TAG
export FRONTEND_TAG=$TAG

docker-compose -f docker-compose.prod.yml up -d

echo "✅ Rollback to $TAG completed."
