---
id: postgresql
title: PostgreSQL
---

ToolJet has the capability to connect to PostgreSQL databases for data retrieval and modification.

## Establishing a Connection

To establish a connection with the PostgreSQL global datasource, you can take either of the following steps: click on the "Add new global datasource" button in the query panel, or access the [Global Datasources](/docs/data-sources/overview) page through the ToolJet dashboard.

ToolJet offers two connection types to connect to your PostgreSQL database:

- **Manual connection**
- **Connection string**

### Manual connection

To connect to PostgreSQL using Manual connection parameters, select **Manual connection** as the connection type and provide the following details:

- **Host**
- **Port**
- **SSL**
- **Database Name**
- **Username**
- **Password**
- **Connection Options**
- **SSL Certificate**

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/datasource-reference/postgresql/pgconnection-v2.png" alt="PG connection"/>
</div>

### Connection string

To connect to PostgreSQL using a connection string, select **Connection String** as the connection type and provide the following details:

- **Connection String**

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/datasource-reference/postgresql/pgconnection-string.png" alt="PG connection string"/>
</div>

We recommend creating a new PostgreSQL database user to have control over ToolJet's access levels.

:::caution
Ensure that the host/IP of the database is accessible from your VPC in case you are using self-hosted ToolJet. If you are using ToolJet cloud, please whitelist our IP.
:::

Click the **Test connection** button to verify the correctness of the credentials and the accessibility of the database to ToolJet server. Click the **Save** button to save the data source.

## Querying PostgreSQL

Click on `+Add` button on the query panel and select the PostgreSQL from the global datasources. 

PostgreSQL query editor has two modes, **SQL** & **GUI**. **[SQL mode](/docs/data-sources/postgresql#sql-mode)** can be used to write raw SQL queries and **[GUI mode](/docs/data-sources/postgresql#gui-mode)** can be used to query your PostgreSQL database without writing queries.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/postgresql/newquery.png" alt="PG connection"/>

</div>

#### SQL Mode

To execute SQL queries, select the SQL mode from the dropdown and enter your query in the editor. Click the `Run` button to execute the query.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/postgresql/sql1.png" alt="PG connection"/>

</div>

#### **Parameterized queries**:

ToolJet offers support for parameterized SQL queries, which enhance security by preventing SQL injection and allow for dynamic query construction. To implement parameterized queries:

1. Use `:parameter_name` as placeholders in your SQL query where you want to insert parameters.
2. In the **Parameters** section below the query editor, add key-value pairs for each parameter.
3. The keys should match the parameter names used in the query (without the colon).
4. The values can be static values or dynamic values using the `{{ }}` notation.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/datasource-reference/postgresql/parameterized-query.png" alt="Postgresql parameterized SQL queries"/>
</div>

**Example:**
```yaml
Query: SELECT * FROM users WHERE username = :username
SQL Parameters:
  Key: username
  Value: oliver // or {{ components.username.value }}
```

#### GUI Mode

Choose the GUI mode from the dropdown and select the operation **Bulk update using primary key**. Provide the **Table** name and the **Primary key column** name. Then, in the editor, input the **records** as an array of objects.

Here is an example of records for a bulk update using the provided format:

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

Please note that the records should be enclosed within square brackets `[]`, and each record should be represented as an object with key-value pairs.

Click the `Run` button to execute the query.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/postgresql/gui1.png" alt="PG connection"/>

</div>

:::tip
- You can apply transformations to the query results. Refer to our transformations documentation for more details: **[link](/docs/tutorial/transformations)**
- Check out this how-to guide on **[bulk updating multiple rows](/docs/how-to/bulk-update-multiple-rows)** from a table component.
:::
