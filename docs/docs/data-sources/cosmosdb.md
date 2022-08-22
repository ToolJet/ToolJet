---
id: cosmosdb
title: CosmosDB
---
# Cosmosdb

ToolJet can connect to CosmosDB databases to read and write data. 


## Connection

To add a new **[Azure Cosmos DB](https://docs.microsoft.com/en-us/javascript/api/overview/azure/cosmos-readme?view=azure-node-latest#key-concepts)**, click on the `+` button on data sources panel at the left-bottom corner of the app editor. Select CosmosDB from the modal that pops up.

ToolJet requires the following to connect to your Cosmos DB.

- **Cosmos DB Account End point**
- **Cosmos DB Account Key**

:::info
**Azure Cosmos DB End point** is the URL of the Cosmos DB service.
**Azure Cosmos DB Key** is the key that is used to access the Cosmos DB service.
You can find the endpoint and key in the **[Azure Portal](https://portal.azure.com/)**.
:::

<div style={{textAlign: 'center'}}>

![ToolJet - Data source - CosmosDB](/img/datasource-reference/cosmosdb/cosmosdb-connect.png)

</div>


## Supported queries: 

- [Listing databases](#listing-databases)
- [Listing containers](#listing-containers)
- [Inserting item(s)](#inserting-items)
- [Retrieving an item](#retrieving-an-item)
- [Deleting an item](#deleting-an-item)
- [Querying documents](#querying-documents)





### Listing databases
This query lists all the databases in a Cosmos DB.

### Listing containers
This query lists all the containers of a database in a Cosmos DB.

| Fields      | description |
| ----------- | ----------- |
| database    | id of the database |

### Inserting item(s)
This query inserts one or more items in a container of a database in a Cosmos DB.

| Fields      | description |
| ----------- | ----------- |
| database    | id of the database |
| container   | id of the container |
| items       | items to be inserted. Example: `{{[{name: "one", val: 1}, {name:"two", val: 2}]}}` |

### Retrieving an item
To read a single item from a container of a database in a Cosmos DB, use the following query.

| Fields      | description |
| ----------- | ----------- |
| database    | id of the database |
| container   | id of the container |
| item        | id of the item |


### Deleting an item
To delete an item from a container of a database in a Cosmos DB, use the following query.

| Fields      | description |
| ----------- | ----------- |
| database    | id of the database |
| container   | id of the container |
| item        | id of the item |


### Querying documents
To query documents from a container of a database in a Cosmos DB using SQL-like syntax, use the following query.

| Fields      | description |
| ----------- | ----------- |
| database    | id of the database |
| container   | id of the container |
| query       | query to be executed. Example: `SELECT * FROM c WHERE c.age > 20 AND c.age <= 30` |
