---
id: marketplace-plugin-qdrant
title: Qdrant
---

Qdrant is a vector database which can be integrated with ToolJet to enable efficient vector search at scale. It supports AI applications with advanced technology for finding similar vectors.

At its core, Qdrant operates with points, which are records consisting of a vector and an optional payload which allows you to store additional context or metadata alongside the vectors for more meaningful searches.

## Connection

To connect with Qdrant, you will need Qdrant URL and an API key, which can be generated from [Qdrant Cloud Dashboard](https://qdrant.to/cloud).

<img className="screenshot-full img-full" src="/img/marketplace/plugins/qdrant/config.png" alt="Qdrant Configuration" />

## Supported Operations

### Get Collection Info

Use this operation to retrieve metadata and configuration details about a specific collection in Qdrant.

**Required Parameter**

- **Collection Name:** Refers to the specific dataset stored in Qdrant.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/qdrant/get-collection-info.png" alt="Get Collection Info" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>
```yaml
{
    "status": "green",
    "optimizer_status": "ok",
    "indexed_vectors_count": 5417,
    "points_count": 5412,
    "segments_count": 2,
    "config": {
        "params": {
            "vectors": {
                "size": 512,
                "distance": "Cosine"
            },
            "shard_number": 1,
            "replication_factor": 1,
            "write_consistency_factor": 1,
            "on_disk_payload": true
        },
        "hnsw_config": {
            "m": 16,
            "ef_construct": 100,
            "full_scan_threshold": 10000,
            "max_indexing_threads": 0,
            "on_disk": false
        },
        "optimizer_config": {
            "deleted_threshold": 0.2,
            "vacuum_min_vector_number": 1000,
            "default_segment_number": 2,
            "max_segment_size": null,
            "memmap_threshold": null,
            "indexing_threshold": 1000,
            "flush_interval_sec": 5,
            "max_optimization_threads": null
        },
        "wal_config": {
            "wal_capacity_mb": 1,
            "wal_segments_ahead": 0
        },
        "quantization_config": null,
        "strict_mode_config": {
            "enabled": false
        }
    },
    "payload_schema": {}
}
```
</details>

### Get Points

Use this operation to retrieve specific data points from a collection using their unique identifiers.

**Required Parameters**

- **Collection Name:** Refers to the specific dataset stored in Qdrant.
- **IDs:** Unique identifiers for individual data points within the collection. They are used to locate and retrieve specific entries from the collection.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/qdrant/get-points.png" alt="Get Points" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
[{
    "id": 1,
    "payload": {
        "file_name": "text.jpeg",
        "image_url": "https://storage.googleapis.com/demo-midjourney/.jpeg",
        "name": "Catherine Hyde",
        "url": "/styles/catherine-hyde"
    },
    "vector": [0.043383807, -0.06374442, -0.013710048, -0.0332631, 0.013115806, -0.018017521, -0.01306308, -0.030214038, 0.009868348, 0.02169504, -0.009813371, -0.033448037, 0.004893773, -0.009090395...]
}]
```
</details>

### Delete Points

Use this operation to remove specific data points from a collection using their unique identifiers.

**Required Parameters**

- **Collection Name:** Refers to the specific dataset stored in Qdrant.
- **IDs:** Unique identifiers for individual data points within the collection. They are used to locate and retrieve specific entries from the collection.

**Optional Parameter**

- **Filter:** Used to set conditions when searching or retrieving points.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/qdrant/delete-points.png" alt="Delete Points" />

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

<img className="screenshot-full img-full" src="/img/marketplace/plugins/qdrant/query-points.png" alt="Query Points" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
[{
    "id": 2589,
    "version": 124,
    "score": 0.1293197
}, {
    "id": 2274,
    "version": 111,
    "score": 0.12669206
}, {
    "id": 2612,
    "version": 124,
    "score": 0.12196793
}]
```
</details>

### Upsert Points

Use this operation to add new data points or update existing ones in a collection based on their unique identifiers.

**Required Parameters**

- **Collection Name:** Represents the group of data points where the new or updated points will be stored.
- **Points:** The actual data being added or updated. Each point contains a unique identifier and optional attributes.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/qdrant/upsert-points.png" alt="Upsert Points" />
