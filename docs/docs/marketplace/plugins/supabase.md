---
id: marketplace-plugin-supabase
title: Supabase
---

ToolJet connects to your Supabase database, allowing you to directly interact with your Supabase back-end from within your ToolJet application.

:::info NOTE
Before following this guide, it is assumed that you have already completed the process of [Using Marketplace plugins](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connection

ToolJet connects to Supabase using one of three connection types. Choose one from the **Connection type** dropdown in the data source configuration:

| Connection type | Credentials | Supported operations |
|:----------------|:------------|:---------------------|
| **Secret key** (default) | **Project URL** and **Secret key** | Row operations. The secret key bypasses Row Level Security. |
| **Publishable key** | **Project URL** and **Publishable key** | Row operations. Row Level Security applies. |
| **Connection string (PostgreSQL)** | **Connection string** and an optional **CA certificate** | [Run SQL](#run-sql) only. |

Supabase data sources created before connection types were added use **Secret key**.

### Secret Key or Publishable Key

- You can find the **Project URL** and API keys in the API settings of your Supabase project dashboard.
  - **Secret key**: the secret key (`sb_secret_...`) or the legacy `service_role` key. This key bypasses Row Level Security.
  - **Publishable key**: the publishable key (`sb_publishable_...`) or the legacy `anon` key. Row Level Security applies to queries made with this key.

  <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/marketplace/plugins/supabase/api_settings.png" alt="Supabase API Settings" />

- Establish a connection to Supabase by either clicking `+Add new Data source` on the query panel or navigating to the [Data Sources](/docs/data-sources/overview/) page from the ToolJet dashboard.

- Select **Secret key** or **Publishable key** as the **Connection type**.

- Enter the **Project URL** (for example, `https://<project-ref>.supabase.co`) and the key into their designated fields.

- Click **Test Connection** to validate your credentials. Click **Save** to store the data source.

  <img className="screenshot-full img-l" style={{ marginTop: '15px' }} src="/img/marketplace/plugins/supabase/connection-secret-key.png" alt="Supabase data source configured with the Secret key connection type" />

### Connection String (PostgreSQL)

Use this connection type to run raw SQL queries against your Supabase database.

- Copy the PostgreSQL connection string from your Supabase project's **Connect** dialog. It looks like this:

  ```
  postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
  ```

  Use the **Session pooler** (port `5432`) or **Transaction pooler** (port `6543`) connection string. On free Supabase projects, the direct connection is IPv6-only. URL-encode any special characters in the password.

- Select **Connection string (PostgreSQL)** as the **Connection type**.

- Paste the string into the **Connection string** field.

- Optionally, paste the Supabase CA certificate into the **CA certificate (optional)** field. When it's set, ToolJet verifies the server certificate. Without it, the connection is still encrypted but the certificate isn't verified. To turn SSL off, add `sslmode=disable` to the connection string.

- Click **Test Connection** to validate the connection. Click **Save** to store the data source.

  <img className="screenshot-full img-l" style={{ marginTop: '15px' }} src="/img/marketplace/plugins/supabase/connection-string.png" alt="Supabase data source configured with the Connection string (PostgreSQL) connection type" />

## Querying Supabase

- To perform queries on Supabase in ToolJet, click the **+Add** button in the [query manager](/docs/app-builder/connecting-with-data-sources/creating-managing-queries) located at the bottom panel of the editor.
- Select the previously configured Supabase datasource.
- In the Operation dropdown, select the desired operation type. ToolJet currently [supports](#supported-operations) six query types for Supabase interactions.
- Enter the table name and other required parameters for the selected operation and click on **Run** button to run the query.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/supabase/listops-v2.png" alt="Supabase supported operations" />

:::info
Query results can be transformed using transformations. Read our [transformations documentation](/docs/app-builder/custom-code/transform-data).
:::

## Supported Operations

You can create query for Supabase data source to perform several operations such as:

1. **[Get Rows](#get-rows)**
2. **[Create Row(s)](#create-rows)**
3. **[Update Row(s)](#update-rows)**
4. **[Delete Row(s)](#delete-rows)**
5. **[Count Rows](#count-rows)**
6. **[Run SQL](#run-sql)**

Operations 1–5 need a **Secret key** or **Publishable key** connection. **Run SQL** needs a **Connection string (PostgreSQL)** connection.

### Get Rows

#### Required Parameters

- **Table** - Database table name.

#### Optional Parameters

- **Where** - Filter rows based on a condition.
- **Sort** - Sort rows based on a column.
- **Limit** - Limit the number of rows returned.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/supabase/get-rows.png" alt="Get Rows query" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
[
  {
    "id": 1,
    "created_at": "2026-02-23T12:10:17.780412+00:00",
    "likes": 100,
    "content": "Photo post",
  },
  {
    "id": 2,
    "created_at": "2026-02-23T12:12:37.624735+00:00",
    "likes": 300,
    "content": "Reel post",
  },
]
```

</details>

### Create Row(s)

#### Required Parameters

- **Table** - Database table name.
- **Body** - Data to be inserted into the table. It should be an array of object(s).
 
Here's the **Sample Input** below :

```javascript
[
  { "content": "Photo post", "likes", 100 },
  { "content": "Reel post", "likes", 300 }
]
```
<img className="screenshot-full img-full" src="/img/marketplace/plugins/supabase/create-rows.png" alt="Create Rows query" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
created: true
```

</details>

### Update Row(s)

#### Required Parameters

- **Table** - Database table name.
- **Columns** - Column name and value to be updated.

#### Optional Parameters

- **Where** - Update rows based on a condition. If not provided, all rows will be updated.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/supabase/update-rows.png" alt="Update Rows query" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
[
  {
    "id": 2,
    "created_at": "2026-02-23T12:20:08.623547+00:00",
    "likes": 94,
    "content": "Saved!",
  },
]
```

</details>

### Delete Row(s)

#### Required Parameters

- **Table** - Database table name.
- **Where** - Delete rows based on a condition.

#### Optional Parameters

- **Sort** - Sort rows by a column before the limit is applied.
- **Limit** - Maximum number of rows to delete.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/supabase/delete-rows.png" alt="Delete Rows query" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
deleted: true
```

</details>

### Count Rows

#### Required Parameters

- **Table** - Database table name.

#### Optional Parameters

- **Where** - Filter rows based on a condition.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/supabase/count-rows.png" alt="Count Rows query" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
count: 1
```

</details>

### Run SQL

Runs a raw SQL query against the Supabase PostgreSQL database. In the **Operation** dropdown, this appears as **Run SQL (connection string)**.

#### Required Parameters

- **Query** - The SQL query to run.

#### Optional Parameters

- **SQL Parameters** - Key-value pairs for parameterized queries. Use `:parameter_name` placeholders in the query, and add a parameter with the matching key (without the colon) for each one. Values can be static or dynamic using `{{ }}`.

Example:

```sql
SELECT * FROM orders WHERE status = :status
```

SQL Parameters:

- Key: `status`
- Value: `{{ components.statusSelect.value }}`

<img className="screenshot-full img-full" src="/img/marketplace/plugins/supabase/run-sql.png" alt="Run SQL query with a SQL parameter" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
[
  {
    "id": 1,
    "status": "shipped",
    "total": 249.99,
  },
]
```

</details>

:::info Query timeout
SQL queries time out after 120,000 ms by default. To change this, set the `PLUGINS_SQL_DB_STATEMENT_TIMEOUT` environment variable.
:::
