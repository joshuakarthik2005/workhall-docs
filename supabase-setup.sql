-- ============================================================
-- Supabase SQL Setup for Workhall Docs RAG Search
-- ============================================================
-- 
-- Run this SQL in the Supabase SQL Editor:
-- Supabase Dashboard → SQL Editor → New Query → Paste & Run
--
-- This script:
-- 1. Enables the pgvector extension (for vector similarity search)
-- 2. Creates the docs_embeddings table to store document chunks + embeddings
-- 3. Creates a match_docs function for vector similarity search
-- 4. Creates an index for fast approximate nearest neighbor search
--
-- IMPORTANT: This uses 384-dimensional vectors (for all-MiniLM-L6-v2 model)
-- If you switch to a different embedding model, update the dimension accordingly.
-- ============================================================

-- Step 1: Enable the pgvector extension
-- pgvector adds vector data type and similarity search operators to PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Drop existing table if re-running (optional — uncomment if needed)
-- DROP TABLE IF EXISTS docs_embeddings;
-- DROP FUNCTION IF EXISTS match_docs;

-- Step 3: Create the docs_embeddings table
-- Each row represents one chunk of documentation content with its embedding
CREATE TABLE IF NOT EXISTS docs_embeddings (
  -- Unique identifier for each chunk
  id BIGSERIAL PRIMARY KEY,
  
  -- The actual text content of this chunk (what gets sent to LLM as context)
  content TEXT NOT NULL,
  
  -- The heading/section this chunk belongs to (e.g., "Authentication Methods")
  heading TEXT NOT NULL,
  
  -- URL path to the documentation page (e.g., "/docs/features/authentication")
  url TEXT NOT NULL,
  
  -- Relative file path in the docs/ directory (e.g., "features/authentication.md")
  file_path TEXT NOT NULL,
  
  -- The embedding vector (384 dimensions for all-MiniLM-L6-v2)
  -- This is what enables vector similarity search
  embedding VECTOR(384) NOT NULL,
  
  -- Timestamp for tracking when chunks were indexed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create the match_docs function
-- This function is called from the Express server via supabase.rpc('match_docs', ...)
-- It performs cosine similarity search between the query embedding and stored embeddings
CREATE OR REPLACE FUNCTION match_docs(
  query_embedding VECTOR(384),    -- The embedding of the user's search query
  match_count INT DEFAULT 5,      -- How many results to return
  match_threshold FLOAT DEFAULT 0.3  -- Minimum similarity score (0-1)
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  heading TEXT,
  url TEXT,
  file_path TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.content,
    de.heading,
    de.url,
    de.file_path,
    -- Cosine similarity: 1 - cosine distance
    -- Higher values = more similar (1.0 = identical, 0.0 = orthogonal)
    1 - (de.embedding <=> query_embedding) AS similarity
  FROM docs_embeddings de
  WHERE 1 - (de.embedding <=> query_embedding) > match_threshold
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Step 5: Create an index for fast vector search
-- Uses IVFFlat (Inverted File with Flat compression) for approximate nearest neighbor search
-- 
-- Note: The index requires at least some data in the table to build.
-- If you get an error, run indexDocs.js first, then run this CREATE INDEX statement.
-- For small datasets (<1000 rows), the index is optional but still helpful.
CREATE INDEX IF NOT EXISTS docs_embeddings_embedding_idx 
  ON docs_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Step 6: Create an index on the URL column for fast lookups
CREATE INDEX IF NOT EXISTS docs_embeddings_url_idx 
  ON docs_embeddings (url);

-- ============================================================
-- Verify the setup
-- ============================================================
-- After running this script, you should see:
-- ✅ pgvector extension enabled
-- ✅ docs_embeddings table created (384-dimensional vectors)
-- ✅ match_docs function created
-- ✅ Indexes created
--
-- Next steps:
-- 1. Configure your .env file with Groq + Supabase credentials
-- 2. Run: node scripts/indexDocs.js (to index your docs)
-- 3. Run: node server.js (to start the search API)
-- ============================================================
