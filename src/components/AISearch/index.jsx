/**
 * AISearch Component
 * 
 * A premium search modal for RAG-based documentation search.
 * Features:
 * - Ctrl+K / Cmd+K keyboard shortcut to open
 * - Real-time search with loading states
 * - AI-generated answers with markdown rendering
 * - Source document links for reference
 * - Glassmorphism design with smooth animations
 * - Click outside or Escape to close
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

/**
 * Renders a simple markdown-like text with basic formatting.
 * Handles bold, inline code, code blocks, and line breaks.
 */
function renderMarkdown(text) {
  if (!text) return null;

  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, i) => {
    // Code blocks
    if (part.startsWith('```')) {
      const lines = part.split('\n');
      const language = lines[0].replace('```', '').trim();
      const code = lines.slice(1, -1).join('\n');
      return (
        <pre key={i} className={styles.codeBlock}>
          {language && <span className={styles.codeLang}>{language}</span>}
          <code>{code}</code>
        </pre>
      );
    }

    // Regular text — apply inline formatting
    const formatted = part.split('\n').map((line, j) => {
      // Skip empty lines
      if (!line.trim()) return <br key={`${i}-${j}`} />;

      // Headers
      if (line.startsWith('### ')) {
        return <h4 key={`${i}-${j}`} className={styles.answerHeading}>{line.slice(4)}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={`${i}-${j}`} className={styles.answerHeading}>{line.slice(3)}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={`${i}-${j}`} className={styles.answerHeading}>{line.slice(2)}</h2>;
      }

      // Bullet points
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={`${i}-${j}`} className={styles.bulletPoint}>
            <span className={styles.bullet}>•</span>
            <span dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(2)) }} />
          </div>
        );
      }

      // Numbered list items
      const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);
      if (numberedMatch) {
        return (
          <div key={`${i}-${j}`} className={styles.bulletPoint}>
            <span className={styles.bullet}>{numberedMatch[1]}.</span>
            <span dangerouslySetInnerHTML={{ __html: inlineFormat(numberedMatch[2]) }} />
          </div>
        );
      }

      // Regular paragraph
      return (
        <p key={`${i}-${j}`} className={styles.paragraph} dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
      );
    });

    return <React.Fragment key={i}>{formatted}</React.Fragment>;
  });
}

/**
 * Applies inline markdown formatting (bold, inline code).
 */
function inlineFormat(text) {
  return text
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="' + styles.inlineCode + '">$1</code>');
}

/**
 * Main AISearch component — renders the search trigger button and modal.
 */
