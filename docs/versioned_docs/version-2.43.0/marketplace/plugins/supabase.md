---
id: marketplace-plugin-supabase
title: Supabase
---

# Supabase

ToolJet connects to your Supabase database, allowing you to directly interact with your  Supabase back-end from within your ToolJet application.

:::info
**NOTE:** **Before following this guide, it is assumed that you have already completed the process of [Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

- To connect to Supabase you need to have the Project URL and Service Role Secret. You can find these credentials in your API Settings on the Supabase dashboard. Make sure to copy the Service Role Secret key. This key has the ability to bypass Row Level Security.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/marketplace/plugins/supabase/api_settings.png" alt="Supabase API Settings" />
</div>

- Establish a connection to Supabase by either clicking `+Add new Data source` on the query panel or navigating to the [Data Sources](/docs/data-sources/overview/) page from the ToolJet dashboard.

- Enter your Project URL and Service Role Secret into their designated fields.

- Click **Test Connection** to validate your credentials. Click **Save** to store the data source.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/marketplace/plugins/supabase/supabase_install.png" alt="Supabase Install" />
</div>

## Querying Supabase

- To perform queries on Supabase in ToolJet, click the **+Add** button in the [query manager](/docs/app-builder/query-panel/#add) located at the bottom panel of the editor.
- Select the previously configured Supabase datasource.

- In the Operation dropdown, select the desired operation type. ToolJet currently [supports](#supported-operations) five query types for Supabase interactions.

- Enter the table name and other required parameters for the selected operation and click on **Run** button to run the query.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/supabase/add_query.gif" alt="Supabase query" />

</div>

<br/>

:::info
Query results can be transformed using transformations. Read our [transformations documentation](/docs/tutorial/transformations).
:::

## Supported Operations

You can create query for Supabase data source to perform several operations such as:
  1. **[Get Rows](#get-rows)**
  2. **[Create Row(s)](#create-rows)**
  3. **[Update Row(s)](#update-rows)** 
  4. **[Delete Row(s)](#delete-rows)** 
  5. **[Count Rows](#count-rows)** 

### Get Rows

  #### Required parameters:
  - **Table** - Database table name.



  #### Optional Parameters:
  - **Where** - Filter rows based on a condition.
  - **Sort** - Sort rows based on a column.
  - **Limit** - Limit the number of rows returned.


<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/marketplace/plugins/supabase/get_rows.png" alt="Get Rows" />
</div>


### Create Row(s)

  #### Required parameters:
  - **Table** - Database table name.
  - **Body** - Data to be inserted into the table. It should be an array of object(s).



  <div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/marketplace/plugins/supabase/create_rows.png" alt="Create Rows" />
</div>

### Update Row(s)

  #### Required parameters:
  - **Table** - Database table name.
  - **Columns** - Column name and value to be updated.


  #### Optional Parameters:
  - **Where** - Update rows based on a condition. If not provided, all rows will be updated.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/marketplace/plugins/supabase/update_rows.png" alt="Update Rows" />
</div>


### Delete Row(s)

  #### Required parameters:
  - **Table** - Database table name.
  - **Where** - Delete rows based on a condition.

  <div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/marketplace/plugins/supabase/delete_rows.png" alt="Delete Rows" />
</div>


### Count Rows

  #### Required parameters:
  - **Table** - Database table name.



  #### Optional Parameters:
  - **Where** - Filter rows based on a condition.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/marketplace/plugins/supabase/count_rows.png" alt="Count Rows" />
</div>
<br/>



