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

<img className="screenshot-full img-l" src="/img/datasource-reference/cosmosdb/connect-v3.png" alt="ToolJet - Data source - CosmosDB"/>

## Querying CosmoDB

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **CosmoDB** datasource added in previous step.
3. Select the operation you want to perform and enter the query.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to create and trigger the query. <br/>
<img className="screenshot-full" src="/img/datasource-reference/cosmosdb/operations-v2.png" alt="ToolJet - Data source - CosmosDB"/>

<div style={{paddingTop:'24px'}}>

## Supported Queries

### List Databases

This query lists all the databases in a Cosmos DB.

<img className="screenshot-full img-full" src="/img/datasource-reference/cosmosdb/listDatabase-v2.png" alt="ToolJet - Data source - CosmosDB" style={{marginBottom:'15px'}}/>

### List Containers

This query lists all the containers of a database in a Cosmos DB.

#### Required Parameter
- **Database**

<img className="screenshot-full img-full" src="/img/datasource-reference/cosmosdb/listContainers-v2.png" alt="ToolJet - Data source - CosmosDB" style={{marginBottom:'15px'}}/>

### Insert Items

This query inserts one or more items in a container of a database in a Cosmos DB.

#### Required Parameter
- **Database**
- **Container**
- **Items**

#### Optional Parameter

- **Partition key**

<img className="screenshot-full" src="/img/datasource-reference/cosmosdb/insertItems-v2.png" alt="ToolJet - Data source - CosmosDB" style={{marginBottom:'15px'}}/>

#### Example

```yaml
{{[ 
  { 
    'name': 'Olympia', 
    'state': 'WA'
  },
  {  
    'name': 'Redmond', 
    'state': 'WA'
  }
]}}
```

### Read Item

To read a single item from a container of a database in a Cosmos DB, use the following query.

#### Required Parameter
- **Database**
- **Container**
- **Item ID**

<img className="screenshot-full img-full" src="/img/datasource-reference/cosmosdb/readItem-v2.png" alt="ToolJet - Data source - CosmosDB" style={{marginBottom:'15px'}}/>

### Delete Item

To delete an item from a container of a database in a Cosmos DB, use the following query.

#### Required Parameter
- **Database**
- **Container**
- **Item ID**

#### Optional Parameter

- **Partition key**

<img className="screenshot-full img-full" src="/img/datasource-reference/cosmosdb/deleteItem-v2.png" alt="ToolJet - Data source - CosmosDB" style={{marginBottom:'15px'}}/>

### Query Database

To query documents from a container of a database in a Cosmos DB using SQL-like syntax, use the following query.

#### Required Parameter
- **Database**
- **Container**
- **Query**

<img className="screenshot-full img-full" src="/img/datasource-reference/cosmosdb/queryDatabase-v2.png" alt="ToolJet - Data source - CosmosDB" style={{marginBottom:'15px'}}/>

#### Example
```yaml
SELECT * FROM c WHERE c.age > 20 AND c.age <= 30
```

</div>
