---
id: couchdb
title: CouchDB
---

# CouchDB

ToolJet can connect to CouchDB databases to read and write data. CocuhDB uses basic auth for authentication , username and password for the database is required to create an CouchDB data source on ToolJet. For more info visit [CouchDB docs](https://docs.couchdb.org/en/stable/).


## Supported Queries: 

- [Listing Records](#listing-records)
- [Retrieving a Record](#retrieving-a-record)
- [Creating a Record](#creating-a-record)
- [Updating a Record](#updating-a-record)
- [Deleting a Record](#deleting-a-record)
- [Find](#find)
- [Retrieving a View](#retrieving-a-view)

:::info
NOTE: Record ID is same as document ID("_id") .
:::
### Listing Records 

This query lists all the records in a database.

#### Optional Parameters: 

- **Include docs**
- **Descending order**
- **Limit**
- **Skip**

:::info
descending (boolean) – Return the documents in descending order by key. Default is false.

limit (number) – Limit the number of the returned documents to the specified number.

skip (number) – Skip this number of records before starting to return the results. Default is 0.

include_docs (boolean) – include_docs key is set to false by default , if true it returns the document data along with the default fields.

:::


<img className="screenshot-full" src="/img/datasource-reference/couchdb/listing.png" alt="Couch listing"/>



Example response from CouchDb: 

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

### Retrieving a Record 

#### Required Parameters: 

- **Record ID**


<img className="screenshot-full" src="/img/datasource-reference/couchdb/retrieving.png" alt="Couch retrieve view" />



Example response from CouchDb: 

```json
{
    "_id": "e33dc4e209689cb0400d095fc401a1e0",
    "_rev": "1-a62af8e14451af88c150e7e718b7a0e8",
    "0": {
        "name": "test data"
    }
}
```
The returned JSON is the JSON of the document, including the document ID and revision number:


### Creating a Record


<img className="screenshot-full" src="/img/datasource-reference/couchdb/creating.png" alt="Couch create view"/>


#### Example Records:

```json
  [{"name":"tooljet"}]
```

Click on the `run` button to run the query.

Example response from CouchDb:
```json

   {
    "ok": true,
    "id": "23212104e60a71edb42ebc509f0049a2",
    "rev": "1-b0a625abc4e21ee554737920156e911f"
}

```

### Updating a Record

You can get the revision id  value, by sending a GET request to get the document details.
You get the document as JSON in the response. For each update to the document, the revision field "_rev" gets changed.

#### Required Rarameters:
- **Revision ID**
- **Record ID**


<img className="screenshot-full" src="/img/datasource-reference/couchdb/updating.png" alt="Couch update view" />


#### Example Body:

```json
  [{"name":"tooljet"}]
```


Click on the `run` button to run the query.

:::info
NOTE: Query must be saved before running.
:::

Example response from CouchDb:
```json
{
    "ok": true,
    "id": "23212104e60a71edb42ebc509f0049a2",
    "rev": "2-b0a625abc4e21ee554737920156e911f"
}
```

### Deleting a Record

#### Required Parameters:
- **Revision ID**
- **Record ID**


<img className="screenshot-full" src="/img/datasource-reference/couchdb/deleting.png" alt="Couch delete view"/>



Click on the `run` button to run the query.


Example response from CouchDb:

```json
{
    "ok": true,
    "id": "rev_id=2-3d01e0e87139c57e9bd083e48ecde13d&record_id=e33dc4e209689cb0400d095fc401a1e0",
    "rev": "1-2b99ef28c03e68ea70bb668ee55ffb7b"
}
```

### Find 

Find documents using a declarative JSON querying syntax.

#### Required Parameters:
- **Selector**

:::info
NOTE:
selector syntax: https://pouchdb.com/guides/mango-queries.html
:::


<img className="screenshot-full" src="/img/datasource-reference/couchdb/find.png" alt="Couch find" />


#### Example Body:

```json
{
    "selector": {
        "year":  {"$gte": 2015}
    },
    "fields": ["year"]
}
```


Click on the `run` button to run the query.

:::info
NOTE:
selector (json) – JSON object describing criteria used to select documents. 

More information : https://docs.couchdb.org/en/stable/api/database/find.html
:::

Example response from CouchDb:


<img className="screenshot-full" src="/img/datasource-reference/couchdb/find_response.png" alt="Couch find response" />


### Retrieving a View

Views are the primary tool used for querying and reporting on CouchDB documents.

#### Required Parameters:
- **View url**

Reference for view :https://docs.couchdb.org/en/3.2.0/ddocs/views/intro.html#what-is-a-view


<img className="screenshot-full" src="/img/datasource-reference/couchdb/get_view.png" alt="Couch get view" />


#### Optional Parameters: 

- **Start key**
- **End key**
- **Limit**
- **Skip**

Click on the `run` button to run the query.

:::info
startkey (json) – Return records starting with the specified key.

endkey (json) – Stop returning records when the specified key is reached.

limit (number) – Limit the number of the returned documents to the specified number.

skip (number) – Skip this number of records before starting to return the results. Default is 0.
:::

Example response from CouchDb:
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