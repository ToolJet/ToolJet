---
id: marketplace-plugin-confluence
title: Confluence
---

ToolJet allows you to connect to Confluence Cloud to read and write pages, blog posts, spaces, comments, labels and attachments through the Confluence REST API v2.

:::info
**NOTE:** **Before following this guide, it is assumed that you have already completed the process of [Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

To connect to a Confluence data source in ToolJet, you can either click the **+ Add new data source** button on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page in the ToolJet dashboard.

Confluence authenticates through **OAuth 2.0 (3LO)**. Create an [OAuth 2.0 (3LO) app](https://developer.atlassian.com/cloud/confluence/oauth-2-3lo-apps/) in the Atlassian developer console and add the Confluence API to it. Then provide:

- **Client ID** and **Client secret** of the app
- **Scope(s)**: space-separated scopes — see [Scopes](#scopes) below

Copy the **Redirect URI** shown on the connection form and register it as the callback URL in your Atlassian app.

### Scopes

The field is prefilled with a starting point. **Edit it to match your Atlassian app before connecting** — the prefilled list is not guaranteed to work as-is.

Rules that govern what belongs here:

- **Every scope must also be granted to your Atlassian app** under **Permissions > Confluence API**. Asking for a scope the app does not have fails the consent screen with *"This app has requested Confluence API scopes that have not been added to the app"*.
- **Use granular v2 scopes** — the `read:page:confluence` style. Classic scopes (`read:confluence-content.all`, `read:confluence-user`, `search:confluence`) target the v1 API this plugin does not use, and Atlassian does not accept them alongside granular ones. `write:attachment:confluence` does not exist at all: v2 has no attachment-write endpoints.
- **`offline_access` is required for refresh tokens** and is appended automatically if you remove it. Without it the connection stops working when the access token expires.
- **Deletes need their own scopes.** `DELETE /pages/{id}`, `DELETE /footer-comments/{comment-id}` and similar require the matching `delete:*:confluence` scope, or they fail with 403.

A verified read/write set covering the common operations:

```
read:page:confluence write:page:confluence read:space:confluence write:space:confluence
read:comment:confluence write:comment:confluence read:attachment:confluence
read:custom-content:confluence write:custom-content:confluence
read:hierarchical-content:confluence read:task:confluence offline_access
```

Or, to start read-only:

```
read:page:confluence read:space:confluence read:comment:confluence offline_access
```

Trim to what your app actually does; a narrower scope set is a smaller consent screen and less access to hand out.

If you clear the field entirely, **Connect to Confluence** stops with *"Add at least one Confluence scope"* rather than opening the consent screen — `offline_access` alone grants no access to any API.

### Authorizing

The data source is authorized before it is saved:

1. Fill in **Client ID**, **Client secret** and **Scope(s)**.
2. Click **Connect to Confluence**. ToolJet opens the Atlassian consent screen in a new window.
3. Approve the requested scopes. The window returns to ToolJet and the button changes to **Save data source**.
4. Click **Save data source**. The authorization code is exchanged for tokens as part of the save, so the data source is only stored once the connection genuinely works.

There is no separate *Test connection* step for Confluence — connecting successfully is the test.

Turn on **Authentication required for all users** if each ToolJet user should authorize with their own Atlassian account; otherwise every query uses the account that connected here.

Expired access tokens are refreshed automatically when queries run. If the refresh token is revoked, the next query re-opens the consent screen.

:::info
OAuth tokens are not tied to one site. Queries therefore need a **Site** selected in the query editor — see [Selecting a site](#selecting-a-site).
:::

## Querying Confluence

1. Click the **+ Add** button in the query manager at the bottom of the editor and select the Confluence data source added earlier.
2. Pick an **Operation** — the searchable list contains every endpoint of the [Confluence REST API v2](https://developer.atlassian.com/cloud/confluence/rest/v2/intro/), with its HTTP method and summary.
3. Fill in the path, query and body parameters the endpoint declares.

:::tip
Query results can be transformed using transformations. Refer to our transformations documentation for more details: **[link](/docs/tutorial/transformations)**.
:::

The plugin covers the v2 API: pages, blog posts, spaces, comments, labels, attachments, custom content, tasks, versions and content properties. Endpoints that exist only in the older v1 API — CQL search, user lookup, attachment upload and content restrictions — are not available; use a **[REST API](/docs/data-sources/restapi)** data source for those.

### Selecting a site

Click **Get sites** in the query editor and choose the Confluence site to query. The selector lists every site the authorization covers and stores its Atlassian cloud id with the query.

Every query needs a site: requests are addressed as `https://api.atlassian.com/ex/confluence/{cloudId}/...`, because an OAuth token is issued to an Atlassian account rather than to one site. **Get sites** only works after the data source has been authorized.

### Filling in body fields

Some body fields are objects rather than plain values — a page's `body` and `version`, a space's `description`. They appear as ordinary text inputs, so type JSON into them:

```json
{ "representation": "storage", "value": "<p>Hello from ToolJet</p>" }
```

The plugin reads the endpoint's schema and converts those fields into real JSON objects before sending. Fields the spec declares as strings, such as `title`, are left exactly as typed, so a title containing braces survives intact. A `{{ }}` expression that already evaluates to an object also works.

Sending such a field as a raw string is what produces `INVALID_MESSAGE` from Confluence — it means the payload could not be deserialized.

## Examples

### List pages in a space

**Operation** `GET /pages`

Set the `space-id` query parameter to the numeric space id, and optionally `limit` and `body-format`. Responses are cursor-paginated: `_links.next` holds the URL of the next page, whose `cursor` query parameter can be fed back into the same query.

### Create a page

**Operation** `POST /pages`

```json
{
  "spaceId": "65537",
  "status": "current",
  "title": "Release notes",
  "body": {
    "representation": "storage",
    "value": "<p>Shipped today.</p>"
  }
}
```

### Update a page

**Operation** `PUT /pages/{id}`

Confluence uses optimistic locking on updates: the request must carry the **next** version number, so read the page first and send `version.number + 1`.

```json
{
  "id": "1234567",
  "status": "current",
  "title": "Release notes",
  "body": { "representation": "storage", "value": "<p>Updated.</p>" },
  "version": { "number": 4, "message": "Updated from ToolJet" }
}
```

### List attachments on a page

**Operation** `GET /pages/{id}/attachments`

Returns attachment metadata, including a `downloadLink` for each file. Uploading a new attachment is a v1-only endpoint and is not available through this plugin.

## Troubleshooting

| Message | Cause |
| --- | --- |
| *Site not selected* | No site is selected on the query. Click **Get sites** and pick one. |
| *Authentication required* | **Get sites** was clicked on a data source that has not been connected. Re-open the data source and click **Connect to Confluence**. |
| *The authorized Atlassian account has no accessible Confluence sites* | The app was authorized without the Confluence API added to it, or the account has no Confluence access. |
| 401 / 403 | The token expired. ToolJet refreshes it automatically; if the refresh token was revoked, the next run re-opens the consent screen. |
| *Missing OAuth scope* / *Unauthorized; scope does not match* | The token was issued without the scope this endpoint needs — the error names it. Add it to **Scope(s)** and to your Atlassian app, then **reconnect the data source**. Adding a scope does not upgrade a token that already exists, and refreshing keeps the original scopes. |
| 429 | Confluence rate limited the request. The `Retry-After` value is returned in the error details. |
| `INVALID_MESSAGE` (400) | Confluence could not deserialize the payload — usually an object field such as `body` or `version` that isn't valid JSON. Check it parses, and that `version.number` is a number rather than a quoted string. |
| *This app has requested Confluence API scopes that have not been added to the app* | The scopes in the **Scope(s)** field are not declared on your Atlassian app. Open the app at [developer.atlassian.com](https://developer.atlassian.com/console/myapps) → **Permissions** → **Confluence API** → **Configure**, add the granular scopes listed in the error, then connect again. Alternatively trim the **Scope(s)** field to only the scopes the app already has. |
| *Add at least one Confluence scope* | **Connect to Confluence** was clicked with the **Scope(s)** field empty. See [Scopes](#scopes). |
| 403 on a `DELETE` operation | The token has no `delete:*:confluence` scope. Add it to the data source and to your Atlassian app, then connect again. |
