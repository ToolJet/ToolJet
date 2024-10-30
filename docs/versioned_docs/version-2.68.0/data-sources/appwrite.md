---
id: appwrite
title: Appwrite 
---

ToolJet can connect to appwrite database to read/write data.

<div style={{paddingTop:'24px'}}>

## Connection 

To establish a connection with the Appwrite data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](https://docs.tooljet.com/docs/data-sources/overview)** page from the ToolJet dashboard.

ToolJet requires the following to connect to your Appwrite:
- **Host (API endpoint)**
- **Project ID**
- **Secret Key**

You'll find the Secret Key and other credentials on your Appwrite's project settings page. You may need to create a new key if you don't have one already.

:::info
You should also set the scope for access to a particular resource. Learn more about the **API keys and scopes** [here](https://appwrite.io/docs/keys).
:::

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/datasource-reference/appwrite/connect-v3.png" alt="Appwrite intro"/>

</div>

</div>

<div style={{paddingTop:'24px'}}>

## Querying Appwrite 

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **Appwrite** datasource added in previous step.
3. Select the operation you want to perform.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

<div style={{textAlign: 'center'}}>

<img style={{ border:'0'}} className="screenshot-full" src="/img/datasource-reference/appwrite/querying-v3.png" alt="Appwrite intro"/>

</div> 

:::tip
Query results can be transformed using Transformations. Read our **Transformation Documentation** [here](/docs/tutorial/transformations).
:::

</div>

<div style={{paddingTop:'24px'}}>

## Supported operations

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

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px'}} className="screenshot-full" src="/img/datasource-reference/appwrite/list-v3.png" alt="Appwrite List" />

</div>

### Get Document

Use this operation to get a document from a collection by its unique ID. 

#### Required Parameters

- **Collection ID**
- **Document ID**

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px'}} className="screenshot-full" src="/img/datasource-reference/appwrite/get-v3.png" alt="Appwrite get" />

</div>

### Add Document to Collection

Use this operation to create a new document in a collection.

#### Required Parameters

- **Collection ID**
- **Body**

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px'}} className="screenshot-full" src="/img/datasource-reference/appwrite/add-v3.png" alt="Appwrite add" />

</div>

### Update Document

Use this operation to update a document.

#### Required Parameters

- **Collection ID**
- **Document ID**
- **Body**

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px'}} className="screenshot-full" src="/img/datasource-reference/appwrite/upd-v3.png" alt="Appwrite update" />

</div>

### Delete Document

Use this operation for deleting a document in the collection.

#### Required Parameters

- **Collection ID** 
- **Document ID**

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px'}} className="screenshot-full" src="/img/datasource-reference/appwrite/del-v3.png" alt="Appwrite delete"/>

</div>

</div>