---
id: snowflake
title: Snowflake
---

ToolJet can connect to Snowflake databases to read and write data.

## Connection

To establish a connection with the Snowflake data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview/)** page from the ToolJet dashboard and choose Snowflake as the data source.

## Authentication Methods

### Basic Authentication 

Authenticates to Snowflake using a username and password to establish a direct connection with the specified account, role, and warehouse.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/datasource-reference/snowflake/basic-auth.png" alt="ToolJet - Snowflake connection" />

:::info
Please make sure the **Host/IP** of the database is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please **whitelist** our IP.

You can find snowflake docs on network policies **[here](https://docs.snowflake.com/en/user-guide/network-policies.html)**.
:::

ToolJet requires the following to connect to Snowflake database.

- **Account**
- **Username/Login name**
- **Password**

Use your Snowflake **Account Identifier** as the value for the **Account** field.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/snowflake/accounts-snowflake.png" alt="ToolJet - Snowflake" />

:::info
You can also configure **[additional optional parameters](https://docs.snowflake.com/en/user-guide/nodejs-driver-use.html#additional-connection-options)**.
:::

### OAuth 2.0 

#### Generate OAuth Credentials from Snowflake

Follow the steps below to obtain the required OAuth credentials: Client ID, Client Secret, Authorization URL, and more.

**Step 1: Create a Security Integration**

Run the following query in a Snowflake worksheet:

```sql
USE ROLE ACCOUNTADMIN;

CREATE OR REPLACE SECURITY INTEGRATION tooljet_oauth
TYPE = OAUTH
ENABLED = TRUE
OAUTH_CLIENT = CUSTOM
OAUTH_CLIENT_TYPE = 'CONFIDENTIAL'
OAUTH_REDIRECT_URI = <your-tooljet-instance-redirect-uri>
OAUTH_ISSUE_REFRESH_TOKENS = TRUE
OAUTH_REFRESH_TOKEN_VALIDITY = 7776000;
```
Replace **`your-tooljet-instance-redirect-uri`** with your ToolJet Redirect URI.

**Step 2: Get Client Secret**

Run the following query:

```sql
SELECT SYSTEM$SHOW_OAUTH_CLIENT_SECRETS('TOOLJET_OAUTH');
```
From the output, copy this : `OAUTH_CLIENT_SECRET`

**Step 3: Get Client ID and OAuth Endpoints**

Run the following query:

```sql
DESC SECURITY INTEGRATION TOOLJET_OAUTH;
```
From the output, copy the following values:

- `OAUTH_CLIENT_ID` > **Client ID**
- `OAUTH_AUTHORIZATION_ENDPOINT` > **Authorization URL**
- `OAUTH_TOKEN_ENDPOINT` > **Token URL**

**Note**: Please ensure that your role is not included in the **BLOCKED_ROLES_LIST**. If it is included, you will need to clear it.

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/generate-oauth-sf.png" alt="Generate Snowflake Credentials "/>

#### OAuth2.0 - Custom App
Uses credentials from your own OAuth application to authenticate and authorize access via a custom OAuth provider configuration.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/datasource-reference/snowflake/oauth-custom-app2.png" alt="ToolJet - Snowflake connection" />

You can enable **Authentication required for all users** in the configuration to enforce user-level authentication. When enabled, users are redirected to the OAuth 2.0 consent screen the first time a query from this data source is executed within an application, ensuring secure, user-specific authorization. ToolJet supports OAuth 2.0 authentication using both **Custom App** and **ToolJet App** configurations, allowing flexible integration based on your OAuth provider setup.

**Note**: After completing the OAuth flow, the query must be triggered again to load the data.

:::info
Snowflake provides multiple OAuth endpoint URLs, including account-level and profile-level endpoints.  

Ensure that you use at least one valid set of Authorization and Token URLs (preferably from the same source) when configuring the data source. Mixing endpoints from different sources may lead to authentication issues.
:::

#### OAuth2.0 - ToolJet App

Uses ToolJet’s preconfigured OAuth application to simplify authentication without requiring you to create and manage your own OAuth app.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/datasource-reference/snowflake/oauth-tj-app2.png" alt="ToolJet - Snowflake connection" />

:::info
The **`scope`** parameter for OAuth token requests can include more than just a role. The format depends on the OAuth flow:

`session:role:<role_name>` specifies the role (e.g., `session:role:public`, `session:role:analyst`)
- You can also leave scope empty to use the user's default role.
- For External OAuth, the scope is configured in the security integration and may map to different Snowflake roles.

For more info, refer **[here](https://docs.snowflake.com/en/user-guide/oauth-ext-overview#scopes)**.
:::

### Bearer Token Auth
This authentication method uses a pre-generated bearer token for secure, token-based access to Snowflake, so you don't need to provide a username and password. Enter the token in the **Bearer token** field.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/datasource-reference/snowflake/bearer-auth.png" alt="ToolJet - Snowflake connection" />

:::info
- The bearer token is a Snowflake programmatic access token (PAT). ToolJet connects with the token you enter, using Snowflake's `PROGRAMMATIC_ACCESS_TOKEN` authenticator. There is no OAuth authorization step, and no authorization code is exchanged.

- Refer **[here](https://docs.snowflake.com/en/user-guide/programmatic-access-tokens)** on how to generate a token.
:::

**Generate a Programmatic Access Token (PAT) in Snowflake :**

Programmatic Access Tokens (PAT) allow secure, token-based authentication to Snowflake without using a password. PAT is useful when MFA is enabled and password-based authentication is blocked.

**How to Generate a PAT**

1. From the Snowflake UI, go to:
   **Settings > Authentication.**
2. Under **Programmatic access tokens**, click **Generate token.**
3. Provide required details (name, expiration, etc.)
4. Copy and store the token securely.
5. To use PAT, a **network policy** must be configured. For more info, check **[Snowflake docs](https://docs.snowflake.com/en/user-guide/network-policies.html).**

Example:

```sql
CREATE NETWORK POLICY allow_all_policy
ALLOWED_IP_LIST = ('0.0.0.0/0');
```

:::info
- The token is shown only once. Store it securely. 
- PAT cannot be used as replacement for password when signing in to Snowflake.
- The IP address in the network policy should be configured based on your system or organization's network setup.
:::

### Key Pair Auth

This is an authentication method that uses an RSA key pair (public/private) instead of a username/password. It's ideal for service accounts, automation, and CI/CD pipelines.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/datasource-reference/snowflake/key-pair-auth.png" alt="ToolJet - Snowflake connection"/>

:::info
Please refer to **[Key Pair Auth Docs](https://docs.snowflake.com/en/user-guide/key-pair-auth)** on how to generate the private key and passphrase.
:::

## Dynamic Connection Parameters

You can enable **Allow dynamic connection parameters** in the data source configuration page to directly use the values in the query builder.

<img className="screenshot-full img-s" src="/img/datasource-reference/snowflake/dynamic-conn-config.png" alt="ToolJet - Snowflake query connection" />

ToolJet allows you to override Snowflake connection parameters such as **Database, Warehouse and Role** directly at **query runtime** when dynamic connection parameters are enabled. This enables a single data source to support multiple environments or tenants without requiring separate configurations.

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/dynamic-conn-query-builder.png" alt="ToolJet - Snowflake query connection" />

## Querying Snowflake

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **Snowflake** datasource added in previous step.
3. Select the **SQL Mode** form the dropdown and enter the query.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/query-v5.png" alt="ToolJet - Snowflake query" />

```sql
select * from "SNOWFLAKE_SAMPLE_DATA"."WEATHER"."DAILY_14_TOTAL" limit 10;
```
## Querying in GUI Mode

1. Create a new query and select the Snowflake data source.
2. Select the GUI mode from the dropdown.
3. Select the operation you want to perform.
4. Fetch and select the **Table**. The dropdown lists the base tables in the data source's database, limited to the **Schema** set on the data source if one is configured.
5. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

:::info Identifiers are case-sensitive
In GUI mode, ToolJet wraps table and column names in double quotes, for example `"ID"`. Quoted identifiers are case-sensitive in Snowflake, so column names must match the case stored in Snowflake exactly. Snowflake stores names created without quotes in uppercase, so a column created as `firstname` must be referenced as `FIRSTNAME`.

Columns picked from the column dropdowns already use the stored case. Take care with column names you type yourself, such as the keys in **Records to insert**, **Records to update**, and **Records to upsert**. The examples on this page use lowercase keys, which only match columns that were created with quoted lowercase names. For a table created without quotes, use uppercase keys such as `{ "ID": 101, "FIRSTNAME": "John" }`.
:::

### List Rows
Retrieves and displays rows from the selected table based on optional filters, sorting, and limits.

#### Required Parameter
- **Table**: Select the table from which rows need to be retrieved.

#### Optional Parameters
- **Filter**: Applies conditions to return only rows that match the specified criteria.
- **Sort**: Orders the returned rows based on one or more selected columns.
- **Aggregate**: Performs calculations such as count, sum, or average on selected columns.
- **Group by**: Groups rows that have the same values in specified columns to enable aggregation.
- **Limit**: Restricts the number of rows returned in the result.
- **Offset**: Skips a specified number of rows before starting to return results.

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/list-rows-gui.png" alt="Snowflake list rows gui" />

### Create Row
Insert a new row into the selected table by providing values for the required columns.

In the editor, ensure the **Columns** input is provided in `string` format.

#### Optional Parameter
- **Columns**: Specifies the table columns and their corresponding values to be inserted when creating a new row. If no columns are provided, the row is inserted with `DEFAULT VALUES`.

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/create-rows-gui.png" alt="Snowflake create rows gui" />

### Update Rows
Modify existing row values in the selected table based on the specified conditions or identifiers.

In the editor, ensure the **Columns** input is provided in `string` format.

#### Required Parameters
- **Filter**: Apply conditions to identify which row(s) should be updated. At least one filter condition is required. Without one, the query fails with `Update rows requires at least one filter condition`.
- **Columns**: Specify the column names and values to be updated in the selected row(s).

#### Optional Parameters
- **Allow this query to update multiple rows**: When enabled, the query can modify multiple rows at once. When disabled, the query fails with `Query matches more than one row. Enable "Allow this Query to modify multiple rows" to permit this.` if the filter matches more than one row.
- **Consider query that updates zero records as success**: When enabled, a query that matches no rows is still treated as successful. When disabled, the query fails with `No rows were updated.` if no row matches the filter.

Both toggles are off by default. The update runs in a transaction, so when a toggle's condition is violated, it is rolled back and no rows are changed. A successful query returns the number of affected rows as `rowsAffected`.

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/update-rows-gui.png" alt="Snowflake update rows gui" />

### Delete Rows
Removes the rows that match the specified filter conditions.

#### Required Parameter
- **Filter**: Specifies conditions to determine which rows should be deleted from the table. At least one filter condition is required. Without one, the query fails with `Delete rows requires at least one filter condition to prevent accidental mass deletions`.

#### Optional Parameters
- **Allow this query to delete multiple rows**: When enabled, the query can delete multiple rows at once. When disabled, the query fails with `Query matches more than one row. Enable "Allow this Query to modify multiple rows" to permit this.` if more than one row would be deleted.
- **Consider query that deletes zero records as success**: When enabled, a query that matches no rows is still treated as successful. When disabled, the query fails with `No rows were deleted.` if no row matches the filter.

Both toggles are off by default. The delete runs in a transaction, so when a toggle's condition is violated, it is rolled back and no rows are deleted.

Unlike some other SQL data sources, Snowflake's **Delete rows** operation has no **Limit** option, because Snowflake doesn't support `LIMIT` in `DELETE` statements. Use **Filter** to target the rows to delete.

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/delete-rows-gui.png" alt="Snowflake delete rows gui" />

### Upsert Row
Inserts a new row or updates an existing row if a matching primary key already exists. In the editor, ensure to the input the **Columns** in `string` format.

#### Required Parameters
- **Primary key column(s)**: One or more primary key columns used to detect conflicts. Enter a single column name, such as `id`, or an array for composite keys, such as `{{ ["id", "tenant_id"] }}`. At least one is required.
- **Columns**: Defines the column–value pairs that will be inserted or updated in the row.

#### Optional Parameters
- **Allow this query to upsert multiple rows**: When enabled, the query can affect multiple rows at once. When disabled, the query fails with `Query matches more than one row. Enable "Allow this Query to modify multiple rows" to permit this.` if more than one row is affected.
- **Consider query that upserts zero records as success**: When enabled, a query that affects no rows is still treated as successful. When disabled, the query fails with `No rows were upserted.` if no row is affected.

Both toggles are off by default. The upsert runs in a transaction, so when a toggle's condition is violated, it is rolled back.

#### How Upsert Works in Snowflake
ToolJet runs the upsert as a Snowflake `MERGE` statement that matches on the primary key column(s):
- **A row with the same primary key exists**: Only the non-primary-key columns you provide in **Columns** are updated. Other columns keep their current values.
- **No row with that primary key exists**: A new row is inserted with the columns you provide.
- **Only primary key columns are provided**: Existing rows aren't changed, and a new row is inserted if no match exists.
- **All primary key values are empty**: ToolJet skips the `MERGE` and runs a plain `INSERT` with the non-primary-key columns. Snowflake then fills the key, for example from a column default or identity. If no non-primary-key columns are provided either, the query fails with `No non-primary-key columns provided to insert`.

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/upsert-rows-gui.png" alt="Snowflake upsert rows gui" />

### Bulk Insert
Inserts multiple rows into the table using an array of records. All records are inserted in a single transaction. See [Transactions and batching](#transactions-and-batching-in-bulk-operations).

#### Required Parameter
- **Records to insert**: An array of row objects to insert. If a record doesn't include a column that other records in the same batch include, that column is inserted as `NULL` for the record.

<details id="tj-dropdown">
<summary>**Example Values**</summary>
```json
[
  { "id": 101, "firstname": "John", "email": "john.doe@example.com", "age": 28 },
  { "id": 102, "firstname": "Alice", "email": "alice.smith@example.com", "age": 32 },
  { "id": 103, "firstname": "Bob", "email": "bob.johnson@example.com", "age": 25 },
  { "id": 104, "firstname": "Emma", "email": "emma.brown@example.com", "age": 30 }
]
```
</details>

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/bulk-insert-gui.png" alt="Snowflake bulk insert gui" />

### Bulk Update using Primary Key
Updates multiple rows at once by matching each record with its corresponding primary key. All records are updated in a single transaction. See [Transactions and batching](#transactions-and-batching-in-bulk-operations).

#### Required Parameters
- **Primary key column(s)**: One or more primary key columns. Enter a single column name, such as `id`, or an array for composite keys, such as `{{ ["id", "tenant_id"] }}`.
- **Records to update**: An array of row objects to update. Each row must include all primary key column values and at least one column to update, otherwise the query fails with an error such as `Row 2 is missing primary key column "id"`.

<details id="tj-dropdown">
<summary>**Example Values**</summary>
```json
[
  { "id": 101, "firstname": "John Doe", "age": 29 },
  { "id": 102, "firstname": "Alice Smith", "age": 33 },
  { "id": 103, "firstname": "Bob Johnson", "age": 26 },
  { "id": 104, "firstname": "Emma Brow", "age": 30 }
]  
```
</details>

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/bulk-update-gui.png" alt="Snowflake bulk update gui" />

### Bulk Upsert using Primary Key
Inserts new rows or updates existing rows in bulk based on matching primary key values. All records are upserted in a single transaction. See [Transactions and batching](#transactions-and-batching-in-bulk-operations).

#### Required Parameters
- **Primary key column(s)**: One or more primary key columns used to detect conflicts. Enter a single column name, such as `id`, or an array for composite keys, such as `{{ ["id", "tenant_id"] }}`.
- **Records to upsert**: An array of row objects to insert or update. Each row must include all primary key column values.

Each record is upserted with a `MERGE` statement, following the same rules as [Upsert Row](#how-upsert-works-in-snowflake). If the row exists, the columns in the record are updated. If it doesn't, the record is inserted.

<details id="tj-dropdown">
<summary>**Example Values**</summary>
```json
[
  { "id": 101, "firstname": "John Michael", "age": 30 },
  { "id": 105, "firstname": "Taylor", "email": "taylor@example.com", "age": 27 },
  { "id": 106, "firstname": "Wilson", "email": "wilson@example.com", "age": 35 }
]
```
</details>

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/snowflake/bulk-upsert-gui.png" alt="Snowflake bulk update gui" />

### Transactions and Batching in Bulk Operations

**Bulk insert**, **Bulk update using primary key**, and **Bulk upsert using primary key** run all of their statements inside a single transaction. If any statement fails, the whole operation is rolled back and no records are written. The query either applies every record or none of them.

You don't need to split large arrays yourself. ToolJet automatically splits the records into batches so that no statement exceeds Snowflake's limit of 16,384 bound parameters. The number of records per batch is 16,384 divided by the number of columns in the records. For example, records with 8 columns are inserted in batches of 2,048. All batches still run in the same transaction.

**Bulk insert** sends one multi-row `INSERT` statement per batch. **Bulk update using primary key** and **Bulk upsert using primary key** send one statement per record. Each operation returns the total number of affected rows as `rowsAffected`.

:::tip
Query results can be transformed using transformations. Read our [transformations](/docs/app-builder/custom-code/transform-data) documentation to learn more.
:::