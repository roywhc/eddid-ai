# Data Model: Agentic AI Knowledge Base System

**Date**: 2026-01-24  
**Feature**: Agentic AI Knowledge Base System

## Entity Overview

The system manages documents, chunks, chat sessions, and candidate entries for knowledge base curation.

## Core Entities

### Document
**Purpose**: Represents a knowledge base document that has been added to the system

**Attributes**:
- `doc_id` (String, Primary Key): Unique document identifier
- `kb_id` (String, Indexed): Knowledge base identifier for categorization
- `title` (String): Document title
- `doc_type` (String): Type of document (e.g., "internal_policy", "faq", "guide")
- `content` (Text): Full document content
- `version` (String): Document version for tracking changes
- `status` (String): Document status ("active", "archived", "deleted")
- `created_at` (DateTime): Creation timestamp
- `updated_at` (DateTime): Last update timestamp
- `created_by` (String): User who created the document
- `approved_by` (String, Optional): User who approved the document
- `language` (String): Document language (default: "en")
- `tags` (List[String]): Tags for categorization and search
- `chunks` (Integer, Optional): Number of chunks created from this document
- `source_type` (String): Source of document ("manual", "external_perplexity", "imported")
- `source_urls` (List[String]): URLs where document content originated

**Relationships**:
- One-to-Many with Chunk (a document has many chunks)
- Many-to-One with Knowledge Base (documents belong to a knowledge base)

**Validation Rules**:
- `doc_id` must be unique
- `title` must be non-empty
- `content` must be non-empty
- `kb_id` must reference a valid knowledge base
- `version` must follow semantic versioning (MAJOR.MINOR.PATCH)

**State Transitions**:
- `pending` → `active` (when approved)
- `active` → `archived` (when superseded)
- `active` → `deleted` (when removed)

### Chunk
**Purpose**: Represents a portion of a document that has been split for embedding and vector storage

**Attributes**:
- `chunk_id` (String, Primary Key): Unique chunk identifier
- `doc_id` (String, Indexed): Reference to parent document
- `kb_id` (String, Indexed): Knowledge base identifier
- `content` (Text): Chunk text content
- `doc_type` (String): Type of source document
- `version` (String): Version of source document
- `section_title` (String, Optional): Title of section containing this chunk
- `section_path` (String, Optional): Hierarchical path to section
- `chunk_index` (Integer): Position of chunk within document
- `chunk_size` (Integer): Size of chunk in characters
- `language` (String): Language of chunk (default: "en")
- `created_at` (DateTime): Creation timestamp
- `updated_at` (DateTime): Last update timestamp
- `owner` (String, Optional): User who created/owns the chunk
- `tags` (List[String]): Tags inherited from document
- `source_type` (String): Source type inherited from document
- `source_urls` (List[String]): Source URLs inherited from document
- `status` (String): Chunk status ("active", "archived", "deleted")
- `embedding_vector` (Vector, Stored Separately): Embedding vector in vector database

**Relationships**:
- Many-to-One with Document (chunks belong to a document)
- Many-to-One with Knowledge Base (chunks belong to a knowledge base)

**Validation Rules**:
- `chunk_id` must be unique
- `doc_id` must reference an existing document
- `content` must be non-empty
- `chunk_size` must match actual content length
- `chunk_index` must be non-negative

**State Transitions**:
- Created as `active`
- `active` → `archived` (when document is archived)
- `active` → `deleted` (when document is deleted or updated)

### Chat Session
**Purpose**: Represents a conversation between a user and the system

**Attributes**:
- `session_id` (String, Primary Key): Unique session identifier
- `user_id` (String, Optional): User identifier (if authenticated)
- `created_at` (DateTime): Session creation timestamp
- `last_activity` (DateTime): Last message timestamp
- `message_count` (Integer): Number of messages in session
- `status` (String): Session status ("active", "expired", "closed")

**Relationships**:
- One-to-Many with Chat Message (session has many messages)

**Validation Rules**:
- `session_id` must be unique
- `last_activity` must be >= `created_at`

**State Transitions**:
- Created as `active`
- `active` → `expired` (after TTL period)
- `active` → `closed` (when explicitly closed)

### Chat Message
**Purpose**: Represents a single message in a conversation

