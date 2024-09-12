---
id: mysql
title: MySQL
---

ToolJet can connect to MySQL databases to read and write data.

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the MySQL data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/mysql/addmysql.gif" alt="MySQL data source"/>

</div>
<br/>

:::info
Please make sure the **Host/IP** of the database is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please **whitelist** our IP.
:::

**ToolJet requires the following to connect to your MySQL database:**

- **Username**
- **Password**
- **Database Name**
- **Connection Type**

If you are using **Hostname** as the connection type, you will need to provide the following information:

- **Host/IP**
- **Port**
- **SSL**

If you are using **Socket** as the connection type, you will need to provide the following information:

- **Socket Path**

**Note:** It is recommended to create a new MySQL database user so that you can control the access levels of ToolJet.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/mysql/mysqlconnect.png" alt="mysql"/>

</div>

</div>

<div style={{paddingTop:'24px'}}>

## Querying MySQL

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the database added in the previous step as the data source. 

Once the MySQL data source is added, you can create queries to read and write data to the database. You can create queries from the **[Query Panel](/docs/app-builder/query-panel#query-manager)** located at the bottom panel of the app builder.

### SQL Mode

SQL mode can be used to query MySQL database using SQL queries. 

1. Select **SQL mode** from the dropdown.
2. Enter the SQL query in the editor.
3. Click on the **Run** button to run the query.

**Example:**

```sql
SELECT * FROM users
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/mysql/sqlmode.png" alt="mysql" style={{marginBottom:'15px'}}/>

</div>

### GUI Mode

GUI mode can be used to query MySQL database without writing queries. 

1. Select **GUI mode** from the dropdown.
2. Choose the operation **Bulk update using primary key**.
3. Enter the **Table** name and **Primary key column** name.
4. In the editor enter the records in the form of an array of objects.
5. Click on the **Run** button to run the query. 

**Example:**

```json
{{ [ {id: 1, channel: 33}, {id:2, channel:24} ] }}
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/mysql/guinew.png" alt="mysql"/>

</div>

:::tip
Query results can be transformed using transformations. Learn more about transformations [here](/docs/tutorial/transformations).
:::

</div>
