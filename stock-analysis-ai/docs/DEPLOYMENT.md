# Deployment Guide

This guide covers deploying the Agentic KB System using Docker and Azure Container Apps.

## Quick Start

### Local Development with Docker Compose

```bash
# Start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Build Docker Image Locally

```bash
# Build image
./build-docker.sh

# Or manually
docker build -t agentic-kb-api:latest -f Dockerfile .

# Run container
docker run -p 8000:8000 \
  -e OPENROUTER_API_KEY=your-key \
  -e PERPLEXITY_API_KEY=your-key \
  agentic-kb-api:latest
```

## Azure Container Apps Deployment

See [AZURE-DEPLOYMENT.md](./AZURE-DEPLOYMENT.md) for detailed Azure deployment instructions.

### Quick Deploy

```bash
# Set environment variables
export RESOURCE_GROUP="rg-agentic-kb"
export OPENROUTER_API_KEY="your-key"
export PERPLEXITY_API_KEY="your-key"

# Deploy
./deploy-azure.sh
```

## Health Checks

The application provides three health endpoints:

- **Liveness**: `GET /api/v1/health/live` - Container is running
- **Readiness**: `GET /api/v1/health/ready` - Container is ready for traffic
- **Health Check**: `GET /api/v1/health` - Full health status with component details

## Environment Variables

See `.env.example` for all available environment variables.

### Required Variables

- `OPENROUTER_API_KEY` - OpenRouter API key
- `PERPLEXITY_API_KEY` - Perplexity API key

### Optional Variables

- `ENV` - Environment (development/production)
- `DEBUG` - Enable debug mode
- `LLM_MODEL` - LLM model to use
- `METRICS_ENABLED` - Enable metrics collection
- `AIOPS_LOGGING_ENABLED` - Enable AIOps logging

## Docker Configuration

### Dockerfile

The Dockerfile uses a multi-stage build:
1. **Builder stage**: Installs dependencies
2. **Runtime stage**: Minimal image with application

### Docker Compose

The `docker-compose.yml` file includes:
- Service definition
- Volume mounts for data persistence
- Environment variable configuration
- Health check configuration
- Network setup

## Monitoring

### Metrics

Access metrics at:
- Prometheus format: `/api/v1/metrics`
- JSON summary: `/api/v1/metrics/summary`

### Logs

**Local Docker**:
```bash
docker-compose logs -f
```

**Azure Container Apps**:
```bash
az containerapp logs show \
    --name agentic-kb-system \
    --resource-group rg-agentic-kb \
    --follow
```

## Troubleshooting

### Container Won't Start

1. Check logs: `docker-compose logs`
2. Verify environment variables
3. Check health endpoint: `curl http://localhost:8000/api/v1/health`

### Database Issues

1. Ensure data directory is writable
2. Check database connection string
3. Verify SQLite file permissions

### API Key Issues

1. Verify API keys are set correctly
2. Check secret references in Azure
3. Test API keys independently

## Production Considerations

1. **Use Azure Key Vault** for secrets management
2. **Enable Application Insights** for monitoring
3. **Configure auto-scaling** based on metrics
4. **Set up alerts** for critical errors
5. **Use persistent storage** for production data
6. **Enable HTTPS only** (default in Azure Container Apps)
7. **Regularly update** base images for security

## Next Steps

- Set up CI/CD pipeline
- Configure monitoring dashboards
- Implement blue-green deployments
- Add automated testing in pipeline
