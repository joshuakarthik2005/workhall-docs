/**
 * indexDocs.js
 * 
 * Reads all .md and .mdx files from the docs/ directory, generates embeddings
 * using a LOCAL model (all-MiniLM-L6-v2 via Transformers.js), and stores them
 * in Supabase with pgvector for similarity search.
 * 
 * No OpenAI/Groq API call needed for embeddings — runs 100% locally.
 * 
 * Usage: node scripts/indexDocs.js
 * 
 * Required environment variables:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_KEY: Your Supabase service role key (not anon key!)
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { chunkMarkdown } = require('./chunkContent');
const { generateEmbeddings, EMBEDDING_DIMENSIONS, MODEL_NAME } = require('./embeddings');

// Load environment variables from .env file
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// ============================================================
// Configuration
// ============================================================

const DOCS_DIR = path.resolve(__dirname, '..', 'docs');

// ============================================================
// Initialize Supabase client
// ============================================================

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    console.error('   Please check your .env file.');
    process.exit(1);
  }
}

// Use service role key (not anon key) for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================================
// File discovery
// ============================================================

/**
 * Recursively finds all .md and .mdx files in a directory.
 * Skips files starting with _ (like _category_.json).
 * 
 * @param {string} dir - Directory to search
 * @returns {string[]} Array of absolute file paths
 */
function findMarkdownFiles(dir) {
  const files = [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Recursively search subdirectories
      files.push(...findMarkdownFiles(fullPath));
    } else if (
      (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) &&
      !entry.name.startsWith('_') // Skip category files
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Converts a file path to a URL-friendly slug for the docs site.
 * Example: docs/features/authentication.md → /docs/features/authentication
 * 
 * @param {string} filePath - Absolute path to the markdown file
 * @returns {string} URL path for the document
 */
function filePathToUrl(filePath) {
  const relativePath = path.relative(DOCS_DIR, filePath);
  const withoutExtension = relativePath.replace(/\.(mdx?|md)$/, '');
  // Convert Windows backslashes to forward slashes for URLs
  const urlPath = withoutExtension.split(path.sep).join('/');
  return `/docs/${urlPath}`;
}

// ============================================================
// Supabase storage
// ============================================================

/**
 * Clears all existing embeddings from the database.
 * Called before re-indexing to ensure a fresh start.
 */
async function clearExistingEmbeddings() {
  console.log('🗑️  Clearing existing embeddings...');

  const { error } = await supabase
    .from('docs_embeddings')
    .delete()
    .neq('id', 0); // Delete all rows (neq trick for "delete all")

  if (error) {
    console.error('❌ Error clearing embeddings:', error.message);
    throw error;
  }

  console.log('✅ Existing embeddings cleared.');
}

/**
 * Stores chunks with their embeddings in Supabase.
 * 
 * @param {Array<{content: string, heading: string, filePath: string}>} chunks
 * @param {number[][]} embeddings
 */
async function storeEmbeddings(chunks, embeddings) {
  console.log(`\n💾 Storing ${chunks.length} embeddings in Supabase...`);

  // Prepare rows for insertion
  const rows = chunks.map((chunk, index) => ({
    content: chunk.content,
    heading: chunk.heading,
    url: filePathToUrl(chunk.filePath),
    file_path: path.relative(DOCS_DIR, chunk.filePath),
    embedding: embeddings[index],
  }));

  // Insert in batches to avoid payload size limits
  const INSERT_BATCH = 50;
  for (let i = 0; i < rows.length; i += INSERT_BATCH) {
    const batch = rows.slice(i, i + INSERT_BATCH);

    const { error } = await supabase
      .from('docs_embeddings')
      .insert(batch);

    if (error) {
      console.error(`❌ Error inserting batch ${i}-${i + batch.length}:`, error.message);
      throw error;
    }

    console.log(`  ✅ Inserted rows ${i + 1}-${i + batch.length}`);
  }
}

// ============================================================
// Main indexing pipeline
// ============================================================

async function main() {
  console.log('🚀 Starting documentation indexing...');
  console.log(`   Embedding model: ${MODEL_NAME} (${EMBEDDING_DIMENSIONS} dimensions, local)`);
  console.log();

  // Step 1: Find all markdown files
  const files = findMarkdownFiles(DOCS_DIR);
  console.log(`📁 Found ${files.length} markdown files:\n`);
  files.forEach((f) => console.log(`   ${path.relative(DOCS_DIR, f)}`));
  console.log();

  // Step 2: Read and chunk all files
  const allChunks = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const chunks = chunkMarkdown(content, file);
    allChunks.push(...chunks);
    console.log(`📄 ${path.basename(file)} → ${chunks.length} chunks`);
  }

  console.log(`\n📦 Total chunks to index: ${allChunks.length}\n`);

  if (allChunks.length === 0) {
    console.log('⚠️  No chunks to index. Check your docs/ directory.');
    return;
  }

  // Step 3: Generate embeddings locally (no API call needed!)
  console.log('🤖 Generating embeddings locally (Transformers.js)...\n');
  const texts = allChunks.map((chunk) => chunk.content);
  
  const embeddings = await generateEmbeddings(texts, (current, total) => {
    // Progress indicator
    if (current % 5 === 0 || current === total) {
      const percent = Math.round((current / total) * 100);
      process.stdout.write(`\r  📊 Progress: ${current}/${total} (${percent}%)`);
    }
  });
  
  console.log('\n');

  // Step 4: Clear existing data and store new embeddings
  await clearExistingEmbeddings();
  await storeEmbeddings(allChunks, embeddings);

  console.log('\n✅ Indexing complete!');
  console.log(`   ${files.length} files → ${allChunks.length} chunks indexed`);
  console.log('   Run "node server.js" to start the search API.\n');
}

// Run the indexing pipeline
main().catch((error) => {
  console.error('\n❌ Indexing failed:', error.message);
  process.exit(1);
});
