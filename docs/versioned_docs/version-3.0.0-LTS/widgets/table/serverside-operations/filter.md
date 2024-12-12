---
id: filter
title: Filter Operation
---

This guide explains how to perform serverside filter operation on a **Table** component in ToolJet.

<div style={{paddingTop:'24px'}}>

## Add Table Component

Before performing the filter operation, let's setup the table component and populate it with the data:

1. Drag a **Table** component from the right component library to the canvas.
2. Select the data source and create a new query from the query panel at the bottom. (Refer to [data source](/docs/data-sources/overview) docs for more details) <br/>
    This guide will use ToolJet’s Sample data source (Postgres).<br/>
    Add the following query to fetch the data from the database:

    ```sql
    SELECT * FROM public.sample_data_orders
    LIMIT 100
    ```

    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/fetch-data-query.png" alt="Fetch data from the data source" />

3. Set the value of the **Data** property of the **Table** to `{{queries.<query_name>.data}}` to populate the table with relevant data.

</div>

<div>

## Serverside Filter

Follow the following steps to perform server-side filter operation on the **Table**:

1. Enable Server Side Filter under the **Table** properties.

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

3. Add Event Handler to **RunJS** Query<br/>
    Event: **Query Success**<br/>
    Action: **Run Query**<br/>
    Query: **Select Your Query**

    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/filter-query-eh.png" alt="Fetch data from the data source" />

4. Edit Query as follows:

    ```sql
    {{queries.runjs1.data.mainQuery}}
    ```

    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/filter-query.png" alt="Fetch data from the data source" />

5. Add Event Handler in the **Table**:<br/>
    Event: **Filter Changed**<br/>
    Action: **Run Query**<br/>
    Query: **Select Your RunJS Query**

    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/filter-eh.png" alt="Fetch data from the data source" />

    This will run the query and fetch the data every time a filter changes.

6. Add Loading State, navigate to the **Table** properties under Additional Actions. Click on the **fx** icon next to Loading State and enter `{{queries.getOrders.isLoading}}` in the field.

    Note: Make sure to replace *getOrders* with your query name.

    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/filter-loading.png" alt="Fetch data from the data source" />

This is how serverside filtering is implemented in ToolJet's **Table** component. When one or more filters are applied to the **Table**, the query is executed on the server, ensuring that the filtering affects all records in the dataset, not just the data currently loaded into the **Table**.

</div>