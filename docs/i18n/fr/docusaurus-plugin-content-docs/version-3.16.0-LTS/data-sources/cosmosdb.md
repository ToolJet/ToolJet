---
id: cosmosdb
title: CosmosDB
---

ToolJet peut se connecter aux bases de données CosmosDB pour lire et écrire des données.

## Connexion

Pour établir une connexion avec la source de données CosmosDB, vous pouvez soit cliquer sur le bouton **+ Add new data source** situé sur le panneau de requête, soit accéder à la page **[Data Sources](/docs/data-sources/overview)** depuis le tableau de bord ToolJet.

ToolJet requiert les éléments suivants pour se connecter à votre Cosmos DB.

- **Cosmos DB Account End point**
- **Cosmos DB Account Key**

:::info
**Azure Cosmos DB End Point** est l'URL du service Cosmos DB.
**Azure Cosmos DB Key** est la clé utilisée pour accéder au service Cosmos DB.
Vous pouvez trouver le point de terminaison et la clé dans le **[portail Azure](https://portal.azure.com/)**.
:::

<img className="screenshot-full img-full" src="/img/datasource-reference/cosmosdb/connection-v3.png" alt="Connection - CosmosDB"/>

## Interroger CosmoDB

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes dans le panneau inférieur de l'éditeur.
2. Sélectionnez la source de données **CosmoDB** ajoutée à l'étape précédente.
3. Sélectionnez l'opération que vous souhaitez effectuer et saisissez la requête.
4. Cliquez sur le bouton **Preview** pour prévisualiser le résultat, ou sur le bouton **Run** pour créer et déclencher la requête.

<img className="screenshot-full img-full" src="/img/datasource-reference/cosmosdb/listops-v3.png" alt="Supported operations - CosmosDB"/>

## Requêtes prises en charge

- **[List databases](#list-databases)**
- **[List containers](#list-containers)**
- **[Read item](#read-item)**
- **[Insert items](#insert-items)**
- **[Delete item](#delete-item)**
- **[Query database](#query-database)**

### List Databases

Cette requête liste toutes les bases de données d'un Cosmos DB.

<img className="screenshot-full img-full" src="/img/datasource-reference/cosmosdb/list-db-op.png" alt="list db query"/>

### List Containers

Cette requête liste tous les conteneurs d'une base de données dans un Cosmos DB.

#### Paramètre requis
- **Database**

<img className="screenshot-full img-full" src="/img/datasource-reference/cosmosdb/list-container-op.png" alt="list container query "/>


### Read Item

Pour lire un seul élément d'un conteneur d'une base de données dans un Cosmos DB, utilisez la requête suivante.

#### Paramètre requis
- **Database**
- **Container**
- **Item ID**

<img className="screenshot-full img-full" src="/img/datasource-reference/cosmosdb/read-item-op.png" alt="read item query"/>

### Insert Items

Cette requête insère un ou plusieurs éléments dans un conteneur d'une base de données dans un Cosmos DB.

#### Paramètre requis
- **Database**
- **Container**
- **Items**

<img className="screenshot-full img-full" src="/img/datasource-reference/cosmosdb/insert-op.png" alt="insert item query"/>

#### Exemple

```yaml
{
  "id": "123", 
  "product": "Laptop", 
  "price": 1200, 
  "customer_id": "C001"
}
```

### Delete Item

Pour supprimer un élément d'un conteneur d'une base de données dans un Cosmos DB, utilisez la requête suivante.

#### Paramètre requis
- **Database**
- **Container**
- **Item ID**
- **Partition Key**

<img className="screenshot-full img-full" src="/img/datasource-reference/cosmosdb/delete-op.png" alt="delete item query"/>

### Query Database

Pour interroger des documents d'un conteneur d'une base de données dans un Cosmos DB à l'aide d'une syntaxe de type SQL, utilisez la requête suivante.

#### Paramètre requis
- **Database**
- **Container**
- **Query**

<img className="screenshot-full img-full" src="/img/datasource-reference/cosmosdb/query-db-op.png" alt="query database querying"/>

#### Exemple
```yaml
SELECT * FROM c WHERE c.age > 20 AND c.age <= 30
```
