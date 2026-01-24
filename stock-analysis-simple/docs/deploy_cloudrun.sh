#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="gluex"
REGION="asia-east2"
PLATFORM="managed"
ALLOW_UNAUTHENTICATED="--allow-unauthenticated"
TIMEOUT="3600s"
MEMORY="512Mi"
CPU="1"
MAX_INSTANCES="1"
MIN_INSTANCES="0"
GCS_BUCKET="gluex-workspace"

echo ""
echo "============================================================"
echo -e "${BLUE}Cloud Run Deployment - Multi-Stage API${NC}"
echo "============================================================"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo "Memory: $MEMORY"
echo "CPU: $CPU"
echo "Timeout: $TIMEOUT"
echo "Max Instances: $MAX_INSTANCES"
echo "GCS Bucket: $GCS_BUCKET"
echo "============================================================"
echo ""

# Check for API key (optional - API server only reads CSV files)
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  OPENROUTER_API_KEY not set (optional for this API)${NC}"
    echo "   The API server only reads CSV files and doesn't need the API key."
    OPENROUTER_API_KEY="not-required"
else
    echo -e "${GREEN}✓${NC} OPENROUTER_API_KEY found"
fi
echo ""

# Check if GCS bucket exists (using gcloud storage, more reliable than gsutil)
echo "🔍 Checking GCS bucket: $GCS_BUCKET"
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}⚠️  Could not determine GCP project ID${NC}"
    echo "   Bucket check skipped. Please ensure bucket '$GCS_BUCKET' exists."
else
    # Use gcloud storage (more reliable, no Python dependency like gsutil)
    if gcloud storage buckets describe "gs://$GCS_BUCKET" &>/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} GCS bucket '$GCS_BUCKET' exists"
    else
        echo -e "${YELLOW}⚠️  GCS bucket '$GCS_BUCKET' not found${NC}"
        echo "   Attempting to create bucket..."
        
        # Create bucket using gcloud storage (recommended method)
        if gcloud storage buckets create "gs://$GCS_BUCKET" --location="$REGION" --project="$PROJECT_ID" 2>/dev/null; then
            echo -e "${GREEN}✓${NC} GCS bucket '$GCS_BUCKET' created successfully"
        else
            # Bucket might already exist or there's a permission issue
            echo -e "${YELLOW}⚠️  Could not create bucket automatically${NC}"
            echo "   The bucket may already exist (check: https://console.cloud.google.com/storage/browser/$GCS_BUCKET)"
            echo "   If it doesn't exist, create it manually with:"
            echo "   gcloud storage buckets create gs://$GCS_BUCKET --location=$REGION"
            echo ""
            echo "   Continuing deployment (assuming bucket exists)..."
        fi
    fi
fi
echo ""

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create deployment directory
DEPLOY_DIR="$SCRIPT_DIR/deploy_cloudrun_temp"
echo "📦 Preparing deployment package..."
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copy required files
echo "📋 Copying required files..."

# Create requirements.txt with uvicorn for Cloud Run
cat > "$DEPLOY_DIR/requirements.txt" <<'EOF'
# Google Cloud Run Requirements
# Core API dependencies
fastapi==0.109.0
pydantic==2.5.3
python-multipart==0.0.6
uvicorn[standard]==0.27.0
EOF
echo "   ✓ requirements.txt created (with uvicorn)"
cp "$SCRIPT_DIR/api_server.py" "$DEPLOY_DIR/"
echo "   ✓ api_server.py"

# Create Dockerfile
echo ""
echo "🐳 Creating Dockerfile..."
cat > "$DEPLOY_DIR/Dockerfile" <<'EOF'
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create workspace directory (will be mounted by Cloud Run)
RUN mkdir -p /workspace

# Set environment variables
ENV PORT=8080
ENV PYTHONUNBUFFERED=1
ENV GCS_BUCKET=gluex-workspace
# Explicitly set WORKSPACE_DIR to /workspace (mounted by Cloud Run)
ENV WORKSPACE_DIR=/workspace

# Expose port
EXPOSE 8080

