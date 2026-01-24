#!/bin/bash
# Azure Container Apps Deployment Script
# This script builds and deploys the application to Azure Container Apps

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Azure Container Apps Deployment ===${NC}"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed${NC}"
    echo "Please install Azure CLI: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi

# Check if user is logged in
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}Please login to Azure...${NC}"
    az login
fi

# Configuration (set these as environment variables or modify here)
RESOURCE_GROUP=${RESOURCE_GROUP:-"rg-agentic-kb"}
LOCATION=${LOCATION:-"eastus"}
ACR_NAME=${ACR_NAME:-"acragentickb"}
CONTAINER_APP_NAME=${CONTAINER_APP_NAME:-"agentic-kb-system"}
IMAGE_NAME=${IMAGE_NAME:-"agentic-kb-api"}
IMAGE_TAG=${IMAGE_TAG:-"latest"}

echo -e "${BLUE}Configuration:${NC}"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  ACR Name: $ACR_NAME"
echo "  Container App: $CONTAINER_APP_NAME"
echo "  Image: $IMAGE_NAME:$IMAGE_TAG"
echo ""

# Step 1: Create resource group if it doesn't exist
echo -e "${YELLOW}Step 1: Creating resource group...${NC}"
az group create --name $RESOURCE_GROUP --location $LOCATION || echo "Resource group already exists"

# Step 2: Create Azure Container Registry if it doesn't exist
echo -e "${YELLOW}Step 2: Creating Azure Container Registry...${NC}"
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true || echo "ACR already exists"

# Step 3: Login to ACR
echo -e "${YELLOW}Step 3: Logging in to ACR...${NC}"
az acr login --name $ACR_NAME

# Step 4: Build and push Docker image
echo -e "${YELLOW}Step 4: Building and pushing Docker image...${NC}"
az acr build --registry $ACR_NAME --image $IMAGE_NAME:$IMAGE_TAG --file Dockerfile .

# Step 5: Create Container Apps environment if it doesn't exist
echo -e "${YELLOW}Step 5: Creating Container Apps environment...${NC}"
ENV_NAME="${CONTAINER_APP_NAME}-env"
az containerapp env create \
    --name $ENV_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION || echo "Environment already exists"

# Step 6: Create Container App
echo -e "${YELLOW}Step 6: Creating/updating Container App...${NC}"
ACR_SERVER="${ACR_NAME}.azurecr.io"

# Check if container app exists
if az containerapp show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo "Container app exists, updating..."
    az containerapp update \
        --name $CONTAINER_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --image $ACR_SERVER/$IMAGE_NAME:$IMAGE_TAG \
        --set-env-vars \
            ENV=production \
            API_HOST=0.0.0.0 \
            API_PORT=8000 \
            VECTOR_STORE_TYPE=chromadb \
            CHROMADB_PATH=/app/data/chroma \
            DATABASE_URL=sqlite:////app/data/metadata.db \
            LLM_PROVIDER=openrouter \
            LLM_MODEL=deepseek/deepseek-v3.2 \
            METRICS_ENABLED=true \
            AIOPS_LOGGING_ENABLED=true \
            AIOPS_LOG_DIR=/app/aiops \
        --cpu 1.0 \
        --memory 2Gi \
        --min-replicas 1 \
        --max-replicas 10 \
        --target-port 8000 \
        --ingress external
else
    echo "Creating new container app..."
    az containerapp create \
        --name $CONTAINER_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --environment $ENV_NAME \
        --image $ACR_SERVER/$IMAGE_NAME:$IMAGE_TAG \
        --registry-server $ACR_SERVER \
        --set-env-vars \
            ENV=production \
            API_HOST=0.0.0.0 \
            API_PORT=8000 \
            VECTOR_STORE_TYPE=chromadb \
            CHROMADB_PATH=/app/data/chroma \
            DATABASE_URL=sqlite:////app/data/metadata.db \
            LLM_PROVIDER=openrouter \
            LLM_MODEL=deepseek/deepseek-v3.2 \
            METRICS_ENABLED=true \
            AIOPS_LOGGING_ENABLED=true \
            AIOPS_LOG_DIR=/app/aiops \
        --cpu 1.0 \
        --memory 2Gi \
        --min-replicas 1 \
        --max-replicas 10 \
        --target-port 8000 \
        --ingress external
fi

# Step 7: Set secrets (if provided)
if [ ! -z "$OPENROUTER_API_KEY" ]; then
    echo -e "${YELLOW}Step 7: Setting secrets...${NC}"
    az containerapp secret set \
        --name $CONTAINER_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --secrets openrouter-api-key=$OPENROUTER_API_KEY || echo "Secret already set"
fi

if [ ! -z "$PERPLEXITY_API_KEY" ]; then
    az containerapp secret set \
        --name $CONTAINER_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --secrets perplexity-api-key=$PERPLEXITY_API_KEY || echo "Secret already set"
fi

# Step 8: Configure health probes
echo -e "${YELLOW}Step 8: Configuring health probes...${NC}"
az containerapp update \
    --name $CONTAINER_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --set-env-vars \
        ENV=production \
        API_HOST=0.0.0.0 \
        API_PORT=8000 \
    --cpu 1.0 \
    --memory 2Gi

# Get the FQDN
FQDN=$(az containerapp show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn -o tsv)

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo -e "${BLUE}Application URL: https://${FQDN}${NC}"
echo -e "${BLUE}Health Check: https://${FQDN}/api/v1/health${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Set secrets: az containerapp secret set --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --secrets openrouter-api-key=<key>"
echo "2. Update environment variables to reference secrets"
echo "3. Test the health endpoint"
echo "4. Monitor logs: az containerapp logs show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --follow"
