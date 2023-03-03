---
id: firestore
title: Cloud Firestore
---

# Cloud Firestore

## Connection 
ToolJet connects to your Cloud Firestore using JSON key of your GCP service account.
To generate a new key, check out [Firestore's official documentation](https://cloud.google.com/iam/docs/creating-managing-service-account-keys#iam-service-account-keys-create-console).

Once the key is downloaded, click on `+` button of data sources panel at the left-bottom corner of the app editor. Select Firestore from the modal that pops up. Paste the key in the field for GCP key. Click on **Test connection** button to verify if the service account can access Firestore from ToolJet server. Click on **Save** button to save the datasource.


<img className="screenshot-full" src="/img/datasource-reference/firestore/add-ds-firestore.gif"  alt="firestore add ds"/>


## Querying Firestore 

Click on `+` button of the query manager at the bottom panel of the editor and select the database added in the previous step as the data source.


<img className="screenshot-full" src="/img/datasource-reference/firestore/firestore-query.png" alt="firestore QUERY" />


Select the operation that you want to perform on Firestore and click **Save** to save the query. 

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: **[link](/docs/tutorial/transformations)**
:::

## Supported operations
1. [Get document](#get-document)
2. [Query collection](#query-collection)
3. [Add Document to Collection](#add-document-to-collection) 
4. [Update document](#update-document) 
5. [Set document](#set-document)
6. [Bulk update using document id](#bulk-update-using-document-id)
7. [Delete document](#delete-document)

### Get document

Use this operation to get the data in a document.

#### Required parameters:

- **Path**: Enter the path of the document. Path format: `collection name/document id`. ex: `books/23e2wsds32`


<img className="screenshot-full" src="/img/datasource-reference/firestore/get.png" alt="firestore get" />


### Query collection

Use this operation to query all the documents in a collection. Check firestore doc [here](https://firebase.google.com/docs/reference/js/v8/firebase.database.Query).

#### Required parameters:

- **Path**: Enter the name of the collection to be queried. Example: `books`

#### Optional parameters:

- **Order type**: Select ascending or descending from the dropdown.

- **Limit**: Maximum number of documents to return in response. By default will return maximum 25 results. Maximum of 100 results allowed per request. The Limit value should be of integer type.

- **Field, Operator, and Value**: For filtering the results, you can enter a document field name, use appropriate operator from the dropdown and set a value.


<img className="screenshot-full" src="/img/datasource-reference/firestore/query-collection.png" alt="firestore collection"/>


### Add Document to Collection

Use this operation for creating a new document in a collection.

#### Required parameters:

- **Collection**: Enter the path of the document in a collection. Path format: `collection name/document id`. ex: `books/33243dwe2332`
- **Body**: Enter the Field names and their values in json form. example body:
```json
{
"Author": "Shubh",
"id": 5
}
```


<img className="screenshot-full" src="/img/datasource-reference/firestore/add-document.png" alt="firestore document" />


### Update document

Use this operation for updating the existing document in a collection. Also, it only updates fields if they exist, but doesn't replace an entire object like [set operation](#set-document).

#### Required parameters:

- **Path**: Enter the path of the document in a collection. Path format: `collection name/document id`. ex: `books/33243dwe2332`
- **Body**: Enter the Field names and their values in json form. example body:
```json
{
"Author": "Shubhendra",
"id": 3
}
```


<img className="screenshot-full" src="/img/datasource-reference/firestore/update.png" alt="firestore update" />


### Set document

This operation replaces your chosen object with the value that you provide. So if your object has 5 fields, and you use Set operation and pass object with 3 fields, it will now have 3 fields.

#### Required parameters:

- **Path**: Enter the path of the document in a collection. Path format: `collection name/document id`. ex: `books/33243dwe2332`
- **Body**: Enter the Field names and their values in json form. example body:
```json
{
"Author": "Shefewfbh",
"id": 9
}
```


<img className="screenshot-full" src="/img/datasource-reference/firestore/set.png" alt="firestore set" />


### Bulk update using document id

Use this operation for bulk updating documents.

#### Required parameters:

- **Collection**: 
- **Key for document ID**: 
- **Records**:



<img className="screenshot-full" src="/img/datasource-reference/firestore/bulk.png" alt="firestore bulk" />


### Delete document

Use this operation for deleting a document in a collection.

#### Required parameters:

- **Path**: Enter the path of the document to be deleted in a collection. Path format: `collection name/document id`. ex: `books/33243dwe2332`


<img className="screenshot-full" src="/img/datasource-reference/firestore/delete.png" alt="firestore delete"/>


## Transforming firestore query result for Table widget

The Firestore query result is in the form of object so we’ll need to transform it into array.

```js
return data = Array(data)
```