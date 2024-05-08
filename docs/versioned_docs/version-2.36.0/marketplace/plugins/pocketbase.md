---
id: marketplace-plugin-pocketbase
title: PocketBase
---

# PocketBase

ToolJet connects to your PocketBase database, allowing you to directly interact with your PocketBase backend from the convenience of your ToolJet application.

:::info
**NOTE:** **Before following this guide, it is assumed that you have already completed the process of [Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

- To connect to PocketBase, you need the Host URL, email, and password. The Host URL is the URL of your PocketBase instance. Email and password are the credentials of the user who has access to the PocketBase instance.

- Establish a connection to PocketBase by either clicking `+Add new Data source` on the query panel or navigating to the [Data Sources](/docs/data-sources/overview/) page from the ToolJet dashboard.

- Enter your Host URL, email and password into their designated fields.

- Click **Test Connection** to validate your credentials. Click **Save** to store the data source.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/marketplace/plugins/pocketbase/pocketbase_install.png" alt="PocketBase Install" />
</div>

## Querying PocketBase

- To perform queries on PocketBase in ToolJet, click the **+Add** button in the [query manager](/docs/app-builder/query-panel/#add) located at the bottom panel of the editor.
- Select the previously configured PocketBase datasource.

- In the Operation dropdown, select the desired operation type. ToolJet currently [supports](#supported-operations) five query types for PocketBase interactions.

- Enter the collection name and other required parameters for the selected operation and click on **Run** button to run the query.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/pocketbase/add_query.gif" alt="PocketBase query" />

</div>

<br/>

:::info
Query results can be transformed using transformations. Read our [transformations documentation](/docs/tutorial/transformations).
:::

## Supported Operations

You can create query for PocketBase data source to perform several operations such as:
  1. **[List Records](#list-records)**
  2. **[Get Record](#get-record)**
  3. **[Add Record to Collection](#add-record-to-collection)** 
  4. **[Update Record to Collection](#update-record-to-collection)** 
  5. **[Delete Record](#delete-record)** 

### List Records

  #### Required parameters:

  - **Collection Name** - Collection name in the database.



  #### Optional Parameters:

  - **Limit** - Number of records to be fetched.
  - **Sort** - Sort the records based on a sort rule. Add `-` / `+`(default) in front of the attribute for DESC / ASC order.
  - **Where** - Filter the records based on a filter conditions.


  <div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/marketplace/plugins/pocketbase/list_records.png" alt="List Records" />
  </div>


### Get Record

  #### Required parameters:
  - **Collection Name** - Collection name in the database.
  - **Record ID** - ID of the record to be fetched.


  <div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/marketplace/plugins/pocketbase/get_record.png" alt="Get Record" />
</div>

### Add Record to Collection

  #### Required parameters:
  - **Collection Name** - Collection name in the database.
  - **Body** - Data to be added to the collection. It should be in valid JSON format.
  

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/marketplace/plugins/pocketbase/add_record.png" alt="Add Record" />
</div>

### Update Record to Collection

  #### Required parameters:
  - **Collection Name** - Collection name in the database.
  - **Record ID** - ID of the record to be updated.
  - **Body** - Data to be updated in the collection. It should be in valid JSON format.


<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/marketplace/plugins/pocketbase/update_record.png" alt="Update Record" />
</div>

### Delete Record

  #### Required parameters:
  - **Collection Name** - Collection name in the database.
  - **Record ID** - ID of the record to be deleted.


<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/marketplace/plugins/pocketbase/delete_record.png" alt="Delete Record" />
</div>


