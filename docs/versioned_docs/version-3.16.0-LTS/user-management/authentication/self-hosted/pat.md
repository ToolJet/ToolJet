---
id: pat
title: Personal Access Token
---

<PlanBadge type="enterprise" />
<PlanBadge type="self-hosted" />

You can seamlessly and securely embed your ToolJet applications inside customer portals, internal dashboards, and third-party systems, without requiring full user authentication flows.

With Personal Access Tokens (PATs), ToolJet enables secure, scoped, and session-isolated access to embedded applications. Each token is tied to a specific user and application, allowing you to control exactly who can access what, and for how long, all without interfering with your main ToolJet session.

## Key Benefits
- **Embed without friction**: Load applications inside iframes instantly, no login prompts or redirects.
- **Scoped access**: Tokens are application and user-specific, ensuring proper scoped access.
- **Session isolation**: Embedded sessions don’t interfere with regular ToolJet usage.
- **Expiration control**: Define how long each token and session should stay valid.
- **Workspace-level compatibility**: Extend PAT usage across workspace when needed.

## When to Use PAT

Use Personal Access Tokens when you want to:
- Embed ToolJet apps into customer-facing portals without requiring login.
- Integrate ToolJet apps into third-party systems, CRMs, or internal dashboards.
- Deliver multi-tenant SaaS interfaces with strict access control per user.
- Build secure public dashboards with time-bound, scoped access.
- Maintain session isolation between embedded apps and primary ToolJet usage.

## Generate PAT

To create a Personal Access Token for a specific app–user combination, you can use the following endpoint through an API client such as Postman, cURL, or any other API testing tool.

```swift
POST /api/ext/users/personal-access-token
```
**Request Body Parameters**

| Field           | Type    | Required                       | Description |
|:--------------- |:------- |:------------------------------ |:----------- |
| `email`         | string  | Either `email` or `userId`     | Email of the ToolJet user the token is for. |
| `userId`        | string  | Either `email` or `userId`     | ID (UUID) of the ToolJet user. If you send both, `userId` is used. |
| `appId`         | string  | Either `appId` or `appSlug`    | ID (UUID) of the app to scope the token to. |
| `appSlug`       | string  | Either `appId` or `appSlug`    | Slug of the app to scope the token to. If you send both, `appId` is used. |
| `sessionExpiry` | integer | No                             | How long the embedded session stays valid, in minutes. Minimum `1`. |
| `patExpiry`     | integer | No                             | How long the token stays valid, in minutes. Minimum `1`. |

:::info
When you omit `patExpiry` or `sessionExpiry`, ToolJet uses the `PAT_EXPIRY` and `PAT_SESSION_EXPIRY` environment variables. Both are set in **days** and default to `10`.
:::

**cURL Request Example**

```js
curl --location 'http://localhost:3000/api/ext/users/personal-access-token' \
--header 'Authorization: Basic <your_token>' \
--header 'Content-Type: application/json' \
--data-raw '{
  "email": "a1@tooljet.com",
  "appId": "8ba8bf0e-6b8f-4e07-abb9-6fd2d816fabc",
  "sessionExpiry": 60,
  "patExpiry": 1440
}'
```

<details id="tj-dropdown">
<summary>Example Response</summary>
```js
{
  "personalAccessToken": "pat_XXXX",
  "redirectUrl": "http://your-domain.com/embed-apps/:appId?personal-access-token=pat_XXXX&appSlug=:appSlug"
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
| **No Cross Workspace**  | Tokens become invalid if app moves to a different workspace.                   |
| **JWT Strategy**        | All tokens are validated against expiry, scope, and permissions before access. |

## Error Handling

| Status                  | Scenario                                 |
|:----------------------- |:---------------------------------------- |
| `404 Not Found`         | User does not exist                      |
| `403 Forbidden`         | The external API is disabled (`ENABLE_EXTERNAL_API`), the license doesn't include it, or the `Authorization` header is missing or wrong |
| `400 Bad Request`       | Invalid payload, neither `email` nor `userId` sent, or no app matches `appId` / `appSlug` |
| `403 Forbidden`         | Invalid or expired PAT when the embed URL is opened |

## Best Practices

To use PATs securely and effectively:
- Set short expiration durations for public or high-risk apps.
- Use HTTPS and proper security headers (like Content-Security-Policy) when embedding apps.
- Regenerate tokens if user roles or app permissions change.
- Avoid storing PATs in local storage or cookies, ToolJet uses in-memory storage for better isolation.
- The endpoint doesn't check whether the user can access the app. Check this in your backend before generating a PAT.
- Log and monitor PAT usage and expiry events in production environments.
- Apply per-PAT rate limiting to reduce abuse potential.
- Only expose the token once, tokens are returned in plaintext only during creation.
