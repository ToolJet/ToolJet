---
id: pagination
title: Pagination
---

This guide explains how to perform server side pagination on a **Table** component in ToolJet.

<div style={{paddingTop:'24px'}}>

## Add a Table Component

Before performing the server side pagination, add the **Table** component and populate it with data:

1. Drag a **Table** component from the right component library to the canvas.
2. Select a data source and create a new query using the query panel at the bottom. This guide uses ToolJet’s sample data source (Postgres). Add the following query to fetch the data from the database:

```sql
SELECT * FROM public.sample_data_orders
LIMIT 100
```

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/fetch-data-query.png" alt="Fetch data from the data source" />

3. Set the value of the **Data** property of the **Table** component to `{{queries.<query_name>.data}}` to populate the **Table** component with the data retrieved by the query.

</div>

<div style={{paddingTop:'24px'}}>

## Server Side Pagination

Follow the mentioned steps to perform server side pagination on the **Table** component:

1. Enable Server Side Pagination under the **Table** component properties.

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/pagiation-property.png" alt="Fetch data from the data source" />

2. Create a new query to find the total number of records on the server side.

```sql
SELECT COUNT(*) FROM public.sample_data_orders
```

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/pagiation-count.png" alt="Fetch data from the data source" />

3. Navigate to the Pagination section under the table component properties, in the Total record server side enter `{{queries.countOrders.data[0].count}}`. *Note: Make sure to change countOrders with your query name created in the last step.*
    
<img className="screenshot-full" src="/img/widgets/table/serverside-operations/pagiation-total-record.png" alt="Fetch data from the data source" />
    
4. Enter the following query:
    
```sql
SELECT * FROM public.sample_data_orders
LIMIT 100 OFFSET {{(components.table1.pageIndex-1)*100}}
```
    
<img className="screenshot-full" src="/img/widgets/table/serverside-operations/pagiation-query.png" alt="Fetch data from the data source" />
    
*Note: Make sure to replace table1 with your **Table** name.*
    
5. Add an Event Handler to the **Table** component:<br/>
    Event: **Page changed**<br/>
    Action: **Run Query**<br/>
    Query: **Select Your Query**
    
<img className="screenshot-full" src="/img/widgets/table/serverside-operations/pagiation-eh.png" alt="Fetch data from the data source" />
    
This will run the query and fetch the data every time the page is changed.
    
6. To disable the next page button on the last page, navigate to the **Table** component properties under the Pagination section. Click on the **fx** icon next to the Enable next page button and enter `{{components.table1.pageIndex<queries.countOrders.data[0].count/100}}` in the field.
    
<img className="screenshot-full" src="/img/widgets/table/serverside-operations/pagiation-next-page.png" alt="Fetch data from the data source" />
    
7. Go to the Additional Actions section in the Table component's properties. Click the **fx** icon next to the Loading State and enter `{{queries.getOrders.isLoading}}` in the field to add a Loading State. *Note: Make sure to replace getOrders with your query name.*

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/pagiation-loading.png" alt="Fetch data from the data source" />

This is how server side pagination is implemented in ToolJet's **Table** component. When pagination is used, the query is executed on the server, retrieving only the relevant set of records for the current page. This ensures that data is fetched efficiently from the server, rather than loading the entire dataset at once, improving performance and scalability.

</div>