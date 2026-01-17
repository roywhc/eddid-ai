from pydantic_settings import BaseSettings
from typing import Optional
from enum import Enum
import logging

class Environment(str, Enum):
    DEV = "development"
    STAGING = "staging"
    PROD = "production"

class VectorStoreType(Enum):
    CHROMADB = "chromadb"
    PGVECTOR = "pgvector"

class EmbeddingsType(Enum):
    SENTENCE_TRANSFORMERS = "sentence-transformers"
    OPENAI = "openai"

class LLMProvider(str, Enum):
    OPENAI = "openai"
    OPENROUTER = "openrouter"
    AZURE_OPENAI = "azure_openai"

class Settings(BaseSettings):
    # Core
    env: Environment = Environment.DEV
    debug: bool = True
    log_level: str = "INFO"

    # API Server
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_workers: int = 4
    secret_key: str = "your-secret-key-change-in-prod"
    allowed_origins: str = "http://localhost:3000"
    
    @property
    def allowed_origins_list(self) -> list[str]:
        """Parse allowed_origins string into list"""
        if isinstance(self.allowed_origins, str):
            return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]
        return self.allowed_origins if isinstance(self.allowed_origins, list) else []

    # Vector Store
    vector_store_type: VectorStoreType = VectorStoreType.CHROMADB
    chroma_persist_dir: str = "/tmp/chroma"
    
    # pgvector (if using)
    pgvector_host: Optional[str] = None
    pgvector_port: int = 5432
    pgvector_user: str = "postgres"
    pgvector_password: str = "password"
    pgvector_db: str = "knowledge_base"

    # Metadata DB
    metadata_db_url: str = "sqlite:///./data/metadata.db"

    # Embeddings
    embeddings_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embeddings_type: EmbeddingsType = EmbeddingsType.SENTENCE_TRANSFORMERS

    # LLM
    llm_provider: LLMProvider = LLMProvider.OPENROUTER
    llm_model: str = "openai/gpt-4-turbo"  # OpenRouter format: provider/model
    llm_temperature: float = 0.7
    openai_api_key: Optional[str] = None
    azure_openai_api_key: Optional[str] = None
    # OpenRouter
    openrouter_api_key: Optional[str] = None
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # Perplexity
    perplexity_api_key: Optional[str] = None
    perplexity_model: str = "sonar"
    perplexity_timeout: int = 30

    # Confidence & Thresholds
    kb_confidence_threshold: float = 0.7
    relevance_score_threshold: float = 0.5
    
    # KB Update
    kb_update_enabled: bool = True
    kb_update_review_required: bool = True
    kb_candidate_ttl: int = 7

    # Session & Cache
    session_ttl: int = 3600
    cache_ttl: int = 300
    max_cache_size: int = 1000

    # Rate Limiting
    rate_limit_enabled: bool = True
    rate_limit_requests: int = 100
    rate_limit_window: int = 60

    # Data Retention
    log_retention_days: int = 30
    chat_history_retention_days: int = 90

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def pgvector_url(self) -> str:
        if self.vector_store_type == VectorStoreType.PGVECTOR:
            return f"postgresql://{self.pgvector_user}:{self.pgvector_password}@{self.pgvector_host}:{self.pgvector_port}/{self.pgvector_db}"
        raise ValueError("pgvector_url only available when using pgvector")

settings = Settings()
logger = logging.getLogger(__name__)

