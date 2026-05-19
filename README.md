# Workhall Docs

AI-powered documentation site built with **Docusaurus** and **RAG (Retrieval Augmented Generation)** search.

## 🏗️ Tech Stack

| Component | Technology |
|-----------|------------|
| Documentation site | Docusaurus (classic template, JavaScript) |
| Vector database | Supabase pgvector |
| Embeddings | `all-MiniLM-L6-v2` (local via Transformers.js, 384d) |
| Answer generation | Groq API (`mixtral-8x7b-32768`) |
| Search API | Express.js (localhost:3001) |
| Search UI | React component (Docusaurus theme override) |

## 📁 Project Structure

```
workhall-docs/
├── docs/                           # Markdown documentation files
│   ├── intro.md                    # Introduction
│   ├── getting-started.md          # Getting started guide
│   ├── features/                   # Feature documentation
│   │   ├── authentication.md
│   │   ├── workflows.md
│   │   └── integrations.md
│   └── api/                        # API reference
│       ├── overview.md
│       └── endpoints.md
├── scripts/
│   ├── chunkContent.js             # Markdown chunking utility
│   ├── embeddings.js               # Local embedding model (Transformers.js)
│   └── indexDocs.js                # Embedding + Supabase indexer
├── server.js                       # Express.js RAG search API
├── src/
│   ├── components/
│   │   └── AISearch/               # AI search modal component
│   │       ├── index.jsx
│   │       └── styles.module.css
│   ├── theme/
│   │   └── SearchBar/              # Docusaurus search bar override
│   │       └── index.jsx
│   └── css/
│       └── custom.css              # Theme customization
├── supabase-setup.sql              # SQL to run in Supabase
├── .env.example                    # Environment variables template
├── docusaurus.config.js            # Docusaurus configuration
├── sidebars.js                     # Sidebar navigation
└── package.json                    # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20
- A [Groq API key](https://console.groq.com/keys) (free tier available)
- A [Supabase project](https://supabase.com) (free tier works)

### Step 1: Install Dependencies

```bash
cd workhall-docs
npm install
```

### Step 2: Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → **New Query**
3. Paste the contents of `supabase-setup.sql` and click **Run**
4. This creates the `docs_embeddings` table (384-dim vectors) and `match_docs` function

### Step 3: Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
GROQ_API_KEY=gsk_your-groq-api-key
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
DOCS_BASE_URL=http://localhost:3000
```

### Step 4: Index the Documentation

```bash
node scripts/indexDocs.js
```

This reads all markdown files, generates embeddings **locally** (no API call), and stores them in Supabase. On first run, the embedding model (~23MB) is downloaded and cached.

### Step 5: Start the Search API

```bash
node server.js
```

The API server runs at `http://localhost:3001`.

### Step 6: Start Docusaurus

```bash
npm start
```

The docs site runs at `http://localhost:3000`.

### Step 7: Try AI Search

1. Open `http://localhost:3000`
2. Press **Ctrl+K** (or **Cmd+K** on Mac)
3. Type a question like "How do I set up OAuth?"
4. Get an AI-generated answer with source links!

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Docusaurus dev server (port 3000) |
| `npm run server` | Start the search API server (port 3001) |
| `npm run index` | Index docs into Supabase |
| `npm run dev` | Start both Docusaurus and API server concurrently |
| `npm run build` | Build production Docusaurus site |

## 🔄 Re-indexing

When you add or update documentation, re-run the indexing script:

```bash
node scripts/indexDocs.js
```

This clears the existing embeddings and creates new ones.

## 🎨 Customization

- **Theme colors**: Edit `src/css/custom.css`
- **Search UI**: Edit `src/components/AISearch/`
- **Search behavior**: Edit `server.js` (match count, threshold, prompt)
- **Chunking strategy**: Edit `scripts/chunkContent.js`
- **Embedding model**: Edit `scripts/embeddings.js` (change model name)
- **Chat model**: Edit `server.js` (change `CHAT_MODEL` constant)

## 📝 License

MIT
