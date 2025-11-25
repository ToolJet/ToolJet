---
id: pat-integration
title: Using PAT for Embedded Apps
---

ToolJet’s Personal Access Tokens (PATs) allow you to securely embed your applications inside portals, dashboards, or third-party systems without requiring your users to log in again.

This guide shows how to use PATs to create isolated, scoped sessions for embedded apps, so your users can interact with ToolJet apps seamlessly while your main application handles authentication.

Key Benefits
- Embed apps without login prompts or redirects.
- Scoped access for each app and user.
- Session isolation ensures embedded sessions don’t interfere with normal ToolJet usage.
- Token expiration control for secure access.

## Authentication Flow

The embedding workflow involves your web application and ToolJet backend:
1. User logs into your portal using your preferred authentication method.
2. Your backend generates a PAT scoped to that user and app.
3. Backend returns an embed URL containing the PAT.
4. Frontend renders the ToolJet app inside an iframe using the embed URL.

### Flow Diagram

```js
User → Your App → Backend → ToolJet API → Backend → Frontend → iframe → ToolJet App
```

- Your app authenticates the user.
- Backend requests a PAT from ToolJet.
- ToolJet returns a secure redirect URL.
- Frontend embeds the app in an iframe using this URL.

## Step 1 — Generate a PAT

Use ToolJet’s PAT endpoint to create a token for a specific app–user pair.

**Endpoint**
```js
POST /api/ext/users/personal-access-token
```

**Required Parameters**

| Field           | Type   | Description                        |
| --------------- | ------ | ---------------------------------- |
| `email`         | string | Email of the user                  |
| `appId`         | string | App ID for which the PAT is scoped |
| `sessionExpiry` | number | Session duration in minutes        |
| `patExpiry`     | number | Token validity in seconds          |

**cURL Example**

```bash
curl --location 'https://your-tooljet-domain.com/api/ext/users/personal-access-token' \
--header 'Authorization: Basic <your_token>' \
--header 'Content-Type: application/json' \
--data-raw '{
  "email": "user@example.com",
  "appId": "8ba8bf0e-6b8f-4e07-abb9-6fd2d816fabc",
  "sessionExpiry": 60,
  "patExpiry": 3600
}'
```

**Node.js/Express Example**

```js
import axios from 'axios';

const generatePAT = async (email, appId) => {
  const response = await axios.post(
    'https://your-tooljet-domain.com/api/ext/users/personal-access-token',
    {
      email,
      appId,
      sessionExpiry: 60,
      patExpiry: 3600
    },
    {
      headers: {
        'Authorization': 'Basic <your_token>',
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data.redirectUrl; // Embed URL containing PAT
};
```

## Step 2 — Create the Embed URL

The response from ToolJet contains a redirectUrl or PAT. Use this to form the URL for embedding:

```js
https://your-domain.com/embed-apps/:appId?personal-access-token=pat_XXXX
```

**How it works**

1. PAT is validated by ToolJet.
2. A session is created isolated from your main ToolJet session.
3. The embedded app loads inside the iframe.

## Step 3 — Render the App

**Basic iframe**

```js
<iframe 
  src="https://your-domain.com/embed-apps/8ba8bf0e-6b8f-4e07-abb9-6fd2d816fabc?personal-access-token=pat_XXXX" 
  width="100%" 
  height="600px">
</iframe>
```

**React Example**

```js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const EmbeddedApp = ({ userEmail, appId }) => {
  const [embedUrl, setEmbedUrl] = useState('');

  useEffect(() => {
    const fetchPAT = async () => {
      const response = await axios.post('/api/generate-pat', { email: userEmail, appId });
      setEmbedUrl(response.data.redirectUrl);
    };
    fetchPAT();
  }, [userEmail, appId]);

  return embedUrl ? (
    <iframe src={embedUrl} width="100%" height="600px" />
  ) : (
    <div>Loading...</div>
  );
};

export default EmbeddedApp;
```
:::note
Always generate PATs on the backend. Never expose your main ToolJet token in the frontend.
:::

## Security Considerations

- Backend-only generation: PATs should only be generated server-side.
- Scoped tokens: Each PAT is bound to a specific app and user.
- Session isolation: Embedded sessions don’t interfere with the user’s main ToolJet session.
- HTTPS & CSP: Always use HTTPS and configure Content-Security-Policy headers.
- Short expiration: Especially for public or high-risk apps.
- Regenerate on role changes: If user roles or app permissions change, regenerate PATs.

## Error Handling

| Status | Scenario                         |
| ------ | -------------------------------- |
| 400    | Invalid request payload          |
| 401    | Invalid or expired PAT           |
| 403    | User does not have access to app |
| 404    | User does not exist              |
| 429    | Too many PAT creation requests   |
