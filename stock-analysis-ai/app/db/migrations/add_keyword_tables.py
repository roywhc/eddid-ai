"""
Migration script to create keyword and keyword_associations tables
Run this once to create new database schema for keyword indexing
"""
import sqlite3
import logging
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)

def migrate_keyword_tables(db_path: str = "./data/metadata.db"):
    """
    Create keywords and keyword_associations tables if they don't exist
    
    Args:
        db_path: Path to SQLite database file
    """
    db_file = Path(db_path)
    if not db_file.exists():
        logger.warning(f"Database file not found: {db_path}. Migration skipped.")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Create keywords table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS keywords (
                keyword_id TEXT PRIMARY KEY,
                keyword_text TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                usage_count INTEGER NOT NULL DEFAULT 1,
                last_used_at TIMESTAMP,
                CHECK(LENGTH(keyword_text) >= 2 AND LENGTH(keyword_text) <= 50)
            )
        """)
        
        # Create unique index on keyword_text (case-insensitive)
        cursor.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_keywords_text_lower 
            ON keywords(LOWER(keyword_text))
        """)
        
        # Create index for usage tracking
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_keywords_usage 
            ON keywords(usage_count DESC, last_used_at DESC)
        """)
        
        # Create keyword_associations table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS keyword_associations (
                association_id TEXT PRIMARY KEY,
                keyword_id TEXT NOT NULL,
                query_id TEXT,
                perplexity_result_id TEXT,
                session_id TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (keyword_id) REFERENCES keywords(keyword_id) ON DELETE CASCADE,
                CHECK(query_id IS NOT NULL OR perplexity_result_id IS NOT NULL)
            )
        """)
        
        # Create indexes for keyword_associations
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_keyword_associations_keyword 
            ON keyword_associations(keyword_id)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_keyword_associations_query 
            ON keyword_associations(query_id)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_keyword_associations_perplexity 
            ON keyword_associations(perplexity_result_id)
        """)
        
        conn.commit()
        logger.info("Migration completed: keyword tables created successfully")
    
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_keyword_tables()
