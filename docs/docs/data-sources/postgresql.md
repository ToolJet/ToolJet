---
id: postgresql
title: PostgreSQL
---

ToolJet has the capability to connect to PostgreSQL databases for data retrieval and modification.

<div style={{paddingTop:'24px'}}>

## Establishing a Connection

To establish a connection with the PostgreSQL data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page from the ToolJet dashboard and choose PostgreSQL as the data source.

ToolJet offers two connection types to connect to your PostgreSQL database:

- **[Manual connection](#manual-connection)**
- **[Connection string](#connection-string)**

### Manual Connection

To connect to PostgreSQL using Manual connection parameters, select **Manual connection** as the connection type and provide the following details:

- **Host**
- **Port**
- **SSL**
- **Database Name**
- **Username**
- **Password**
- **Connection Options**
- **SSL Certificate**

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/datasource-reference/postgresql/pgconnection-v2.png" alt="PG connection"/>

### Connection String

To connect to PostgreSQL using a connection string, select **Connection String** as the connection type and provide the following details:

- **Connection String**

<img className="screenshot-full" src="/img/datasource-reference/postgresql/pgconnection-string.png" alt="PG connection string"/>

<br/><br/>

**Note:** We recommend creating a new PostgreSQL database user to have control over ToolJet's access levels.

:::info
Please make sure the **Host/IP** of the database is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please **whitelist** our IP.
:::

</div>

<div style={{paddingTop:'24px'}}>

## Querying in SQL Mode

1. Create a new query and select the PostgreSQL data source.
2. Select the SQL query mode from the dropdown and enter the query.
3. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/postgresql/sql-v2.png" alt="PG connection"/>

### Parameterized Queries

ToolJet offers support for parameterized SQL queries, which enhance security by preventing SQL injection and allow for dynamic query construction. To implement parameterized queries:

1. Use `:parameter_name` as placeholders in your SQL query where you want to insert parameters.
2. In the **Parameters** section below the query editor, add key-value pairs for each parameter.
3. The keys should match the parameter names used in the query (without the colon).
4. The values can be static values or dynamic values using the `{{ }}` notation.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/datasource-reference/postgresql/parameterized-query.png" alt="Postgresql parameterized SQL queries"/>

#### Example:

```yaml
Query: SELECT * FROM users WHERE username = :username
```
SQL Parameters: <br/>
- Key: username <br/>
- Value: oliver or `{{ components.username.value }}`

### Row Level Security

In ToolJet, you can set up server-side row-level security to restrict access to specific rows based on custom groups or default user roles. Refer to the [Setup Row Level Security](#) guide for more information.

### Query Timeout

You can set the timeout duration for SQL queries by adding the `PLUGINS_SQL_DB_STATEMENT_TIMEOUT` variable to the environment configuration file. By default, it is set to 120,000 ms.

### PostgreSQL Dynamic Functions and System Variables

PostgreSQL offers dynamic functions that provide runtime information about the current session, connection, database, and server settings. These can help you write queries that automatically adapt to different environments without hardcoding values.

| Function / Variable  | Description                                                           | Example Output                              |
| -------------------- | --------------------------------------------------------------------- | ------------------------------------------- |
| `current_database()` | Returns the name of the current database                              | `tooljet_db`                                |
| `current_user`       | Returns the name of the current user                                  | `app_user`                                  |
| `session_user`       | Returns the session user (same as `current_user` unless role changes) | `app_user`                                  |
| `version()`          | Returns the PostgreSQL server version                                 | `PostgreSQL 15.3 on x86_64-pc-linux-gnu...` |
| `inet_server_addr()` | Returns the IP address of the server                                  | `192.168.1.10`                              |
| `inet_server_port()` | Returns the server port                                               | `5432`                                      |
| `pg_backend_pid()`   | Returns the process ID of the current backend                         | `56789`                                     |

</div>

<div style={{paddingTop:'24px'}}>

## Querying in GUI Mode

1. Create a new query and select the PostgreSQL data source.
2. Select the GUI mode from the dropdown.
3. Select the operation **Bulk update using primary key**.
4. Provide the **Table** name and the **Primary key column** name.
5. Then, in the editor, input the **records** as an array of objects.
6. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

<img className="screenshot-full" src="/img/datasource-reference/postgresql/gui-v2.png" alt="PG connection"/>

```json
[
  {
    "customer_id": 1,
    "country": "India"
  },
  {
    "customer_id": 2,
    "country": "USA"
  }
]
```

:::tip

- You can apply transformations to the query results. Refer to our transformations documentation for more details: **[Transformation Tutorial](/docs/beta/app-builder/custom-code/transform-data)**
- Check out this how-to guide on **[bulk updating multiple rows](/docs/how-to/bulk-update-multiple-rows)** from a table component.
  :::

</div>
