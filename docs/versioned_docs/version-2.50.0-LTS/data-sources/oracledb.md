---
id: oracledb
title: Oracle DB
---

# Oracle DB

ToolJet can connect to Oracle databases to read and write data.

## Connection

To establish a connection with the Oracle DB data source you can either click on the `+Add new` button in the query panel, or navigate to the [Data Sources](https://docs.tooljet.com/docs/data-sources/overview) page from the ToolJet dashboard.

### Required Credentials

- **Host**
- **Port**
- **SID / Service Name** (Database name must be a SID / Service Name)
- **Database Name**
- **SSL**
- **Username**
- **Password**
- **Client Library Path**


<div style={{textAlign: 'center'}}>
![ToolJet - Data source - OracleDB](/img/datasource-reference/oracledb/oracleauth-v3.png)
</div>

:::info
ToolJet includes Oracle Instant Client versions 21.10 and 11.2. If you need to use a different client library version:
- For cloud deployments: You can add a custom client library to a directory of your choice or mount it as a volume in the container.
- For local setups: You can specify the path to your custom Oracle Client Library.

This allows ToolJet to locate and use the specific drivers for Oracle database connections.
:::

Click on **Test connection** to verify if the credentials are correct and the database is accessible to ToolJet server. Click on **Save** button to save the data source.

### Client Versions and Compatibility

ToolJet runs Oracle DB connections in thick mode. By default, ToolJet includes Oracle instant client versions 21.10 and 11.2. These client versions determine which Oracle Database versions you can connect to.

#### Available Client Versions
- Oracle Instant Client 21.10
- Oracle Instant Client 11.2

#### Compatibility
The instant client version affects which Oracle Database versions you can connect to:

- Oracle Instant Client 21.10 is compatible with Oracle Database 11.2 and later versions.
- Oracle Instant Client 11.2 is compatible with Oracle Database 10.2 and later versions.


## Querying Oracle DB

Once you have added an Oracle DB data source, click on the  `+` button of the query manager to create a new query. There are two modes by which you can query SQL:

  1. **[SQL mode](/docs/data-sources/oracledb#sql-mode)**
  2. **[GUI mode](/docs/data-sources/oracledb#gui-mode)**

#### SQL mode

SQL mode can be used to write raw SQL queries.
  1. Select SQL mode from the dropdown.
  2. Enter the SQL query in the editor.
  3. Click on the `run` button to execute the query.

#### GUI mode

GUI mode can be used to query Oracle database without writing queries.

  1. Select GUI mode from the dropdown.
  2. Choose the operation **Bulk update using primary key**.
  3. Enter the **Table** name and **Primary key** column name.
  4. In the editor, enter the records in the form of an array of objects. Example:
  ```json
  [
    {
      "id": 1,
      "channel": 33
    },
    {
      "id": 2,
      "channel": 24
    }
  ]
  ```
  5. Click on the `run` button to execute the query.

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: **[link](/docs/tutorial/transformations)**
:::
