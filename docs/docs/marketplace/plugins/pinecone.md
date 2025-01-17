---
id: marketplace-plugin-pinecone
title: Pinecone
---

ToolJet integrates with Pinecone to utilize its vector database capabilities. This integration enables ToolJet to perform vector operations such as updating, querying, and managing vector embeddings in Pinecone indexes.

:::note
Before following this guide, it is assumed that you have already completed the process of **[Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

For connecting to Pinecone, the following credential is required:

- **API Key**: API key for Pinecone can be generated from the [Pinecone Console](https://app.pinecone.io/organizations/-/projects/-/keys).

<img className="screenshot-full" src="/img/marketplace/plugins/pinecone/connection.png" alt="Configuring Pinecone in ToolJet" />


## Supported Operations

- **[Get Index Stats](#get-index-stats)**
- **[List Vector IDs](#list-vector-ids)**
- **[Fetch Vectors](#fetch-vectors)**
- **[Upsert Vectors](#upsert-vectors)**
- **[Update Vector](#update-a-vector)**
- **[Delete Vectors](#delete-vectors)**
- **[Query Vectors](#query-vectors)**

### Get Index Stats

This operation retrieves statistics about a specific index in your Pinecone database.

#### Required Parameters:

- **Index**: The name of the index to get statistics for.

<!-- 
    <img className="screenshot-full" src="/img/marketplace/plugins/pinecone/get-index-stats.png" alt="Get Index Stats Operation" />
 -->

<details>
<summary>**Example Response**</summary>

```json
{
  "dimension": 1536,
  "indexFullness": 0.0,
  "totalVectorCount": 1000,
  "namespaces": {
    "default": {
      "vectorCount": 1000
    }
  }
}
```
</details>

### List Vector IDs

This operation retrieves a list of vector IDs from a specified index.

#### Required Parameters:

- **Index**: The name of the index to list vector IDs from.

#### Optional Parameters:

- **Prefix**: Filter vector IDs by prefix.
- **Limit**: Maximum number of vector IDs to return.
- **Pagination Token**: Token for retrieving the next page of results.
- **Namespace**: Specific namespace to query within the index.

<!-- 
    <img className="screenshot-full" src="/img/marketplace/plugins/pinecone/list-vector-ids.png" alt="List Vector IDs Operation" />
 -->

<details>
<summary>**Example Values**</summary>

```yaml
Index: example-index
Prefix: document1#
Limit: 100
Pagination Token: Tm90aGluzYB0byBZzWUGaGVyZQo=
Namespace: example-namespace
```
</details>

### Fetch Vectors

This operation retrieves specific vectors by their IDs from an index.

#### Required Parameters:

- **Index**: The name of the index to fetch vectors from.
- **IDs**: Array of vector IDs to fetch.

#### Optional Parameters:

- **Namespace**: Specific namespace to fetch vectors from.

<!-- 
    <img className="screenshot-full" src="/img/marketplace/plugins/pinecone/fetch-vectors.png" alt="Fetch Vectors Operation" />
 -->

<details>
<summary>**Example Values**</summary>

```yaml
Index: example-index
IDs: ["id-1", "id-2"]
Namespace: example-namespace
```
</details>

### Upsert Vectors

This operation inserts or updates vectors in an index.

#### Required Parameters:

- **Index**: The name of the index to upsert vectors into.
- **Vectors**: Array of vectors to upsert, including IDs and values.

#### Optional Parameters:

- **Namespace**: Specific namespace to upsert vectors into
<!-- 
    <img className="screenshot-full" src="/img/marketplace/plugins/pinecone/upsert-vectors.png" alt="Upsert Vectors Operation" /> -->

<details>
<summary>**Example Values**</summary>

```yaml
Index: example-index
Vectors: [{"id": "vec1", "values": [0.1, 0.2, 0.3]}]
Namespace: example-namespace
```
</details>

### Update a Vector

This operation updates a single vector's values or metadata.

#### Required Parameters:

- **Index**: The name of the index containing the vector.
- **ID**: ID of the vector to update.

#### Optional Parameters:

- **Values**: Updated vector values as an array.
- **Sparse Vector**: Sparse vector representation.
- **Metadata**: Additional metadata for the vector.
- **Namespace**: Specific namespace containing the vector.
<!-- 
    <img className="screenshot-full" src="/img/marketplace/plugins/pinecone/update-vector.png" alt="Update Vector Operation" />
     -->

<details>
<summary>**Example Values**</summary>

```yaml
Index: example-index
ID: id-3
Values: [4.0, 2.0]
Sparse Vector: {"indices": [1, 5], "values": [0.5, 0.5]}
Metadata: {"genre": "comedy"}
Namespace: example-namespace
```
</details>

### Delete Vectors

This operation deletes vectors from an index.

#### Required Parameters:

- **Index**: The name of the index to delete vectors from.

#### Optional Parameters:

- **IDs**: Array of vector IDs to delete.
- **Delete All**: Boolean flag to delete all vectors.
- **Namespace**: Specific namespace to delete vectors from.
- **Filter**: Filter condition for selective deletion.

<!-- 
    <img className="screenshot-full" src="/img/marketplace/plugins/pinecone/delete-vectors.png" alt="Delete Vectors Operation" />
-->

<details>
<summary>**Example Values**</summary>

```yaml
Index: example-index
IDs: ["id-1", "id-2"]
Delete All: true
Namespace: example-namespace
Filter: {"genre": {"$in": ["documentary", "action"]}}
```
</details>

### Query Vectors

This operation queries vectors in an index based on similarity.

#### Required Parameters:

- **Index**: The name of the index to query.
- **Vectors**: Query vector values.

#### Optional Parameters:

- **Namespace**: Specific namespace to query.
- **Top K**: Number of most similar vectors to return.
- **Filter**: Filter condition for the query.
- **Include Values**: Boolean to include vector values in results.
- **Include Metadata**: Boolean to include metadata in results.
- **Sparse Vector**: Sparse vector for hybrid search.

<!-- 
    <img className="screenshot-full" src="/img/marketplace/plugins/pinecone/query-vectors.png" alt="Query Vectors Operation" />
 -->

<details>
<summary>**Example Values**</summary>

```yaml
Index: example-index
Vectors: [0.3, 0.3, 0.3, 0.3, 0.3]
Namespace: example-namespace
Top K: 3
Filter: {"genre": {"$in": ["documentary", "action"]}}
Include Values: true
Include Metadata: true
Sparse Vector: {"indices": [1, 5], "values": [0.5, 0.5]}
```
</details>