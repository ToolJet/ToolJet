---
sidebar_position: 3
---

# PostgreSQL


ToolJet can connect to PostgreSQL databases to read and write data. 

## Connection

Please make sure the host/ip of the database is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please whitelist our IP.

To add a new PostgreSQL database, click on the '+' button on data sources panel at the left-bottom corner of the app editor. Select PostgreSQL from the modal that pops up.

ToolJet requires the following to connect to your PostgreSQL database.

- **Host**
- **Port**
- **Username**
- **Password**

It is recommended to create a new PostgreSQL database user so that you can control the access levels of ToolJet. 

<img src="/img/datasource-reference/pg-connect.png" alt="ToolJet - Redis connection" height="250"/>

Click on 'Test connection' button to verify if the credentials are correct and that the database is accessible to ToolJet server. Click on 'Save' button to save the datasource.

## Querying PostgreSQL
Click on '+' button of the query manager at the bottom panel of the editor and select the database added in the previous step as the datasource. PostgreSQL query editor has two modes, SQL & GUI. SQL mode can be used to write raw SQL queries and GUI mode can be used to query your PostgreSQL database without writing queries.

<img src="/img/datasource-reference/pg-query.png" alt="ToolJet - Redis connection" height="250"/>

Click on the 'run' button to run the query. NOTE: Query should be saved before running.

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/tutorial/transformations)
:::