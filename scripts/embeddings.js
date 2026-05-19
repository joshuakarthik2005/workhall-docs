/**
 * embeddings.js
 * 
 * Shared embedding utility using Transformers.js (@xenova/transformers).
 * Runs the all-MiniLM-L6-v2 model LOCALLY — no API key needed, 100% free.
 * 
 * This model produces 384-dimensional embeddings, which are stored in
 * Supabase pgvector for similarity search.
 * 
 * On first run, the model (~23MB) is downloaded and cached automatically.
 * Subsequent runs load from cache and are much faster.
 * 
 * Why local embeddings?
 * - Groq API does NOT support embedding models (only chat/completion)
 * - Local embeddings are free with no rate limits
 * - all-MiniLM-L6-v2 is a high-quality, lightweight model
 */

const { pipeline } = require('@xenova/transformers');

// Embedding model — small, fast, and high quality
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
const EMBEDDING_DIMENSIONS = 384;

// Cache the pipeline instance so we don't reload the model on every call
let embeddingPipeline = null;

/**
 * Initializes and returns the embedding pipeline.
 * Uses singleton pattern — model is loaded only once.
 * 
 * @returns {Promise} The feature-extraction pipeline
 */
async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    console.log(`  🔄 Loading embedding model: ${MODEL_NAME}...`);
    console.log('     (First run downloads ~23MB model, cached after that)');
    
    embeddingPipeline = await pipeline('feature-extraction', MODEL_NAME, {
      // Use quantized model for faster loading and lower memory
      quantized: true,
    });
    
    console.log('  ✅ Embedding model loaded successfully!');
  }
  return embeddingPipeline;
}

/**
 * Generates an embedding vector for a single text string.
 * 
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} 384-dimensional embedding vector
 */
async function generateEmbedding(text) {
  const pipe = await getEmbeddingPipeline();
  
  // Run the model — returns a Tensor
  const output = await pipe(text, {
    pooling: 'mean',      // Mean pooling over token embeddings
    normalize: true,       // L2 normalize for cosine similarity
  });
  
  // Convert Tensor to a plain JavaScript array
  return Array.from(output.data);
}

/**
 * Generates embeddings for an array of text strings.
 * Processes sequentially to manage memory (local model).
 * 
 * @param {string[]} texts - Array of text strings to embed
 * @param {Function} [onProgress] - Optional callback(index, total) for progress
 * @returns {Promise<number[][]>} Array of 384-dimensional embedding vectors
 */
async function generateEmbeddings(texts, onProgress) {
  // Ensure the model is loaded before starting
  await getEmbeddingPipeline();
  
  const embeddings = [];
  
  for (let i = 0; i < texts.length; i++) {
    const embedding = await generateEmbedding(texts[i]);
    embeddings.push(embedding);
    
    if (onProgress) {
      onProgress(i + 1, texts.length);
    }
  }
  
  return embeddings;
}

module.exports = {
  generateEmbedding,
  generateEmbeddings,
  EMBEDDING_DIMENSIONS,
  MODEL_NAME,
};
