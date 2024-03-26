---
id: oracledb
title: Oracle DB
---

# Oracle DB

ToolJet can connect to Oracle databases to read and write data. 

## Connection

To establish a connection with the Oracle DB data source, click on the `+Add new` button located on the query panel or navigate to the [Data Sources](https://docs.tooljet.com/docs/data-sources/overview) page from the ToolJet dashboard.

A Oracle DB can be connected with the following credentials:
- **Host**
- **Port**
- **SID / Service Name** ( Database name must be a SID / Service Name )
- **Database Name**
- **SSL**
- **Username**
- **Password**
- **Client Library Path** ( Only required for local setup )

<div style={{textAlign: 'center'}}>

![ToolJet - Data source - OracleDB](/img/datasource-reference/oracledb/oracleauth-v2.png)

</div>

Click on **Test connection** button to verify if the credentials are correct and that the database is accessible to ToolJet server. Click on **Save** button to save the data source.

## Querying Oracle DB

Once you have added a Oracle DB data source, click on `+` button of the query manager to create a new query. There are two modes by which you can query SQL:

  1. **[SQL mode](/docs/data-sources/oracledb#sql-mode)**
  2. **[GUI mode](/docs/data-sources/oracledb#gui-mode)**

#### SQL mode

SQL mode can be used to write raw SQL queries. Select SQL mode from the dropdown and enter the SQL query in the editor. Click on the `run` button to run the query.


#### GUI mode

GUI mode can be used to query Oracle database without writing queries. Select GUI mode from the dropdown and then choose the operation **Bulk update using primary key**. Enter the **Table** name and **Primary key column** name. Now, in the editor enter the records in the form of an array of objects. 

**Example**: `{{ [ {id: 1, channel: 33}, {id:2, channel:24} ] }}`

Click on the **run** button to run the query. **NOTE**: Query should be saved before running.

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: **[link](/docs/tutorial/transformations)**
:::
