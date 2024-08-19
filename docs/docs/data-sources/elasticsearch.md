---
id: elasticsearch  
title: Elasticsearch
---

# Elasticsearch

ToolJet allows you to connect to your Elasticsearch cluster to perform data read/write operations and execute various queries.

## Connection

To connect to an Elasticsearch data source in ToolJet, you can either click the **+Add new data source** button on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page in the ToolJet dashboard.

For self-hosted ToolJet, ensure that the Elasticsearch cluster's host/IP is accessible from your VPC. If using ToolJet Cloud, please make sure to **whitelist our IP**.

To connect to your Elasticsearch cluster, the following details are required:
- **Host**
- **Port**
- **Username**
- **Password**

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/elasticsearch/connect-v2.png" alt="Elastic Connect" />
</div>

ToolJet also supports SSL certificate-based connections:
- You can use either CA or Client certificates.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/elasticsearch/ssl-v2.png" alt="Elastic SSL Connect" />
</div>

## Querying Elasticsearch

1. Click the **+** button in the query manager at the bottom of the editor and select the Elasticsearch data source added earlier.
2. Choose the operation you want to perform on your Elasticsearch cluster.

:::tip
Query results can be transformed using transformations. Refer to our transformations documentation for more details: **[link](/docs/tutorial/transformations)**
:::

## Supported Operations

ToolJet supports the following Elasticsearch operations:

