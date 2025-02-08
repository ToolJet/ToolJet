---
id: marketplace-plugin-weaviate
title: Weaviate
---

Integrating Weaviate with ToolJet enables efficient vector search and semantic querying, allowing applications to retrieve relevant information based on meaning rather than exact keywords. This integration is ideal for building AI-powered search engines, recommendation systems, and knowledge retrieval applications that enhance user experience with context-aware results.

## Connections

### Cloud

To connect with Weaviate Cloud, you will need the **Instance URL** and the **API Key**, which can be generated from **[Weaviate Console](https://weaviate.io/developers/wcs/connect)**.

<img className="screenshot-full" src="/img/marketplace/plugins/weaviate/cloud-config.png" alt="Weaviate Configuration" />

### Local

To connect with Weaviate Local, you will need the **Host** and the **Port**.

<img className="screenshot-full" src="/img/marketplace/plugins/weaviate/local-config.png" alt="Weaviate Configuration" />

## Supported Operations

## Data Type - Schema

### Get Database Schema

Run this opetation to get the database schema.

**Optional Patameter**

- **Consistency**: Toggle on for consistency.

<img className="screenshot-full" src="/img/marketplace/plugins/weaviate/db-schema.png" alt="Weaviate Configuration" />

<details>
<summary>**Response Example**</summary>

```json
{
  "classes": [
    {
      "class": "Createcollection",
      "description": "Test collection create",
      "invertedIndexConfig": {
        "bm25": {
          "b": 0.75,
          "k1": 1.2
        },
        "cleanupIntervalSeconds": 300,
        "indexNullState": true,
        "indexPropertyLength": true,
        "indexTimestamps": true,
        "stopwords": {
          "additions": [
            "custom1"
          ],
          "preset": "en",
          "removals": [
            "the"
          ]
        }
      },
      "moduleConfig": {
        "text2vec-contextionary": {
          "vectorizeClassName": true
        }
      },
      "multiTenancyConfig": {
        "autoTenantActivation": false,
        "autoTenantCreation": false,
        "enabled": false
      },
      "properties": [
        {
          "dataType": [
            "text"
          ],
          "description": "Main text field",
          "indexFilterable": true,
          "indexRangeFilters": false,
          "indexSearchable": true,
          "name": "content",
          "tokenization": "word"
        }
      ],
      "replicationConfig": {
        "asyncEnabled": true,
        "deletionStrategy": "NoAutomatedResolution",
        "factor": 1
      },
      "shardingConfig": {
        "virtualPerPhysical": 128,
        "desiredCount": 1,
        "actualCount": 1,
        "desiredVirtualCount": 128,
        "actualVirtualCount": 128,
        "key": "_id",
        "strategy": "hash",
        "function": "murmur3"
      },
      "vectorIndexConfig": {
        "skip": false,
        "cleanupIntervalSeconds": 300,
        "maxConnections": 64,
        "efConstruction": 128,
        "ef": -1,
        "dynamicEfMin": 100,
        "dynamicEfMax": 500,
        "dynamicEfFactor": 8,
        "vectorCacheMaxObjects": 1000000000000,
        "flatSearchCutoff": 40000,
        "distance": "cosine",
        "pq": {
          "enabled": false,
          "bitCompression": false,
          "segments": 0,
          "centroids": 256,
          "trainingLimit": 100000,
          "encoder": {
            "type": "kmeans",
            "distribution": "log-normal"
          }
        },
        "bq": {
          "enabled": false
        },
        "sq": {
          "enabled": false,
          "trainingLimit": 100000,
          "rescoreLimit": 20
        },
        "filterStrategy": "sweeping"
      },
      "vectorIndexType": "hnsw",
      "vectorizer": "none"
    }
  ]
}
```

</details>

## Data Type - Collection

### Get Collection

**Required Parameter**

- **Collection Name**: Name of the desired collection to fetch details.

**Optional Parameter**

- **Consistency**: Toggle on for consistency.

<img className="screenshot-full" src="/img/marketplace/plugins/weaviate/get-collection.png" alt="Weaviate Configuration" />

<details>
<summary>**Response Example**</summary>

```json
{
[
  {
    "dataType":["text"],
    "description":"Main text field",
    "indexFilterable":true,
    "indexRangeFilters":false,
    "indexSearchable":true,
    "name":"content",
    "tokenization":"word"
  }
],
"replicationConfig":{
  "asyncEnabled":true,
  "deletionStrategy":"NoAutomatedResolution",
  "factor":1
},
"shardingConfig":{
  "virtualPerPhysical":128,
  "desiredCount":1,
  "actualCount":1,
  "desiredVirtualCount":128,
  "actualVirtualCount":128,
  "key":"_id",
  "strategy":"hash",
  "function":"murmur3"
},
"vectorIndexConfig":{
  "skip":false,
  "cleanupIntervalSeconds":300,
  "maxConnections":64,
  "efConstruction":128,
  "ef":-1,
  "dynamicEfMin":100,
  "dynamicEfMax":500,
  "dynamicEfFactor":8,
  "vectorCacheMaxObjects":1000000000000,
  "flatSearchCutoff":40000,
  "distance":"cosine",
  "pq":{
    "enabled":false,
    "bitCompression":false,
    "segments":0,
    "centroids":256,
    "trainingLimit":100000,
    "encoder":{
      "type":"kmeans",
      "distribution":"log-normal"
    }
  },
  "bq":{
    "enabled":false
  },
  "sq":{
    "enabled":false,
    "trainingLimit":100000,
    "rescoreLimit":20
  },
  "filterStrategy":"sweeping"
},
"vectorIndexType":"hnsw",
"vectorizer":"none"
}
```

</details>

### Create Collection

Use this operation to create a new collection.

**Parameters**

- Collection Name
- Vectorizer
- Vector index config
- Sharding config
- Factor
- Async enabled
- Deletion strategy
- Cleanup interval seconds
- Bm 25
- Stop words
- Index time stamps
- Index null state
- Index property length
- Module config
- Description
- Consistency
- Properties

<img className="screenshot-full" src="/img/marketplace/plugins/weaviate/create-collection.png" alt="Weaviate Configuration" />

<details>
<summary>**Response Example**</summary>

```json

{
  "class":"Newcollection",
  "description":"Test collection create",
  "invertedIndexConfig":{
    "bm25":{
      "b":0.75,
      "k1":1.2
    },
    "cleanupIntervalSeconds":300,
    "indexNullState":true,
    "indexPropertyLength":true,
    "indexTimestamps":true,
    "stopwords":{
      "additions":[
        "custom1"
      ],
      "preset":"en",
      "removals":[
        "the"
      ]
    }
  },
  "moduleConfig":{
    "text2vec-contextionary":{
      "vectorizeClassName":true
    }
  },
  "multiTenancyConfig":{
    "autoTenantActivation":false,
    "autoTenantCreation":false,
    "enabled":false
  },
  "properties":[
    {
      "dataType":[
        "text"
      ],
      "description":"Main text field",
      "indexFilterable":true,
      "indexRangeFilters":false,
      "indexSearchable":true,
      "name":"content",
      "tokenization":"word"
    }
  ],
  "replicationConfig":{
    "asyncEnabled":true,
    "deletionStrategy":"NoAutomatedResolution",
    "factor":1
  },
  "shardingConfig":{
    "virtualPerPhysical":128,
    "desiredCount":1,
    "actualCount":1,
    "desiredVirtualCount":128,
    "actualVirtualCount":128,
    "key":"_id",
    "strategy":"hash",
    "function":"murmur3"
  },
  "vectorIndexConfig":{
    "skip":false,
    "cleanupIntervalSeconds":300,
    "maxConnections":64,
    "efConstruction":128,
    "ef":-1,
    "dynamicEfMin":100,
    "dynamicEfMax":500,
    "dynamicEfFactor":8,
    "vectorCacheMaxObjects":1000000000000,
    "flatSearchCutoff":40000,
    "distance":"cosine",
    "pq":{
      "enabled":false,
      "bitCompression":false,
      "segments":0,
      "centroids":256,
      "trainingLimit":100000,
      "encoder":{
        "type":"kmeans",
        "distribution":"log-normal"
      }
    },
    "bq":{
      "enabled":false
    },
    "sq":{
      "enabled":false,
      "trainingLimit":100000,
      "rescoreLimit":20
    },
    "filterStrategy":"sweeping"
  },
  "vectorIndexType":"hnsw",
  "vectorizer":"none"
}
```

</details>

### Delete Collection

Use this operation to delete a collection.

**Required Parameters**

- **Collection Name**: Collection name that needs to be deleted.

<img className="screenshot-full" src="/img/marketplace/plugins/weaviate/delete-collection.png" alt="Weaviate Configuration" />

## Data Type - Objects

### List Objects

Use this operation to list all the objects of a collection.

**Required Parameter**

- **Collection Name**: Collection name to list it's objects.

**Optional Parameter**

- **Include vectors**
- **After**
- **Offset**
- **Limit**
- **Include**
- **Sort**
- **Order**
- **Tenant**

<img className="screenshot-full" src="/img/marketplace/plugins/weaviate/list-object.png" alt="Weaviate Configuration" />

<details>
<summary>**Response Example**</summary>

```json
{
    "deprecations":[],
    "objects":[{
        "class":"Testcollection",
        "creationTimeUnix":1739009190787,
        "id":"296f9f17-628a-463a-b273-6ae369a3bb59",
        "lastUpdateTimeUnix":1739009190787,
        "properties":{
            "content":"This is a test document stored in Weaviate.",
            "title":"New Sample Document"
        },
        "vectorWeights":null
    },
    {
        "class":"Testcollection",
        "creationTimeUnix":1738941448311,
        "id":"550e8400-e29b-41d4-a716-446655440000",
        "lastUpdateTimeUnix":1738941448311,
        "properties":{
            "content":"This is a test document stored in Weaviate.",
            "title":"Sample Document"
        },
        "vectorWeights":null
    },
    {
        "class":"Testcollection",
        "creationTimeUnix":1739008896994,
        "id":"98a6628d-f07d-4f56-b64b-1b818201095c",
        "lastUpdateTimeUnix":1739008896994,
        "properties":{
            "content":"This is a test document stored in Weaviate.",
            "title":"Sample Document"
        },
        "vectorWeights":null
    }],
    "totalResults":3
}
```

</details>

### Create Object

Use this operation to create a new object within the selected collection.

**Required Parameters**

- **Collection Name**: Collection name to create an object inside it.
- **Properties**: Define title and content of the object.
- **Vector**: Enter the vector for the object.

**Optional Parameter**

- **Object uuid**

<img className="screenshot-full" src="/img/marketplace/plugins/weaviate/create-object.png" alt="Weaviate Configuration" />

<details>
<summary>**Response Example**</summary>

```json
{
    "class":"Testcollection",
    "creationTimeUnix":1739009190787,
    "id":"296f9f17-628a-463a-b273-6ae369a3bb59",
    "lastUpdateTimeUnix":1739009190787,
    "properties":{
        "content":"This is a test document stored in Weaviate.",
        "title":"New Sample Document"
    },
    "vector":[0.12345,0.12345,.......,0.12345,0.12345]
}
```

</details>

### Get Object By Id

Use this operation to fetch an object using it's ID.

**Required Parameters**

- **Collection Name**: Collection Name of the object.
- **Object ID**: Object ID to fetch the object details.

<img className="screenshot-full" src="/img/marketplace/plugins/weaviate/get-object.png" alt="Weaviate Configuration" />

<details>
<summary>**Response Example**</summary>

```json
{
    "class":"Testcollection",
    "creationTimeUnix":1738941448311,
    "id":"550e8400-e29b-41d4-a716-446655440000",
    "lastUpdateTimeUnix":1738941448311,
    "properties":{
        "content":"This is a test document stored in Weaviate.",
        "title":"Sample Document"
    },
    "vectorWeights":null
}
```

</details>

### Delete Object By Id

Use this operation to delete the object using it's ID.

**Required Parameters**

- **Collection Name**: Collection Name of the object.
- **Object ID**: Object ID to of the object to be deleted.

<img className="screenshot-full" src="/img/marketplace/plugins/weaviate/delete-object.png" alt="Weaviate Configuration" />
