---
id: search
title: Search Operation
---

This guide explains how to perform a server side search operation on the **Table** component in ToolJet.

<div style={{paddingTop:'24px'}}>

## Add Table Component

Before performing the search operation, add the **Table** component and populate it with data:

1. Drag a **Table** component from the right component library to the canvas.
2. Select a data source and create a new query using the query panel at the bottom. We are going to use ToolJet’s sample data source (Postgres) in this guide. Add the following query to fetch the data from the database:
    
```sql
SELECT * FROM public.sample_data_orders
LIMIT 100
```
    
<img className="screenshot-full" src="/img/widgets/table/serverside-operations/fetch-data-query.png" alt="Fetch data from the data source" />
    
3. Set the value of the **Data** property of the **Table** component to `{{queries.<query_name>.data}}` to populate the **Table** component with the data retrieved by the query.

</div>

<div style={{paddingTop:'24px'}}>

## Server Side Search

Follow the mentioned steps to perform server side search operation on the **Table** component:

1. Enable Server side Search under the **Table** component properties.
    
<img className="screenshot-full" src="/img/widgets/table/serverside-operations/search-property.png" alt="Enable server side search operation" />
    
2. Enter the following query
    
```sql
SELECT * FROM public.sample_data_orders
WHERE city ILIKE '%{{components.table1.searchText}}%' OR
    country ILIKE '%{{components.table1.searchText}}%' OR
    state ILIKE '%{{components.table1.searchText}}%'
LIMIT 100
```
    
<img className="screenshot-full" src="/img/widgets/table/serverside-operations/search-query.png" alt="Enter the query" />
    
The above query searches for the searched text in the city, state and country columns on the server side and returns the data. *Note: Make sure to replace table1 with your **Table** component name.*
    
3. Add an Event Handler to the **Table** component:<br/>
    Event: **Search**<br/>
    Action: **Run Query**   
    Query: **Select Your Query**<br/>
    
<img className="screenshot-full" src="/img/widgets/table/serverside-operations/search-eh.png" alt="Add event handler" />
    
This will run the query and fetch the data every time something is searched.
    
4. Go to the Additional Actions section in the Table component's properties. Click the **fx** icon next to the Loading State and enter `{{queries.getOrders.isLoading}}` in the field to add a Loading State. *Note: Make sure to replace getOrders with your query name.*
    
<img className="screenshot-full" src="/img/widgets/table/serverside-operations/search-loading.png" alt="Add loading state" />

This is how server side search operation is implemented in ToolJet's **Table** component. Now when a search is performed in the **Table** component, the query is executed on the server, allowing the search to be applied across the entire dataset.

</div>