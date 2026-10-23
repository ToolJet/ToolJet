---
id: personal-access-tokens
title: Personal Access Tokens
---

A personal access token (PAT) lets a tool act on your behalf in one ToolJet workspace without your password. ToolJet uses workspace personal access tokens for:

- The [ToolJet CLI](/docs/app-builder/custom-component-library/setup), which signs in with a token to create and publish custom component libraries.
- [ToolJet MCP](/docs/build-with-ai/mcp/overview), which lets an AI coding agent build apps, work with data, run workflows, and manage users in your workspace.
- [ToolJet AI](/docs/build-with-ai/generate-applications), which creates a token for itself while it builds apps for you. See [AI App Builder Token](#ai-app-builder-token).

Each token belongs to the user who created it and is bound to a single workspace. A token never has more access than its owner: every request runs with the owner's role and permissions in that workspace, and a fixed allowlist narrows that further. See [What a Token Can Access](#what-a-token-can-access).

:::info Availability
Workspace personal access tokens are available on ToolJet Enterprise Edition and ToolJet Cloud. They are not available on the Community Edition, where the **Personal access tokens** card doesn't appear in **Profile settings**.
:::

<!-- TODO verify: whether a PlanBadge should be added. The code has no license or plan gate on tokens, only an edition check (EE and Cloud). -->

:::note
These tokens are different from the app-scoped tokens used to [embed private apps](/docs/user-management/authentication/self-hosted/pat), which your backend generates through `/api/ext/users/personal-access-token`.
:::

## Who Can Create a Token

Only **Admins** and **Builders** can create a token, and the role is checked in the workspace you pick for the token, not only in your current workspace. If you choose a workspace where you are an end user, creation fails with `Only admins and builders can create personal access tokens in this workspace`.

The role check happens only when the token is created. After that, the token acts with your current permissions in the workspace. If you stop being an active member of the workspace, the token stops working.

## Create a Token

1. Open **Profile settings**. See [Profile Settings](/docs/user-management/profile-management/user-profile).
2. Find the **Personal access tokens** card and click **Create new token**. The button is disabled if your role in the current workspace isn't Admin or Builder.

   <img className="screenshot-full img-full" src="/img/user-management/profile-management/personal-access-tokens/tokens-list.png" alt="Personal access tokens card listing the macbook-cli and github-actions-deploy tokens with their workspace and last-used status" />

3. In the **Create personal access token** dialog, fill in the fields:

   | Field | Description |
   |:------|:------------|
   | **Token name** | A name you will recognize later, for example `macbook-cli`. Required. Names don't need to be unique. |
   | **Workspace** | The workspace the token can act on. Defaults to your current workspace and lists every workspace where you are an active member. |
   | **Expiration** | The date the token expires. Required. The earliest date you can pick is tomorrow. |

   <img className="screenshot-full img-m" src="/img/user-management/profile-management/personal-access-tokens/create-token-modal.png" alt="Create personal access token dialog with Token name, Workspace and Expiration filled in" />

4. Click **Create token**.

The **Token created** screen shows two values, each with a copy button:

- **Token**: The token itself. It starts with `tj_pat_`.
- **Workspace ID**: The ID of the workspace the token is bound to.

:::warning Copy the token now
ToolJet shows the token only once and stores only a hash of it. If you lose it, revoke it and create a new one.
:::

## Expiration and Sessions

Every token has an expiration date. ToolJet won't create a token without an expiration date in the future, so you can't create a token that never expires, from the UI or the API. After the expiration date, the token shows an **Expired** label in the token list and calls with it fail with `Personal access token expired`.
<!-- TODO verify: the date is sent as YYYY-MM-DD and parsed as midnight UTC, so a token likely expires at the start of the chosen date rather than at the end of it. -->

A tool exchanges the token for a session (see [Use a Token with the API](#use-a-token-with-the-api)). A session:

- Is bound to the token's workspace and can't reach any other workspace.
- Expires after 10 days without activity. Each request extends it by another 10 days.
- Never lasts beyond the token's expiration date.

When a session expires, the tool exchanges the token again for a new one.

## Manage and Revoke Tokens

The **Personal access tokens** card lists your tokens with these columns:

- **Name**
- **Workspace**
- **Last used**: When the token was last used, or **Never used**. Expired tokens show an **Expired** label instead.

The list shows only your own tokens. To revoke a token:

1. Click **Revoke** on the token's row.
2. In the **Revoke token?** dialog, click **Revoke token**.

Revoking takes effect immediately and can't be undone. Every session created from the token ends, so any CLI, CI pipeline, or AI agent using it stops working on its next request. To restore access, create a new token and update wherever the old one was used.

## What a Token Can Access

A session created from a workspace token can reach only the areas below, and only to the extent its owner's role and permissions allow. Plan and license checks still apply, so a token can't use a feature your plan doesn't include.

| Area | What a token can do |
|:-----|:--------------------|
| **Apps** | Create, edit, and delete apps and modules; manage versions, app history, app permissions, and app Git operations; manage folders; import and export; use templates; manage comments and files; manage workspace themes. |
| **Data** | Create, edit, and run queries and organize them in query folders; work with data sources and environments; use ToolJet Database; read the specs of installed plugins. |
| **Workflows** | Create and run workflows; read execution status, nodes, and results; manage workflow schedules. |
| **Workspace users** | List, invite, update, archive, and unarchive users, and manage custom groups. See [Users and Groups](#users-and-groups). |

### Users and Groups

For **users**, a token can:

- List the workspace's users.
- Invite a user.
- Update a user's first name, last name, role, groups (add the user to groups), and metadata.
- Archive and unarchive a user. These always apply to the token's workspace.

For **groups**, a token can:

- List groups, view a group, and list its members.
- Create, rename and update, duplicate, and delete [custom groups](/docs/user-management/role-based-access/custom-groups). Default groups can't be deleted.
- Remove a member from a group.
- View and manage granular permissions for apps and data sources, including listing the apps and data sources that can be added.

A token can't:

- Upload users in bulk from a CSV file.
- Add members to a group from the group itself. To add a user to groups, update the user instead.
- Use the separate role-change endpoint (`PUT /api/v2/group-permissions/role/user`). To change a user's role, update the user instead.

### What a Token Can Never Access

Everything outside the areas above is denied, including:

- Workspace settings, such as workspace details, workspace constants and secrets, workspace variables, custom styles, custom domains, white labelling, login and SSO configuration, Git sync configuration, and SMTP.
- Instance-level settings, licensing, SCIM, audit logs, metrics, and plugin installation.
- ToolJet AI, because its endpoints consume AI credits.
- Personal access tokens, sessions, authentication, and profile settings. A token can't create, list, or revoke tokens.
- Custom component library management through a session. The ToolJet CLI authenticates these commands with the token directly; see [Set Up the CLI](/docs/app-builder/custom-component-library/setup).

A request outside the allowlist fails with `403 Forbidden` and a message like this:

```text
This personal access token cannot access <feature>. Workspace tokens are limited to: apps, data, workflows, workspace_users.
```

## AI App Builder Token

When ToolJet AI builds an app for you, it creates a token named **AI app builder** in your token list for that workspace. ToolJet AI uses it so that the apps, queries, and tables it creates are attributed to you, and it has the same access limits as any other workspace token.

- ToolJet never shows or stores the raw value of this token, so it can't be copied or used elsewhere.
- One token is reused for each user and workspace. Each build extends its expiration to 30 days from the build.
- You can revoke it like any other token. ToolJet AI creates it again on your next build.
- If you aren't an Admin or Builder in the workspace, ToolJet AI doesn't create the token and keeps building without per-user attribution.

## Use a Token with the API

Tools such as the CLI and the MCP server use the token in two ways. You need this only if you are building your own integration.

### Validate a Token

Send the token as a bearer token to check that it is valid:

```bash
curl https://tooljet.example.com/api/personal-access-tokens/validate \
  --header 'Authorization: Bearer tj_pat_XXXX'
```

<details id="tj-dropdown">
<summary>Example Response</summary>

```json
{
  "email": "jane@example.com",
  "organizationId": "8ba8bf0e-6b8f-4e07-abb9-6fd2d816fabc"
}
```

</details>

### Exchange a Token for a Session

To call ToolJet's internal APIs, exchange the token for a session:

```bash
curl --request POST https://tooljet.example.com/api/personal-access-tokens/session \
  --header 'Authorization: Bearer tj_pat_XXXX'
```

<details id="tj-dropdown">
<summary>Example Response</summary>

```json
{
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "organizationId": "8ba8bf0e-6b8f-4e07-abb9-6fd2d816fabc",
  "organizationSlug": "my-workspace",
  "organizationName": "My Workspace",
  "expiresAt": "2026-11-02T10:15:30.000Z"
}
```

</details>

| Field | Description |
|:------|:------------|
| `authToken` | The session token. |
| `organizationId`, `organizationSlug`, `organizationName` | The workspace the session is bound to. |
| `expiresAt` | When the session expires if unused. This is the session's expiry, not the token's. |

Send `authToken` with each request as a `tj_auth_token` header or a `tj_auth_token` cookie. You don't need a `tj-workspace-id` header, because the session is bound to the token's workspace.

```bash
curl https://tooljet.example.com/api/apps \
  --header 'tj_auth_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### Open a Read-Only Session for One App

To let a headless browser open and render a single app, add the app's ID to the exchange request. The session it returns is read-only and pinned to that app. ToolJet MCP uses this to check that an app it built renders correctly before handing it back to you.
<!-- TODO verify: that the MCP verify_page_render tool obtains its browser session through this appId exchange. The source PR (#17878) describes the use as "the AI builder's render check". -->

Like all workspace tokens, this is available on ToolJet Enterprise Edition and ToolJet Cloud. This session isn't meant for showing apps to end users. To embed an app for your users, see [Personal Access Token for private app embedding](/docs/user-management/authentication/self-hosted/pat).

```bash
curl --request POST https://tooljet.example.com/api/personal-access-tokens/session \
  --header 'Authorization: Bearer tj_pat_XXXX' \
  --header 'Content-Type: application/json' \
  --data '{ "appId": "8ba8bf0e-6b8f-4e07-abb9-6fd2d816fabc" }'
```

| Field | Type | Description |
|:------|:-----|:------------|
| `appId` | string (UUID) | Optional. The ID of an app in the token's workspace. Omit it to get a regular workspace session. |

The response has the same fields as a regular session, and you send `authToken` the same way, as a `tj_auth_token` header or cookie. The session expires on the same schedule as a regular session.

An app session has these limits:

- **Read-only**: It can only send `GET` requests. The one exception is running the app's queries.
- **One app**: Any request for a different app fails.
- **Only what rendering needs**: It can read the app and the version being opened, its environments, its queries and query folders, the workspace's data sources, custom styles, themes and files, and the workspace constants the app loads. It can't list the workspace's apps.
- **No secrets**: Secret constants are returned masked, and `GET /api/organization-constants/decrypted` is denied.
- **Never wider than the token**: Naming an app never gives the session more access than the same token has without an `appId`.

:::caution
The queries an app session runs execute against the real data sources configured for the app. A query that writes data still writes data, even though the session itself is read-only.
:::

Only front-end apps can be opened this way. Workflows and modules can't.

| Status | Message | Cause |
|:-------|:--------|:------|
| `400 Bad Request` | `appId must be a UUID` | `appId` isn't a valid UUID. |
| `404 Not Found` | `App not found in this workspace` | The app doesn't exist, belongs to another workspace, or is a workflow or module. |
| `403 Forbidden` | `This session is read-only. App-scoped render sessions may only issue GET requests.` | The session sent a request other than `GET` that isn't a query run. |
| `403 Forbidden` | `This session is scoped to a single app and cannot access <app ID>.` | The request targets a different app. |
| `403 Forbidden` | `This app-scoped session cannot access <feature>. Render sessions are limited to: Auth, APP, appEnvironments, OrganizationConstant, DataQueries, DATA_SOURCE, CustomStyles, VERSION, organizationThemes, file, DataQueryFolders.` | The request is outside what an app session can reach. |

### Errors

Both endpoints return `401 Unauthorized` with one of these messages when the token can't be used:

| Message | Cause |
|:--------|:------|
| `Missing Authorization header` | The request has no `Authorization` header. |
| `Invalid personal access token` | The header doesn't use the `Bearer` scheme, the token doesn't start with `tj_pat_`, or the token doesn't exist or was revoked. |
| `Personal access token expired` | The token's expiration date has passed. |

Exchanging a token for a session can also fail with `401 Unauthorized` and one of these messages:

| Message | Cause |
|:--------|:------|
| `Token owner no longer exists` | The user who created the token has been deleted. |
| `Token owner is no longer an active member of this workspace` | The token's owner was archived or removed from the workspace. |
| `Workspace not found` | The token's workspace no longer exists. |

Requests made with a session return `401 Unauthorized` once the token is revoked or expires, or the session expires. Requests outside the allowlist return `403 Forbidden`, as described in [What a Token Can Access](#what-a-token-can-access). For the errors specific to app sessions, see [Open a Read-Only Session for One App](#open-a-read-only-session-for-one-app).
