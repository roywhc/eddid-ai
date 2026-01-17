"""Test database connection"""
import pytest
from app.db.metadata_store import get_db, init_db, SessionLocal
from sqlalchemy import inspect, text


def test_database_connection():
    """Test that database connection works"""
    db = next(get_db())
    assert db is not None
    db.close()


def test_tables_created():
    """Test that all required tables are created"""
    init_db()
    inspector = inspect(SessionLocal().bind)
    tables = inspector.get_table_names()
    
    assert "documents" in tables
    assert "chunks" in tables
    assert "kb_candidates" in tables
    assert "chat_history" in tables


def test_database_query():
    """Test basic database query"""
    db = SessionLocal()
    try:
        result = db.execute(text("SELECT 1"))
        assert result.scalar() == 1
    finally:
        db.close()

