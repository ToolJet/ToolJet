---
id: marketplace-plugin-weaviate
title: Weaviate
---

Weaviate is a vector database, integrating Weaviate with ToolJet enables efficient vector search and semantic querying, allowing applications to retrieve relevant information based on meaning rather than exact keywords. This integration is ideal for building AI-powered search engines, recommendation systems, and knowledge retrieval applications that enhance user experience with context-aware results.

## Connections

### Cloud

To connect with Weaviate Cloud, you will need the **Instance URL** and the **API Key**, which can be generated from **[Weaviate Console](https://weaviate.io/developers/wcs/connect)**.

<img className="screenshot-full" src="/img/marketplace/plugins/weaviate/cloud-config.png" alt="Weaviate Configuration" />

### Local

To connect ToolJet with Weaviate Local, you will need the **Host** and the **Port**.

Run the following Docker command to start the container locally. This will set the host to `localhost` and port to `8080`.

```yaml
docker run -p 8080:8080 -p 50051:50051 cr.weaviate.io/semitechnologies/weaviate:1.28.4
```

<img className="screenshot-full" src="/img/marketplace/plugins/weaviate/local-config.png" alt="Weaviate Configuration" />

## Supported Operations

## Data Type - Schema

### Get Database Schema

Run this opetation to get the database schema.

**Optional Patameter**

- **Consistency**: Ensures the request is handled by the leader node to maintain accuracy.

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

- **Consistency**: Ensures the request is handled by the leader node to maintain accuracy.

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

**Required Parameters**

- **Collection Name**: The name of the collection.
- **Vectorizer**: Vectorizer to use for data objects added to this collection.
- **Vector index config**: Vector index type specific settings, including distance metric.
- **Module config**: Module-specific settings.
- **Description**: A description for your reference.
- **Properties**: An array of the properties you are adding, same as a Property Object.

**Required Parameters**

- **Consistency**: Ensures the request is handled by the leader node to maintain accuracy.
- **Sharding config**: Controls behavior of the collection in a multi-node setting.
- **Stop words**: Controls which words should be ignored in the inverted index.
- **Index time stamps**: Maintains inverted indexes for each object by its internal timestamps.
- **Index null state**: Maintains inverted indexes for each property regarding its null state.
- **Index property length**: Maintains inverted indexes for each property by its length.
- **Bm 25**: Search ranking method that boosts result accuracy using adjustable k1 and b values. By default, k1 = 1.2 and b = 0.75.
- **Factor**: Controls replication or sharding behavior for scaling.
- **Async enabled**: Runs operations in the background for better performance.
- **Deletion strategy**: Defines how deleted data is handled (e.g., immediate or delayed).
- **Cleanup interval seconds**: Sets how often old or deleted data is removed.

Refer to **[weaviate documentation](https://weaviate.io/developers/weaviate/config-refs/schema)** for more information.

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

- **Collection Name**: Collection name to list its objects.

**Optional Parameter**

- **Include vectors**: Specify names of the vectors to include.
- **After**: A threshold UUID of the objects to retrieve after.
- **Offset**: The starting index of the result window.
- **Limit**: The maximum number of items to be returned per page. 
- **Include**: Include additional information, such as classification infos. Allowed values include: classification, vector, interpretation.
- **Sort**: Name(s) of the property to sort by.
- **Order**: Determines sorting direction (asc or desc).
- **Tenant**: Specifies the tenant in a request targeting a multi-tenant class.

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
- **Properties**: An array of the properties you are adding, same as a Property Object.
- **Vector**: Enter the vector for the object.

**Optional Parameter**

- **Object uuid**: The UUID of the object.

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
- **Object ID**: Object ID of the object to be deleted.

<img className="screenshot-full" src="/img/marketplace/plugins/weaviate/delete-object.png" alt="Weaviate Configuration" />
