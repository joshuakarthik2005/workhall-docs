---
sidebar_position: 2
title: Workflows
description: Build powerful automated workflows with Workhall's visual builder, triggers, actions, and conditions.
---

# Workflows

Workflows are the heart of Workhall. They let you automate business processes using a visual drag-and-drop builder — no coding required.

## Workflow Concepts

### Triggers

Triggers define **when** a workflow starts. Available trigger types:

- **Form Submission** — Runs when a form is submitted
- **Schedule** — Runs on a cron schedule (e.g., every Monday at 9 AM)
- **Webhook** — Runs when an external HTTP request is received
- **Record Change** — Runs when data in a table is created, updated, or deleted
- **Manual** — Triggered by a user clicking a button

### Actions

Actions define **what** happens in a workflow:

- **Send Email** — Send templated emails to users or external addresses
- **Create Record** — Insert data into any Workhall table
- **Update Record** — Modify existing records based on conditions
- **HTTP Request** — Call external APIs and webhooks
- **Send Notification** — Push notifications to team members
- **Run Script** — Execute custom JavaScript logic
- **Assign Task** — Create and assign tasks to team members

### Conditions

Conditions add **branching logic** to workflows:

```javascript
// Example: Conditional workflow logic
if (trigger.data.priority === 'high') {
  // Route to the senior team
  await actions.assignTask({
    assignee: 'senior-team',
    priority: 'urgent',
  });
} else {
  // Standard processing
  await actions.assignTask({
    assignee: 'general-queue',
    priority: 'normal',
  });
}
```

## Building Your First Workflow

### Step 1: Create a New Workflow

1. Navigate to **Workflows** in the sidebar
2. Click **"+ New Workflow"**
3. Give your workflow a name and description

### Step 2: Add a Trigger

Drag a trigger from the palette onto the canvas. For example, select **"Form Submission"** and configure it:

- **Form**: Select which form triggers this workflow
- **Conditions**: Optionally filter which submissions activate it

### Step 3: Add Actions

Connect actions to your trigger:

1. Drag an **"Send Email"** action onto the canvas
2. Connect it to the trigger by drawing a line
3. Configure the email template, recipients, and subject line

### Step 4: Test and Publish

1. Click **"Test"** to run the workflow with sample data
2. Review the execution log to verify each step
3. Click **"Publish"** to make the workflow live

## Advanced Features

### Parallel Execution

Run multiple actions simultaneously by connecting multiple actions to the same node:

```
Trigger → [Action A] → Continue
       ↘ [Action B] → Continue
       ↘ [Action C] → Continue
```

### Error Handling

Configure retry policies and fallback actions:

```javascript
// Workflow error handling configuration
{
  "retryPolicy": {
    "maxRetries": 3,
    "backoffMultiplier": 2,
    "initialDelay": "1s"
  },
  "onFailure": {
    "action": "notify",
    "target": "admin@company.com"
  }
}
```

### Workflow Variables

Store and reference data across workflow steps:

```javascript
// Set a variable in one step
workflow.setVariable('approvalStatus', 'approved');

// Use it in a later step
const status = workflow.getVariable('approvalStatus');
if (status === 'approved') {
  await actions.sendEmail({ template: 'approval-confirmed' });
}
```

### Scheduled Workflows

Create workflows that run on a schedule:

| Schedule | Cron Expression | Description |
|----------|----------------|-------------|
| Every hour | `0 * * * *` | Runs at the top of every hour |
| Daily at 9 AM | `0 9 * * *` | Runs once daily at 9:00 AM |
| Weekly on Monday | `0 9 * * 1` | Runs every Monday at 9:00 AM |
| Monthly on the 1st | `0 0 1 * *` | Runs on the first of each month |

## Workflow Templates

Workhall provides pre-built templates for common use cases:

1. **Employee Onboarding** — Automated task assignment for new hires
2. **Expense Approval** — Multi-level approval with notifications
3. **Customer Feedback** — Collect, categorize, and route feedback
4. **Incident Response** — Escalation and notification workflows
5. **Content Publishing** — Review, approve, and publish content

:::tip Performance Tip
For high-volume workflows, enable **batch processing** to group executions and reduce API calls. Configure this in **Workflow Settings → Performance**.
:::
