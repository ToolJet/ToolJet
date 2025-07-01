---
id: ssouserinfo
title: Access SSO User Info
---

In ToolJet, you can now pass user-specific authentication details from the SSO provider to connected datasources. This allows each user to access systems like Snowflake, Salesforce, GraphQL, and more using their own credentials, eliminating the need for shared logins. It ensures that enterprise security policies such as role-based access and row-level restrictions are enforced based on the user’s identity.

## Accessing SSO User Info in App Builder

ToolJet exposes a global variable called `ssoUserInfo` within the App Builder, which contains user-specific authentication details from the active SSO session. This allows you to securely pass identity information, such as tokens and user identifiers into queries and logic within your app.

You can reference `ssoUserInfo` directly in queries or components to dynamically control access, personalize content, or forward authentication tokens to connected datasources that support OAuth 2.0 or OIDC.

Use the following syntax to refer to any exposed variable from `ssoUserInfo`:

```js
{{globals.currentUser.ssoUserInfo.<variable-name>}}
```

### Commonly Exposed SSO Variables

The exposed variables may vary depending on the identity provider. You can view all available variables in the Inspector panel under `globals` > `currentUser` > `ssoUserInfo`. Below are some commonly exposed variables:

| Variable | Description |
|:----------|:-------------|
| `sub` | Unique identifier for the user assigned by the identity provider. |
| `name` | Full name of the authenticated user. |
| `given_name` | User’s first name or given name. |
| `family_name` | User’s last name or family name. |
| `picture` | URL of the user’s profile picture. |
| `email` | Email address associated with the user’s SSO identity. |
| `email_verified` | Boolean flag indicating whether the email address has been verified. |
| `hd` | Hosted domain or organization the user belongs to. |
| `access_token` | OAuth 2.0 access token for the current user session, used to authenticate requests to connected datasources. |
| `id_token` | Encoded ID token containing user identity claims in JWT format. |
| `id_token_decrypted` | Decrypted contents of the ID token, useful for accessing detailed user claims. |