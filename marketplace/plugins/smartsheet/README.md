# Smartsheet Data Connector

The **Smartsheet** marketplace plugin enables ToolJet to interact directly with the Smartsheet REST API. Use it to read and write sheets, rows, columns, reports, folders, workspaces, users, searches, and webhooks within your internal applications.

Official Documentation: [ToolJet Smartsheet Plugin Docs](https://docs.tooljet.com/docs/marketplace/plugins/marketplace-plugin-smartsheet)

---

## Connection Setup

### 1. Select Region & Base URL

Smartsheet operates across distinct geographic regions. Choose your target region during data source setup; the API base URL updates automatically based on your selection:

| Region | API Base URL |
| :--- | :--- |
| **US (United States)** | `https://api.smartsheet.com/2.0` |
| **EU (Europe)** | `https://api.smartsheet.eu/2.0` |
| **AU (Australia)** | `https://api.smartsheet.au/2.0` |

---

### 2. Authentication Modes

The plugin supports two authentication methods:

#### Option A: API Access Token (Personal Access Token)
Generate a token in your Smartsheet account under **Account** > **Personal Access Tokens** (click **Create new token**), then paste it directly into the plugin configuration field in ToolJet.

#### Option B: OAuth 2.0

To authorize ToolJet via OAuth 2.0, create a Developer App in the Smartsheet Developer Portal and configure your redirect URLs.

##### Redirect Callback URL
Copy the **Redirect URL** shown in the ToolJet connection form into your Smartsheet Developer App settings. If no custom redirect URL is saved, the plugin derives it from the ToolJet host and sub-path at runtime.

##### Regional OAuth Endpoints
By default, leaving **Authorization URL** and **Access Token URL** blank will use the standard regional endpoints below. Enter custom URLs only if you need to override these defaults (explicit values take precedence over region defaults):

| Region | Authorization URL | Access Token URL |
| :--- | :--- | :--- |
| **US** | `https://app.smartsheet.com/b/authorize` | `https://api.smartsheet.com/2.0/token` |
| **EU** | `https://app.smartsheet.eu/b/authorize` | `https://api.smartsheet.eu/2.0/token` |
| **AU** | `https://app.smartsheet.au/b/authorize` | `https://api.smartsheet.au/2.0/token` |

##### Authorizing Steps
Ensure your Smartsheet Developer App has the required scopes enabled (e.g., `READ_SHEETS`, `WRITE_SHEETS`, `ADMIN_USERS`, `CREATE_SHEETS`).

1. Enter your **Client ID**, **Client Secret**, and select your **Region** in ToolJet.
2. Click **Save** to store the initial configuration.
3. Add a new query using this data source and click **Run**.
4. Complete the consent prompt in the pop-up window provided by Smartsheet.
5. Run the query again to fetch data; ToolJet persists the returned OAuth credentials through its datasource OAuth flow.

> **Note:** Access tokens are auto-refreshed when expired. If a refresh token is revoked, re-authorize the data source from the configuration settings.

---

## Querying Smartsheet

### OpenAPI Specification Engine

The plugin query editor is powered by the vendored Smartsheet OpenAPI specification at `openapi-specs/smartsheet.yaml`, referenced in `lib/operations.json` as `@spec/smartsheet/smartsheet`. That local specification exposes **187 operations across 118 API paths** to the query editor.

* **Path Parameters:** Automatically interpolated into the request URL.
* **Query Parameters:** Transmitted as standard URL search params (array values duplicate the parameter key).
* **JSON Request Bodies:** Rendered for `POST`, `PUT`, `PATCH`, and `DELETE` actions.

### Common Operations & Data Structures

* **Reading Sheets & Rows:** `GET /sheets/{sheetId}` is the simplest way to read rows. The response payload contains all row and cell objects structured in nested JSON format. Use the `include` query parameter to attach auxiliary metadata such as `attachments`, `discussions`, `format`, `columnType`, or `paperSize`.
* **Attachment Uploads:** The plugin supports three Smartsheet attachment upload formats:
  1. **Multipart Form-Data:** Sent via `file.base64Data`.
  2. **Raw File Content:** Sent directly via `file.content`.
  3. **URL References:** Configured using `url` along with `attachmentType`.

---

## Troubleshooting & FAQ

* **Permissions & Plan Restrictions:** Smartsheet enforces admin-level and subscription-tier checks for specific endpoints. A `403 Forbidden` response usually indicates insufficient permissions or feature gating on the target Smartsheet plan rather than a plugin issue.
* **Row/Cell Update Validation:** Smartsheet strictly enforces schema formats on `PUT` requests to rows or cells (e.g., cell IDs, strict column data types). Verify that payloads align with Smartsheet's expected schema.
* **Path Validation:** Unset path parameters are intercepted before execution, returning `Missing value for path parameter(s): {name}` to prevent invalid API calls.

---

## Development & Contribution

To build and test the plugin locally prior to deployment:

```bash
# Build the production bundle into dist/index.js
npm run build
```
