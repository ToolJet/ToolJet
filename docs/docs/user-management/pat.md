---
id: pat
title: Personal Access Token for Embedded Apps
---

You can seamlessly embed your ToolJet applications inside customer portals, internal dashboards, and third-party systems, without requiring full user authentication flows.

With Personal Access Tokens (PATs), ToolJet enables secure, scoped, and session-isolated access to embedded applications. Each token is tied to a specific user and application, allowing you to control exactly who can access what, and for how long, all without interfering with your main ToolJet session.

**Key Benefits**
- **Embed without friction**: Load applications inside iframes instantly, no login prompts or redirects.
- **Scoped access**: Tokens are application and user-specific, ensuring proper scoped access.
- **Session isolation**: Embedded sessions don’t interfere with regular ToolJet usage.
- **Expiration control**: Define how long each token and session should stay valid.
- **Workspace-level compatibility**: Extend PAT usage across workspace when needed.

**Ideal For**
- SaaS platforms embedding ToolJet apps for customer use.
- Internal teams integrating apps into CRMs or analytics tools.
- Administrators who need fine-grained, time-bound access control.

## Generate PAT

To create a Personal Access Token for a specific app-user combination, you can use the following endpoint:

```swift
POST /api/ext/users/personal-access-token
```
**Required Parameters**

| Field           | Type   | Description                              |
|:--------------- |:------ |:---------------------------------------- |
| `email`         | string | Email of the user                        |
| `appId`         | string | App ID to which the PAT should be scoped |
| `sessionExpiry` | number | Session duration in minutes              |
| `patExpiry`     | number | Token validity in seconds                |

**cURL Request Example**

```js
curl --location 'http://localhost:3000/api/ext/users/personal-access-token' \
--header 'Authorization: Basic <your_token>' \
--header 'Content-Type: application/json' \
--data-raw '{
  "email": "a1@tooljet.com",
  "appId": "8ba8bf0e-6b8f-4e07-abb9-6fd2d816fabc",
  "sessionExpiry": 60,
  "patExpiry": 1000000
}'
```

<details id="tj-dropdown">
<summary>Example Response</summary>
```js
{
  "personalAccessToken": "pat_469ed9...1a8b597",
  "redirectUrl": "http://localhost:8082/embed-apps/8ba8bf0e...?personal-access-token=pat_469ed9..."
}
```
</details>

## Embed the App

Use the returned **redirectUrl** inside an `<iframe>` tag:

```js
<iframe src="https://your-domain.com/embed-apps/:appId?personal-access-token=pat_XXXX" />
```

Upon visiting this URL:
- PAT is validated
- An isolated session is created
- The app loads inside the iframe

## Security Scope

| Scope                   | Behavior                                                                       |
|:----------------------- |:------------------------------------------------------------------------------ |
| **App+User Scoped**     | Token only works for specified app and user.                                   |
| **Single Active Token** | One PAT per app-user pair.                                                     |
| **No Cross Workspace**  | Tokens become invalid if app moves to a different workspace.                   |
| **JWT Strategy**        | All tokens are validated against expiry, scope, and permissions before access. |

## Error Handling

| Status                  | Scenario                                 |
|:----------------------- |:---------------------------------------- |
| `404 Not Found`         | User does not exist                      |
| `403 Forbidden`         | User doesn’t have access to the app      |
| `400 Bad Request`       | Invalid payload                          |
| `429 Too Many Requests` | >10 requests per minute for PAT creation |
| `401 Unauthorized`      | Invalid or expired PAT on app access     |
