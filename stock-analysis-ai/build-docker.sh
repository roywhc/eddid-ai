#!/bin/bash
# Docker Build Script
# Builds the Docker image for local testing

set -e

IMAGE_NAME=${IMAGE_NAME:-"agentic-kb-api"}
IMAGE_TAG=${IMAGE_TAG:-"latest"}

echo "Building Docker image: $IMAGE_NAME:$IMAGE_TAG"
docker build -t $IMAGE_NAME:$IMAGE_TAG -f Dockerfile .

echo ""
echo "Build complete!"
echo "To run locally: docker run -p 8000:8000 $IMAGE_NAME:$IMAGE_TAG"
echo "Or use docker-compose: docker-compose up"
