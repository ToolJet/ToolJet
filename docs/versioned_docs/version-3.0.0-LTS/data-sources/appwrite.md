---
id: appwrite
title: Appwrite 
---

ToolJet can connect to appwrite database to read/write data.

<div style={{paddingTop:'24px'}}>

## Connection 

To establish a connection with the Appwrite data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page from the ToolJet dashboard.

ToolJet requires the following to connect to your Appwrite:
- **Host (API endpoint)**
- **Project ID**
- **Database ID**
- **Secret Key**

You'll find the Secret Key and other credentials on your Appwrite's project settings page. You may need to create a new key if you don't have one already.

:::info
You should also set the scope for access to a particular resource. Learn more about the **API keys and scopes** [here](https://appwrite.io/docs/keys).
:::

<img className="screenshot-full" src="/img/datasource-reference/appwrite/connect-v4.png" alt="Appwrite intro"/>

</div>

<div style={{paddingTop:'24px'}}>

## Querying Appwrite 

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **Appwrite** datasource added in previous step.
3. Select the operation you want to perform.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

<img className="screenshot-full" src="/img/datasource-reference/appwrite/querying-v4.png" alt="Appwrite intro"/>

:::tip
Query results can be transformed using Transformations. Read our **Transformation Documentation** [here](/docs/tutorial/transformations).
:::

</div>

<div style={{paddingTop:'24px'}}>

## Supported Operations

-  **[List Documents](#list-documents)**
-  **[Get Document](#get-document)**
-  **[Add Document to Collection](#add-document-to-collection)**
-  **[Update Document](#update-document)** 
-  **[Delete Document](#delete-document)**

### List Documents

This operation is used to get a list of all the user documents.

#### Required Parameters

- **Collection ID**

#### Optional Parameters

- **Limit**
- **Order fields**
- **Order types**
- **Field**
- **Operator**
- **Value**

<img className="screenshot-full" src="/img/datasource-reference/appwrite/list-v4.png" alt="Appwrite List" />

<details>
<summary>**Example Values**</summary>

```yaml
Collection ID: your collection id
```

</details>

<details>
<summary>**Example Response**</summary>

```json
{
  "total": 1,
  "documents": [
    {
      "Name": "johnson",
      "Age": 30,
      "$id": "67c80db91abc900bd9cf",
      "$createdAt": "2025-03-05T08:39:21.113+00:00",
      "$updatedAt": "2025-03-05T08:40:05.294+00:00",
      "$permissions": [],
      "$databaseId": "67c80c91000d003d6ce5",
      "$collectionId": "67c80d190032ba8ae4fa"
    }
  ]
}
```
</details>

### Get Document

Use this operation to get a document from a collection by its unique ID. 

#### Required Parameters

- **Collection ID**
- **Document ID**

<img className="screenshot-full" src="/img/datasource-reference/appwrite/get-v4.png" alt="Appwrite get" />

<details>
<summary>**Example Values**</summary>

```yaml
Collection ID: your collection id
Document ID: your documnet id
```

</details>

<details>
<summary>**Example Response**</summary>

```json
{
  "Name": "johnson",
  "Age": 30,
  "$id": "67c80db91abc900bd9cf",
  "$createdAt": "2025-03-05T08:39:21.113+00:00",
  "$updatedAt": "2025-03-05T08:40:05.294+00:00",
  "$permissions": [],
  "$databaseId": "67c80c91000d003d6ce5",
  "$collectionId": "67c80d190032ba8ae4fa"
}
```
</details>

### Add Document to Collection

Use this operation to create a new document in a collection.

#### Required Parameters

- **Collection ID**
- **Body**

<img className="screenshot-full" src="/img/datasource-reference/appwrite/add-v4.png" alt="Appwrite add" />

<details>
<summary>**Example Values**</summary>

```yaml
Collection ID: your collection id
Body: {'Name': 'John Doe', 'Age': 25}
```

</details>

<details>
<summary>**Example Response**</summary>

```json
{
  "Name": "John Doe",
  "Age": 25,
  "$id": "67c93e1809fc85c4dca5",
  "$permissions": [],
  "$createdAt": "2025-03-06T06:18:00.042+00:00",
  "$updatedAt": "2025-03-06T06:18:00.042+00:00",
  "$databaseId": "67c80c91000d003d6ce5",
  "$collectionId": "67c80d190032ba8ae4fa"
}
```
</details>

### Update Document

Use this operation to update a document.

#### Required Parameters

- **Collection ID**
- **Document ID**
- **Body**

<img style={{ border:'0', marginBottom:'15px'}} className="screenshot-full" src="/img/datasource-reference/appwrite/upd-v4.png" alt="Appwrite update" />

<details>
<summary>**Example Values**</summary>

```yaml
Collection ID: your collection id
Document ID: your document id
Body: {'Name': 'Jane Doe'}
```

</details>

<details>
<summary>**Example Response**</summary>

```json
{
  "Name": "Jane Doe",
  "Age": 25,
  "$id": "67c93e1809fc85c4dca5",
  "$createdAt": "2025-03-06T06:18:00.042+00:00",
  "$updatedAt": "2025-03-06T06:21:37.801+00:00",
  "$permissions": [],
  "$databaseId": "67c80c91000d003d6ce5",
  "$collectionId": "67c80d190032ba8ae4fa"
}
```
</details>

### Delete Document

Use this operation for deleting a document in the collection.

#### Required Parameters

- **Collection ID** 
- **Document ID**

<img className="screenshot-full" src="/img/datasource-reference/appwrite/del-v4.png" alt="Appwrite delete"/>

<details>
<summary>**Example Values**</summary>

```yaml
Collection ID: your collection id
Document ID: your document id
```

</details>

<details>
<summary>**Example Response**</summary>

```yaml
deleted: true
```
</details>

</div>