---
id: marketplace-plugin-confluence
title: Confluence
---

ToolJet allows you to connect to Confluence Cloud to read and write pages, blog posts, spaces, comments, labels, attachments and other content through the Confluence REST API v2.

:::info NOTE
Before following this guide, it is assumed that you have already completed the process of [Using Marketplace plugins](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connection

To connect to a Confluence data source in ToolJet, you can either click the **+ Add new data source** button on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page in the ToolJet dashboard.

Confluence authenticates through **OAuth 2.0 (3LO)**. Create an [OAuth 2.0 (3LO) app](https://developer.atlassian.com/cloud/confluence/oauth-2-3lo-apps/) in the Atlassian developer console and add the Confluence API to it. Then fill in the connection form:

| Field | Description |
| --- | --- |
| **Client ID** | The client ID of your Atlassian app. |
| **Client secret** | The secret of your Atlassian app. |
| **Site URL** | The address of your Confluence site, for example `https://your-site.atlassian.net`. |
| **Scope(s)** | Space-separated Atlassian scopes. See [Scopes](#scopes). |
| **Redirect URI** | Read-only. Copy it and register it as the callback URL in your Atlassian app. |
| **Authentication required for all users** | When on, each ToolJet user authorizes with their own Atlassian account. When off, every query uses the account that connected the data source. |

<!-- TODO screenshot: Confluence connection form showing Client ID, Client secret, Site URL, Scope(s) with its helper text, Redirect URI, the Authentication required for all users toggle and the Connect to Confluence button -->

### Scopes

The **Scope(s)** field is prefilled with:

```
read:page:confluence write:page:confluence read:space:confluence write:space:confluence read:attachment:confluence write:attachment:confluence read:comment:confluence write:comment:confluence read:confluence-content.all read:confluence-space.summary read:confluence-user search:confluence offline_access
```

This value mixes granular v2 scopes with classic scopes, so **replace it before connecting**. Use one of the scope sets below, trimmed to what your app needs.

A read/write set covering the common operations:

```
read:page:confluence write:page:confluence read:space:confluence write:space:confluence
read:comment:confluence write:comment:confluence read:attachment:confluence
read:custom-content:confluence write:custom-content:confluence
read:hierarchical-content:confluence read:task:confluence offline_access
```

A read-only set:

```
read:page:confluence read:space:confluence read:comment:confluence offline_access
```

Rules for this field:

- **Every scope must also be granted to your Atlassian app** under **Permissions > Confluence API**. Asking for a scope the app doesn't have fails the consent screen with *"This app has requested Confluence API scopes that have not been added to the app"*.
- **Use granular v2 scopes**, in the `read:page:confluence` style. Classic scopes (`read:confluence-content.all`, `read:confluence-space.summary`, `read:confluence-user`, `search:confluence`) target the v1 API, which this plugin doesn't use. <!-- TODO verify: whether Atlassian rejects classic scopes when they are requested together with granular scopes -->
- **`offline_access` is required for refresh tokens.** It's appended automatically if you leave it out. Without it, the connection stops working when the access token expires.
- **Deletes need their own scopes.** For example, `DELETE /pages/{id}` needs `delete:page:confluence`, `DELETE /footer-comments/{comment-id}` needs `delete:comment:confluence`, and `DELETE /attachments/{id}` needs `delete:attachment:confluence`. Without the matching `delete:*:confluence` scope these operations fail with 403.
- **`write:attachment:confluence` only covers attachment content properties** (`POST`, `PUT` and `DELETE` on `/attachments/{attachment-id}/properties`). The v2 API has no endpoint for uploading attachments.

A narrower scope set means a smaller consent screen and less access to hand out.

If the field is empty, or contains only `offline_access`, **Connect to Confluence** stops with *"Add at least one Confluence scope"* instead of opening the consent screen.

### Authorizing

The data source is authorized before it's saved:

1. Fill in **Client ID**, **Client secret**, **Site URL** and **Scope(s)**.
2. Click **Connect to Confluence**. ToolJet opens the Atlassian consent screen.
3. Approve the requested scopes. You return to ToolJet and the button changes to **Save data source**.
4. Click **Save data source**. The authorization code is exchanged for tokens as part of the save, so the data source is only stored once the connection works.

Confluence has no separate **Test connection** button. Connecting successfully is the test.

Expired access tokens are refreshed automatically when queries run. If the refresh token is revoked, the next query opens the consent screen again.

:::info
OAuth tokens aren't tied to one site, so the data source records which site it points at. See [Setting the site](#setting-the-site).
:::

## Querying Confluence

1. Click the **+ Add** button in the query manager at the bottom of the editor and select the Confluence data source added earlier.
2. Pick an **Operation**. The searchable list contains every endpoint of the [Confluence REST API v2](https://developer.atlassian.com/cloud/confluence/rest/v2/intro/) with its HTTP method and summary.
3. Fill in the path, query and body parameters the endpoint declares.

<!-- TODO screenshot: Confluence query editor with the Operation list open, then with GET /pages selected and its parameters shown -->

:::tip
Query results can be transformed using transformations. Refer to the **[transformations documentation](/docs/app-builder/custom-code/transform-data)** for details.
:::

The plugin covers the v2 API:

- Pages, blog posts and their versions, likes, labels and content properties
- Spaces, space properties, space permissions and space roles
- Footer and inline comments
- Attachments (read and delete), labels, tasks and custom content
- Whiteboards, databases, Smart Links and folders
- Content tree navigation (children, direct children, ancestors and descendants)
- Classification levels, data policies and content redaction
- User lookup by account ID (`POST /users-bulk`) and site access checks by email
- Forge app properties

Endpoints that exist only in the older v1 API, such as CQL search, attachment upload and content restrictions, aren't available. Use a **[REST API](/docs/data-sources/restapi/)** data source for those.

### Setting the site

The site is set once on the data source, not per query. Enter it as **Site URL** on the connection form, and every query on that data source runs against it. Use the address you visit in the browser, for example `https://your-site.atlassian.net`. A bare hostname, or a URL that includes `/wiki`, also works.

A site is always required. An OAuth token is issued to an Atlassian account rather than to one site, so requests are sent to `https://api.atlassian.com/ex/confluence/{cloudId}/wiki/api/v2/...`. ToolJet translates the site URL into that cloud ID using the sites the authorized account can reach, so you never need to look the cloud ID up yourself.

:::info
One data source connects to one site. To work with a second Confluence site, add a second Confluence data source and set its **Site URL** accordingly.
:::

### Filling in body fields

Some body fields are objects rather than plain values, such as a page's `body` and `version` or a space's `description`. They appear as ordinary text inputs, so type JSON into them:

```json
{ "representation": "storage", "value": "<p>Hello from ToolJet</p>" }
```

The plugin reads the endpoint's schema and converts these fields into JSON objects before sending. Fields that the spec declares as strings, such as `title`, are sent exactly as typed, so a title containing braces stays intact. A `{{ }}` expression that already evaluates to an object also works.

If such a field is sent as a raw string, Confluence returns `INVALID_MESSAGE`, which means the payload couldn't be deserialized.

## Examples

### List pages in a space

**Operation:** `GET /pages`

Set the `space-id` query parameter to the numeric space ID, and optionally `limit` and `body-format`. Responses are cursor-paginated: `_links.next` holds the URL of the next page, and its `cursor` query parameter can be fed back into the same query.

### Create a page

**Operation:** `POST /pages`

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

**Operation:** `PUT /pages/{id}`

Confluence uses optimistic locking on updates. The request must carry the **next** version number, so read the page first and send `version.number + 1`.

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

**Operation:** `GET /pages/{id}/attachments`

Returns attachment metadata, including a `downloadLink` for each file. Uploading a new attachment is a v1-only endpoint and isn't available through this plugin.

## Troubleshooting

| Message | Cause |
| --- | --- |
| *Site not configured* | **Site URL** is empty on the data source. Set it to your site's address, for example `https://your-site.atlassian.net`. |
| *Invalid Site URL* | **Site URL** isn't a valid address. Use the form `https://your-site.atlassian.net`. |
| *Site not accessible* | The authorized account can't reach the site in **Site URL**. The error lists the sites it can reach. Correct the URL, or authorize an account with access. |
| *The authorized Atlassian account has no accessible Confluence sites* | The app was authorized without the Confluence API added to it, or the account has no Confluence access. |
| 401 / 403 | The token expired. ToolJet refreshes it automatically. If the refresh token was revoked, the next run opens the consent screen again. |
| *Missing OAuth scope* / *Unauthorized; scope does not match* | The token was issued without the scope this endpoint needs, and the error names it. Add it to **Scope(s)** and to your Atlassian app, then **reconnect the data source**. Adding a scope doesn't upgrade an existing token, and refreshing keeps the original scopes. |
| 429 | Confluence rate limited the request. The `Retry-After` value is returned in the error details. |
| `INVALID_MESSAGE` (400) | Confluence couldn't deserialize the payload, usually because an object field such as `body` or `version` isn't valid JSON. Check that it parses, and that `version.number` is a number rather than a quoted string. |
| *This app has requested Confluence API scopes that have not been added to the app* | The scopes in **Scope(s)** aren't declared on your Atlassian app. Open the app at [developer.atlassian.com](https://developer.atlassian.com/console/myapps), go to **Permissions** > **Confluence API** > **Configure**, add the granular scopes listed in the error, then connect again. Alternatively, trim **Scope(s)** to only the scopes the app already has. |
| *Add at least one Confluence scope* | **Connect to Confluence** was clicked with no product scope in **Scope(s)**. See [Scopes](#scopes). |
| 403 on a `DELETE` operation | The token has no matching `delete:*:confluence` scope. Add it to the data source and to your Atlassian app, then connect again. |
