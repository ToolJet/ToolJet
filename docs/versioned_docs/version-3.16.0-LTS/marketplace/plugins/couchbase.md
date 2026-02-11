---
id: marketplace-plugin-couchbase
title: Couchbase
---

ToolJet integrates with Couchbase to leverage its NoSQL database and advanced vector search capabilities. This enables CRUD document operations, SQL++ queries, and Full-Text Search (FTS) within Couchbase databases. Vector store features support semantic search, hybrid queries, and intelligent application development.

:::note
Before following this guide, it is assumed that you have already completed the process of **[Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

To connect with Couchbase, you will need the following credentials. Which you can generate from [Couchbase Console](https://www.couchbase.com/).

- **Data API Endpoint** 
- **Username**
- **Password**

<img className="screenshot-full img-full" src="/img/marketplace/plugins/couchbase/connection-v2.png" alt="Configuring Couchbase in ToolJet" />

### Connecting to Data API endpoint in ToolJet

To connect ToolJet with the Couchbase Data API, you must first enable the Data API access and configure authentication properly.

- **Configure Allowed IP Addresses**: For public connections, you must allow the IP address from which ToolJet will send requests. Add the required IP or CIDR block under Allowed IP Addresses.
- **Set Up Cluster Access Credentials**: Create or use existing cluster credentials to authenticate Data API requests.
- **Retrieve the Data API Endpoint URL**: Once enabled, Couchbase displays the Data API endpoint URL, which can be used as the base URL in ToolJet.


## Supported Operations

- **[Get Document](#get-document)**
- **[Create Document](#create-document)**
- **[Update Document](#update-document)**
- **[Delete Document](#delete-document)**
- **[Query](#query)**
- **[FTS Search](#fts-search)**

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/couchbase/listops.png" alt="Couchbase operations" />

### Get Document

This operation retrieves a specific document by its ID from a Couchbase collection.

#### Required Parameters

- **Bucket**: The name of the bucket containing the document
- **Document ID**: The unique identifier of the document to retrieve
- **Scope**: The scope name 
- **Collection**: The collection name

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/couchbase/get-doc.png" alt="Get Document Operation" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```json
{
  "id": "user::123",
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "created_at": "2026-02-04T12:15:00Z"
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


<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/couchbase/create-doc.png" alt="Create Document Operation" />

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


<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/couchbase/update-doc.png" alt="Update Document Operation" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
Updated successfully
```
</details>

Note: Update operation replaces the original document with the updated value of the document passed. 

### Delete Document

This operation deletes a document from a Couchbase collection.

#### Required Parameters

- **Bucket**: The name of the bucket containing the document
- **Scope**: The scope name
- **Collection**: The collection name
- **Document ID**: The unique identifier of the document to delete

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/couchbase/delete-doc.png" alt="Delete Document Operation" />

<details id="tj-dropdown">
<summary>**Example Response**</summary>

```yaml
Deleted successfully
```
</details>

### Query

This operation executes SQL++ queries against your Couchbase database.

#### Required Parameters

- **SQL++ Query**: The SQL++ statement to execute (use `$parameter` placeholders for named parameters)

#### Optional Parameters

- **Arguments (Key-Value)**: Key-value object for named parameters that replace `$parameter` placeholders in the query
- **Query Options**: JSON object containing additional query options like `readonly`, `timeout`, etc.

<details id="tj-dropdown">
<summary>**Example Query**</summary>

```sql
SELECT * FROM `travel-sample`.`inventory`.`airline` WHERE country = $country LIMIT 10
```

**Arguments (Key-Value)**: `{ "$country": "France" }`

**Query Options**: `{ "readonly": true, "query_context": "travel-sample.inventory" }`

Refer to the [request paramters](https://docs.couchbase.com/server/current/n1ql-rest-query/index.html#Request) for supported query options.

</details>

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/marketplace/plugins/couchbase/query-v2.png" alt="Query Operation" />

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

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/couchbase/fts-search-v2.png" alt="FTS Search Operation" />

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