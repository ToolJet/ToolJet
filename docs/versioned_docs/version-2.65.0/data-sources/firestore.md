---
id: firestore
title: Cloud Firestore
---

ToolJet can connect to **Cloud Firestore** databases to read and write data.

## Connection 

- ToolJet connects to your **Cloud Firestore** using JSON key of your GCP service account. Get your service account key as JSON from GCP console. For generating a new key, check out **[Firestore's official documentation](https://cloud.google.com/iam/docs/creating-managing-service-account-keys#iam-service-account-keys-create-console)**.
- Once you have the key, open it in a text editor and copy the contents. Paste the contents in the **Private key** field of the Firestore data source modal.
- Click on the **Test Connection** button to verify if the key is valid. Click on the **Save** button to save the data source.

<div style={{textAlign: 'center'}}>

<img style={{ border:'0'}} className="screenshot-full" src="/img/datasource-reference/firestore/add-ds-firestore-v2.png"  alt="firestore add ds"/>

</div>

<div style={{paddingTop:'24px'}}>

## Querying Firestore 

Click on the **+ Add** button of the query manager at the bottom panel of the editor and select the database added in the previous step as the data source. 

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/firestore/firestore-query-v2.png" alt="firestore QUERY" />

</div>


Select the operation that you want to perform from the **Operation** dropdown and click on the **Run** button to run the query.

:::tip
Query results can be transformed using transformations. Read our transformations documentation to see how: **[link](/docs/tutorial/transformations)**
:::

</div>

<div style={{paddingTop:'24px'}}>

## Supported Operations
- **[Get Document](#get-document)**
- **[Query collection](#query-collection)**
- **[Add Document to Collection](#add-document-to-collection)** 
- **[Update Document](#update-document)** 
- **[Set Document](#set-document)**
- **[Bulk update using document id](#bulk-update-using-document-id)**
- **[Delete Document](#delete-document)**

</div>

### Get Document

Use this operation to get the data in a document.

#### Required Parameters:

- **Path**: Enter the path of the document. Path format: `collection name/document id`. Example: `books/23e2wsds32`

<div style={{textAlign: 'center'}}>

<img style={{ border:'0'}} className="screenshot-full" src="/img/datasource-reference/firestore/get-v2.png" alt="firestore get" />

</div>

### Query Collection

Use this operation to query all the documents in a collection. Check firestore doc **[here](https://firebase.google.com/docs/reference/js/v8/firebase.database.Query)**.

#### Required Parameters:

- **Path**: Enter the name of the collection to be queried. Example: `books`

#### Optional Parameters:

- **Order type**: Select ascending or descending from the dropdown.
- **Limit**: Maximum number of documents to return in response. By default will return maximum 25 results. Maximum of 100 results allowed per request. The Limit value should be of integer type.
- **Field, Operator, and Value**: For filtering the results, you can enter a document field name, use appropriate operator from the dropdown and set a value.

<div style={{textAlign: 'center'}}>

<img style={{ border:'0'}} className="screenshot-full" src="/img/datasource-reference/firestore/query-collection-v2.png" alt="firestore collection"/>

</div>

### Add Document to Collection

Use this operation for creating a new document in a collection.

#### Required Parameters:

- **Collection**: Enter the path of the document in a collection. Path format: `collection name/document id`. ex: `books/33243dwe2332`
- **Body**: Enter the field names and their values in JSON form. 

**Example body:**
```json
{
"Author": "Shubh",
"id": 5
}
```

<div style={{textAlign: 'center'}}>

<img style={{ border:'0'}} className="screenshot-full" src="/img/datasource-reference/firestore/add-document-v2.png" alt="firestore document" />

</div>

### Update Document

Use this operation for updating the existing document in a collection. Also, it only updates fields if they exist, but doesn't replace an entire object like **[set operation](#set-document)**.

#### Required Parameters:

- **Path**: Enter the path of the document in a collection. Path format: `collection name/document id`. Example: `books/33243dwe2332`
- **Body**: Enter the field names and their values in JSON form. 

**Example body:**
```json
{
"Author": "Shubhendra",
"id": 3
}
```

<div style={{textAlign: 'center'}}>

<img style={{ border:'0'}} className="screenshot-full" src="/img/datasource-reference/firestore/update-v2.png" alt="firestore update" />

</div>

### Set Document

This operation replaces your chosen object with the value that you provide. So if your object has 5 fields, and you use Set operation and pass object with 3 fields, it will now have 3 fields.

#### Required Parameters:

- **Path**: Enter the path of the document in a collection. Path format: `collection name/document id`. Example: `books/33243dwe2332`
- **Body**: Enter the field names and their values in JSON form. 

**Example body:**
```json
{
"Author": "Shefewfbh",
"id": 9
}
```

<div style={{textAlign: 'center'}}>

<img style={{ border:'0'}} className="screenshot-full" src="/img/datasource-reference/firestore/set-v2.png" alt="firestore set" />

</div>

### Bulk Update Using Document ID

Use this operation for bulk updating documents.

#### Required Parameters:

- **Collection**: Enter the path of the document in a collection. Path format: `collection name/document id`. ex: `books/33243dwe2332`
- **Key for document ID**: Enter the document ID key used in your Firestore collection that identifies each document uniquely.
- **Records**: Specifies the number of records (documents) that you plan to update in this operation.


<div style={{textAlign: 'center'}}>

<img style={{ border:'0'}} className="screenshot-full" src="/img/datasource-reference/firestore/bulk-v2.png" alt="firestore bulk" />

</div>

### Delete Document

Use this operation for deleting a document in a collection.

#### Required Parameters:

- **Path**: Enter the path of the document to be deleted in a collection. Path format: `collection name/document id`. ex: `books/33243dwe2332`

<div style={{textAlign: 'center'}}>

<img style={{ border:'0'}} className="screenshot-full" src="/img/datasource-reference/firestore/delete-v2.png" alt="firestore delete"/>

</div>


</div>

<div style={{paddingTop:'24px'}}>

## Transforming Firestore Query Result for Table Widget

The Firestore query result is in the form of object so we’ll need to transform it into array.

```js
return data = Array(data)
```

</div>