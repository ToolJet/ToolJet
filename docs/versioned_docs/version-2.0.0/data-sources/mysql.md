---
id: mysql
title: MySQL
---

# MySQL

ToolJet can connect to MySQL databases to read and write data. 

## Connection

ToolJet requires the following to connect to your MySQL database. Please make sure the host/ip of the database is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please whitelist our IP.

To add a new MySQL database, click on the `+` button on data sources panel at left sidebar in the app editor. Select MySQL from the modal that pops up.

ToolJet requires the following to connect to your MySQL database.

- **Host**
- **Port**
- **Username**
- **Password**

It is recommended to create a new MySQL database user so that you can control the access levels of ToolJet. 

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/mysql/mysql.png" alt="mysql"/>

</div>

Click on **Test connection** button to verify if the credentials are correct and that the database is accessible to ToolJet server. Click on **Save** button to save the data source.

## Querying MySQL

Once you have added a MySQL data source, click on `+` button of the query manager to create a new query. There are two modes by which you can query SQL:

  1. **[SQL mode](/docs/data-sources/mysql#sql-mode)**
  2. **[GUI mode](/docs/data-sources/mysql#gui-mode)**

#### SQL mode

SQL mode can be used to write raw SQL queries. Select SQL mode from the dropdown and enter the SQL query in the editor. Click on the `run` button to run the query.

**NOTE**: Query should be saved before running.


<img className="screenshot-full" src="/img/datasource-reference/mysql/mysql-sqlmode.png" alt="mysql mode" />



#### GUI mode

GUI mode can be used to query MySQL database without writing queries. Select GUI mode from the dropdown and then choose the operation **Bulk update using primary key**. Enter the **Table** name and **Primary key column** name. Now, in the editor enter the records in the form of an array of objects. 

**Example**: `{{ [ {id: 1, channel: 33}, {id:2, channel:24} ] }}`


<img className="screenshot-full" src="/img/datasource-reference/mysql/mysql-guimode.png" alt="mysql gui mode" />


Click on the **run** button to run the query. **NOTE**: Query should be saved before running.

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: **[link](/docs/tutorial/transformations)**
:::
