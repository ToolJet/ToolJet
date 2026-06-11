---
id: mariadb
title: MariaDB
---

# MariaDB

ToolJet can connect to MariaDB to read and write data.

## Connection

To add a new MariaDB data source, click on the `+` button on datasources panel at the left sidebar of the app builder. Select MariaDB from the modal that pops up.

ToolJet requires the following to connect to your DynamoDB.

- **Host**
- **Username**
- **Password**
- **Connection Limit**
- **Port**
- **Database**
- **SSL**
- **SSL Certificate**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/mariadb/connection.png" alt="MariaDB" />

</div>

Click on **Test connection** button to verify if the credentials are correct and that the database is accessible to ToolJet server. Click on **Save** button to save the data source.

## Querying MariaDB

Click on `+` button of the query manager at the bottom panel of the builder and select the MariaDB datasource added in the previous step. 

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/mariadb/query.png" alt="MariaDB query" />

</div>

Click on the **run** button to run the query.

**NOTE**: Query should be saved before running.

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: **[link](/docs/tutorial/transformations)**
:::
