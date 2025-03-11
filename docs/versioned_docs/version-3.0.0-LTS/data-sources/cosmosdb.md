---
id: cosmosdb
title: CosmosDB
---

ToolJet can connect to CosmosDB databases to read and write data.

## Connection

To establish a connection with the CosmosDB data source, you can either click on the **+ Add new data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

ToolJet requires the following to connect to your Cosmos DB.

- **Cosmos DB Account End point**
- **Cosmos DB Account Key**

:::info
**Azure Cosmos DB End Point** is the URL of the Cosmos DB service.
**Azure Cosmos DB Key** is the key that is used to access the Cosmos DB service.
You can find the endpoint and key in the **[Azure Portal](https://portal.azure.com/)**.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/cosmosdb/cosmosdb-connect-v3.png" alt="ToolJet - Data source - CosmosDB"/>

</div>

<div style={{paddingTop:'24px'}}>

## Querying CosmoDB

1. Click on **+** button of the query manager at the bottom panel of the editor.
2. Select the **CosmoDB** datasource added in previous step.
3. Select the operation you want to perform and enter the query.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to create and trigger the query.

<img className="screenshot-full" src="/img/datasource-reference/cosmosdb/operations-v2.png" alt="ToolJet - Data source - CosmosDB"/>

</div>

<div style={{paddingTop:'24px'}}>

## Supported Operations

### List Databases

This query lists all the databases in a Cosmos DB.

<img className="screenshot-full" src="/img/datasource-reference/cosmosdb/listDatabase-v2.png" alt="ToolJet - Data source - CosmosDB" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Response**</summary>
```json
      0: "CustomerData"
      1: "cypress"
```
</details>

### List Containers

This query lists all the containers of a database in a Cosmos DB.

#### Required Parameter
- **Database:** Name of the Database.

<img className="screenshot-full" src="/img/datasource-reference/cosmosdb/listContainers-v2.png" alt="ToolJet - Data source - CosmosDB" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
      Database: CustomerData
```
</details>

<details>
<summary>**Example Response**</summary>
```json
      0: "Orders"
      1: "dsf"
```
</details>

### Insert Items

This query inserts one or more items in a container of a database in a Cosmos DB.

#### Required Parameter
- **Database:** Name of the Database.
- **Container:** Name of the Container.
- **Items:** Item(s) you want to add to the container.

<img className="screenshot-full" src="/img/datasource-reference/cosmosdb/insertItems-v2.png" alt="ToolJet - Data source - CosmosDB" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
      Database: CustomerData
      Container: Orders
      Items: {{[{ "product" : 'ToolJet' }]}}
```
</details>

<details>
<summary>**Example Response**</summary>
```json
      message: "Items inserted"
```
</details>

### Read Item

To read a single item from a container of a database in a Cosmos DB, use the following query.

#### Required Parameter
- **Database:** Name of the Database.
- **Container:** Name of the Container.
- **Items:** Item(s) you want to add to the container.

<img className="screenshot-full" src="/img/datasource-reference/cosmosdb/readItem-v2.png" alt="ToolJet - Data source - CosmosDB" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
      Database: CustomerData
      Container: Orders
      Item ID: 317c3713-6908-40fc-8676-f26df2cdb423
```
</details>

<details>
<summary>**Example Response**</summary>
```json
      band: "12",
      id: "317c3713-6908-40fc-8676-f26df2cdb423"
      "..."
```
</details>

### Delete Item

To delete an item from a container of a database in a Cosmos DB, use the following query.

#### Required Parameter
- **Database:** Name of the Database.
- **Container:** Name of the Container.
- **Items:** Item(s) you want to add to the container.

<img className="screenshot-full" src="/img/datasource-reference/cosmosdb/deleteitem-v2.png" alt="ToolJet - Data source - CosmosDB" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
      Database: CustomerData
      Container: Orders
      Item ID: 317c3713-6908-40fc-8676-f26df2cdb423
```
</details>

<details>
<summary>**Example Response**</summary>
```json
      message: "Items Deleted"
```
</details>

### Query Database

To query documents from a container of a database in a Cosmos DB using SQL-like syntax, use the following query.

#### Required Parameter
- **Database:** Name of the Database.
- **Container:** Name of the Container.

#### Optional Parameter
- **Query:** A Query to retrieve, manipulate, or manage data in the database.

<img className="screenshot-full" src="/img/datasource-reference/cosmosdb/queryDatabase-v2.png" alt="ToolJet - Data source - CosmosDB" style={{marginBottom:'15px'}}/>

<details>
<summary>**Example Value**</summary>
```yaml
      Database: CustomerData
      Container: Orders
```
</details>

<details>
<summary>**Example Response**</summary>
```json
      0: {} 7 keys
      1: {} 7 keys
        product: "ToolJet"
        id: "317c3713-6908-40fc-8676-f26df2cdb423"
        "..."
```
</details>

</div>
