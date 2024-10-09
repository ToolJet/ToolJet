---
id: postgresql
title: PostgreSQL
---

ToolJet has the capability to connect to PostgreSQL databases for data retrieval and modification.

<div style={{paddingTop:'24px'}}>

## Establishing a Connection

To establish a connection with the PostgreSQL data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page from the ToolJet dashboard and choose PostgreSQL as the data source.

ToolJet requires the following information to connect to your PostgreSQL database:

- **Host**
- **Port**
- **SSL**
- **Database Name**
- **Username**
- **Password**
- **Connection Options**
- **SSL Certificate**

**Note:** We recommend creating a new PostgreSQL database user to have control over ToolJet's access levels.

:::info
Please make sure the **Host/IP** of the database is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please **whitelist** our IP.
:::

<img className="screenshot-full" src="/img/datasource-reference/postgresql/pgconnection.png" alt="PG connection"/>

</div>

<div style={{paddingTop:'24px'}}>

## Querying PostgreSQL

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **PostgreSQL** datasource added in previous step.
3. Select the query mode from the dropdown and enter the query.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

<img className="screenshot-full" src="/img/datasource-reference/postgresql/newquery.png" alt="PG connection" style={{marginBottom:'15px'}}/>

### SQL Mode

To execute SQL queries, select the SQL mode from the dropdown and enter your query in the editor.

<img className="screenshot-full" src="/img/datasource-reference/postgresql/sql-v2.png" alt="PG connection"/>

```sql
SELECT * FROM CUSTOMER
```

### GUI Mode

Choose the GUI mode from the dropdown and select the operation **Bulk update using primary key**. Provide the **Table** name and the **Primary key column** name. Then, in the editor, input the **records** as an array of objects.

<img className="screenshot-full" src="/img/datasource-reference/postgresql/gui-v2.png" alt="PG connection"/>

```sql
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
