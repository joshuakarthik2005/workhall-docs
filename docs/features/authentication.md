---
sidebar_position: 1
title: Authentication
description: Learn how Workhall handles user authentication, SSO, OAuth, and role-based access control.
---

# Authentication

Workhall provides a robust authentication system that supports multiple sign-in methods, single sign-on (SSO), and fine-grained role-based access control (RBAC).

## Authentication Methods

### Email & Password

The default authentication method. Users sign up with an email and password, with optional two-factor authentication (2FA).

```javascript
// Example: Authenticating via the Workhall SDK
const workhall = require('@workhall/sdk');

const client = workhall.createClient({
  apiKey: process.env.WORKHALL_API_KEY,
});

// Sign in a user
const session = await client.auth.signIn({
  email: 'user@example.com',
  password: 'securePassword123',
});

console.log('Session token:', session.token);
```

### OAuth 2.0 Providers

Workhall supports OAuth 2.0 login with the following providers:

- **Google** — Sign in with Google Workspace accounts
- **Microsoft** — Azure AD and Microsoft 365 integration
- **GitHub** — For developer-focused teams
- **Slack** — Sign in using your Slack workspace identity

### SAML SSO (Enterprise)

For enterprise customers, Workhall supports SAML 2.0 single sign-on:

1. Navigate to **Settings → Security → SSO**
2. Upload your Identity Provider (IdP) metadata XML
3. Configure the Assertion Consumer Service (ACS) URL
4. Map SAML attributes to Workhall user fields

```xml
<!-- Example SAML Configuration -->
<SAMLConfiguration>
  <EntityID>https://workhall.com/saml/metadata</EntityID>
  <ACSUrl>https://workhall.com/saml/callback</ACSUrl>
  <SignOnUrl>https://idp.example.com/sso/saml</SignOnUrl>
</SAMLConfiguration>
```

## Role-Based Access Control (RBAC)

Workhall uses a hierarchical role system:

| Role | Permissions |
|------|------------|
| **Owner** | Full access, billing, workspace deletion |
| **Admin** | Manage members, configure integrations, create workflows |
| **Manager** | Create and edit workflows, manage team projects |
| **Member** | Use workflows, view dashboards, collaborate on tasks |
| **Guest** | View-only access to shared resources |

### Custom Roles

You can create custom roles with granular permissions:

```javascript
// Create a custom role via API
const role = await client.roles.create({
  name: 'Workflow Editor',
  permissions: [
    'workflows.create',
    'workflows.edit',
    'workflows.publish',
    'dashboards.view',
    'tasks.manage',
  ],
});
```

## Two-Factor Authentication (2FA)

Workhall supports TOTP-based two-factor authentication:

1. Go to **Profile → Security → Enable 2FA**
2. Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.)
3. Enter the verification code to confirm setup
4. Save the backup recovery codes in a secure location

:::warning Important
Store your recovery codes securely. If you lose access to your authenticator app and don't have recovery codes, you'll need to contact your workspace admin to reset 2FA.
:::

## Session Management

- Sessions expire after **24 hours** of inactivity by default
- Admins can configure custom session durations in **Settings → Security**
- Active sessions can be viewed and revoked from **Profile → Active Sessions**
- API tokens have configurable expiration dates

## API Key Authentication

For programmatic access, use API keys:

```bash
# Authenticate API requests with an API key
curl -H "Authorization: Bearer wh_live_abc123def456" \
  https://api.workhall.com/v1/workflows
```

See the [API Overview](/docs/api/overview) for more details on API authentication.