# Start the application directly (mount is handled by Cloud Run)
CMD ["python", "-m", "uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "8080"]
EOF
echo "   ✓ Dockerfile created (GCS mount configured in Cloud Run)"

# Create .dockerignore
cat > "$DEPLOY_DIR/.dockerignore" <<'EOF'
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.so
.env
.venv
venv/
ENV/
.git/
.gitignore
*.md
workspace/
deploy_*/
EOF
echo "   ✓ .dockerignore created"

# Show package contents
echo ""
echo "📊 Deployment package contents:"
du -sh "$DEPLOY_DIR" 2>/dev/null || echo "   [Size calculation not available]"
echo ""

# Confirmation
echo -e "${YELLOW}⚠️  About to deploy to Cloud Run${NC}"
echo "This will:"
echo "  - Build a Docker container"
echo "  - Deploy to Cloud Run in $REGION"
echo "  - Create/update service: $SERVICE_NAME"
echo "  - Make it publicly accessible"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    rm -rf "$DEPLOY_DIR"
    exit 0
fi

echo ""
echo "🚀 Deploying to Cloud Run..."
echo ""

# Check if service already exists
SERVICE_EXISTS=$(gcloud run services describe "$SERVICE_NAME" \
    --region="$REGION" \
    --platform="$PLATFORM" \
    --format='value(metadata.name)' 2>/dev/null || echo "")

if [ -n "$SERVICE_EXISTS" ]; then
    echo "   Service '$SERVICE_NAME' already exists - updating..."
else
    echo "   Creating new service '$SERVICE_NAME'..."
fi
echo ""

# Get the default service account email
PROJECT_ID=$(gcloud config get-value project)
SERVICE_ACCOUNT="${PROJECT_ID}@appspot.gserviceaccount.com"

# Grant Storage Object Admin role to service account for GCS bucket access
echo "🔐 Configuring service account permissions..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/storage.objectAdmin" \
    --quiet 2>/dev/null || echo "   (Permissions may already be set)"

# Deploy to Cloud Run
# Note: gcloud run deploy automatically routes 100% traffic to the new revision by default
echo ""
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
    --source="$DEPLOY_DIR" \
    --region="$REGION" \
    --platform="$PLATFORM" \
    $ALLOW_UNAUTHENTICATED \
    --set-env-vars="OPENROUTER_API_KEY=${OPENROUTER_API_KEY},GCS_BUCKET=${GCS_BUCKET},WORKSPACE_DIR=/workspace" \
    --timeout="$TIMEOUT" \
    --memory="$MEMORY" \
    --cpu="$CPU" \
    --max-instances="$MAX_INSTANCES" \
    --min-instances="$MIN_INSTANCES" \
    --quiet

# Check deployment result
if [ $? -eq 0 ]; then
    echo ""
    echo "============================================================"
    echo -e "${GREEN}✅ Deployment Successful!${NC}"
    echo "============================================================"
    echo ""
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
        --region="$REGION" \
        --platform="$PLATFORM" \
        --format='value(status.url)' 2>/dev/null)
    
    if [ -n "$SERVICE_URL" ]; then
        echo "📍 Service URL:"
        echo "   $SERVICE_URL"
        echo ""
        echo "   Note: This is your .run.app domain! ✨"
        echo ""
        echo "🧪 Test Commands:"
        echo ""
        echo "   # API Info"
        echo "   curl $SERVICE_URL/"
        echo ""
        echo "   # Health Check"
        echo "   curl $SERVICE_URL/health"
        echo ""
        echo "   # Get job IDs"
        echo "   curl $SERVICE_URL/api/py/job_ids"
        echo ""
        echo "   # Extract elements"
        echo "   curl -X POST $SERVICE_URL/api/py/extract/keyword \\"
        echo "     -F \"option=ENTITY\" \\"
        echo "     -F \"job_id=20260104_124345\""
        echo ""
    fi
    
    echo "📊 Monitoring:"
    echo ""
    echo "   # View logs"
    echo "   gcloud run logs read $SERVICE_NAME --region=$REGION --limit=50"
    echo ""
    echo "   # View in console"
    echo "   https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME"
    echo ""
    
    # Clean up
    echo "🧹 Cleaning up deployment directory..."
    rm -rf "$DEPLOY_DIR"
    echo ""
    echo -e "${GREEN}✅ Deployment complete!${NC}"
else
    echo ""
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo "Deployment directory preserved at: $DEPLOY_DIR"
    echo "Check the error messages above for details."
    exit 1
fi

