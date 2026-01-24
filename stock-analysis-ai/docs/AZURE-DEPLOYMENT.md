# Azure Container Apps Deployment Guide

This guide covers deploying the Agentic KB System to Azure Container Apps.

## Prerequisites

1. **Azure Account**: Active Azure subscription
2. **Azure CLI**: Installed and configured
   ```bash
   # Install Azure CLI
   # Windows: https://aka.ms/installazurecliwindows
   # Mac: brew install azure-cli
   # Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   ```
3. **Docker**: For local testing (optional)
4. **API Keys**: OpenRouter and Perplexity API keys

## Quick Start

### 1. Login to Azure

```bash
az login
az account set --subscription <your-subscription-id>
```

### 2. Set Environment Variables

```bash
export RESOURCE_GROUP="rg-agentic-kb"
export LOCATION="eastus"
export ACR_NAME="acragentickb"
export OPENROUTER_API_KEY="your-key"
export PERPLEXITY_API_KEY="your-key"
```

### 3. Deploy

```bash
./deploy-azure.sh
```

## Manual Deployment Steps

### Step 1: Create Resource Group

```bash
az group create --name rg-agentic-kb --location eastus
```

### Step 2: Create Azure Container Registry

```bash
az acr create --resource-group rg-agentic-kb --name acragentickb --sku Basic --admin-enabled true
```

### Step 3: Build and Push Image

```bash
# Login to ACR
az acr login --name acragentickb

# Build and push
az acr build --registry acragentickb --image agentic-kb-api:latest --file Dockerfile .
```

### Step 4: Create Container Apps Environment

```bash
az containerapp env create \
    --name agentic-kb-env \
    --resource-group rg-agentic-kb \
    --location eastus
```

### Step 5: Create Container App

```bash
az containerapp create \
    --name agentic-kb-system \
    --resource-group rg-agentic-kb \
    --environment agentic-kb-env \
    --image acragentickb.azurecr.io/agentic-kb-api:latest \
    --registry-server acragentickb.azurecr.io \
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
    --cpu 1.0 \
    --memory 2Gi \
    --min-replicas 1 \
    --max-replicas 10 \
    --target-port 8000 \
    --ingress external
```

### Step 6: Set Secrets

```bash
# Set OpenRouter API key
az containerapp secret set \
    --name agentic-kb-system \
    --resource-group rg-agentic-kb \
    --secrets openrouter-api-key=your-key-here

# Set Perplexity API key
az containerapp secret set \
    --name agentic-kb-system \
    --resource-group rg-agentic-kb \
    --secrets perplexity-api-key=your-key-here

# Update container app to use secrets
az containerapp update \
    --name agentic-kb-system \
    --resource-group rg-agentic-kb \
    --set-env-vars \
        OPENROUTER_API_KEY=secretref:openrouter-api-key \
        PERPLEXITY_API_KEY=secretref:perplexity-api-key
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENV` | Environment (production/development) | `production` |
| `API_HOST` | API host | `0.0.0.0` |
| `API_PORT` | API port | `8000` |
| `VECTOR_STORE_TYPE` | Vector store type | `chromadb` |
| `CHROMADB_PATH` | ChromaDB path | `/app/data/chroma` |
| `DATABASE_URL` | Database connection string | `sqlite:////app/data/metadata.db` |
| `LLM_PROVIDER` | LLM provider | `openrouter` |
| `LLM_MODEL` | LLM model | `deepseek/deepseek-v3.2` |
| `METRICS_ENABLED` | Enable metrics | `true` |
| `AIOPS_LOGGING_ENABLED` | Enable AIOps logging | `true` |

### Scaling Configuration

The container app is configured with:
- **Min Replicas**: 1
- **Max Replicas**: 10
- **CPU**: 1.0 cores
- **Memory**: 2Gi

To update scaling:

```bash
az containerapp update \
    --name agentic-kb-system \
    --resource-group rg-agentic-kb \
    --min-replicas 2 \
    --max-replicas 20
```

### Health Probes

