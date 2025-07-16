---
id: marketplace-plugin-couchbase
title: Couchbase
---

ToolJet integrates with Couchbase to utilize its NoSQL database capabilities. This integration enables ToolJet to perform document operations such as creating, reading, updating, and deleting documents, as well as executing SQL++ queries and Full-Text Search (FTS) operations in Couchbase databases.

:::note
Before following this guide, it is assumed that you have already completed the process of **[Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

For connecting to Couchbase, the following credentials are required:

- **Data API Endpoint**: Your Couchbase Data API endpoint URL 
- **Username**: Your Couchbase username
- **Password**: Your Couchbase password

<img className="screenshot-full" src="/img/marketplace/plugins/couchbase/connection.png" alt="Configuring Couchbase in ToolJet" />

## Supported Operations

- **[Get Document](#get-document)**
- **[Create Document](#create-document)**
- **[Update Document](#update-document)**
- **[Delete Document](#delete-document)**
- **[Query](#query)**
- **[FTS Search](#fts-search)**

### Get Document

This operation retrieves a specific document by its ID from a Couchbase collection.

#### Required Parameters

- **Bucket**: The name of the bucket containing the document
- **Document ID**: The unique identifier of the document to retrieve
- **Scope**: The scope name 
- **Collection**: The collection name

<img className="screenshot-full" src="/img/marketplace/plugins/couchbase/get-document.png" alt="Get Document Operation" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```json
{
  "id": "user::123",
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "created_at": "2023-01-15T10:30:00Z"
}
```
</details>

### Create Document

This operation creates a new document in a Couchbase collection.

#### Required Parameters

- **Bucket**: The name of the bucket to create the document in
- **Scope**: The scope name
- **Collection**: The collection name
- **Document ID**: The unique identifier for the new document
- **Document**: The document data as a JSON object


<img className="screenshot-full" src="/img/marketplace/plugins/couchbase/create-document.png" alt="Create Document Operation" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
Created successfully
```
</details>

### Update Document

This operation updates an existing document in a Couchbase collection.

#### Required Parameters

- **Bucket**: The name of the bucket containing the document
- **Scope**: The scope name
- **Collection**: The collection name
- **Document ID**: The unique identifier of the document to update
- **Document**: The updated document data as a JSON object


<img className="screenshot-full" src="/img/marketplace/plugins/couchbase/update-document.png" alt="Update Document Operation" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
Updated successfully
```
</details>

### Delete Document

This operation deletes a document from a Couchbase collection.

#### Required Parameters

- **Bucket**: The name of the bucket containing the document
- **Scope**: The scope name
- **Collection**: The collection name
- **Document ID**: The unique identifier of the document to delete

<img className="screenshot-full" src="/img/marketplace/plugins/couchbase/delete-document.png" alt="Delete Document Operation" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
Deleted successfully
```
</details>

### Query

This operation executes SQL++ queries against your Couchbase database.

#### Required Parameters

- **SQL++ Query**: The SQL++ statement to execute (use `?` placeholders for parameters)

#### Optional Parameters

- **Arguments**: Array of arguments to replace `?` placeholders in the query

<img className="screenshot-full" src="/img/marketplace/plugins/couchbase/query.png" alt="Query Operation" />

<details id="tj-dropdown">
<summary>**Example Query**</summary>

```sql
SELECT * FROM `travel-sample`.`inventory`.`airline` WHERE country = ? LIMIT 10
```

**Arguments**: `["France"]`

</details>

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```json
{
  "results": [
    {
      "airline": {
        "id": 137,
        "type": "airline",
        "name": "Air France",
        "iata": "AF",
        "icao": "AFR",
        "callsign": "AIRFRANS",
        "country": "France"
      }
    }
  ],
  "status": "success",
  "metrics": {
    "elapsedTime": "15.2ms",
    "executionTime": "14.8ms",
    "resultCount": 1,
    "resultSize": 234
  }
}
```
</details>

### FTS Search

This operation performs Full-Text Search queries against a Couchbase FTS index.

#### Required Parameters

- **Bucket**: The name of the bucket to search in
- **Scope**: The scope name
- **Index Name**: The name of the FTS index to search against
- **Search Query**: The FTS search query as a JSON object

<img className="screenshot-full" src="/img/marketplace/plugins/couchbase/fts-search.png" alt="FTS Search Operation" />

<details id="tj-dropdown">
<summary>**Example Search Query**</summary>

```json
{
  "query": {
    "match": "hotel",
    "field": "name"
  }
}
```

</details>

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```json
{
  "status": {
    "total": 1,
    "failed": 0,
    "successful": 1
  },
  "request": {
    "query": {
      "match": "hotel",
      "field": "name"
    }
  },
  "hits": [
    {
      "index": "hotel-index",
      "id": "hotel_123",
      "score": 0.8567,
      "fields": {
        "name": "Grand Hotel",
        "city": "Paris",
        "country": "France"
      }
    }
  ],
  "total_hits": 1,
  "max_score": 0.8567,
  "took": 12
}
```
</details> 