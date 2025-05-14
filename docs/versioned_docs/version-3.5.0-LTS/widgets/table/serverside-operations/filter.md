---
id: filter
title: Filter Operation
---

This guide explains how to implement a server side filter operation on the **Table** component in ToolJet.

<div style={{paddingTop:'24px'}}>

## Add Table Component

Before implementing the filter operation, add the **Table** component and populate it with data:

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

## Server Side Filter

Follow the mentioned steps to perform server side filter operation on the **Table** component:

1. Enable Server Side Filter under the **Table** component properties.

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/filter-property.png" alt="Fetch data from the data source" />

2. Create a new **RunJS** Query to dynamically create SQL queries for filters.

```js
const filterData = components.table1.filters;
    
const createSQLQueries = (filters) => {
    
  let conditions = '';
    
  filters.forEach(({ condition, value, column }, index) => {
    
   const prefix = index === 0 ? 'WHERE' : 'AND';
    
    switch (condition) {
      case "contains":
        conditions += ` ${prefix} ${column} ILIKE '%${value}%'`;
        break;
      case "doesNotContains":
        conditions += ` ${prefix} ${column} NOT ILIKE '%${value}%'`;
        break;
      case "matches":
      case "equals":
        conditions += ` ${prefix} ${column} = '${value}'`;
        break;
      case "ne":
        conditions += ` ${prefix} ${column} != '${value}'`;
        break;
      case "nl":
        conditions += ` ${prefix} ${column} IS NULL`;
        break;
      case "isEmpty":
        conditions += ` ${prefix} ${column} = ''`;
        break;
      default:
        throw new Error(`Unsupported condition: ${condition}`);
    }
  });
    
const mainQuery = `SELECT * FROM public.sample_data_orders ${conditions}`;
    
return { mainQuery };
    
}
    
return createSQLQueries(filterData);
```

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/filter-js-query.png" alt="Fetch data from the data source" />

3. Add an Event Handler to the **RunJS** Query<br/>
    Event: **Query Success**<br/>
    Action: **Run Query**<br/>
    Query: **Select Your Query**

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/filter-query-eh.png" alt="Fetch data from the data source" />

4. Enter the following query:
```sql
  {{queries.runjs1.data.mainQuery}}
```

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/filter-query.png" alt="Fetch data from the data source" />

5. Add an Event Handler to the **Table** component:<br/>
    Event: **Filter Changed**<br/>
    Action: **Run Query**<br/>
    Query: **Select Your RunJS Query**

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/filter-eh.png" alt="Fetch data from the data source" />

This will run the query and fetch the data every time a filter changes.

6. Go to the Additional Actions section in the Table component's properties. Click the **fx** icon next to the Loading State and enter `{{queries.getOrders.isLoading}}` in the field to add a Loading State. *Note: Make sure to replace getOrders with your query name.*

<img className="screenshot-full" src="/img/widgets/table/serverside-operations/filter-loading.png" alt="Fetch data from the data source" />

This is how server side filtering is implemented in ToolJet's **Table** component. When one or more filters are applied to the **Table** component, the query is executed on the server, ensuring that the filtering affects all records in the dataset, not just the data currently loaded into the **Table** component.

</div>