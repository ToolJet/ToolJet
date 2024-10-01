---
id: sort
title: Serverside Sort Operation
---

This guide explains how to perform serverside sort operation on a table component in ToolJet.  While most databases offer support for serverside operations, the specific implementation can vary depending on the database. For the purposes of this guide, PostgreSQL will be used as the data source to demonstrate the process.

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

## Serverside Sort

Follow the following steps to perform server side sort operation on table:

1. Enable Server Side Sort under the table’s properties.
    
    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/sort-property.png" alt="Fetch data from the data source" />
    
2. Edit the query, as follow:
    
    ```sql
    SELECT * 
    FROM public.sample_data_orders 
    {{components.table1.sortApplied ? `
        ORDER BY ${components.table1.sortApplied[0].column} 
        ${components.table1.sortApplied[0].direction}
    ` : ""}} 
    LIMIT 100
    ```
    
    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/sort-query.png" alt="Fetch data from the data source" />
    
    **Note**: Make sure to replace *table1* with your table name.
    
3. Add Event Handler in table:<br/>
    Event: **Sort applied**<br/>
    Action: **Run Query**<br/>
    Query: **Select Your Query**
    
    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/sort-eh.png" alt="Fetch data from the data source" />
    
    This will run the query and fetch the data every time a sort is applied.
    
4. Add Loading State, navigate to the table's properties under Additional Actions. Click on the *fx* icon next to Loading State and enter `{{queries.getOrders.isLoading}}` in the field.
    
    Note: Make sure to replace *getOrders* with your query name.
    
    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/sort-loading.png" alt="Fetch data from the data source" />
    

This is how serverside sort operation is implemented in ToolJet's table component. When sorting is applied to a column in the table, the query is executed on the server, enabling sorting across the entire dataset. This ensures that the sorting is not limited to the data loaded into the table but covers all records in the database.

</div>