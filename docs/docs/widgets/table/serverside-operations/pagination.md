---
id: pagination
title: Serverside Pagination
---

This guide explains how to perform serverside pagination on a table component in ToolJet.  While most databases offer support for server-side operations, the specific implementation can vary depending on the database. For the purposes of this guide, PostgreSQL will be used as the data source to demonstrate the process.

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

3. Set the value of the **Data** property of the table to `{{queries.<query_name>.data}}` to populate the table with relevant data.

</div>

<div style={{paddingTop:'24px'}}>

## Serverside Pagination

Follow the following steps to perform server side pagination on table:

1. Enable Server Side Pagination under the table’s properties.
    
    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/pagiation-property.png" alt="Fetch data from the data source" />
    
2. Create a new query to find total number of records on server side
    
    ```sql
    SELECT COUNT(*) FROM public.sample_data_orders
    ```
    
    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/pagiation-count.png" alt="Fetch data from the data source" />
    
3. Navigate to the table's properties under Pagination section, in Total record server side enter `{{queries.countOrders.data[0].count}}` 
    
    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/pagiation-total-record.png" alt="Fetch data from the data source" />
    
    Make sure to change *countOrders* with your query name create in the last step.
    
4. Edit the query, as follow:
    
    ```sql
    SELECT * FROM public.sample_data_orders
    LIMIT 100 OFFSET {{(components.table1.pageIndex-1)*100}}
    ```
    
    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/pagiation-query.png" alt="Fetch data from the data source" />
    
    **Note**: Make sure to replace *table1* with your table name.
    
5. Add Event Handler in table:<br/>
    Event: **Page changed**<br/>
    Action: **Run Query**<br/>
    Query: **Select Your Query**
    
    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/pagiation-eh.png" alt="Fetch data from the data source" />
    
    This will run the query and fetch the data every time a sort is applied.
    
6. Disable the next page button on the last page, navigate to the table's properties under Pagination section. Click on the *fx* icon next to Ebable next page button and enter `{{components.table1.pageIndex<queries.countOrders.data[0].count/100}}` in the field.
    
    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/pagiation-next-page.png" alt="Fetch data from the data source" />
    
7. Add Loading State, navigate to the table's properties under Additional Actions. Click on the *fx* icon next to Loading State and enter `{{queries.getOrders.isLoading}}` in the field.
    
    **Note**: Make sure to replace *getOrders* with your query name.
    
    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/pagiation-loading.png" alt="Fetch data from the data source" />

This is how serverside pagination is implemented in ToolJet's table component. When pagination is used, the query is executed on the server, retrieving only the relevant set of records for the current page. This ensures that data is fetched efficiently from the server, rather than loading the entire dataset at once, improving performance and scalability.

</div>

