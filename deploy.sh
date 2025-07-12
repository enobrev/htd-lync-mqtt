#!/bin/bash

# HTD Lync MQTT Bridge - Build and Deploy Script
# Usage: ./deploy.sh [version]
# If no version provided, uses package.json version

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_REPO="enobrev/htd-lync-mqtt"
NOMAD_JOB="nomad.hcl"
NOMAD_ADDR="http://10.0.0.10:4646"

# Get version from package.json or command line
if [ -n "$1" ]; then
    VERSION="$1"
else
    VERSION=$(grep '"version"' package.json | cut -d'"' -f4)
fi

echo -e "${BLUE}🚀 Starting HTD Lync MQTT Bridge deployment...${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"
echo

# Step 1: Build the source
echo -e "${YELLOW}📦 Building TypeScript source...${NC}"
npm run build
echo -e "${GREEN}✅ Source build complete${NC}"
echo

# Step 2: Build Docker container
echo -e "${YELLOW}🐳 Building Docker container...${NC}"
docker build -t htd-lync-mqtt:latest .
docker build -t htd-lync-mqtt:${VERSION} .
echo -e "${GREEN}✅ Docker build complete${NC}"
echo

# Step 3: Tag for DockerHub
echo -e "${YELLOW}🏷️  Tagging for DockerHub...${NC}"
docker tag htd-lync-mqtt:latest ${DOCKER_REPO}:latest
docker tag htd-lync-mqtt:${VERSION} ${DOCKER_REPO}:${VERSION}
echo -e "${GREEN}✅ Tagging complete${NC}"
echo

# Step 4: Push to DockerHub
echo -e "${YELLOW}⬆️  Pushing to DockerHub...${NC}"
docker push ${DOCKER_REPO}:latest
docker push ${DOCKER_REPO}:${VERSION}
echo -e "${GREEN}✅ Push to DockerHub complete${NC}"
echo

# Step 5: Update Nomad deployment
echo -e "${YELLOW}🎯 Updating Nomad deployment...${NC}"
if command -v nomad &> /dev/null; then
    export NOMAD_ADDR="${NOMAD_ADDR}"
    # Check if job is already running
    if nomad job status htd-lync-mqtt &> /dev/null; then
        echo -e "${BLUE}📋 Existing job found, updating...${NC}"
        nomad job run ${NOMAD_JOB}
        echo -e "${BLUE}🔄 Waiting for deployment to complete...${NC}"
        nomad job status htd-lync-mqtt
    else
        echo -e "${BLUE}📋 No existing job found, deploying new...${NC}"
        nomad job run ${NOMAD_JOB}
    fi
    echo -e "${GREEN}✅ Nomad deployment complete${NC}"
else
    echo -e "${YELLOW}⚠️  Nomad CLI not found, skipping deployment${NC}"
    echo -e "${BLUE}💡 Manual deployment: NOMAD_ADDR=${NOMAD_ADDR} nomad job run ${NOMAD_JOB}${NC}"
fi
echo

# Step 6: Summary
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo -e "${BLUE}📊 Summary:${NC}"
echo -e "  • Built version: ${VERSION}"
echo -e "  • Docker image: ${DOCKER_REPO}:${VERSION}"
echo -e "  • DockerHub: https://hub.docker.com/r/${DOCKER_REPO}"
if command -v nomad &> /dev/null; then
    echo -e "  • Nomad job: htd-lync-mqtt"
    echo
    echo -e "${BLUE}🔍 Check deployment status:${NC}"
    echo -e "  NOMAD_ADDR=${NOMAD_ADDR} nomad job status htd-lync-mqtt"
    echo -e "  NOMAD_ADDR=${NOMAD_ADDR} nomad alloc logs -f \$(NOMAD_ADDR=${NOMAD_ADDR} nomad job allocs htd-lync-mqtt | grep running | head -1 | cut -d' ' -f1)"
fi
echo

echo -e "${GREEN}✨ Happy deploying!${NC}"