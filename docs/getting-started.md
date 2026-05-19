---
sidebar_position: 2
title: Getting Started
description: Step-by-step guide to setting up your Workhall workspace and creating your first workflow.
---

# Getting Started with Workhall

This guide walks you through setting up your Workhall workspace from scratch.

## Prerequisites

Before you begin, ensure you have:

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- An email address for account registration
- Admin access if you're setting up for your organization

## Step 1: Create Your Account

1. Navigate to [workhall.com/signup](https://workhall.com/signup)
2. Enter your email address and choose a strong password
3. Verify your email by clicking the confirmation link
4. Complete your profile with your name and role

```bash
# If using the CLI tool for enterprise setup:
npm install -g @workhall/cli
workhall init my-workspace
```

## Step 2: Set Up Your Workspace

After signing in, you'll be guided through workspace creation:

1. **Name your workspace** — Choose a descriptive name (e.g., "Acme Engineering")
2. **Select a plan** — Free, Pro, or Enterprise
3. **Invite members** — Add team members by email or share an invite link
4. **Choose a template** — Start from scratch or use a pre-built workspace template

## Step 3: Configure Your Environment

### Environment Variables

For self-hosted deployments, configure the following environment variables:

```env
WORKHALL_DB_HOST=localhost
WORKHALL_DB_PORT=5432
WORKHALL_DB_NAME=workhall
WORKHALL_SECRET_KEY=your-secret-key-here
WORKHALL_REDIS_URL=redis://localhost:6379
WORKHALL_SMTP_HOST=smtp.gmail.com
```

### Docker Deployment

```yaml
version: '3.8'
services:
  workhall:
    image: workhall/platform:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/workhall
    depends_on:
      - db
      - redis
  db:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data
  redis:
    image: redis:7-alpine
```

## Step 4: Create Your First Workflow

1. Click **"New Workflow"** in the sidebar
2. Drag a **Trigger** node onto the canvas (e.g., "Form Submitted")
3. Add an **Action** node (e.g., "Send Email Notification")
4. Connect the nodes by drawing a line between them
5. Click **"Publish"** to activate your workflow

:::info
Workflows run in real-time as soon as they're published. You can pause or modify them at any time from the Workflows dashboard.
:::

## Next Steps

- Learn about [Authentication](/docs/features/authentication) to secure your workspace
- Explore [Workflows](/docs/features/workflows) for advanced automation patterns
- Check the [API Reference](/docs/api/overview) to build custom integrations
