/**
 * chunkContent.js
 * 
 * Cleans and chunks markdown content into smaller, semantically meaningful pieces
 * for embedding and vector search. Each chunk is designed to be small enough for
 * efficient embedding while preserving enough context to be useful in RAG responses.
 * 
 * Strategy:
 * 1. Strip frontmatter (YAML between --- delimiters)
 * 2. Remove markdown syntax (links, images, HTML tags, code fences)
 * 3. Split by headings to create semantic sections
 * 4. Further split large sections into smaller chunks (~500 chars)
 * 5. Preserve heading context in each chunk for better retrieval
 */

// Maximum character length for each chunk
const MAX_CHUNK_SIZE = 500;

// Minimum character length — skip chunks that are too short to be useful
const MIN_CHUNK_SIZE = 50;

/**
 * Removes YAML frontmatter from markdown content.
 * Frontmatter is the metadata block between --- delimiters at the top of .md files.
 * 
 * @param {string} content - Raw markdown string
 * @returns {string} Content without frontmatter
 */
function removeFrontmatter(content) {
  // Match frontmatter block: starts and ends with --- on its own line
  return content.replace(/^---[\s\S]*?---\n*/m, '');
}

/**
 * Cleans markdown syntax to produce plain text.
 * This helps create cleaner embeddings by removing formatting noise.
 * 
 * @param {string} text - Markdown text
 * @returns {string} Cleaned plain text
 */
function cleanMarkdown(text) {
  return text
    // Remove code blocks (``` ... ```) but keep the content inside
    .replace(/```[\s\S]*?```/g, (match) => {
      // Extract just the code content, removing the fence markers and language tag
      const lines = match.split('\n');
      return lines.slice(1, -1).join('\n');
    })
    // Remove inline code backticks
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown images ![alt](url)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Remove markdown links [text](url) — keep the text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove HTML tags
    .replace(/<[^>]+>/g, '')
    // Remove Docusaurus admonitions (:::note, :::tip, etc.)
    .replace(/:::\w+/g, '')
    .replace(/:::/g, '')
    // Remove bold/italic markers
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove heading markers (# ## ### etc.) — we handle headings separately
    .replace(/^#{1,6}\s+/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, '')
    // Remove table formatting pipes
    .replace(/\|/g, ' ')
    // Remove table separator rows (e.g., |---|---|)
    .replace(/^[\s-:]+$/gm, '')
    // Collapse multiple newlines into two
    .replace(/\n{3,}/g, '\n\n')
    // Collapse multiple spaces
    .replace(/ {2,}/g, ' ')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim();
}

/**
 * Splits markdown content into sections based on headings.
 * Each section includes the heading as context.
 * 
 * @param {string} content - Markdown content (with frontmatter already removed)
 * @returns {Array<{heading: string, content: string}>} Array of sections
 */
function splitByHeadings(content) {
  const sections = [];
  // Split on heading lines (# Heading, ## Heading, etc.)
  const parts = content.split(/^(#{1,6}\s+.+)$/m);

  let currentHeading = 'Introduction';
  let currentContent = '';

  for (const part of parts) {
    const headingMatch = part.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      // Save the previous section if it has content
      if (currentContent.trim()) {
        sections.push({
          heading: currentHeading,
          content: currentContent.trim(),
        });
      }
      // Start a new section with this heading
      currentHeading = headingMatch[1].trim();
      currentContent = '';
    } else {
      currentContent += part;
    }
  }

  // Don't forget the last section
  if (currentContent.trim()) {
    sections.push({
      heading: currentHeading,
      content: currentContent.trim(),
    });
  }

  return sections;
}

/**
 * Splits a long text into smaller chunks, trying to break at paragraph boundaries.
 * Falls back to sentence boundaries, then hard character limits.
 * 
 * @param {string} text - Text to split
 * @param {number} maxSize - Maximum chunk size in characters
 * @returns {string[]} Array of text chunks
 */
function splitIntoChunks(text, maxSize = MAX_CHUNK_SIZE) {
  // If the text is already small enough, return as-is
  if (text.length <= maxSize) {
    return [text];
  }

  const chunks = [];
  // Split by paragraphs (double newline)
  const paragraphs = text.split(/\n\n+/);

  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed the limit
    if (currentChunk.length + paragraph.length + 2 > maxSize) {
      // Save the current chunk if it has content
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }

      // If a single paragraph is too long, split it by sentences
      if (paragraph.length > maxSize) {
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
        currentChunk = '';
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > maxSize) {
            if (currentChunk.trim()) {
              chunks.push(currentChunk.trim());
            }
            currentChunk = sentence;
          } else {
            currentChunk += sentence;
          }
        }
      } else {
        currentChunk = paragraph;
      }
    } else {
      // Add paragraph to current chunk
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Main function: processes raw markdown content into an array of chunks
 * ready for embedding. Each chunk includes the heading context for
 * better retrieval relevance.
 * 
 * @param {string} rawContent - Raw markdown file content
 * @param {string} filePath - Path to the source file (for metadata)
 * @returns {Array<{content: string, heading: string, filePath: string}>} Processed chunks
 */
function chunkMarkdown(rawContent, filePath) {
  // Step 1: Remove frontmatter
  const withoutFrontmatter = removeFrontmatter(rawContent);

  // Step 2: Split into heading-based sections
  const sections = splitByHeadings(withoutFrontmatter);

  const allChunks = [];

  for (const section of sections) {
    // Step 3: Clean the markdown syntax
    const cleanedContent = cleanMarkdown(section.content);

    // Step 4: Split large sections into smaller chunks
    const textChunks = splitIntoChunks(cleanedContent);

    for (const chunk of textChunks) {
      // Skip chunks that are too short to be meaningful
      if (chunk.length < MIN_CHUNK_SIZE) continue;

      allChunks.push({
        // Prepend the heading for context — helps the embedding model understand
        // what this chunk is about even when the chunk itself is a sub-section
        content: `${section.heading}: ${chunk}`,
        heading: section.heading,
        filePath: filePath,
      });
    }
  }

  return allChunks;
}

module.exports = { chunkMarkdown, cleanMarkdown, removeFrontmatter };
