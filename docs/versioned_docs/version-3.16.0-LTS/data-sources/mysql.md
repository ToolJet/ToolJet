---
id: mysql
title: MySQL
---

ToolJet can connect to MySQL databases to read and write data.

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the MySQL data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

<img className="screenshot-full" src="/img/datasource-reference/mysql/addmysql.gif" alt="MySQL data source"/>

:::info
Please make sure the **Host/IP** of the database is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please **whitelist** our IP.
:::

**ToolJet requires the following to connect to your MySQL database:**

- **Username**
- **Password**
- **Database Name**
- **Connection Type**

If you are using **Hostname** as the connection type, you will need to provide the following information:

- **Host/IP**
- **Port**
- **SSL**
- **SSL Certificate**:
  - **CA Certificate**
  - **Self-signed Certificate**
  - **None**

If you are using **Socket** as the connection type, you will need to provide the following information:

- **Socket Path**

**Note:** It is recommended to create a new MySQL database user so that you can control the access levels of ToolJet.

<img className="screenshot-full" src="/img/datasource-reference/mysql/mysqlconnect-v2.png" alt="mysql"/>

</div>

<div style={{paddingTop:'24px'}}>

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

<img className="screenshot-full" src="/img/datasource-reference/mysql/sqlmode.png" alt="mysql" style={{marginBottom:'15px'}}/>

### Parameterized Queries

ToolJet offers support for parameterized SQL queries, which enhance security by preventing SQL injection and allow for dynamic query construction. To implement parameterized queries:

1. Use `:parameter_name` as placeholders in your SQL query where you want to insert parameters.
2. In the **Parameters** section below the query editor, add key-value pairs for each parameter.
3. The keys should match the parameter names used in the query (without the colon).
4. The values can be static values or dynamic values using the `{{ }}` notation.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/datasource-reference/mysql/parameterized-query.png" alt="mysql"/>

##### Example:

```yaml
Query: SELECT * FROM users WHERE username = :username
```
SQL Parameters:
- Key: username
- Value: oliver // or `{{ components.username.value }}`

### Row Level Security

In ToolJet, you can set up server-side row-level security to restrict access to specific rows based on custom groups or default user roles. Refer to the [Setup Row Level Security](#) guide for more information.

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
3. Choose the operation **Bulk update using primary key**.
4. Enter the **Table** name and **Primary key column** name.
5. In the editor enter the records in the form of an array of objects.
6. Click on the **Run** button to run the query.

**Example:**

```json
{{ [ {id: 1, channel: 33}, {id:2, channel:24} ] }}
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/mysql/guinew.png" alt="mysql"/>

</div>

:::tip
Query results can be transformed using transformations. Learn more about transformations [here](/docs/beta/app-builder/custom-code/transform-data).
:::

</div>
