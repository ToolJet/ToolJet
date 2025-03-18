---
id: marketplace-plugin-Presto
title: PrestoDB
---

# PrestoDB

ToolJet allows you to connect to your PrestoDB database to perform SQL queries and retrieve data.

## Connection

To connect to a PrestoDB data source in ToolJet, you can either click the **+Add new data source** button on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page in the ToolJet dashboard.

To connect to your PrestoDB database, the following details are required:
- **Username**
- **Password**
- **Catalog**
- **Host**
- **Port**
- **Schema**
- **User**
- **Timezone** (optional)
- **Extra Headers** (optional)

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/prestodb/connect.png" alt="PrestoDB Connect" />
</div>

## Querying PrestoDB

1. Click the **+** button in the query manager at the bottom of the editor and select the PrestoDB data source added earlier.
2. Write your SQL query in the query editor.

:::tip
Query results can be transformed using transformations. Refer to our transformations documentation for more details: **[link](/docs/tutorial/transformations)**
:::

## Supported Operations

ToolJet supports executing SQL queries on PrestoDB databases.

### SQL Query

This operation allows you to execute SQL queries on your PrestoDB database.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/prestodb/query.png" alt="PrestoDB Query"/>
</div>

#### Parameters:
- **SQL Query**: The SQL query to execute.

#### Example:
```sql
SELECT * FROM my_table WHERE column_name = 'value' LIMIT 10
```