---
id: search
title: Serverside Search Operation
---

This guide explains how to perform serverside search operation on a table component in ToolJet.  While most databases offer support for serverside operations, the specific implementation can vary depending on the database. For the purposes of this guide, PostgreSQL will be used as the data source to demonstrate the process.

<div style={{paddingTop:'24px'}}>

## Add Table Component

Before performing the search operation, lets setup the table component and populate it with the data:

1. Drag a table component from left component library to the canvas.
2. Select the data source and create a new query from the query panel at the bottom. (Refer to [data source](/docs/data-sources/overview) docs for more details) <br/>
    We are going to use ToolJet’s Sample data source (Postgres) in this guide.<br/>
    Add the following query to fetch the data from database:
    
    ```sql
    SELECT * FROM public.sample_data_orders
    LIMIT 100
    ```
    
    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/fetch-data-query.png" alt="Fetch data from the data source" />
    
3. Set the value of the **Data** property of the table to `{{queries.<query_name>.data}}` to populate the table with relevant data.

</div>

<div style={{paddingTop:'24px'}}>

## Serverside Search

Follow the following steps to perform server side search operation on table:

1. Enable Server Side Search under the table’s properties.
    
    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/search-property.png" alt="Enable server side search operation" />
    
2. Edit the query, as follow:
    
    ```sql
    SELECT * FROM public.sample_data_orders
    WHERE city ILIKE '%{{components.table1.searchText}}%' OR
          country ILIKE '%{{components.table1.searchText}}%' OR
          state ILIKE '%{{components.table1.searchText}}%'
    LIMIT 100
    ```
    
    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/search-query.png" alt="Enter the query" />
    
    The above query searches for the searched text in city, state and country column on server side and return the data.<br/>
    **Note**: Make sure to replace *table1* with your table name.
    
3. Add Event Handler in table:<br/>
    Event: **Search**<br/>
    Action: **Run Query**   
    Query: **Select Your Query**<br/>
    
    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/search-eh.png" alt="Add event handler" />
    
    This will run the query and fetch the data every time something is searched.
    
4. Add Loading State, navigate to the table's properties under Additional Actions. Click on the *fx* icon next to Loading State and enter `{{queries.getOrders.isLoading}}` in the field.<br/>
    **Note**: Make sure to replace *getOrders* with your query name.
    
    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/search-loading.png" alt="Add loading state" />

This is how serverside search operation is implemented in ToolJet's table component. Now when a search is performed in the table, the query is executed on the server, allowing the search to be applied across the entire dataset.

</div>