export default function AISearch() {
  const { siteConfig } = useDocusaurusContext();
  // Read API URL from docusaurus.config.js customFields — works for both local dev and production
  const SEARCH_API_URL = `${siteConfig.customFields?.searchApiUrl || 'http://localhost:3001'}/api/search`;

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  // --------------------------------------------------------
  // Keyboard shortcut: Ctrl+K / Cmd+K to open/close
  // --------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus the input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure modal is rendered
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    // Reset state when closing
    if (!isOpen) {
      setQuery('');
      setResult(null);
      setError(null);
    }
  }, [isOpen]);

  // --------------------------------------------------------
  // Click outside to close
  // --------------------------------------------------------
  const handleBackdropClick = useCallback((e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  }, []);

  // --------------------------------------------------------
  // Search handler — calls the RAG API
  // --------------------------------------------------------
  const handleSearch = useCallback(async (e) => {
    e.preventDefault();

    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(SEARCH_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Search failed (HTTP ${response.status})`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
    } catch (err) {
      console.error('Search error:', err);
      setError(
        err.message.includes('Failed to fetch')
          ? 'Cannot connect to search server. Make sure the server is running on port 3001 (run: node server.js)'
          : err.message
      );
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  return (
    <>
      {/* ====================================================== */}
      {/* Search trigger button in the navbar                     */}
      {/* ====================================================== */}
      <button
        className={styles.searchButton}
        onClick={() => setIsOpen(true)}
        aria-label="Search documentation"
        id="ai-search-button"
      >
        <svg className={styles.searchIcon} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className={styles.searchButtonText}>AI Search</span>
        <kbd className={styles.shortcut}>
          <span>Ctrl</span>
          <span>K</span>
        </kbd>
      </button>

      {/* ====================================================== */}
      {/* Search modal overlay                                    */}
      {/* ====================================================== */}
      {isOpen && (
        <div className={styles.overlay} onClick={handleBackdropClick}>
          <div className={styles.modal} ref={modalRef}>
            {/* Modal header with search input */}
            <div className={styles.modalHeader}>
              <div className={styles.searchInputWrapper}>
                <svg className={styles.inputIcon} viewBox="0 0 20 20" fill="none">
                  <path d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <form onSubmit={handleSearch} className={styles.searchForm}>
                  <input
                    ref={inputRef}
                    type="text"
                    className={styles.searchInput}
                    placeholder="Ask anything about Workhall..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    id="ai-search-input"
                  />
                </form>
                <button
                  className={styles.closeButton}
                  onClick={() => setIsOpen(false)}
                  aria-label="Close search"
                >
                  <kbd>ESC</kbd>
                </button>
              </div>
            </div>

            {/* Modal body — shows loading, results, or empty state */}
            <div className={styles.modalBody}>
              {/* Loading state */}
              {isLoading && (
                <div className={styles.loadingState}>
                  <div className={styles.spinner}>
                    <div className={styles.spinnerDot}></div>
                    <div className={styles.spinnerDot}></div>
                    <div className={styles.spinnerDot}></div>
                  </div>
                  <p className={styles.loadingText}>Searching docs and generating answer...</p>
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className={styles.errorState}>
                  <div className={styles.errorIcon}>⚠️</div>
                  <p className={styles.errorText}>{error}</p>
                </div>
              )}

              {/* Results */}
              {result && !isLoading && (
                <div className={styles.resultContainer}>
                  {/* AI-generated answer */}
                  <div className={styles.answerSection}>
                    <div className={styles.answerHeader}>
                      <div className={styles.aiTag}>
                        <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                          <path d="M8 1L10 5.5L15 6.5L11.5 10L12.5 15L8 12.5L3.5 15L4.5 10L1 6.5L6 5.5L8 1Z" fill="currentColor" />
                        </svg>
                        AI Answer
                      </div>
                      {result.timing && (
                        <span className={styles.timing}>{result.timing}</span>
                      )}
                    </div>
                    <div className={styles.answerContent}>
                      {renderMarkdown(result.answer)}
                    </div>
                  </div>

                  {/* Source links */}
                  {result.sources && result.sources.length > 0 && (
                    <div className={styles.sourcesSection}>
                      <h4 className={styles.sourcesTitle}>
                        <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                          <path d="M6 2H3C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V10M10 2H14V6M14 2L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Sources
                      </h4>
                      <div className={styles.sourcesList}>
                        {result.sources.map((source, index) => (
                          <a
                            key={index}
                            href={source.url}
                            className={styles.sourceLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <span className={styles.sourceIndex}>{index + 1}</span>
                            <span className={styles.sourceTitle}>{source.title}</span>
                            <span className={styles.sourceSimilarity}>
                              {Math.round(source.similarity * 100)}% match
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Empty state — shown when modal first opens */}
              {!isLoading && !result && !error && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
                      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" opacity="0.3" />
                      <path d="M24 14V34M14 24H34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
                      <path d="M20 18L24 14L28 18M30 20L34 24L30 28M28 30L24 34L20 30M18 28L14 24L18 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                    </svg>
                  </div>
                  <p className={styles.emptyTitle}>AI-Powered Documentation Search</p>
                  <p className={styles.emptyDescription}>
                    Ask a question in natural language and get an AI-generated answer based on the Workhall docs.
                  </p>
                  <div className={styles.exampleQueries}>
                    {[
                      'How do I set up OAuth authentication?',
                      'What workflow triggers are available?',
                      'How to connect Slack integration?',
                    ].map((example, i) => (
                      <button
                        key={i}
                        className={styles.exampleQuery}
                        onClick={() => {
                          setQuery(example);
                          // Auto-submit after setting the query
                          setTimeout(() => {
                            const form = document.querySelector(`.${styles.searchForm}`);
                            if (form) form.requestSubmit();
                          }, 100);
                        }}
                      >
                        <span className={styles.exampleArrow}>→</span>
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className={styles.modalFooter}>
              <span className={styles.footerHint}>
                <kbd>Enter</kbd> to search
                <kbd>ESC</kbd> to close
              </span>
              <span className={styles.poweredBy}>Powered by Groq + Supabase</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
