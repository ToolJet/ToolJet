---
id: marketplace-plugin-smartsheet
title: Smartsheet Data Connector
---

ToolJet allows you to connect to Smartsheet to read and write sheets, rows, columns, reports, folders, workspaces, users, searches, and webhooks through the Smartsheet REST API.

:::info
**NOTE:** **Before following this guide, it is assumed that you have already completed the process of [Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

To connect to a Smartsheet data source in ToolJet, you can either click the **+ Add new data source** button on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page in the ToolJet dashboard.

Smartsheet supports two connection modes in this plugin:

- **OAuth 2.0**: provide the Smartsheet app `Client ID` and `Client Secret`
- **API Access Token**: provide a personal Smartsheet access token

Choose the **Region** first. The API base URL changes by region:

- **US**: `https://api.smartsheet.com/2.0`
- **EU**: `https://api.smartsheet.eu/2.0`
- **AU**: `https://api.smartsheet.au/2.0`

### Setting up OAuth

1. **Create a Smartsheet app**: in the [Smartsheet Developer Portal](https://developers.smartsheet.com), register a new app. Copy its **Client ID** and **Client Secret** into the ToolJet connection form.
2. **Register the redirect URL** in the app's OAuth settings (Redirect URLs). It must match the URL ToolJet redirects to after consent, exactly:
   - Leave the **Redirect URL** field on the ToolJet connection form empty and the plugin computes it from `TOOLJET_HOST` and `SUB_PATH`:
     - Local: `http://localhost:8082/oauth2/authorize`
     - Deployed: `https://<your-tooljet-host>/oauth2/authorize`
   - Fill the field only to override the computed URL (custom host, subpath, or a proxy in front of ToolJet), then register that exact value in Smartsheet instead.
3. The redirect URL is a browser redirect target, not a server-to-server callback, so it does not need to be publicly reachable for local testing. If Smartsheet rejects `http://localhost` for your app, use an **API Access Token** locally, or expose ToolJet through an HTTPS tunnel and register the tunnel URL.

The plugin uses the selected region's authorization and token endpoints, unless custom endpoint overrides are configured.

### Procuring an API Access Token

Generate a personal access token in Smartsheet under **Account → Personal Access Tokens**, then paste it into the **API Access Token** field on the connection form.

### Scopes

The scopes field is prefilled with a starting point. Edit it to match your Smartsheet app before connecting.

Recommended minimum read/write scopes for the current plugin surface are:

```
READ_SHEETS WRITE_SHEETS READ_USERS READ_CONTACTS ADMIN_WEBHOOKS
```

Keep the scope list as narrow as possible. If you ask for a scope that your Smartsheet app does not have, the consent flow can fail.

### Authorizing

OAuth 2.0 data sources are authorized the first time a query runs:

1. Fill in the credentials, pick the correct **Region**, and click **Save**.
2. Open an app, add a query that uses this data source, and click **Run**.
3. Smartsheet's consent screen opens. Approve access.
4. Run the query again. Results are returned and the token is stored on the data source.
5. **Test Connection** now reports success.


The plugin returns ToolJet's OAuth refresh signal for expired OAuth tokens, allowing the runtime to refresh and retry the query. If the refresh token has been revoked, reconnect the data source.

## Querying Smartsheet

1. Click the **+ Add** button in the query manager at the bottom of the editor and select the Smartsheet data source added earlier.
2. Pick an **Operation**. The dropdown is driven by the vendored Smartsheet OpenAPI spec.
3. Fill in the path, query, and body parameters declared by that endpoint.

The plugin uses the vendored OpenAPI spec directly, so the available operations come from `openapi-specs/smartsheet.yaml` rather than a hand-maintained operation list.

### Minimum Required Operations

The vendored specification contains the following required operation/method pairs, and the plugin's generic request runner supports their HTTP methods:

| Operation | Endpoint | Description |
|-----------|----------|-------------|
| List sheets | `GET /sheets` | Returns all sheets accessible to the user |
| Get sheet | `GET /sheets/{sheetId}` | Returns the sheet with its rows and columns (use `include` for attachments, discussions, formatting, etc.) |
| Add rows | `POST /sheets/{sheetId}/rows` | Adds one or more rows to a sheet |
| Update rows | `PUT /sheets/{sheetId}/rows` | Updates cell values or row positions |
| Delete rows | `DELETE /sheets/{sheetId}/rows` | Deletes rows by ID (use the `rowIds` query parameter) |
| List columns | `GET /sheets/{sheetId}/columns` | Returns all columns in a sheet |
| Add column | `POST /sheets/{sheetId}/columns` | Adds one or more columns to a sheet |
| Attach file to sheet | `POST /sheets/{sheetId}/attachments` | Uploads a file attachment to a sheet |
| Attach file to row | `POST /sheets/{sheetId}/rows/{rowId}/attachments` | Uploads a file attachment to a row |
| List reports | `GET /reports` | Returns all reports accessible to the user |
| Get report | `GET /reports/{reportId}` | Returns a specific report with data |
| Search sheets | `GET /search` | Searches across sheets |

Additional operations (folders, workspaces, users, webhooks, and more) are available through the OpenAPI spec dropdown. The vendored specification currently contains 187 operations across 118 API paths.

### Examples

#### Get current user

**Operation** `GET /users/me`

Use this to verify the connection and identify the authenticated account.

#### List sheets

**Operation** `GET /sheets`

Returns the sheets visible to the authenticated account.

#### Get a sheet

**Operation** `GET /sheets/{sheetId}`

Set `sheetId` in the path parameters. Rows and columns are returned by default; `include` adds attachments, discussions, formatting flags, and similar extras.

#### Add rows

**Operation** `POST /sheets/{sheetId}/rows`

Send the rows in the request body. Smartsheet row placement is controlled by the row payload, so keep the request aligned with the endpoint schema.

#### Update rows

**Operation** `PUT /sheets/{sheetId}/rows`

Use this to change cell values or row position. Smartsheet applies row-location rules and column-type rules to these requests.

#### List columns

**Operation** `GET /sheets/{sheetId}/columns`

#### Add column

**Operation** `POST /sheets/{sheetId}/columns`

```json
{
  "title": "New Column",
  "type": "TEXT_NUMBER",
  "index": 1
}
```

#### Attach file to sheet

**Operation** `POST /sheets/{sheetId}/attachments`

Supports three upload modes:

**1. Multipart form-data (file upload)**
```json
{
  "file": {
    "base64Data": "SGVsbG8gV29ybGQ=",
    "name": "document.pdf",
    "type": "application/pdf"
  }
}
```

**2. Binary upload (raw file content)**

The `content` value is sent as UTF-8 bytes, so use this mode for text-like content or content you already have as a string:

```json
{
  "file": {
    "content": "Hello, Smartsheet!",
    "name": "notes.txt",
    "type": "text/plain"
  }
}
```

**3. URL attachment (link to external file)**
```json
{
  "url": "https://example.com/document.pdf",
  "name": "document.pdf",
  "attachmentType": "LINK"
}
```

#### Attach file to row

**Operation** `POST /sheets/{sheetId}/rows/{rowId}/attachments`

Same three upload modes as sheet attachments.

#### Search sheets

**Operation** `GET /search`

#### List workspaces

**Operation** `GET /workspaces`

#### List reports

**Operation** `GET /reports`

#### List webhooks

**Operation** `GET /webhooks`

## Troubleshooting

| Message | Cause |
| --- | --- |
| *Access token is required* | The data source is missing a token for the selected auth mode. |
| *OAuth token expired or invalid* | The token is expired or revoked. Reconnect the data source. |
| *Missing Smartsheet OAuth credentials* | `Client ID` or `Client Secret` is empty on the OAuth connection form. |
| 401 / 403 | Smartsheet rejected the request. The token may be expired, revoked, or missing a required scope. |
| 429 | Smartsheet rate limited the request. Check the response details for retry guidance. |
| Smartsheet error response | The API returned structured error details. The plugin surfaces the message and status code in ToolJet. |
