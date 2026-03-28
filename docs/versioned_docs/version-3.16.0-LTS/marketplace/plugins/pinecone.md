---
id: marketplace-plugin-pinecone
title: Pinecone
---

ToolJet integrates with Pinecone to utilize its vector database capabilities. This integration enables ToolJet to perform vector operations such as updating, querying, and managing vector embeddings in Pinecone indexes.

:::note
Before following this guide, it is assumed that you have already completed the process of **[Using Marketplace plugins](/docs/marketplace/marketplace-overview#configuring-plugins)**.
:::

## Connection

For connecting to Pinecone, the following credential is required:

- **API Key**: API key for Pinecone can be generated from the [Pinecone Console](https://app.pinecone.io/organizations/-/projects/-/keys).

<img className="screenshot-full img-full" src="/img/marketplace/plugins/pinecone/connection.png" alt="Configuring Pinecone in ToolJet" />

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

#### Required Parameter

- **Index**: The name of the index to get statistics for.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/pinecone/get-index-query.png" alt="Get Index Stats Operation" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```json
{
  "namespaces" : {} 1 key

  "dimension" : 4
  "indexFullness" : 0  
  "totalRecordCount" : 1
}
```

</details>

### List Vector IDs

This operation retrieves a list of vector IDs from a specified index.

#### Required Parameter

- **Index**: The name of the index to list vector IDs from.

#### Optional Parameters

- **Prefix**: Filter vector IDs by prefix.
- **Limit**: Maximum number of vector IDs to return.
- **Pagination Token**: Token for retrieving the next page of results.
- **Namespace**: Specific namespace to query within the index.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/pinecone/list-vector-query.png" alt="List Vector IDs Operation" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
{
  "vectors":
    [
      { "id": "0" },
      { "id": "1" },
      { "id": "10" },
      { "id": "11" },
      { "id": "12" },
      { "id": "13" },
      { "id": "14" },
      { "id": "15" },
      { "id": "16" },
      { "id": "17" },
    ],
  "pagination": { "next": "eyJza2lwX3Bhc3QiOiIxNyIsInByZWZpeCI6bnVsbH0=" },
  "namespace": "",
  "usage": { "readUnits": 1 },
}
```

</details>

### Fetch Vectors

This operation retrieves specific vectors by their IDs from an index.

#### Required Parameters

- **Index**: The name of the index to fetch vectors from.
- **IDs**: Array of vector IDs to fetch.

#### Optional Parameters

- **Namespace**: Specific namespace to fetch vectors from.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/pinecone/fetch-vec-query.png" alt="Fetch Vectors Operation" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
{ "records": {}, "namespace": "", "usage": { "readUnits": 1 } }
```

</details>

### Upsert Vectors

This operation inserts or updates vectors in an index.

#### Required Parameters

- **Index**: The name of the index to upsert vectors into.
- **Vectors**: Array of vectors to upsert, including IDs and values.

#### Optional Parameters

- **Namespace**: Specific namespace to upsert vectors into

```yaml
[{"id": "1", "values": [-0.057448626,0.040567733,-0.057180677,0.031162664]}]
```

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/pinecone/upsert-query.png" alt="Upsert Vectors Operation" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
Upsert Successful
```

</details>

### Update a Vector

This operation updates a single vector's values or metadata.

#### Required Parameters

- **Index**: The name of the index containing the vector.
- **ID**: ID of the vector to update.

#### Optional Parameters

- **Values**: Updated vector values as an array.
- **Sparse Vector**: Sparse vector representation.
- **Metadata**: Additional metadata for the vector.
- **Namespace**: Specific namespace containing the vector.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/pinecone/update-vec-query.png" alt="Update Vector Operation" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
Update Successful
```

</details>

### Delete Vectors

This operation deletes vectors from an index.

#### Required Parameters

- **Index**: The name of the index to delete vectors from.

#### Optional Parameters

- **IDs**: Array of vector IDs to delete.
- **Delete All**: Boolean flag to delete all vectors.
- **Namespace**: Specific namespace to delete vectors from.
- **Filter**: Filter condition for selective deletion.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/pinecone/delete-query.png" alt="Delete Vectors Operation" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
Delete Successful
```

</details>

### Query Vectors

This operation queries vectors in an index based on similarity.

#### Required Parameters

- **Index**: The name of the index to query.
- **Vectors**: Query vector values.
- **Top K**: Number of most similar vectors to return.

#### Optional Parameters

- **Namespace**: Specific namespace to query.
- **Filter**: Filter condition for the query.
- **Include Values**: Boolean to include vector values in results.
- **Include Metadata**: Boolean to include metadata in results.
- **Sparse Vector**: Sparse vector for hybrid search.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/pinecone/query-vec.png" alt="Query Vectors Operation" />
