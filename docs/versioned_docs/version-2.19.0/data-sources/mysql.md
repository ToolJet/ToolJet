---
id: mysql
title: MySQL
---

ToolJet can connect to MySQL databases to read and write data.

## Connection

To establish a connection with the MySQL data source, you can either click on the `+Add New` button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/mysql/addmysql.gif" alt="MySQL data source"/>

</div>
<br/>

:::info
Please make sure the **Host/IP** of the database is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please **whitelist** our IP.
:::

**ToolJet requires the following to connect to your MySQL database:**

| Parameter       | Description                                                               |
| :-------------- | :------------------------------------------------------------------------ |
| Username        | Username of the MySQL database                                            |
| Password        | Password of the MySQL database                                            |
| Database name   | Name of the MySQL database                                                |
| Connection type | Connection type of the MySQL database: either **Hostname** or **Socket**. |

If you are using **Hostname** as the connection type, you will need to provide the following information:

| Parameter | Description                                  |
| :-------- | :------------------------------------------- |
| Host/IP   | Hostname or IP address of the MySQL database |
| Port      | Port number of the MySQL database            |
| SSL       | Enable SSL connection to the MySQL database  |

If you are using **Socket** as the connection type, you will need to provide the following information:

| Parameter   | Description             |
| :---------- | :---------------------- |
| Socket path | Path of the socket file |

It is recommended to create a new MySQL database user so that you can control the access levels of ToolJet.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/mysql/mysqlconnect.png" alt="mysql"/>

</div>

Click on **Test connection** to verify the correctness of the provided credentials and the accessibility of the database to the ToolJet server. Finally, click the **Save** button to save the data source configuration.

## Querying MySQL

Once the MySQL data source is added, you can create queries to read and write data to the database. You can create queries from the **[Query Panel](/docs/app-builder/query-panel#add)** located at the bottom panel of the app builder.

1. **[SQL mode](/docs/data-sources/mysql#sql-mode)**
2. **[GUI mode](/docs/data-sources/mysql#gui-mode)**

### SQL mode

SQL mode can be used to query MySQL database using SQL queries. Select SQL mode from the dropdown and then enter the SQL query in the editor.

**Example:**

```sql
SELECT * FROM users
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/mysql/sqlmode.png" alt="mysql"/>

</div>

### GUI mode

GUI mode can be used to query MySQL database without writing queries. Select GUI mode from the dropdown and then choose the operation **Bulk update using primary key**. Enter the **Table** name and **Primary key column** name. Now, in the editor enter the records in the form of an array of objects. Each object should contain the primary key column and the columns to be updated.

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
