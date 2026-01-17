"""Test configuration loading"""
import pytest
from app.config import settings, Environment, VectorStoreType


def test_config_loads():
    """Test that configuration loads correctly"""
    assert settings is not None
    assert isinstance(settings.env, Environment)


def test_default_values():
    """Test default configuration values"""
    assert settings.env == Environment.DEV
    assert settings.debug is True
    assert settings.api_port == 8000
    assert settings.vector_store_type == VectorStoreType.CHROMADB


def test_allowed_origins():
    """Test allowed origins configuration"""
    assert isinstance(settings.allowed_origins, list)
    assert len(settings.allowed_origins) > 0

