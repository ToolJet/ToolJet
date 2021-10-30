---
sidebar_position: 11
---

# MongoDB

ToolJet can connect to DynamoDB to read and write data.

## Connection

Please make sure the host/ip of the database is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please whitelist our IP.

To add a new DynamoDB, click on the `+` button on data sources panel at the left-bottom corner of the app editor. Select DynamoDB from the modal that pops up.

ToolJet requires the following to connect to your MongoDB.

- **Region**
- **Access key**
- **Secret key**

It is recommended to create a new database user so that you can control the access levels of ToolJet.

<img src="/img/datasource-reference/dynamo-connect.png" alt="ToolJet - Dynamo connection" height="250"/>

Click on 'Test connection' button to verify if the credentials are correct and that the database is accessible to ToolJet server. Click on 'Save' button to save the datasource.

## Querying MongoDB

Click on `+` button of the query manager at the bottom panel of the editor and select the database added in the previous step as the datasource. Select the operation that you want to perform and click 'Save' to save the query.

<img src="/img/datasource-reference/dynamo-query.png" alt="ToolJet - Dynamo query" height="250"/>

Click on the 'run' button to run the query. NOTE: Query should be saved before running.

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: [link](/docs/tutorial/transformations)
:::
