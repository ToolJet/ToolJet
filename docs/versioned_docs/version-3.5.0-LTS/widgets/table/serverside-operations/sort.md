---
id: sort
title: Sort Operation
---

This guide explains how to implement a server side sort operation on the **Table** component in ToolJet.

<div style={{paddingTop:'24px'}}>

## Add Table Component

Before implementing the sort operation, add the **Table** component and populate it with data:

1. Drag a **Table** component from the right component library to the canvas.
2. Select a data source and create a new query using the query panel at the bottom. We are going to use ToolJet’s sample data source (Postgres) in this guide. Add the following query to fetch the data from the database:

```sql
SELECT * FROM public.sample_data_orders
LIMIT 100
```

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/fetch-data-query.png" alt="Fetch data from the data source" />

3. Set the value of the **Data** property of the **Table** component to `{{queries.<query_name>.data}}` to populate the **Table** component with the data retrieved by the query.

</div>

<div style={{paddingTop:'24px'}}>

## Server Side Sort

Follow the mentioned steps to perform server side sort operation on the **Table** component:

1. Enable Server Side Sort under the **Table** component properties.

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/sort-property.png" alt="Fetch data from the data source" />

2. Enter the following query:

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

*Note: Make sure to replace table1 with your **Table** name.*

3. Add an Event Handler to the **Table** component:<br/>
    Event: **Sort applied**<br/>
    Action: **Run Query**<br/>
    Query: **Select Your Query**

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/sort-eh.png" alt="Fetch data from the data source" />

This will run the query and fetch the data every time a sort is applied.

4. Go to the Additional Actions section in the Table component's properties. Click the **fx** icon next to the Loading State and enter `{{queries.getOrders.isLoading}}` in the field to add a Loading State. *Note: Make sure to replace getOrders with your query name.*

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/sort-loading.png" alt="Fetch data from the data source" />


This is how server side sort operation is implemented in ToolJet's **Table** component. When sorting is applied to a column in the **Table** component, the query is executed on the server, enabling sorting across the entire dataset. This ensures that the sorting is not limited to the data loaded into the **Table** but covers all records in the database.

</div>