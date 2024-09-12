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
- **Azure**  (Select this option if you are using Azure SQL databases)

**Note:** It is recommended to create a new database user so that you can control the access levels of ToolJet. 

<img className="screenshot-full" src="/img/datasource-reference/mssql/connect.png" alt="ToolJet mssql"/>


</div>

<div style={{paddingTop:'24px'}}>

## Querying SQL Server / Azure SQL Databases

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the database added in the previous step as the data source. 

Once the SQL data source is added, you can create queries to read and write data to the database. You can create queries from the **[Query Panel](/docs/app-builder/query-panel#query-manager)** located at the bottom panel of the app builder.

### SQL Mode

SQL mode can be used to query MS SQL Server / Azure SQL Databases using SQL queries. 

1. Select **SQL mode** from the dropdown.
2. Enter the SQL query in the editor.
3. Click on the **Run** button to run the query.

#### Example
```sql
SELECT * FROM users
```

<img className="screenshot-full" src="/img/datasource-reference/mssql/sql mode.png" alt="ToolJet mssql sql mode" style={{marginBottom:'15px'}}/>

### GUI Mode

GUI mode can be used to query MS SQL Server / Azure SQL Databases without writing queries.

1. Select **GUI mode** from the dropdown.
2. Choose the operation **Bulk update using the primary key**.
3. Enter the **Table** name and **Primary key** column name. 
4. In the editor, enter the records in the form of an array of objects. 
5. Click on the **Run** button to run the query.

#### Example
```json
{{ [ {id: 1, channel: 33}, {id: 2, channel: 24} ] }}
```

<img className="screenshot-full" src="/img/datasource-reference/mssql/gui mode.png" alt="ToolJet mssql gui mode"/>

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/docs/tutorial/transformations)
:::

</div>