**Attributes**:
- `message_id` (String, Primary Key): Unique message identifier
- `session_id` (String, Indexed): Reference to chat session
- `user_id` (String, Optional): User identifier
- `role` (String): Message role ("user" or "assistant")
- `content` (Text): Message content
- `timestamp` (DateTime): Message timestamp
- `sources_used` (List[Citation], JSON): Sources cited in response
- `metadata` (Dict, JSON, Optional): Additional message metadata (confidence, processing time, etc.)

**Relationships**:
- Many-to-One with Chat Session (messages belong to a session)

**Validation Rules**:
- `message_id` must be unique
- `session_id` must reference an existing session
- `role` must be "user" or "assistant"
- `content` must be non-empty
- `timestamp` must be valid datetime

### Candidate Entry
**Purpose**: Represents a potential knowledge base addition generated from external knowledge

**Attributes**:
- `candidate_id` (String, Primary Key): Unique candidate identifier
- `original_query` (String): User query that triggered candidate generation
- `source_type` (String): Source type ("external_perplexity")
- `title` (String): Suggested title for the candidate
- `content` (Text): Candidate content extracted from external source
- `suggested_kb_id` (String): Suggested knowledge base for this candidate
- `suggested_category` (String, Optional): Suggested category/type
- `external_urls` (List[String]): Source URLs from external knowledge
- `extracted_on` (DateTime): When candidate was extracted
- `created_at` (DateTime): When candidate record was created
- `status` (String): Review status ("pending", "approved", "rejected", "modified")
- `reviewed_by` (String, Optional): User who reviewed the candidate
- `review_notes` (Text, Optional): Notes from reviewer
- `hit_count` (Integer): Number of times this query pattern occurred

**Relationships**:
- Many-to-One with Knowledge Base (candidates suggested for a knowledge base)

**Validation Rules**:
- `candidate_id` must be unique
- `title` must be non-empty
- `content` must be non-empty
- `suggested_kb_id` must reference a valid knowledge base
- `status` must be one of: "pending", "approved", "rejected", "modified"
- `hit_count` must be >= 1

**State Transitions**:
- Created as `pending`
- `pending` → `approved` (when reviewed and approved)
- `pending` → `rejected` (when reviewed and rejected)
- `pending` → `modified` (when reviewed and modified before approval)

### Citation
**Purpose**: Represents a source reference in an answer (not a stored entity, part of response)

**Attributes**:
- `source` (String): Source type ("internal" or "external")
- `document_id` (String, Optional): Internal document identifier
- `document_title` (String, Optional): Document title
- `section` (String, Optional): Section within document
- `url` (String, Optional): External URL
- `relevance_score` (Float, Optional): Relevance score (0.0-1.0)
- `snippet` (String, Optional): Content snippet from source

**Validation Rules**:
- `source` must be "internal" or "external"
- If `source` is "internal", `document_id` should be provided
- If `source` is "external", `url` should be provided
- `relevance_score` must be between 0.0 and 1.0 if provided

## Data Relationships Diagram

```
Knowledge Base
    │
    ├── Document (1:N)
    │       │
    │       └── Chunk (1:N)
    │
    └── Candidate Entry (1:N)

Chat Session (1:N)
    │
    └── Chat Message
```

## Data Retention Policies

- **Chat History**: Retained for 90 days (configurable via `chat_history_retention_days`)
- **Logs**: Retained for 30 days (configurable via `log_retention_days`)
- **Candidates**: Retained based on TTL (default 7 days, configurable via `kb_candidate_ttl`)
- **Documents**: Retained indefinitely unless explicitly deleted or archived

## Indexing Strategy

- **Primary Indexes**: All primary keys (doc_id, chunk_id, session_id, message_id, candidate_id)
- **Foreign Key Indexes**: doc_id in Chunk, session_id in Chat Message, kb_id in Document/Chunk/Candidate
- **Query Indexes**: 
  - `created_at` in Document, Chat Session, Chat Message (for time-based queries)
  - `status` in Document, Chunk, Candidate (for filtering by status)
  - `kb_id` in all entities (for knowledge base filtering)

## Vector Store Schema

Chunks are stored in vector database (ChromaDB or pgvector) with:
- **ID**: `chunk_id`
- **Embedding**: Vector representation of chunk content
- **Metadata**: All chunk attributes stored as metadata for filtering
