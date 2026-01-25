"""
Migration script to add content column to documents table
Run this once to update existing database schema
"""
import sqlite3
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

def migrate_documents_table(db_path: str = "./data/metadata.db"):
    """
    Add content column to documents table if it doesn't exist
    
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
        # Check if content column exists
        cursor.execute("PRAGMA table_info(documents)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'content' not in columns:
            logger.info("Adding content column to documents table...")
            cursor.execute("ALTER TABLE documents ADD COLUMN content TEXT")
            conn.commit()
            logger.info("Migration completed: content column added to documents table")
        else:
            logger.info("Content column already exists in documents table")
    
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_documents_table()
