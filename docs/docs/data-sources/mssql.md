---
id: mssql
title: MS SQL Server / Azure SQL Databases
---

ToolJet can connect to MS SQL Server & Azure SQL databases to read and write data. 

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the MS SQL Server data source, click on the **+ Add new Data source** button located on the query panel or navigate to the [Data Sources](/docs/data-sources/overview) page from the ToolJet dashboard.

:::info
Please make sure the **Host/IP** of the database is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please **whitelist** our IP.
:::

ToolJet requires the following to connect to your PostgreSQL database.

- **Host**
- **Port**
- **Username**
- **Password**
- **Connection Options**
- **Azure**  (Select this option if you are using Azure SQL databases)

**Note:** It is recommended to create a new database user so that you can control the access levels of ToolJet. 

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/datasource-reference/mssql/connect-v2.png" alt="ToolJet - Redis connection"/>

### Connection Options

You can add optional configurations in **key-value pairs** for the MS SQL data source connection. 

#### Example:
| Key                     | Value   |
|:------------------------|:--------|
| trustServerCertificate  | true    |

These options allow you to fine-tune the connection, such as enabling encryption when using a self-signed certificate.

### Enabling Encryption with a Self-Signed Certificate

To enhance security during data transfer, encryption can be enabled even with a self-signed certificate.

#### Server-Side Configuration
1. **Create and Install a Self-Signed Certificate:**
   - Generate a self-signed certificate and install it on the SQL Server instance.
2. **Force Encryption:**
   - Configure the SQL Server instance to force encrypted connections.
   - For Azure SQL databases, turn on the **Encryption** toggle in the Azure portal.

#### Client-Side Configuration
1. Set the connection option `trustServerCertificate` to `true`.
   - This bypasses certificate chain validation and is necessary when using a self-signed certificate.

</div>

<div style={{paddingTop:'24px'}}>

## Querying in SQL Mode

SQL mode can be used to query MS SQL Server / Azure SQL Databases using SQL queries.  

1. Create a new query and select the MS SQL data source.
2. Select **SQL mode** from the dropdown.
3. Enter the SQL query in the editor.
4. Click on the **Run** button to run the query.

#### Example
```sql
SELECT * FROM users
```

<img className="screenshot-full" src="/img/datasource-reference/mssql/sql mode.png" alt="ToolJet mssql sql mode" style={{marginBottom:'15px'}}/>

### Parameterized Queries

ToolJet offers support for parameterized SQL queries, which enhance security by preventing SQL injection and allow for dynamic query construction. To implement parameterized queries:

1. Use `:parameter_name` as placeholders in your SQL query where you want to insert parameters.
2. In the **Parameters** section below the query editor, add key-value pairs for each parameter.
3. The keys should match the parameter names used in the query (without the colon).
4. The values can be static values or dynamic values using the `{{ }}` notation.

<div style={{textAlign: 'center'}}>
<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/datasource-reference/mssql/parameterized-query.png" alt="Postgresql parameterized SQL queries"/>
</div>

#### Example:
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

</div>

<div style={{paddingTop:'24px'}}>

## Querying in GUI Mode

GUI mode can be used to query MS SQL Server / Azure SQL Databases without writing queries.

1. Create a new query and select the MS SQL data source.
2. Select **GUI mode** from the dropdown.
3. Choose the operation **Bulk update using the primary key**.
4. Enter the **Table** name and **Primary key** column name. 
5. In the editor, enter the records in the form of an array of objects. 
6. Click on the **Run** button to run the query.

#### Example
```json
{{ [ {id: 1, channel: 33}, {id: 2, channel: 24} ] }}
```

<img className="screenshot-full" src="/img/datasource-reference/mssql/gui mode.png" alt="ToolJet mssql gui mode"/>

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/docs/tutorial/transformations)
:::

</div>
