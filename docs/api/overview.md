---
sidebar_position: 1
title: API Overview
description: Complete overview of the Workhall REST API — authentication, rate limits, errors, and quickstart.
---

# API Overview

The Workhall REST API allows you to programmatically interact with every feature of the platform. Build custom integrations, automate workflows, and extend Workhall's functionality.

## Base URL

All API requests are made to:

```
https://api.workhall.com/v1
```

For self-hosted instances:

```
https://your-domain.com/api/v1
```

## Authentication

All API requests require authentication via an API key or OAuth token:

```bash
# Using API Key
curl -H "Authorization: Bearer wh_live_your_api_key_here" \
  https://api.workhall.com/v1/workflows

# Using OAuth Token
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  https://api.workhall.com/v1/workflows
```

### Generating API Keys

1. Go to **Settings → API Keys**
2. Click **"Generate New Key"**
3. Select the permissions scope
4. Copy and securely store your key

:::warning Security Notice
API keys grant access to your workspace data. Never expose them in client-side code or public repositories. Use environment variables instead.
:::

## Rate Limits

| Plan | Requests/Minute | Requests/Day |
|------|-----------------|--------------|
| Free | 60 | 10,000 |
| Pro | 300 | 100,000 |
| Enterprise | 1,000 | Unlimited |

Rate limit headers are included in every response:

```http
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 299
X-RateLimit-Reset: 1625097600
```

## Request Format

All requests use JSON:

```bash
curl -X POST https://api.workhall.com/v1/workflows \
  -H "Authorization: Bearer wh_live_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Workflow",
    "trigger": {
      "type": "webhook",
      "config": {}
    },
    "actions": []
  }'
```

## Response Format

All responses follow a consistent structure:

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "wf_abc123",
    "name": "New Workflow",
    "status": "draft",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "meta": {
    "requestId": "req_xyz789"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The 'name' field is required",
    "details": [
      {
        "field": "name",
        "message": "must be a non-empty string"
      }
    ]
  },
  "meta": {
    "requestId": "req_xyz789"
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Invalid request data |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Pagination

List endpoints support cursor-based pagination:

```bash
# First page
GET /v1/workflows?limit=20

# Next page (use the cursor from the previous response)
GET /v1/workflows?limit=20&cursor=eyJpZCI6IndmXzEyMyJ9
```

Response includes pagination metadata:

```json
{
  "data": [...],
  "pagination": {
    "hasMore": true,
    "nextCursor": "eyJpZCI6IndmXzEyMyJ9",
    "total": 156
  }
}
```

## SDKs

Official SDKs are available for:

- **JavaScript/Node.js**: `npm install @workhall/sdk`
- **Python**: `pip install workhall`
- **Go**: `go get github.com/workhall/go-sdk`

```javascript
// Node.js SDK example
const Workhall = require('@workhall/sdk');

const client = new Workhall({
  apiKey: process.env.WORKHALL_API_KEY,
});

// List all workflows
const workflows = await client.workflows.list({ limit: 10 });
console.log(workflows.data);
```

See the [API Endpoints](/docs/api/endpoints) reference for the complete list of available endpoints.
