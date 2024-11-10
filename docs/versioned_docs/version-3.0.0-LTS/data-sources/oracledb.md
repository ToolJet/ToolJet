---
id: oracledb
title: Oracle DB
---

ToolJet can connect to Oracle databases to read and write data.

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the OracleDB datasource, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

ToolJet requires the following to connect to a OracleDB datasource:

- **Host**
- **Port**
- **SID / Service Name** (Database name must be a SID / Service Name)
- **Database Name**
- **SSL**
- **Username**
- **Password**
- **Client Library Path**

<img className="screenshot-full" src="/img/datasource-reference/oracledb/oracleauth-v3.png" alt="ToolJet - Data source - OracleDB" />

:::info
ToolJet includes Oracle Instant Client versions 21.10 and 11.2. If you need to use a different client library version:
- For cloud deployments: You can add a custom client library to a directory of your choice or mount it as a volume in the container.
- For local setups: You can specify the path to your custom Oracle Client Library.

This allows ToolJet to locate and use the specific drivers for Oracle database connections.
:::

### Client Versions and Compatibility

ToolJet runs Oracle DB connections in thick mode. By default, ToolJet includes Oracle instant client versions 21.10 and 11.2. These client versions determine which Oracle Database versions you can connect to.

#### Available Client Versions
- Oracle Instant Client 21.10
- Oracle Instant Client 11.2

#### Compatibility
The instant client version affects which Oracle Database versions you can connect to:

- Oracle Instant Client 21.10 is compatible with Oracle Database 11.2 and later versions.
- Oracle Instant Client 11.2 is compatible with Oracle Database 10.2 and later versions.


</div>

<div style={{paddingTop:'24px'}}>

## Querying Oracle DB

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **OracleDB** datasource added in previous step.
3. Select the desired query mode.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

</div>

<div style={{paddingTop:'24px'}}>

## Supported Operations

- **[SQL mode](/docs/data-sources/oracledb#sql-mode)**
- **[GUI mode](/docs/data-sources/oracledb#gui-mode)**

<img className="screenshot-full" src="/img/datasource-reference/oracledb/operations.png" alt="ToolJet - Data source - OracleDB" style={{marginBottom:'15px'}}/>

### SQL mode

SQL mode can be used to write raw SQL queries.

```sql
SELECT first_name, last_name, email
FROM employees
WHERE department_id = 10
ORDER BY last_name;
```

<img className="screenshot-full" src="/img/datasource-reference/oracledb/sql.png" alt="ToolJet - Data source - OracleDB" style={{marginBottom:'15px'}}/>

### GUI mode

GUI mode can be used to query Oracle database without writing queries.

1. Select GUI mode from the dropdown.
2. Choose the operation **Bulk update using primary key**.
3. Enter the **Table** name and **Primary key** column name.
4. In the editor, enter the records in the form of an array of objects.
  
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

<img className="screenshot-full" src="/img/datasource-reference/oracledb/gui.png" alt="ToolJet - Data source - OracleDB" style={{marginBottom:'15px'}}/>

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: **[link](/docs/tutorial/transformations)**
:::

</div>
