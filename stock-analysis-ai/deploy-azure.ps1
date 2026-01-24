# Azure Container Apps Deployment Script (PowerShell)
# This script builds and deploys the application to Azure Container Apps

$ErrorActionPreference = "Stop"

Write-Host "=== Azure Container Apps Deployment ===" -ForegroundColor Green
Write-Host ""

# Check if Azure CLI is installed
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Azure CLI is not installed" -ForegroundColor Red
    Write-Host "Please install Azure CLI: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
}

# Check if user is logged in
$account = az account show 2>$null
if (-not $account) {
    Write-Host "Please login to Azure..." -ForegroundColor Yellow
    az login
}

# Configuration
$RESOURCE_GROUP = if ($env:RESOURCE_GROUP) { $env:RESOURCE_GROUP } else { "rg-agentic-kb" }
$LOCATION = if ($env:LOCATION) { $env:LOCATION } else { "eastus" }
$ACR_NAME = if ($env:ACR_NAME) { $env:ACR_NAME } else { "acragentickb" }
$CONTAINER_APP_NAME = if ($env:CONTAINER_APP_NAME) { $env:CONTAINER_APP_NAME } else { "agentic-kb-system" }
$IMAGE_NAME = if ($env:IMAGE_NAME) { $env:IMAGE_NAME } else { "agentic-kb-api" }
$IMAGE_TAG = if ($env:IMAGE_TAG) { $env:IMAGE_TAG } else { "latest" }

Write-Host "Configuration:" -ForegroundColor Blue
Write-Host "  Resource Group: $RESOURCE_GROUP"
Write-Host "  Location: $LOCATION"
Write-Host "  ACR Name: $ACR_NAME"
Write-Host "  Container App: $CONTAINER_APP_NAME"
Write-Host "  Image: $IMAGE_NAME:$IMAGE_TAG"
Write-Host ""

# Step 1: Create resource group
Write-Host "Step 1: Creating resource group..." -ForegroundColor Yellow
az group create --name $RESOURCE_GROUP --location $LOCATION 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Resource group already exists" -ForegroundColor Gray
}

# Step 2: Create Azure Container Registry
Write-Host "Step 2: Creating Azure Container Registry..." -ForegroundColor Yellow
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ACR already exists" -ForegroundColor Gray
}

# Step 3: Login to ACR
Write-Host "Step 3: Logging in to ACR..." -ForegroundColor Yellow
az acr login --name $ACR_NAME

# Step 4: Build and push Docker image
Write-Host "Step 4: Building and pushing Docker image..." -ForegroundColor Yellow
az acr build --registry $ACR_NAME --image "$IMAGE_NAME`:$IMAGE_TAG" --file Dockerfile .

# Step 5: Create Container Apps environment
Write-Host "Step 5: Creating Container Apps environment..." -ForegroundColor Yellow
$ENV_NAME = "$CONTAINER_APP_NAME-env"
az containerapp env create `
    --name $ENV_NAME `
    --resource-group $RESOURCE_GROUP `
    --location $LOCATION 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Environment already exists" -ForegroundColor Gray
}

# Step 6: Create Container App
Write-Host "Step 6: Creating/updating Container App..." -ForegroundColor Yellow
$ACR_SERVER = "$ACR_NAME.azurecr.io"

# Check if container app exists
$appExists = az containerapp show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP 2>$null

if ($appExists) {
    Write-Host "Container app exists, updating..." -ForegroundColor Gray
    az containerapp update `
        --name $CONTAINER_APP_NAME `
        --resource-group $RESOURCE_GROUP `
        --image "$ACR_SERVER/$IMAGE_NAME`:$IMAGE_TAG" `
        --set-env-vars `
            "ENV=production" `
            "API_HOST=0.0.0.0" `
            "API_PORT=8000" `
            "VECTOR_STORE_TYPE=chromadb" `
            "CHROMADB_PATH=/app/data/chroma" `
            "DATABASE_URL=sqlite:////app/data/metadata.db" `
            "LLM_PROVIDER=openrouter" `
            "LLM_MODEL=deepseek/deepseek-v3.2" `
            "METRICS_ENABLED=true" `
            "AIOPS_LOGGING_ENABLED=true" `
            "AIOPS_LOG_DIR=/app/aiops" `
        --cpu 1.0 `
        --memory 2Gi `
        --min-replicas 1 `
        --max-replicas 10 `
        --target-port 8000 `
        --ingress external
} else {
    Write-Host "Creating new container app..." -ForegroundColor Gray
    az containerapp create `
        --name $CONTAINER_APP_NAME `
        --resource-group $RESOURCE_GROUP `
        --environment $ENV_NAME `
        --image "$ACR_SERVER/$IMAGE_NAME`:$IMAGE_TAG" `
        --registry-server $ACR_SERVER `
        --set-env-vars `
            "ENV=production" `
            "API_HOST=0.0.0.0" `
            "API_PORT=8000" `
            "VECTOR_STORE_TYPE=chromadb" `
            "CHROMADB_PATH=/app/data/chroma" `
            "DATABASE_URL=sqlite:////app/data/metadata.db" `
            "LLM_PROVIDER=openrouter" `
            "LLM_MODEL=deepseek/deepseek-v3.2" `
            "METRICS_ENABLED=true" `
            "AIOPS_LOGGING_ENABLED=true" `
            "AIOPS_LOG_DIR=/app/aiops" `
        --cpu 1.0 `
        --memory 2Gi `
        --min-replicas 1 `
        --max-replicas 10 `
        --target-port 8000 `
        --ingress external
}

# Step 7: Set secrets (if provided)
if ($env:OPENROUTER_API_KEY) {
    Write-Host "Step 7: Setting secrets..." -ForegroundColor Yellow
    az containerapp secret set `
        --name $CONTAINER_APP_NAME `
        --resource-group $RESOURCE_GROUP `
        --secrets "openrouter-api-key=$env:OPENROUTER_API_KEY" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Secret already set" -ForegroundColor Gray
    }
}

if ($env:PERPLEXITY_API_KEY) {
    az containerapp secret set `
        --name $CONTAINER_APP_NAME `
        --resource-group $RESOURCE_GROUP `
        --secrets "perplexity-api-key=$env:PERPLEXITY_API_KEY" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Secret already set" -ForegroundColor Gray
    }
}

# Get the FQDN
$FQDN = az containerapp show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --query "properties.configuration.ingress.fqdn" -o tsv

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host "Application URL: https://$FQDN" -ForegroundColor Blue
Write-Host "Health Check: https://$FQDN/api/v1/health" -ForegroundColor Blue
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Set secrets: az containerapp secret set --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --secrets openrouter-api-key=<key>"
Write-Host "2. Update environment variables to reference secrets"
Write-Host "3. Test the health endpoint"
Write-Host "4. Monitor logs: az containerapp logs show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --follow"
