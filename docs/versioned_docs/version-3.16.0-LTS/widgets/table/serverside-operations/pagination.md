---
id: pagination
title: Pagination
---

This guide explains how to perform server side pagination on a **Table** component in ToolJet.

## Add Table Component

Before performing the server side pagination, add the **Table** component and populate it with data:

1. Drag a **Table** component from the right component library to the canvas.
2. Select a data source and create a new query using the query panel at the bottom. This guide uses ToolJet’s sample data source (Postgres). Add the following query to fetch the data from the database:
    ```sql
    SELECT * FROM public.sample_data_orders
    LIMIT 100
    ```
    <img className="screenshot-full img-full" src="/img/widgets/table/serverside-operations/fetch-data-query.png" alt="Fetch data from the data source" />
3. Set the value of the **Data** property of the **Table** component to `{{queries.<query_name>.data}}` to populate the **Table** component with the data retrieved by the query.

## Server Side Pagination

Follow the mentioned steps to perform server side pagination on the **Table** component:

1. Under the **Table** component's Pagination properties, switch the **Type** to **Server side**.
    <img className="screenshot-full img-full" style={{ marginTop: '10px' }} src="/img/widgets/table/serverside-operations/pagiation-property.png" alt="Enable server side pagination" />
2. Create a new query to find the total number of records on the server side.
    ```sql
    SELECT COUNT(*) FROM public.sample_data_orders
    ```
    <img className="screenshot-full img-full" src="/img/widgets/table/serverside-operations/pagiation-count.png" alt="Fetch the total record count from the data source" />
3. In the Pagination section of the **Table** component's properties, set **Total records server side** to `{{queries.countOrders.data[0].count}}`. *Note: Make sure to replace `countOrders` with your query name created in the last step.*
    <img className="screenshot-full img-full" style={{ marginTop: '10px' }} src="/img/widgets/table/serverside-operations/pagiation-total-record.png" alt="Set the total records server side property" />
4. Set **Server-side rows per page** to the number of records you want to fetch per page, for example `100`. Providing both **Total records server side** and **Server-side rows per page** lets the Table calculate the total number of pages on its own — the page count is shown in the footer and the **First**/**Last** page buttons work automatically, without any extra configuration.
5. Enter the following query, using the same number you set for **Server-side rows per page** as the `LIMIT`:
    ```sql
    SELECT * FROM public.sample_data_orders
    LIMIT 100 OFFSET {{(components.table1.pageIndex-1)*100}}
    ```
    <img className="screenshot-full img-full" src="/img/widgets/table/serverside-operations/pagiation-query.png" alt="Query the next set of records using pageIndex" />
    *Note: Make sure to replace `table1` with your **Table** name, and keep this `LIMIT` in sync with the **Server-side rows per page** value entered in the previous step.*
6. Add an Event Handler to the **Table** component:<br/>
    Event: **Page changed**<br/>
    Action: **Run Query**<br/>
    Query: **Select Your Query**
    <img className="screenshot-full img-full" style={{ marginTop: '10px' }} src="/img/widgets/table/serverside-operations/pagiation-eh.png" alt="Add an event handler to run the query on page change" />
    This will run the query and fetch the data every time the page is changed. *Tip: If you need to run different logic depending on the direction of navigation, use the **Next page** and **Previous page** events instead of **Page changed**.*
7. The **Next** and **Previous** page buttons don't derive their disabled state from **Total records server side** automatically — they're controlled entirely by the **Enable next page button** and **Enable previous page button** toggles, so you still need to bind these with `fx` to stop users from paging past the data:
        - Click the **fx** icon next to **Enable next page button** and enter `{{components.table1.pageIndex<queries.countOrders.data[0].count/100}}`.
        - Click the **fx** icon next to **Enable previous page button** and enter `{{components.table1.pageIndex>1}}`.
    <img className="screenshot-full img-full" style={{ marginTop: '10px' }} src="/img/widgets/table/serverside-operations/pagiation-next-page.png" alt="Bind the enable next/previous page button properties" />
8. Go to the Additional Actions section in the Table component's properties. Click the **fx** icon next to the Loading State and enter `{{queries.getOrders.isLoading}}` in the field to add a Loading State. *Note: Make sure to replace `getOrders` with your query name.*
    <img className="screenshot-full img-full" style={{ marginTop: '10px' }} src="/img/widgets/table/serverside-operations/pagiation-loading.png" alt="Bind the loading state to the query's isLoading property" />

This is how server side pagination is implemented in ToolJet's **Table** component. When pagination is used, the query is executed on the server, retrieving only the relevant set of records for the current page. This ensures that data is fetched efficiently from the server, rather than loading the entire dataset at once, improving performance and scalability.