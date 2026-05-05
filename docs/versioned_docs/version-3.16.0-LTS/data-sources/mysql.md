---
id: mysql
title: MySQL
---

ToolJet can connect to MySQL databases to read and write data.

## Connection

To establish a connection with the MySQL data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard. ToolJet supports both **Static** and **Dynamic** MySQL connections. Along with configuring fixed connection details at the datasource level, you can also define certain connection parameters dynamically from the query builder at runtime.

### Static Connection

<img className="screenshot-full img-full" src="/img/datasource-reference/mysql/connection-v4.png" alt="MySQL data source"/>

### Dynamic Connection 

Dynamic connection allows specific MySQL connection parameters to be provided at runtime from the query builder, enabling flexible and dynamic database access.

<img className="screenshot-full img-full" src="/img/datasource-reference/mysql/query-host.png" alt="mysql dynamic host"/>

:::info
Please make sure the **Host/IP** of the database is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please **whitelist** our IP.
:::

**ToolJet requires the following to connect to your MySQL database:**

- Username
- Password
- Database Name
- Connection Type

If you are using **Hostname** as the connection type, you will need to provide the following information:

- Host/IP
- Port
- SSL
- SSL Certificate:
  - CA Certificate
  - Self-signed Certificate
  - None

If you are using **Socket** as the connection type, you will need to provide the following information:
- **Socket Path**

**Note:** It is recommended to create a new MySQL database user so that you can control the access levels of ToolJet.

### SSH Tunnelling 

ToolJet now supports SSH tunnelling for the MySQL data source, allowing secure connections to databases hosted inside private networks.This can be used to:
- Access private databases
- Improve security
- Enable encrypted communication
- Avoid firewall rule changes

#### SSH Configuration

To securely connect to a private MySQL database using SSH tunnelling:

1. Enable the **SSH tunnel** toggle in the MySQL data source configuration.
2. Provide the following details:
   - **SSH host** – Server hostname or IP address.
   - **SSH port** – Port number (default: `22`).
   - **SSH username** – Username for the SSH server.
   - **Authentication method** – Choose either:
     - **Private key**
     - **Password**

Once configured, ToolJet establishes a secure SSH connection. All MSSQL queries are routed through this encrypted tunnel.

<img className="screenshot-full img-full" src="/img/datasource-reference/mssql/ssh-tunnel.png" alt="Mysql SSH tunnelling connection" />

## Querying in SQL Mode

SQL mode can be used to query MySQL database using SQL queries.

1. Create a new query and select the MySQL data source.
2. Select **SQL mode** from the dropdown.
3. Enter the SQL query in the editor.
4. Click on the **Run** button to run the query.

**Example:**

```sql
SELECT * FROM users
```

<img className="screenshot-full" src="/img/datasource-reference/mysql/query-sql.png" alt="mysql querying"/>

### Parameterized Queries

ToolJet offers support for parameterized SQL queries, which enhance security by preventing SQL injection and allow for dynamic query construction. To implement parameterized queries:

1. Use `:parameter_name` as placeholders in your SQL query where you want to insert parameters.
2. In the **Parameters** section below the query editor, add key-value pairs for each parameter.
3. The keys should match the parameter names used in the query (without the colon).
4. The values can be static values or dynamic values using the `{{ }}` notation.

<img className="screenshot-full img-full" src="/img/datasource-reference/mysql/param-query-v2.png" alt="mysql parameter querying"/>

##### Example:

```yaml
Query: SELECT * FROM users WHERE username = :username
```
SQL Parameters:
- Key: username
- Value: oliver or `{{ components.username.value }}`

### Row Level Security

In ToolJet, you can set up server-side row-level security to restrict access to specific rows based on custom groups or default user roles. Refer to the [Setup Row Level Security](/docs/app-builder/dynamic-access-rule/row-level-security) guide for more information.

### Query Timeout

You can set the timeout duration for SQL queries by adding the `PLUGINS_SQL_DB_STATEMENT_TIMEOUT` variable to the environment configuration file. By default, it is set to 120,000 ms.

### MySQL Dynamic Functions and System Variables

MySQL offers dynamic functions and system variables that provide real-time information about the current database, user session, connection, and server environment. These can help you write queries that automatically adapt to different environments without hardcoding values.

| Function / Variable | Description                                                       | Example Output       |
| ------------------- | ----------------------------------------------------------------- | -------------------- |
| `DATABASE()`        | Returns the name of the current database in use                   | `tooljet_db`         |
| `USER()`            | Returns the current MySQL user account (user\@host)               | `app_user@localhost` |
| `CURRENT_USER()`    | Returns the authenticated user account (can differ from `USER()`) | `app_user@%`         |
| `VERSION()`         | Returns the MySQL server version                                  | `8.0.33`             |
| `@@hostname`        | Returns the MySQL server hostname                                 | `db-server-01`       |
| `@@port`            | Returns the MySQL server port number                              | `3306`               |
| `CONNECTION_ID()`   | Returns the connection ID for the current session                 | `123456`             |

## Querying in GUI Mode

