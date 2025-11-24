---
id: couchdb
title: CouchDB
---

ToolJet can connect to CouchDB databases to read and write data. 

<div style={{paddingTop:'24px'}}>

## Connection

To establish a connection with the CouchDB data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page through the ToolJet dashboard.

ToolJet requires the following to connect to your CouchDB.
- **Username**
- **Password**

<img className="screenshot-full" src="/img/datasource-reference/couchdb/connections.png" alt="Couch listing"/>

</div>

<div style={{paddingTop:'24px'}}>

## Querying CouchDB

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **CouchDB** datasource added in previous step.
3. Select the operation you want to perform and enter the query.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to create and trigger the query.

<img className="screenshot-full" src="/img/datasource-reference/couchdb/operations.png" alt="Couch listing"/>

</div>

<div style={{paddingTop:'24px'}}>

## Supported Queries 

- **[List Records](#list-records)**
- **[Retrieve Record](#retrieve-record)**
- **[Create Record](#create-record)**
- **[Update Record](#update-record)**
- **[Delete Record](#delete-record)**
- **[Find](#find)**
- **[Get View](#get-view)**

### List Records 

This query lists all the records in a database.

#### Optional Parameters

- **Include docs**
- **Descending order**
- **Limit**
- **Skip**

<img className="screenshot-full" src="/img/datasource-reference/couchdb/listing-v2.png" alt="Couch listing"/>

<details id="tj-dropdown">
  <summary>**Response Example**</summary>
  ```json
{
    "total_rows": 3,
    "offset": 0,
    "rows": [
        {
            "id": "23212104e60a71edb42ebc509f000dc2",
            "key": "23212104e60a71edb42ebc509f000dc2",
            "value": {
                "rev": "1-0cc7f48876f15883394e5c139c628123"
            }
        },
        {
            "id": "23212104e60a71edb42ebc509f00216e",
            "key": "23212104e60a71edb42ebc509f00216e",
            "value": {
                "rev": "1-b3c45696b10cb08221a335ff7cbd8b7a"
            }
        },
        {
            "id": "23212104e60a71edb42ebc509f00282a",
            "key": "23212104e60a71edb42ebc509f00282a",
            "value": {
                "rev": "1-da5732beb913ecbded309321cac892d2"
            }
        },
    ]
}
```
</details>

### Retrieve Record 

This operation fetches a single record by its record ID.

#### Required Parameters: 

- **Record ID**


<img className="screenshot-full" src="/img/datasource-reference/couchdb/retrieving-v2.png" alt="Couch retrieve view" />

<details id="tj-dropdown">
  <summary> **Response Example** </summary>
```json
{
    "_id": "e33dc4e209689cb0400d095fc401a1e0",
    "_rev": "1-a62af8e14451af88c150e7e718b7a0e8",
    "0": {
        "name": "test data"
    }
}
```
</details>

### Create Record

Inserts a new record into the database.

#### Required Parameters: 

- **Records**


<img className="screenshot-full" src="/img/datasource-reference/couchdb/creating-v2.png" alt="Couch create view"/>

#### Example

```json
  [{"name":"tooljet"}]
```

<details id="tj-dropdown">
  <summary>**Response Example**</summary>
    ```json
    {
        "ok": true,
        "id": "23212104e60a71edb42ebc509f0049a2",
        "rev": "1-b0a625abc4e21ee554737920156e911f"
    }
    ```
</details>

### Update Record

You can get the revision id  value, by sending a GET request to get the document details.
You get the document as JSON in the response. For each update to the document, the revision field "_rev" gets changed.

#### Required Parameters:
- **Record ID**
- **Revision ID**


<img className="screenshot-full" src="/img/datasource-reference/couchdb/updating-v2.png" alt="Couch update view" />


#### Example

```json
[{"name":"tooljet"}]
```

<details id="tj-dropdown">
  <summary>**Response Example**</summary>
  ```json
  {
      "ok": true,
      "id": "23212104e60a71edb42ebc509f0049a2",
      "rev": "2-b0a625abc4e21ee554737920156e911f"
  }
 ```
</details>

### Delete Record

Removes a record from the database by its record ID.

#### Required Parameters:
- **Record ID**
- **Revision ID**


<img className="screenshot-full" src="/img/datasource-reference/couchdb/deleteRecord.png" alt="Couch delete view"/>

<details id="tj-dropdown">
  <summary>**Response Example**</summary>
    ```json
    {
        "ok": true,
        "id": "rev_id=2-3d01e0e87139c57e9bd083e48ecde13d&record_id=e33dc4e209689cb0400d095fc401a1e0",
        "rev": "1-2b99ef28c03e68ea70bb668ee55ffb7b"
    }
    ```
</details>

### Find 

Find documents using a declarative JSON querying syntax.

#### Required Parameters:
- **Mangoquery**

:::info
NOTE:
selector syntax: https://pouchdb.com/guides/mango-queries.html
:::


<img className="screenshot-full" src="/img/datasource-reference/couchdb/find-v2.png" alt="Couch find" />


#### Example

```json
{
    "selector": {
        "year":  {"$gte": 2015}
    },
    "fields": ["year"]
}
```

Example response from CouchDB:

<img className="screenshot-full" src="/img/datasource-reference/couchdb/find_response.png" alt="Couch find response" />

### Get View

Views are the primary tool used for querying and reporting on CouchDB documents.

#### Required Parameters
- **View url**


#### Optional Parameters: 
- **Start key**
- **End key**
- **Limit**
- **Skip**

<img className="screenshot-full" src="/img/datasource-reference/couchdb/get_view-v2.png" alt="Couch get view" />

<details id="tj-dropdown">
  <summary>**Response Example**</summary>
  ```json
    {
        "total_rows": 4,
        "offset": 0,
        "rows": [
            {
                "id": "23212104e60a71edb42ebc509f000dc2",
                "key": "23212104e60a71edb42ebc509f000dc2",
                "value": {
                    "rev": "1-0cc7f48876f15883394e5c139c628123"
                }
            },
            {
                "id": "23212104e60a71edb42ebc509f00216e",
                "key": "23212104e60a71edb42ebc509f00216e",
                "value": {
                    "rev": "1-b3c45696b10cb08221a335ff7cbd8b7a"
                }
            },
            {
                "id": "23212104e60a71edb42ebc509f00282a",
                "key": "23212104e60a71edb42ebc509f00282a",
                "value": {
                    "rev": "1-da5732beb913ecbded309321cac892d2"
                }
            },
            {
                "id": "23212104e60a71edb42ebc509f002cbd",
                "key": "23212104e60a71edb42ebc509f002cbd",
                "value": {
                    "rev": "1-ca5bb3c0767eb42ea6c33eee3d395b59"
                }
            }
        ]
    }
    ```
</details>

</div>