The application provides three health endpoints:

- **Liveness**: `/api/v1/health/live` - Container is running
- **Readiness**: `/api/v1/health/ready` - Container is ready for traffic
- **Health Check**: `/api/v1/health` - Full health status

Health probes are automatically configured in the container app.

## Monitoring

### View Logs

```bash
# Stream logs
az containerapp logs show \
    --name agentic-kb-system \
    --resource-group rg-agentic-kb \
    --follow

# View recent logs
az containerapp logs show \
    --name agentic-kb-system \
    --resource-group rg-agentic-kb \
    --tail 100
```

### Metrics

Access metrics at:
- **Prometheus Format**: `https://<fqdn>/api/v1/metrics`
- **JSON Summary**: `https://<fqdn>/api/v1/metrics/summary`

### Application Insights (Optional)

To enable Application Insights:

1. Create Application Insights resource
2. Get connection string
3. Add to container app:

```bash
az containerapp update \
    --name agentic-kb-system \
    --resource-group rg-agentic-kb \
    --set-env-vars \
        APPLICATIONINSIGHTS_CONNECTION_STRING="your-connection-string"
```

## Troubleshooting

### Container Won't Start

1. Check logs:
   ```bash
   az containerapp logs show --name agentic-kb-system --resource-group rg-agentic-kb
   ```

2. Verify health probes:
   ```bash
   curl https://<fqdn>/api/v1/health
   ```

3. Check resource limits:
   ```bash
   az containerapp show --name agentic-kb-system --resource-group rg-agentic-kb
   ```

### API Keys Not Working

1. Verify secrets are set:
   ```bash
   az containerapp secret list --name agentic-kb-system --resource-group rg-agentic-kb
   ```

2. Check environment variables reference secrets:
   ```bash
   az containerapp show --name agentic-kb-system --resource-group rg-agentic-kb --query properties.template.containers[0].env
   ```

### High Memory Usage

1. Increase memory:
   ```bash
   az containerapp update \
       --name agentic-kb-system \
       --resource-group rg-agentic-kb \
       --memory 4Gi
   ```

2. Check AIOps logging retention:
   ```bash
   # Reduce retention days
   az containerapp update \
       --name agentic-kb-system \
       --resource-group rg-agentic-kb \
       --set-env-vars AIOPS_RETENTION_DAYS=3
   ```

## Updating the Application

### Update Image

```bash
# Build new image
az acr build --registry acragentickb --image agentic-kb-api:v1.1.0 --file Dockerfile .

# Update container app
az containerapp update \
    --name agentic-kb-system \
    --resource-group rg-agentic-kb \
    --image acragentickb.azurecr.io/agentic-kb-api:v1.1.0
```

### Rollback

```bash
az containerapp revision list \
    --name agentic-kb-system \
    --resource-group rg-agentic-kb

az containerapp revision activate \
    --name agentic-kb-system \
    --resource-group rg-agentic-kb \
    --revision <previous-revision-name>
```

## Cost Optimization

1. **Scale to Zero** (optional):
   ```bash
   az containerapp update \
       --name agentic-kb-system \
       --resource-group rg-agentic-kb \
       --min-replicas 0
   ```

2. **Reduce Resources**:
   ```bash
   az containerapp update \
       --name agentic-kb-system \
       --resource-group rg-agentic-kb \
       --cpu 0.5 \
       --memory 1Gi
   ```

3. **Use Consumption Plan**: Container Apps automatically uses consumption pricing

## Security Best Practices

1. **Use Managed Identity** for ACR access
2. **Store secrets in Azure Key Vault** (future enhancement)
3. **Enable HTTPS only** (default in Container Apps)
4. **Restrict ingress** to specific IPs if needed
5. **Regularly update base images** for security patches

## Next Steps

- Set up CI/CD pipeline (GitHub Actions / Azure DevOps)
- Configure Application Insights for advanced monitoring
- Set up alerts for critical metrics
- Implement blue-green deployments
- Add Azure Key Vault integration for secrets
