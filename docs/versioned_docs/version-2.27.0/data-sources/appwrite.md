---
id: appwrite
title: Appwrite 
---

# Appwrite 

ToolJet can connect to appwrite database to read/write data.

## Connection 

ToolJet connects to your Appwrite app using :
- **Host (API endpoint)**
- **Project ID**
- **Secret key**

You'll find the Secret key and other credentials on your Appwrite's project settings page. You may need to create a new key if you don't have one already.

:::info
You should also set the scope for access to a particular resource. Learn more about the **API keys and scopes** [here](https://appwrite.io/docs/keys).
:::

To establish a connection with the Appwrite data source, you can either click on the `+Add new data source` button located on the query panel or navigate to the [Data Sources](https://docs.tooljet.com/docs/data-sources/overview) page from the ToolJet dashboard.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/appwrite/connectv2.png" alt="Appwrite intro" width="600"/>

</div>

## Querying Appwrite 

After setting up the Appwrite datasource, you can click on the `+` button of the query manager at the bottom panel of the editor and select the Appwrite data source that you added in the previous step.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/appwrite/queryingv2.png" alt="Appwrite intro"/>

</div>

After selecting Appwrite datasource, select the operation that you want to perform on the Appwrite database and click **Save** to save the query. 

:::tip
Query results can be transformed using Transformations. Read our **Transformation documentation** [here](/docs/tutorial/transformations)
:::

## Supported operations

1.  **[List documents](#list-documents)**
2.  **[Get document](#get-document)**
3.  **[Create document](#create-document)**
4.  **[Update document](#update-document)** 
5.  **[Delete document](#delete-document)**
6.  **[Bulk update using document id](#bulk-update-using-document-id)**

### List documents

This operation can be used to get a list of all the user documents.

#### Required parameters:

- **Collection ID:** You can create a new collection using the Database service [server integration](https://appwrite.io/docs/server/database#createCollection) or appwrite console. The value for collection ID field should be of `String` type. 

#### Optional parameters: 

- **Limit:** Maximum number of documents to return in the response. By default, it will return a maximum of 25 results. A maximum of 100 results is allowed per request. The Limit value should be of `integer` type.
- **Order fields:** Array of attributes used to sort results. The order field value should be an `array`.
- **Order types:** Array of order directions for sorting attributes. Possible values are DESC for descending order or ASC for ascending order. The order field value should be an `array`.
- **Field, Operator, and Value:** For filtering the results, you can enter a field(attribute) name, use the appropriate operator from the dropdown, and set a value.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/appwrite/listv2.png" alt="Appwrite List" />

</div>

### Get document

Use this operation to get a document from a collection by its unique ID. 

#### Required parameters:

- **Collection ID:** You can create a new collection using the Database service [server integration](https://appwrite.io/docs/server/database#createCollection) or appwrite console. The value for collection ID should be of `String` type. 

- **Document ID:** Enter the document ID of the document that you want to get. The document ID should be of `String` type. 

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/appwrite/getv2.png" alt="Appwrite get" />

</div>

### Add Document to Collection

Use this operation to create a new document in a collection.

#### Required parameters:

- **Collection ID:** You can create a new collection using the Database service [server integration](https://appwrite.io/docs/server/database#createCollection) or appwrite console. The collection ID should be of `String` type. 

- **Body:** Enter the document data as a JSON object.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/appwrite/addv2.png" alt="Appwrite add" />

</div>

### Update document

Use this operation to update a document.

#### Required parameters:

- **Collection ID:** You can create a new collection using the Database service [server integration](https://appwrite.io/docs/server/database#createCollection) or appwrite console. The value for collection ID should be of `String` type. 

- **Document ID:** Enter the document ID of the document that you want to get. The document ID should be of `String` type. 

- **Body:** Enter the document data as a JSON object.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/appwrite/updv2.png" alt="Appwrite update" />

</div>

### Delete document

Use this operation for deleting a document in the collection.

#### Required parameters:

- **Collection ID:** You can create a new collection using the Database service [server integration](https://appwrite.io/docs/server/database#createCollection) or appwrite console. The value for collection ID should be of `String` type. 

- **Document ID:** Enter the document ID of the document that you want to get. The document ID should be of `String` type. 

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/appwrite/delv2.png" alt="Appwrite delete"/>

</div>

### Bulk update using document id

Use this operation for bulk updating a document in a collection.

#### Required parameters:

- **Collection ID:** You can create a new collection using the Database service [server integration](https://appwrite.io/docs/server/database#createCollection) or appwrite console. The value for collection ID should be of `String` type. 

- **Key for document ID:**  Enter the key or attribute name that can be used to identify each record.

- **Records:** The array of objects that will contain the data for updating each record in the database
and these objects must contain a key-value pair to point unique record in the database (key for document)

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/appwrite/bulkv2.png" alt="Appwrite bulk update" />

</div>
