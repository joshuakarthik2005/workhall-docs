/**
 * server.js
 * 
 * Express.js API server for RAG-based documentation search.
 * 
 * Stack:
 * - Groq API (mixtral-8x7b-32768) for answer generation
 * - Local embeddings (all-MiniLM-L6-v2 via Transformers.js) for query embedding
 * - Supabase pgvector for vector similarity search
 * 
 * Flow:
 * 1. Receives a search query from the frontend
 * 2. Generates an embedding LOCALLY using Transformers.js (no API call)
 * 3. Performs vector similarity search in Supabase (pgvector)
 * 4. Sends the matched chunks as context to Groq (Mixtral) for answer generation
 * 5. Returns the AI-generated answer with source links
 * 
 * Endpoint: POST /api/search
 * Body: { "query": "How do I set up authentication?" }
 * 
 * Usage: node server.js
 * Runs on: http://localhost:3001
 */

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const Groq = require('groq-sdk');
require('dotenv').config();

// Lazy-load the embedding module — loaded on first search request
// This prevents ONNX Runtime from interfering with Render's port detection
let embeddingModule = null;
async function getEmbeddingModule() {
  if (!embeddingModule) {
    console.log('🔄 Loading embedding model (first request)...');
    embeddingModule = require('./scripts/embeddings');
    // Warm up the pipeline
    await embeddingModule.generateEmbedding('warm up');
    console.log('✅ Embedding model ready!');
  }
  return embeddingModule;
}

// ============================================================
// Configuration
// ============================================================

const PORT = process.env.PORT || 3001;
const CHAT_MODEL = 'llama-3.3-70b-versatile'; // Groq production model (Mixtral was deprecated March 2025)
const MATCH_COUNT = 5; // Number of similar documents to retrieve
const MATCH_THRESHOLD = 0.3; // Minimum similarity score (lower threshold for 384-dim model)
const DOCS_BASE_URL = process.env.DOCS_BASE_URL || 'http://localhost:3000';

// ============================================================
// Initialize clients
// ============================================================

// Groq client for chat/answer generation
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Supabase client for vector search
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================================
// Express app setup
// ============================================================

const app = express();

// CORS configuration — allows both local dev and deployed Cloudflare Pages frontend
// Set FRONTEND_URL env var on Render to your Cloudflare Pages domain
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];
// Add the production frontend URL if configured
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: allowedOrigins,
}));

// Parse JSON request bodies
app.use(express.json());

// ============================================================
// Start server IMMEDIATELY so Render detects the port
// Embedding model loads lazily on first search request
// ============================================================

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Workhall Docs Search API running on port ${PORT}`);
  console.log(`   POST /api/search — Search documentation`);
  console.log(`   GET  /api/health — Health check`);
  console.log(`\n   Chat model: ${CHAT_MODEL} (via Groq)`);
  console.log(`   Embedding model: all-MiniLM-L6-v2 (local, 384d, lazy-loaded)`);
  if (process.env.FRONTEND_URL) {
    console.log(`   Frontend URL: ${process.env.FRONTEND_URL}`);
  }
  console.log();

  const missing = [];
  if (!process.env.GROQ_API_KEY) missing.push('GROQ_API_KEY');
  if (!process.env.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_KEY');

  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
    console.warn('   Search will not work until these are configured.\n');
  } else {
    console.log('✅ All environment variables configured.\n');
  }
});

// ============================================================
// Health check endpoint
// ============================================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    models: {
      chat: CHAT_MODEL,
      embeddings: `${MODEL_NAME} (local, ${EMBEDDING_DIMENSIONS}d)`,
    },
    services: {
      groq: !!process.env.GROQ_API_KEY,
      supabase: !!process.env.SUPABASE_URL,
    },
  });
});

// ============================================================
// Search endpoint — the main RAG pipeline
// ============================================================

app.post('/api/search', async (req, res) => {
  const startTime = Date.now();

  try {
    const { query } = req.body;

    // Validate the query
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Missing or empty "query" field in request body.',
      });
    }

    const trimmedQuery = query.trim();
    console.log(`\n🔍 Search query: "${trimmedQuery}"`);

    // --------------------------------------------------------
    // Step 1: Generate an embedding for the search query (LOCAL)
    // --------------------------------------------------------
    console.log('  📊 Generating query embedding (local model)...');

    const { generateEmbedding } = await getEmbeddingModule();
    const queryEmbedding = await generateEmbedding(trimmedQuery);

    // --------------------------------------------------------
    // Step 2: Vector similarity search in Supabase
    // Uses the match_docs function created via SQL (see supabase-setup.sql)
    // --------------------------------------------------------
    console.log('  🔎 Searching vector database...');

    const { data: matches, error: matchError } = await supabase
      .rpc('match_docs', {
        query_embedding: queryEmbedding,
        match_count: MATCH_COUNT,
        match_threshold: MATCH_THRESHOLD,
      });

    if (matchError) {
      console.error('  ❌ Supabase search error:', matchError.message);
      throw new Error(`Vector search failed: ${matchError.message}`);
    }

    console.log(`  ✅ Found ${matches?.length || 0} matching documents`);

    // If no matches found, return a helpful message
    if (!matches || matches.length === 0) {
      return res.json({
        answer: "I couldn't find any relevant documentation for your question. Try rephrasing your query or browsing the docs manually.",
        sources: [],
        query: trimmedQuery,
        timing: `${Date.now() - startTime}ms`,
      });
    }

    // --------------------------------------------------------
    // Step 3: Build context from matched documents
    // --------------------------------------------------------
    const context = matches
      .map((match, i) => `[Source ${i + 1}] (${match.heading})\n${match.content}`)
      .join('\n\n---\n\n');

    // Build source links for the frontend
    const sources = matches.map((match) => ({
      title: match.heading,
      url: `${DOCS_BASE_URL}${match.url}`,
      similarity: Math.round(match.similarity * 100) / 100,
    }));

    // Deduplicate sources by URL
    const uniqueSources = sources.filter(
      (source, index, self) =>
        index === self.findIndex((s) => s.url === source.url)
    );

    // --------------------------------------------------------
    // Step 4: Generate answer using Groq (Mixtral) with RAG context
    // --------------------------------------------------------
    console.log(`  🤖 Generating AI answer via Groq (${CHAT_MODEL})...`);

    const chatResponse = await groq.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.3, // Lower temperature for more factual responses
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: `You are a helpful documentation assistant for the Workhall platform.
Your job is to answer questions based ONLY on the provided documentation context.

Rules:
- Answer the question directly and concisely using the provided context.
- If the context contains code examples, include them in your answer.
- Use markdown formatting for readability (headers, bullet points, code blocks).
- If the context doesn't contain enough information to fully answer the question, say so honestly.
- Do NOT make up information that isn't in the context.
- Reference the source documents when relevant (e.g., "According to the Authentication docs...").`,
        },
        {
          role: 'user',
          content: `Context from Workhall documentation:\n\n${context}\n\n---\n\nQuestion: ${trimmedQuery}`,
        },
      ],
    });

    const answer = chatResponse.choices[0].message.content;
    const timing = `${Date.now() - startTime}ms`;

    console.log(`  ✅ Answer generated in ${timing}`);

    // --------------------------------------------------------
    // Step 5: Return the answer with sources
    // --------------------------------------------------------
    res.json({
      answer,
      sources: uniqueSources,
      query: trimmedQuery,
      timing,
    });

  } catch (error) {
    console.error('❌ Search error:', error.message);
    res.status(500).json({
      error: 'An error occurred while processing your search. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});
