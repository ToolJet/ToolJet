---
id: marketplace-plugin-qdrant
title: Qdrant
---

Qdrant can be integrated with ToolJet to perform high performance vector search at scale. It helps AI applications with advance, open source vector similarity search technology.

## Supported Queries

### Points

Points are the central entity that Qdrant operates with. It is a record that consists a vector and an optional payload (additional information along with vectors). Types of point operations that ToolJet supports are:

### Get Collection info

Retrieves metadata and configuration details about a specific collection in Qdrant.

**Required Parameters:**

- **Collection Name:** Refers to the specific dataset stored in Qdrant.

<img className="screenshot-full" src="/img/marketplace/plugins/qdrant/get_collection_info.png" alt="Get Collection Info" />

### Get Points

Refers to retrieving specific data points from a collection using their unique identifiers. This operation can be performed via the REST API by specifying the desired point IDs.

**Required Parameters:**

- **Collection Name:** Refers to the specific dataset stored in Qdrant.
- **IDs:** Unique identifiers for individual data points within the collection. They are used to locate and retrieve specific entries from the collection.

<img className="screenshot-full" src="/img/marketplace/plugins/qdrant/get_points.png" alt="Get Points" />

### Delete Points

Remove specific data points from a collection using their unique identifiers.

**Required Parameters:**

- **Collection Name:** Refers to the specific dataset stored in Qdrant.
- **IDs:** Unique identifiers for individual data points within the collection. They are used to locate and retrieve specific entries from the collection.
- **Filter:** Used to set conditions when searching or retrieving points.

<img className="screenshot-full" src="/img/marketplace/plugins/qdrant/delete_points.png" alt="Delete Points" />

### Query Points

Search for data points in a collection using a query, typically based on vector similarity or filtering conditions.

**Required Parameters:**

- **Collection Name:** Identifies the dataset where the query will be executed.
- **Limit:** Specifies the maximum number of results to return.
- **Filter:** Defines conditions to narrow down the search.
- **With Vectors:** Indicates whether the vector data for the retrieved points should be included in the response (true or false).
- **Include Metadata:** Specifies if metadata associated with the points should be returned (true or false).
- **Query:** A vector representing the query input used for similarity-based search.

<img className="screenshot-full" src="/img/marketplace/plugins/qdrant/query_points.png" alt="Query Points" />

### Upsert Points

Add new data points or update existing ones in a collection based on their unique identifiers.

**Required Parameters:**

- **Collection Name:** Represents the group of data points where the new or updated points will be stored.
- **Points:** The actual data being added or updated. Each point contains a unique identifier and optional attributes.

<img className="screenshot-full" src="/img/marketplace/plugins/qdrant/upsert_points.png" alt="Upsert Points" />
