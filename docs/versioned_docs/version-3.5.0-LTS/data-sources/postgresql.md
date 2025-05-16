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

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **PostgreSQL** datasource.
3. Select the SQL query mode from the dropdown and enter the query.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

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

### Query Timeout

You can set the timeout duration for SQL queries by adding the `PLUGINS_SQL_DB_STATEMENT_TIMEOUT` variable to the environment configuration file. By default, it is set to 120,000 ms.

</div>

<div style={{paddingTop:'24px'}}>

## Querying in GUI Mode

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **PostgreSQL** datasource.
3. Select the GUI mode from the dropdown.
4. Select the operation **Bulk update using primary key**.
5. Provide the **Table** name and the **Primary key column** name.
6. Then, in the editor, input the **records** as an array of objects.
7. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

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
- You can apply transformations to the query results. Refer to our transformations documentation for more details: **[Transformation Tutorial](/docs/tutorial/transformations)**
- Check out this how-to guide on **[bulk updating multiple rows](/docs/how-to/bulk-update-multiple-rows)** from a table component.
:::

</div>
