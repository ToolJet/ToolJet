---
id: firestore
title: Cloud Firestore
---

ToolJet can connect to **Cloud Firestore** databases to read and write data.

<div style={{paddingTop:'24px'}}>

## Connection 

To establish a connection with the **Cloud Firestore** data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page from the ToolJet dashboard and choose Cloud Firestore as the data source.

ToolJet requires the following to connect to your BigQuery:
- **Private key**

For generating a private key check out **[Firestore's official documentation](https://cloud.google.com/iam/docs/creating-managing-service-account-keys#iam-service-account-keys-create-console)**.

<img className="screenshot-full" src="/img/datasource-reference/firestore/add-ds-firestore-v2.png"  alt="firestore add ds"/>

</div>

<div style={{paddingTop:'24px'}}>

## Querying Firestore 

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **Cloud Firestore** datasource added in previous step.
3. Select the desired operation from the dropdown and enter the required parameters.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

<img className="screenshot-full" src="/img/datasource-reference/firestore/firestore-query-v2.png" alt="firestore QUERY" />

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
- **[Bulk update using document ID](#bulk-update-using-document-id)**
- **[Delete Document](#delete-document)**

### Get Document

Use this operation to get the data in a document.

#### Required Parameters

- **Path**

<img className="screenshot-full" src="/img/datasource-reference/firestore/get-v2.png" alt="firestore get" style={{marginBottom:'15px'}}/>

### Query Collection

Use this operation to query all the documents in a collection. Check firestore doc **[here](https://firebase.google.com/docs/reference/js/v8/firebase.database.Query)**.

#### Required Parameters

- **Path**

#### Optional parameters

- **Order type**
- **Limit**
- **Field**
- **Operator**
- **Value**

<img className="screenshot-full" src="/img/datasource-reference/firestore/query-collection-v2.png" alt="firestore collection" style={{marginBottom:'15px'}}/>

### Add Document to Collection

Use this operation for creating a new document in a collection.

#### Required Parameters

- **Collection**
- **Body**. 

#### Example
```json
{
"Author": "Shubh",
"id": 5
}
```

<img style={{marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/firestore/add-document-v2.png" alt="firestore document" />

### Update Document

Use this operation for updating the existing document in a collection. Also, it only updates fields if they exist, but doesn't replace an entire object like **[set operation](#set-document)**.

#### Required Parameters

- **Path**
- **Body**

#### Example
```json
{
"Author": "Shubhendra",
"id": 3
}
```

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/firestore/update-v2.png" alt="firestore update" />

### Set Document

This operation replaces your chosen object with the value that you provide. So if your object has 5 fields, and you use Set operation and pass object with 3 fields, it will now have 3 fields.

#### Required Parameters

- **Path**
- **Body** 

#### Example
```json
{
"Author": "Shefewfbh",
"id": 9
}
```

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/firestore/set-v2.png" alt="firestore set" />

### Bulk Update Using Document ID

Use this operation for bulk updating documents.

#### Required Parameters

- **Collection**
- **Key for document ID**
- **Records**

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/firestore/bulk-v2.png" alt="firestore bulk" />

### Delete Document

Use this operation for deleting a document in a collection.

#### Required Parameters

- **Path**

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/firestore/delete-v2.png" alt="firestore delete"/>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Transforming Firestore Query Result for Table Widget

The Firestore query result is in the form of object so we’ll need to transform it into array.

```js
return data = Array(data)
```

</div>