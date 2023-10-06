---
id: mssql
title: MS SQL Server / Azure SQL databases
---

# MS SQL Server / Azure SQL databases


ToolJet can connect to MS SQL Server & Azure SQL databases to read and write data. 

## Connection

Please make sure the host/ip of the database is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please whitelist our IP.

To add new MS SQL Server / Azure SQL database, click on the '+' button on data sources panel at the left-bottom corner of the app editor. Select `SQL Server` from the modal that pops up.

ToolJet requires the following to connect to your PostgreSQL database.

- **Host**
- **Port**
- **Username**
- **Password**
- **Azure** - Select this option if you are using Azure SQL databases.

It is recommended to create a new database user so that you can control the access levels of ToolJet. 

Click on 'Test connection' button to verify if the credentials are correct and that the database is accessible to ToolJet server. Click on 'Save' button to save the data source.

<img className="screenshot-full" src="/img/datasource-reference/mssql/connect.gif" alt="ToolJet - Redis connection" height="420"/>


## Querying SQL Server / Azure SQL databases
Click on '+' button of the query manager at the bottom panel of the editor and select the database added in the previous step as the data source. 

Click on the 'run' button to run the query.

<img className="screenshot-full" src="/img/datasource-reference/mssql/query.gif" alt="ToolJet - Redis connection" height="420"/>


:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/docs/tutorial/transformations)
:::
