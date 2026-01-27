"""
Migration script to create tool_calls table
Run this once to create new database schema for tool call tracking
"""
import sqlite3
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

def migrate_tool_call_table(db_path: str = "./data/metadata.db"):
    """
    Create tool_calls table if it doesn't exist
    
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
        # Create tool_calls table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tool_calls (
                tool_call_id TEXT PRIMARY KEY,
                query_id TEXT NOT NULL,
                session_id TEXT,
                tool_name TEXT NOT NULL,
                parameters TEXT NOT NULL,
                result TEXT,
                status TEXT NOT NULL CHECK(status IN ('success', 'failure', 'retry')),
                error_message TEXT,
                duration_ms INTEGER NOT NULL CHECK(duration_ms >= 0),
                retry_count INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create indexes for tool_calls
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_tool_calls_query 
            ON tool_calls(query_id)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_tool_calls_session 
            ON tool_calls(session_id)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_tool_calls_tool_name 
            ON tool_calls(tool_name)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_tool_calls_status 
            ON tool_calls(status)
        """)
        
        conn.commit()
        logger.info("Migration completed: tool_calls table created successfully")
    
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_tool_call_table()
