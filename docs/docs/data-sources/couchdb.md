---
sidebar_position: 4.1
---

# Couchdb


ToolJet can connect to CouchDB databases to read and write data. CocuhDB uses basic auth for authentication , username and password for the database is required to create an CouchDB data source on ToolJet. For more info visit https://docs.couchdb.org/en/stable/

<img class="screenshot-full" src="/img/datasource-reference/couchdb/auth_couch.gif" alt="ToolJet - Data source - CouchDb" height="420" />

Supported queries: 

- Listing records 
- Retrieving a record
- Creating a record
- Updating a record
- Deleting a record
- Find 
- Retrieving a view

:::info
NOTE: Record ID is same as document ID("_id") .
:::
## Listing records 

This query lists all the records in a database.

Optional parameters: 

- Descending order
- Limit
- Skip 
- Include docs 


:::info
descending (boolean) – Return the documents in descending order by key. Default is false.

limit (number) – Limit the number of the returned documents to the specified number.

skip (number) – Skip this number of records before starting to return the results. Default is 0.

include_docs (boolean) – include_docs key is set to false by default , if true it returns the document data along with the default fields.

:::

<img class="screenshot-full" src="/img/datasource-reference/couchdb/list.png" alt="ToolJet - CouchDb Delete Operarion" height="420" />


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

## Retrieving a record 

Required parameters: 

- Record ID


<img class="screenshot-full" src="/img/datasource-reference/couchdb/retreive.png" alt="ToolJet - Data source - CouchDb Retrieve Operation" height="420" />


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


## Creating a record

<img class="screenshot-full" src="/img/datasource-reference/couchdb/create.png" alt="ToolJet - Data source - CouchDb Create Operarion" height="420"/>

#### Example Records:

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
    "rev": "1-b0a625abc4e21ee554737920156e911f"
}

```

## Updating a record

You can get the revision id  value, by sending a GET request to get the document details.
You get the document as JSON in the response. For each update to the document, the revision field "_rev" gets changed.


Required parameters:
- Revision ID
- Record ID

<img class="screenshot-full" src="/img/datasource-reference/couchdb/update.png" alt="ToolJet - Data source - CouchDb Update Operarion" height="420"/>

#### Example body:

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

## Deleting a record

Required parameters:
- Revision ID
- Record ID

<img class="screenshot-full" src="/img/datasource-reference/couchdb/delete.png" alt="ToolJet - CouchDb Delete Operarion" height="420" />


Click on the `run` button to run the query.


Example response from CouchDb:

```json
{
    "ok": true,
    "id": "rev_id=2-3d01e0e87139c57e9bd083e48ecde13d&record_id=e33dc4e209689cb0400d095fc401a1e0",
    "rev": "1-2b99ef28c03e68ea70bb668ee55ffb7b"
}
```

## Find 

Find documents using a declarative JSON querying syntax.

Required parameters:
- Selector

:::info
NOTE:
selector syntax: https://pouchdb.com/guides/mango-queries.html
:::

<img class="screenshot-full" src="/img/datasource-reference/couchdb/find.png" alt="ToolJet - Data source - CouchDb Find Operarion" height="420"/>

#### Example body:

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
<img class="screenshot-full" src="/img/datasource-reference/couchdb/find_response.png" alt="ToolJet - Data source - CouchDb Find Operarion" height="420"/>

## Retrieving a view

Views are the primary tool used for querying and reporting on CouchDB documents.

Required parameters:
- View url

Reference for view :https://docs.couchdb.org/en/3.2.0/ddocs/views/intro.html#what-is-a-view

<img class="screenshot-full" src="/img/datasource-reference/couchdb/view.png" alt="ToolJet - Data source - CouchDb View Operarion" height="420"/>


Optional parameters: 

- Start key
- End key
- Limit
- Skip 

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