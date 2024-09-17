---
id: cosmosdb
title: CosmosDB
---

# Cosmosdb

ToolJet can connect to CosmosDB databases to read and write data.

## Connection

To establish a connection with the CosmosDB data source, you can either click on the `+Add new data source` button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

ToolJet requires the following to connect to your Cosmos DB.

- **Cosmos DB Account End point**
- **Cosmos DB Account Key**

:::info
**Azure Cosmos DB End point** is the URL of the Cosmos DB service.
**Azure Cosmos DB Key** is the key that is used to access the Cosmos DB service.
You can find the endpoint and key in the **[Azure Portal](https://portal.azure.com/)**.
:::

<div style={{textAlign: 'center'}}>

![ToolJet - Data source - CosmosDB](/img/datasource-reference/cosmosdb/cosmosdb-connect-v2.png)

</div>

## Supported Queries:

- [Listing databases](#listing-databases)
- [Listing containers](#listing-containers)
- [Inserting item(s)](#inserting-items)
- [Retrieving an item](#retrieving-an-item)
- [Deleting an item](#deleting-an-item)
- [Querying documents](#querying-documents)

### Listing Databases

This query lists all the databases in a Cosmos DB.

### Listing Containers

This query lists all the containers of a database in a Cosmos DB.

| Fields   | Description        |
| -------- | ------------------ |
| database | id of the database |

### Inserting Item(s)

This query inserts one or more items in a container of a database in a Cosmos DB.

| Fields    | Description                                                                        |
| --------- | ---------------------------------------------------------------------------------- |
| database  | id of the database                                                                 |
| container | id of the container                                                                |
| items     | items to be inserted. Example: `{{[{name: "one", val: 1}, {name:"two", val: 2}]}}` |

### Retrieving An Item

To read a single item from a container of a database in a Cosmos DB, use the following query.

| Fields    | Description         |
| --------- | ------------------- |
| database  | id of the database  |
| container | id of the container |
| item      | id of the item      |

### Deleting An Item

To delete an item from a container of a database in a Cosmos DB, use the following query.

| Fields    | Description         |
| --------- | ------------------- |
| database  | id of the database  |
| container | id of the container |
| item      | id of the item      |

### Querying Documents

To query documents from a container of a database in a Cosmos DB using SQL-like syntax, use the following query.

| Fields    | Description                                                                       |
| --------- | --------------------------------------------------------------------------------- |
| database  | id of the database                                                                |
| container | id of the container                                                               |
| query     | query to be executed. Example: `SELECT * FROM c WHERE c.age > 20 AND c.age <= 30` |
