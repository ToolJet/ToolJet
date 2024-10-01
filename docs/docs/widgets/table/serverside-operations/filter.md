---
id: filter
title: Serverside Filter Operation
---

This guide explains how to perform serverside filter operation on a table component in ToolJet.  While most databases offer support for server-side operations, the specific implementation can vary depending on the database. For the purposes of this guide, PostgreSQL will be used as the data source to demonstrate the process.

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

<div>

## Serverside Filter

Follow the following steps to perform server side filter operation on table:

1. Enable Server Side Sort under the table’s properties.
    
    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/filter-property.png" alt="Fetch data from the data source" />
    
2. Create a new RunJS Query to dynamically create SQL queries for filters.
    
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
    
3. Add Event Handler to RunJS Query<br/>
    Event: **Query Success**<br/>
    Action: **Run Query**<br/>
    Query: **Select Your Query**
    
    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/filter-query-eh.png" alt="Fetch data from the data source" />
    
4. Edit Query as follow:
    
    ```sql
    {{queries.runjs1.data.mainQuery}}
    ```
    
    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/filter-query.png" alt="Fetch data from the data source" />
    
5. Add Event Handler in table:<br/>
    Event: **Filter Changed**<br/>
    Action: **Run Query**<br/>
    Query: **Select Your RunJS Query**
    
    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/filter-eh.png" alt="Fetch data from the data source" />
    
    This will run the query and fetch the data every time a filter is changed.
    
6. Add Loading State, navigate to the table's properties under Additional Actions. Click on the *fx* icon next to Loading State and enter `{{queries.getOrders.isLoading}}` in the field.
    
    Note: Make sure to replace *getOrders* with your query name.
    
    <img className="screenshot-full" src="/img/widgets/table/serverside-operations/filter-loading.png" alt="Fetch data from the data source" />

This is how serverside filtering is implemented in ToolJet's table component. When one or more filters are applied to the table, the query is executed on the server, ensuring that the filtering affects all records in the dataset, not just the data currently loaded into the table.

</div>