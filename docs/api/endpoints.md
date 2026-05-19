---
sidebar_position: 2
title: API Endpoints
description: Complete reference for all Workhall REST API endpoints — workflows, tasks, users, and integrations.
---

# API Endpoints

This page documents all available REST API endpoints in the Workhall platform.

## Workflows

### List Workflows

```http
GET /v1/workflows
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Number of results (default: 20, max: 100) |
| `cursor` | string | Pagination cursor |
| `status` | string | Filter by status: `active`, `draft`, `paused` |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "wf_abc123",
      "name": "Employee Onboarding",
      "status": "active",
      "triggerType": "form_submission",
      "executionCount": 342,
      "lastExecutedAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Workflow

```http
POST /v1/workflows
```

**Request Body:**

```json
{
  "name": "Order Processing",
  "description": "Automates order fulfillment pipeline",
  "trigger": {
    "type": "webhook",
    "config": {
      "method": "POST",
      "headers": { "X-Verify": "true" }
    }
  },
  "actions": [
    {
      "type": "send_email",
      "config": {
        "to": "{{trigger.data.email}}",
        "template": "order_confirmation"
      }
    }
  ]
}
```

### Get Workflow

```http
GET /v1/workflows/:id
```

### Update Workflow

```http
PATCH /v1/workflows/:id
```

### Delete Workflow

```http
DELETE /v1/workflows/:id
```

### Execute Workflow

```http
POST /v1/workflows/:id/execute
```

**Request Body:**

```json
{
  "data": {
    "orderId": "ord_12345",
    "customerEmail": "customer@example.com"
  }
}
```

## Tasks

### List Tasks

```http
GET /v1/tasks
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `assignee` | string | Filter by assignee user ID |
| `status` | string | `pending`, `in_progress`, `completed`, `cancelled` |
| `priority` | string | `low`, `medium`, `high`, `urgent` |
| `dueDate` | string | ISO 8601 date filter |

### Create Task

```http
POST /v1/tasks
```

```json
{
  "title": "Review Q4 Report",
  "description": "Review and approve the quarterly financial report",
  "assignee": "user_abc123",
  "priority": "high",
  "dueDate": "2024-02-01T17:00:00Z",
  "tags": ["finance", "quarterly"],
  "attachments": []
}
```

### Update Task

```http
PATCH /v1/tasks/:id
```

### Delete Task

```http
DELETE /v1/tasks/:id
```

## Users

### List Users

```http
GET /v1/users
```

### Get Current User

```http
GET /v1/users/me
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user_abc123",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "admin",
    "avatar": "https://cdn.workhall.com/avatars/john.jpg",
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLoginAt": "2024-01-15T10:30:00Z"
  }
}
```

### Invite User

```http
POST /v1/users/invite
```

```json
{
  "email": "newuser@example.com",
  "role": "member",
  "teams": ["team_dev", "team_design"]
}
```

### Update User Role

```http
PATCH /v1/users/:id/role
```

### Remove User

```http
DELETE /v1/users/:id
```

## Integrations

### List Integrations

```http
GET /v1/integrations
```

### Connect Integration

```http
POST /v1/integrations
```

```json
{
  "provider": "slack",
  "config": {
    "botToken": "xoxb-your-bot-token",
    "defaultChannel": "#notifications"
  }
}
```

### Disconnect Integration

```http
DELETE /v1/integrations/:id
```

### Test Integration

```http
POST /v1/integrations/:id/test
```

## Webhooks

### List Webhooks

```http
GET /v1/webhooks
```

### Create Webhook

```http
POST /v1/webhooks
```

```json
{
  "name": "Order Events",
  "url": "https://your-app.com/webhook",
  "events": ["order.created", "order.updated", "order.cancelled"],
  "secret": "whsec_your_webhook_secret"
}
```

### Delete Webhook

```http
DELETE /v1/webhooks/:id
```

## Dashboards

### List Dashboards

```http
GET /v1/dashboards
```

### Create Dashboard

```http
POST /v1/dashboards
```

```json
{
  "name": "Sales Overview",
  "widgets": [
    {
      "type": "chart",
      "config": {
        "chartType": "line",
        "dataSource": "workflows",
        "metric": "executionCount",
        "groupBy": "day",
        "timeRange": "30d"
      }
    },
    {
      "type": "metric",
      "config": {
        "label": "Active Workflows",
        "dataSource": "workflows",
        "filter": { "status": "active" },
        "aggregation": "count"
      }
    }
  ]
}
```

:::info Need Help?
If you encounter issues with any endpoint, check the [API Overview](/docs/api/overview) for authentication and error handling details, or reach out to our support team.
:::