- **[Search](#search)**
- **[Index a Document](#index-a-document)**
- **[Get a Document](#get-a-document)**
- **[Update a Document](#update-a-document)**
- **[Delete a Document](#delete-a-document)**
- **[Bulk Operation](#bulk-operation)**
- **[Count Documents](#count-documents)**
- **[Check Document Existence](#check-document-existence)**
- **[Multi Get](#multi-get)**
- **[Scroll Search](#scroll-search)**
- **[Clear Scroll](#clear-scroll)**
- **[Get Cat Indices](#get-cat-indices)**
- **[Get Cluster Health](#get-cluster-health)**

### Search

This operation executes a search query and returns matching search hits. For more details, see the Elasticsearch search guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-search.html)**.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/elasticsearch/elastic-search-v2.png" alt="Elastic search" />
</div>

#### Parameters:
- **Index**: The name of the index to search in.
- **Query**: The search query in JSON format.
- **Scroll** (Optional): Scroll time.

#### Example:
```yaml
Index: books
Query:
  {
    "query": {
      "match": {
        "title": "The Great Gatsby"
      }
    },
    "size": 20
  }
Scroll: 1m # Can be in the format of 1m, 1h, 1d.
```

### Index a Document

This operation adds a JSON document to the specified index or data stream. For more details, see the Elasticsearch index guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-index_.html)**.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/elasticsearch/index-v2.png" alt="Elastic index"/>
</div>

#### Parameters:
- **Index**: The name of the index to add the document to
- **Body**: The document body in JSON format

#### Example:
```yaml
Index: books
Body:
  {
    "title": "1984",
    "author": "George Orwell",
    "year": 1949,
    "genre": "Dystopian Fiction"
  }
```

### Get a Document

This operation retrieves the specified JSON document from the index. For more details, see the Elasticsearch get guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-get.html)**.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/elasticsearch/get-v2.png"  alt="Elastic get"/>
</div>

#### Parameters:
- **Index**: The name of the index to get the document from
- **Id**: The ID of the document to retrieve

#### Example:
```yaml
Index: books
Id: FJXTSZEBsuzUn2y4wZ-W
```

### Update a Document

This operation updates a document using the specified script. For more details, see the Elasticsearch update guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-update.html)**.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/elasticsearch/update-v2.png" alt="Elastic update" />
</div>

#### Parameters:
- **Index**: The name of the index containing the document
- **Id**: The ID of the document to update
- **Body**: The update script or partial document in JSON format

#### Example:
```yaml
Index: books
Id: FJXTSZEBsuzUn2y4wZ-W
Body:
{
  "doc": {
    "title": "1984",
    "author": "George Orwell",
    "year": 1949,
    "genre": "Fiction"
  }
}
```

### Delete a Document

This operation removes a JSON document from the specified index. For more details, see the Elasticsearch delete guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-delete.html)**.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/elasticsearch/delete.png" alt="Elastic delete" />
</div>

#### Parameters:
- **Index**: The name of the index containing the document
- **Id**: The ID of the document to delete

#### Example:
```yaml
Index: books
Id: FJXTSZEBsuzUn2y4wZ-W
```

### Bulk Operation

This operation performs multiple index/update/delete operations in a single API call. For more details, see the Elasticsearch bulk guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html)**.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/elasticsearch/bulk.png" alt="Elastic bulk" />
</div>

#### Parameters:
- **Operations**: The bulk operations to perform in JSON format

#### Example:
```yaml
Operations:
[
  {
    "index": { "_index": "books", "_id": "book124" },
    "document": {
      "title": "To Kill a Mockingbird",
      "author": "Harper Lee",
      "year": 1960
    }
  },
  {
    "index": { "_index": "books", "_id": "book125" },
    "document": {
      "title": "Pride and Prejudice",
      "author": "Jane Austen",
      "year": 1813
    }
  }
]
```

### Count Documents

This operation returns the number of matches for a search query. For more details, see the Elasticsearch count guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-count.html)**.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/elasticsearch/count.png" alt="Elastic count" />
</div>

#### Parameters:
- **Index**: The name of the index to count documents in
- **Query** (Optional): The query to filter documents in JSON format

#### Example:
```yaml
Index: books
Query:
  {
    "query": {
      "range": {
        "timestamp": {
          "gte": 1901
        }
      }
    }
  }
```

### Check Document Existence

This operation checks if a document exists in an index. For more details, see the Elasticsearch exists guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-get.html#docs-get-api-response-codes)**.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/elasticsearch/exists.png" alt="Elastic exists" />
</div>

#### Parameters:
- **Index**: The name of the index to check for document existence
- **Id**: The ID of the document to check

#### Example:
```yaml
Index: books
Id: FJXTSZEBsuzUn2y4wZ-W
```

### Multi Get

This operation retrieves multiple documents in a single request. For more details, see the Elasticsearch multi-get guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-multi-get.html)**.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/elasticsearch/mget.png" alt="Elastic multi get" />
</div>

#### Parameters:
- **Operations**: The multi-get operations to perform in JSON format

#### Example:
```yaml
Operations:
  {
    "docs": [
      { "_index": "books", "_id": "book124" },
      { "_index": "books", "_id": "book125" },
    ]
  }
```

### Scroll Search

This operation retrieves large numbers of results from a single search request. For more details, see the Elasticsearch scroll guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/paginate-search-results.html#scroll-search-results)**.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/elasticsearch/scroll-search.png" alt="Elastic scroll" />
</div>

#### Parameters:
- **Scroll ID**: The scroll ID for the search
- **Scroll**: The scroll time

#### Example:
```yaml
Scroll ID: DXF1ZXJ5QW5kRmV0Y2gBAAAAAAAAOWQWYm9vbDItY1NCOUExal9TcTBjeUEyZw
Scroll: 60m
```

### Clear Scroll

This operation clears the search context for a scroll. For more details, see the Elasticsearch clear scroll guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/clear-scroll-api.html)**.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/elasticsearch/clear-scroll.png" alt="Elastic clear scroll" />
</div>

#### Parameters:
- **Scroll ID**: The scroll ID to clear

#### Example:
```yaml
Scroll ID: DXF1ZXJ5QW5kRmV0Y2gBAAAAAAAAOWQWYm9vbDItY1NCOUExal9TcTBjeUEyZw
```

### Get Cat Indices

This operation provides a compact, column-aligned view of indices in a cluster. For more details, see the Elasticsearch cat indices guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/cat-indices.html)**.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/elasticsearch/cat-indices.png" alt="Elastic cat indices" />
</div>

  <details>
  <summary>**Response Example**</summary>
```json
{
  "body": [
    {
      "health": "yellow",
      "status": "open",
      "index": "1",
      "uuid": "JQOzqxK7Rdar7ROOlqXwkA",
      "pri": "1",
      "rep": "1",
      "docs.count": "2",
      "docs.deleted": "0",
      "store.size": "9.2kb",
      "pri.store.size": "9.2kb"
    },
    {
      "health": "yellow",
      "status": "open",
      "index": "recipes",
      "uuid": "eNGdAsG4TMWvs9f0eLERlQ",
      "pri": "1",
      "rep": "1",
      "docs.count": "20",
      "docs.deleted": "0",
      "store.size": "30kb",
      "pri.store.size": "30kb"
    },
    {
      "health": "yellow",
      "status": "open",
      "index": "read_me",
      "uuid": "EbE4V-5RRE2y-_P4z_auVQ",
      "pri": "1",
      "rep": "1",
      "docs.count": "1",
      "docs.deleted": "0",
      "store.size": "5.1kb",
      "pri.store.size": "5.1kb"
    }
  ],
  "statusCode": 200,
  "headers": {
    "x-elastic-product": "Elasticsearch",
    "content-type": "application/json",
    "content-length": "558"
  },
  "meta": {
    "context": null,
    "request": {
      "params": {
        "method": "GET",
        "path": "/_cat/indices",
        "body": null,
        "querystring": "format=json",
        "headers": {
          "user-agent": "opensearch-js/1.2.0 (linux 6.5.0-1021-aws-x64; Node.js v18.18.2)"
        },
        "timeout": 30000
      },
      "options": {},
      "id": 1
    },
    "name": "opensearch-js",
    "connection": {
      "url": "http://xx.2xx.183.199:9200/",
      "id": "http://xx.2xx.183.199:9200/",
      "headers": {},
      "deadCount": 0,
      "resurrectTimeout": 0,
      "_openRequests": 0,
      "status": "alive",
      "roles": {
        "master": true,
        "data": true,
        "ingest": true
      }
    },
    "attempts": 0,
    "aborted": false
  }
}
```
</details>

### Get Cluster Health

This operation retrieves the status of the cluster’s health. For more details, see the Elasticsearch cluster health guide **[here](https://www.elastic.co/guide/en/elasticsearch/reference/current/cluster-health.html)**.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/datasource-reference/elasticsearch/cluster-health.png" alt="Elastic cluster health" />
</div>

  <details>
  <summary>**Response Example**</summary>
```json
{
  "body": {
    "cluster_name": "docker-cluster",
    "status": "yellow",
    "timed_out": false,
    "number_of_nodes": 1,
    "number_of_data_nodes": 1,
    "active_primary_shards": 10,
    "active_shards": 10,
    "relocating_shards": 0,
    "initializing_shards": 0,
    "unassigned_shards": 3,
    "delayed_unassigned_shards": 0,
    "number_of_pending_tasks": 0,
    "number_of_in_flight_fetch": 0,
    "task_max_waiting_in_queue_millis": 0,
    "active_shards_percent_as_number": 76.92307692307693
  },
  "statusCode": 200,
  "headers": {
    "x-elastic-product": "Elasticsearch",
    "content-type": "application/json",
    "content-length": "405"
  },
  "meta": {
    "context": null,
    "request": {
      "params": {
        "method": "GET",
        "path": "/_cluster/health",
        "body": null,
        "querystring": "",
        "headers": {
          "user-agent": "opensearch-js/1.2.0 (linux 6.5.0-1021-aws-x64; Node.js v18.18.2)"
        },
        "timeout": 30000
      },
      "options": {},
      "id": 1
    },
    "name": "opensearch-js",
    "connection": {
      "url": "http://xx.2xx.183.199:9200/",
      "id": "http://xx.2xx.183.199:9200/",
      "headers": {},
      "deadCount": 0,
      "resurrectTimeout": 0,
      "_openRequests": 0,
      "status": "alive",
      "roles": {
        "master": true,
        "data": true,
        "ingest": true
      }
    },
    "attempts": 0,
    "aborted": false
  }
}
```
</details>