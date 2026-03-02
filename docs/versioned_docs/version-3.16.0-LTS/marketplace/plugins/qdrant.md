---
id: marketplace-plugin-qdrant
title: Qdrant
---

Qdrant is a vector database which can be integrated with ToolJet to enable efficient vector search at scale. It supports AI applications with advanced technology for finding similar vectors.

At its core, Qdrant operates with points, which are records consisting of a vector and an optional payload which allows you to store additional context or metadata alongside the vectors for more meaningful searches.

## Connection

To connect with Qdrant, you will need Qdrant URL and an API key, which can be generated from [Qdrant Cloud Dashboard](https://qdrant.to/cloud).

<img className="screenshot-full img-full" src="/img/marketplace/plugins/qdrant/connection-v2.png" alt="Qdrant Configuration" />

## Supported Operations

1. **[Get Collection Info](#get-collection-info)**
2. **[List Collection](#list-collection)**
3. **[Get Points](#get-points)**
4. **[Upsert Points](#upsert-points)**
5. **[Delete Points](#delete-points)**
6. **[Query Points](#query-points)**

<img className="screenshot-full img-full" src="/img/marketplace/plugins/qdrant/listops.png" alt="Qdrant supported operations" />


### Get Collection Info

Use this operation to retrieve metadata and configuration details about a specific collection in Qdrant.

**Required Parameter**

- **Collection Name:** Refers to the specific dataset stored in Qdrant.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/qdrant/get-collection-query.png" alt="Get Collection Info" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>
```yaml
{
    "status": "green",
    "optimizer_status": "ok",
    "indexed_vectors_count": 0,
    "points_count": 0,
    "segments_count": 2,
    "config": {} 6keys
    "payload_schema": {}
    "update_queue": {} 1key
}
```
</details>

### List Collections

Use this operation to retrieve all available collections in the connected Qdrant instance.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/qdrant/list-collection-query.png" alt="List Collection" />

### Get Points

Use this operation to retrieve specific data points from a collection using their unique identifiers.

**Required Parameters**

- **Collection Name:** Refers to the specific dataset stored in Qdrant.
- **IDs:** Unique identifiers for individual data points within the collection. They are used to locate and retrieve specific entries from the collection.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/qdrant/get-points-query.png" alt="Get Points" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
[{
    "id": 2,
    "payload": {} 4 keys
     {
        "file_name": "662c577775a44fc22d66d4da_Xavier_Dolan_V6_p.jpeg",
        image_url:"https://storage.googleapis.com/demo-midjourney/images/662c577775a44fc22d66d4da_Xavier_Dolan_V6_p.jpeg",
        name:"Xavier Dolan",
        "url": "/styles/xavier-dolan"
    },
    "vector": [-0.05074604, 0.040631093, 0.0011827358, -0.013710048, 0.011997517, -0.024988947, -0.008394034, ...]
}]
```
</details>

### Upsert Points

Use this operation to add new data points or update existing ones in a collection based on their unique identifiers.

**Required Parameters**

- **Collection Name:** Represents the group of data points where the new or updated points will be stored.
- **Points:** The actual data being added or updated. Each point contains a unique identifier and optional attributes.

Here's the **Sample Input** for Upsert operation.

```json
[
  {
    "id": 1,
    "payload": {
      "name": "Item 1",
      "description": "Sample description"
    },
    "vector": {
      "dense-vec3": [0.9, 0.1, 0.2]
    }
  },
  {
    "id": 2,
    "payload": {
      "name": "Item 2",
      "description": "Another item"
    },
    "vector": {
      "dense-vec3": [0.1, 0.8, 0.3]
    }
  },
  {
    "id": 3,
    "payload": {
      "name": "Item 3",
      "description": "Third item"
    },
    "vector": {
      "dense-vec3": [0.5, 0.5, 0.5]
    }
  }
]
```
<img style={{ marginTop:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/qdrant/upsert-points-query.png" alt="Upsert Points" />

### Delete Points

Use this operation to remove specific data points from a collection using their unique identifiers.

**Required Parameters**

- **Collection Name:** Refers to the specific dataset stored in Qdrant.
- **IDs:** Unique identifiers for individual data points within the collection. They are used to locate and retrieve specific entries from the collection.

**Optional Parameter**

- **Filter:** Used to set conditions when searching or retrieving points.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/qdrant/delete-points-query.png" alt="Delete Points" />

### Query Points

Use this operation to search data points in a collection using a query, typically based on vector similarity or filtering conditions.

**Required Parameters**

- **Collection Name:** Identifies the dataset where the query will be executed.
- **Limit:** Specifies the maximum number of results to return.
- **Query:** A vector representing the query input used for similarity-based search.

**Optional Parameters**

- **With Vectors:** Indicates whether the vector data for the retrieved points should be included in the response (true or false).
- **Include Metadata:** Specifies if metadata associated with the points should be returned (true or false).
- **Filter:** Defines conditions to narrow down the search.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/marketplace/plugins/qdrant/query-points-v2.png" alt="Query Points" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
[{
    "id": 3330,
    "version": 159,
    "score": 0.92638075
}, {
    "id": 5037,
    "version": 236,
    "score": 0.9011326
}, {
    "id": 989,
    "version": 49,
    "score": 0.90049756
}]
```
</details>


