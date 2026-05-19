---
sidebar_position: 3
title: Integrations
description: Connect Workhall with your favorite tools — Slack, Google Workspace, Jira, GitHub, and more.
---

# Integrations

Workhall integrates with dozens of popular tools to streamline your workflows and centralize your team's operations.

## Available Integrations

### Communication

| Integration | Features |
|-------------|----------|
| **Slack** | Send messages, create channels, receive workflow notifications |
| **Microsoft Teams** | Post updates, schedule meetings, sync tasks |
| **Discord** | Bot notifications, channel management |
| **Email (SMTP)** | Send templated emails via any SMTP provider |

### Project Management

| Integration | Features |
|-------------|----------|
| **Jira** | Sync issues, update statuses, create tickets from workflows |
| **Asana** | Create tasks, update projects, sync deadlines |
| **Trello** | Manage boards, create cards, move lists |
| **Linear** | Issue tracking, sprint management |

### Developer Tools

| Integration | Features |
|-------------|----------|
| **GitHub** | Trigger workflows on PR events, manage issues, deploy |
| **GitLab** | CI/CD integration, merge request automation |
| **Bitbucket** | Repository webhooks, PR notifications |
| **Vercel** | Deployment triggers, preview URL notifications |

### Cloud Storage

| Integration | Features |
|-------------|----------|
| **Google Drive** | Upload files, share documents, manage permissions |
| **Dropbox** | File sync, shared folder management |
| **AWS S3** | Object storage, file upload/download |
| **OneDrive** | Microsoft 365 file management |

## Setting Up an Integration

### Step 1: Navigate to Integrations

Go to **Settings → Integrations** in your workspace dashboard.

### Step 2: Connect Your Account

Click on the integration you want to set up and follow the OAuth flow:

```javascript
// Example: Configuring the Slack integration via API
const integration = await client.integrations.connect({
  provider: 'slack',
  config: {
    botToken: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    defaultChannel: '#workhall-notifications',
  },
});

console.log('Integration ID:', integration.id);
```

### Step 3: Configure Permissions

Select which permissions the integration needs:

- **Read** — Access data from the connected service
- **Write** — Create or modify data in the connected service
- **Admin** — Full access including configuration changes

### Step 4: Test the Connection

Click **"Test Connection"** to verify the integration is working:

```bash
# Test integration via CLI
workhall integrations test slack
# Output: ✅ Slack integration is connected and working
```

## Webhooks

Create custom webhooks to integrate with any service:

### Incoming Webhooks

Receive data from external services:

```bash
# Your unique webhook URL
POST https://api.workhall.com/webhooks/wh_abc123

# Send data to trigger a workflow
curl -X POST https://api.workhall.com/webhooks/wh_abc123 \
  -H "Content-Type: application/json" \
  -d '{"event": "order_placed", "orderId": "12345"}'
```

### Outgoing Webhooks

Send data to external services when events occur:

```javascript
// Configure an outgoing webhook
await client.webhooks.create({
  name: 'Order Notification',
  url: 'https://your-service.com/webhook',
  events: ['order.created', 'order.updated'],
  headers: {
    'X-Webhook-Secret': 'your-secret',
  },
});
```

## Custom Integrations

Build your own integrations using the Workhall SDK:

```javascript
const { IntegrationBuilder } = require('@workhall/sdk');

const myIntegration = new IntegrationBuilder({
  name: 'My Custom CRM',
  description: 'Sync contacts with our internal CRM',
  
  actions: {
    createContact: async (data) => {
      const response = await fetch('https://crm.example.com/api/contacts', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${data.apiKey}` },
        body: JSON.stringify(data.contact),
      });
      return response.json();
    },
    
    updateContact: async (data) => {
      const response = await fetch(`https://crm.example.com/api/contacts/${data.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${data.apiKey}` },
        body: JSON.stringify(data.updates),
      });
      return response.json();
    },
  },
  
  triggers: {
    onContactCreated: {
      type: 'webhook',
      description: 'Fires when a new contact is added to the CRM',
    },
  },
});

module.exports = myIntegration;
```

:::info Rate Limits
Each integration has rate limits to prevent abuse. Default limits are 1,000 requests per minute for most integrations. Enterprise plans have higher limits — contact sales for details.
:::
