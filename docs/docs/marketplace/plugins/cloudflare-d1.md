---
id: marketplace-plugin-cloudflare-d1
title: Cloudflare D1
---

# Cloudflare D1

ToolJet integrates with Cloudflare D1, Cloudflare's serverless relational SQL database built on SQLite. This integration allows you to query tables, bind query parameters, manage databases, and display D1 query results directly in your ToolJet applications and tables.

:::info
**NOTE:** **Before following this guide, make sure you have reviewed [Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

To connect to Cloudflare D1, you need the following credentials from your Cloudflare dashboard:

- **Account ID**: Your 32-character Cloudflare Account ID (available on your Cloudflare dashboard overview page or in the URL).
- **API Token**: A Cloudflare API token scoped with **Account → D1 → Edit** permissions.
  - To generate the token, navigate to **dash.cloudflare.com → My Profile → API Tokens → Create Token → Create Custom Token**.
  - Under **Permissions**, select **Account** → **D1** → **Edit**.
  - Under **Account Resources**, select **Include** → **Specific account** → choose your account.

### Setting up the Connection

1. Navigate to the **Data Sources** page in the ToolJet dashboard or click **+ Add new Data source** in the query manager.
2. Select **Cloudflare D1** from the Marketplace plugins list.
3. Enter your **Account ID** and **API Token**.
4. Click **Test Connection** to verify that ToolJet can communicate with your Cloudflare D1 account.
5. Click **Save** to persist the data source.

---

## Supported Operations

You can configure queries for the Cloudflare D1 data source to perform the following operations:

1. **[Run SQL Query](#run-sql-query)**
2. **[Run Raw SQL Query](#run-raw-sql-query)**
3. **[List Databases](#list-databases)**
4. **[Get Database](#get-database)**
5. **[Create Database](#create-database)**
6. **[Delete Database](#delete-database)**

---

### Run SQL Query

Executes a SQL query against the selected D1 database and returns rows as objects formatted for ToolJet UI components (e.g., Table widgets). Supports parameter bindings to prevent SQL injection.

#### Required Parameters

- **Database ID**: The unique UUID of the D1 database.
- **SQL Query**: The SQL query string. Use SQLite parameter placeholders such as `?` or `?1`.

#### Optional Parameters

- **Parameters**: An array of parameter values to bind to the query (e.g., `["active"]` or `{{ [1, 'active'] }}`).

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```json
[
  {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "status": "active"
  },
  {
    "id": 2,
    "name": "John Smith",
    "email": "john@example.com",
    "status": "active"
  }
]
```
</details>

---

### Run Raw SQL Query

Executes a raw SQL statement against the D1 database and returns raw column headers and row arrays.

#### Required Parameters

- **Database ID**: The UUID of the D1 database.
- **Raw SQL Query**: The raw SQL query string to execute.

#### Optional Parameters

- **Parameters**: An array of parameter bindings.

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```json
{
  "columns": ["id", "name", "email", "status"],
  "rows": [
    [1, "Jane Doe", "jane@example.com", "active"],
    [2, "John Smith", "john@example.com", "active"]
  ],
  "meta": {
    "duration": 2.1,
    "rows_read": 2,
    "rows_written": 0
  }
}
```
</details>

---

### List Databases

Retrieves a paginated list of all D1 databases under your Cloudflare account.

#### Optional Parameters

- **Database Name Filter**: Filter databases matching a specific name substring.
- **Page**: Page number for pagination (defaults to `1`).
- **Per Page**: Number of databases per page (defaults to `20`, maximum `100`).

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```json
[
  {
    "uuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "name": "production_database",
    "version": "production",
    "created_at": "2026-10-13T06:00:00Z"
  }
]
```
</details>

---

### Get Database

Retrieves details and metadata for a specific D1 database by its UUID.

#### Required Parameters

- **Database ID**: The unique UUID of the D1 database.

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```json
{
  "uuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "name": "production_database",
  "version": "production",
  "created_at": "2026-10-13T06:00:00Z",
  "num_tables": 4,
  "file_size": 16384
}
```
</details>

---

### Create Database

Creates a new serverless SQLite D1 database in your Cloudflare account.

#### Required Parameters

- **Database Name**: The name for the new database.

#### Optional Parameters

- **Primary Location Hint**: Specify the geographical region to host the database primary (e.g., `wnam`, `enam`, `weur`, `eeur`, `apac`, `oc`).

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```json
{
  "uuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "name": "my_new_database",
  "version": "production",
  "created_at": "2026-10-13T12:00:00Z"
}
```
</details>

---

### Delete Database

Permanently deletes an existing D1 database from your Cloudflare account.

#### Required Parameters

- **Database ID**: The unique UUID of the database to delete.

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```json
{
  "success": true,
  "message": "Database deleted successfully",
  "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```
</details>