GUI mode can be used to query MySQL database without writing queries.

1. Create a new query and select the MySQL data source.
2. Select **GUI mode** from the dropdown.
3. Choose the operation you want to perform.
4. Fetch and select the **Table name**.
5. Click on the **Preview** button to view the output or click on **Run** button to trigger the query.

### List Rows
Retrieve records from the selected table with optional filtering, sorting, and pagination options.

#### Required Parameter
- **Table**: Select the table from which rows need to be retrieved.

#### Optional Parameters
- **Filter**: Apply conditions to return only rows that match specific criteria.
- **Sort**: Arrange the returned rows in ascending or descending order based on selected columns.
- **Aggregate**: Apply aggregate functions such as count, sum, average, minimum, or maximum on selected columns.
- **Group by**: Group rows that share the same values in selected columns into summarized results.
- **Limit**: Restricts the number of rows returned in the result.
- **Offset**: Skips a specified number of rows before starting to return results.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/mysql/listrow-gui.png" alt="Mysql List Rows GUI"/>

### Create Rows
Insert a new row into the selected table by providing values for the required columns.

In the editor, ensure the **Columns** input is provided in `string` format.

#### Required Parameters
- **Columns**: Specifies the table columns and their corresponding values to be inserted when creating a new row. 

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/mysql/createrow-gui.png" alt="Mysql Create Rows GUI"/>

### Update Rows
Modify existing row values in the selected table based on the specified conditions or identifiers.

In the editor, ensure the **Columns** input is provided in `string` format.

#### Required Parameters
- **Columns**: Specify the column names and values to be updated in the selected row(s).

#### Optional Parameters
- **Filter**: Apply conditions to identify which row(s) should be updated.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/mysql/updaterow-gui.png" alt="Mysql Update Rows GUI"/>

### Delete Rows
Remove one or more rows from the selected table that match the given conditions.

#### Optional Parameters
- **Filter**: Apply conditions to specify which row(s) should be deleted.
- **Limit**: Specify the maximum number of rows to delete.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/mysql/deleterow-gui.png" alt="Mysql Delete Rows GUI"/>

### Upsert Rows
Insert a new row or update an existing row if a matching primary or unique key already exists.

In the editor, ensure the **Columns** input is provided in `string` format.

#### Required Parameters
- **Primary key column(s)**: Specifies the column(s) used to identify whether a row already exists for updating or if a new row should be inserted.
- **Columns**: Provide the column names and values to be inserted or updated.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/mysql/upsertrow-gui.png" alt="Mysql Upsert Rows GUI"/>

### Bulk Insert
Inserts multiple rows into the table in a single operation using an array of records.

#### Required Parameters
- **Table** : Select the table into which multiple rows need to be inserted.
- **Records to insert**: Provide the set of rows and corresponding column values to be inserted in a single operation.

<details id="tj-dropdown">
<summary>**Example Values**</summary>
```json
{{ [
  { id: 25, firstname: 'secondupdate' },
  { id: 26, firstname: 'john' },
  { id: 16, firstname: 'doe' },
  { id: 17, firstname: 'alice' },
  { id: 18, firstname: 'bob' },
  { id: 19, firstname: 'charlie' },
  { id: 20, firstname: 'david' },
  { id: 21, firstname: 'emma' },
  { id: 22, firstname: 'frank' },
  { id: 23, firstname: 'grace' },
  { id: 24, firstname: 'henry' }
] }}
```
</details>

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/mysql/bulk-insert-gui.png" alt="Mysql Bulk Insert GUI"/>

### Bulk Update using Primary Key
Update multiple existing rows at once by matching records using their primary key values.

#### Required Parameters
- **Primary key column(s)**: Specify the primary key column(s) used to identify the rows that need to be updated.
- **Records to update**: Provide multiple records with updated column values for the matching primary key rows. 

<details id="tj-dropdown">
<summary>**Example Values**</summary>
```json
{{ [
  { id: 14, firstname: 'updated_secondupdate' },
  { id: 15, firstname: 'updated_john' },
  { id: 16, firstname: 'updated_doe' },
  { id: 17, firstname: 'updated_alice' },
  { id: 18, firstname: 'updated_bob' }
] }}
```
</details>

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/mysql/bulk-update-pk-gui.png" alt="Mysql Bulk Update key GUI"/>

### Bulk Upsert using Primary Key
Insert multiple new rows or update existing ones by matching rows using primary key values.

#### Required Parameters
- **Primary key column(s)**: Specify the primary key column(s) used to determine whether each record should be updated or inserted.
- **Records to upsert**: Provide multiple records that will be inserted as new rows or updated if matching primary key values already exist.

In this operation, if a row with the matching primary key exists, it is updated; otherwise, a new row is inserted.

<img style={{marginBottom:'15px'}} className="screenshot-full img-full" src="/img/datasource-reference/mysql/bulk-upsert-pk-gui.png" alt="Mysql Bulk Upsert key GUI"/>

:::tip
Query results can be transformed using transformations. Learn more about transformations [here](/docs/app-builder/custom-code/transform-data).
:::
