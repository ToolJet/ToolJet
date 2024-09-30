---
id: serverside-operations-in-table
title: Server Side Operations in Table
---

This guide explains how to perform server-side operations on a table component in ToolJet.  While most databases offer support for server-side operations, the specific implementation can vary depending on the database. For the purposes of this guide, PostgreSQL will be used as the data source to demonstrate the process.

<div style={{paddingTop:'24px'}}>

## Server Side v/s Client Side

Server-side operations refer to tasks executed on the server, such as data fetching, filtering, sorting, and pagination. These operations leverage the server's resources, making them more efficient when handling large datasets and ensuring faster load times for users. In contrast, client-side operations are performed in the user's browser or application, which may lead to performance issues with large datasets as all data is first fetched and then processed locally. Server-side operations offer better scalability and performance, especially for resource-intensive tasks.

### When to Use Sever Side Operations?

1. **Handling Large Datasets**
2. **Security and Data Integrity**
3. **Complex Business Logic**

### When to Use Client Side Operations?

1. **Real-time Interactivity**
2. **Reduced Server Load**
3. **Offline Capabilities**

</div>

<div style={{paddingTop:'24px'}}>

## Supported Operations

Following server side operations can be performed on a Table in ToolJet:

- **[Search](#search)**
- **[Sort](#sort)**
- **[Filter](#filter)**
- **[Pagination](#pagination)**

Before performing the operations, lets setup the table component and populate it with the data:

1. Drag a table component from left component library to the canvas.
2. Select the data source and create a new query from the query panel at the bottom. (Refer to [data source](https://docs.tooljet.com/docs/data-sources/overview) docs for more details) <br/>
    We are going to use ToolJet’s Sample data source (Postgres) in this guide.<br/>
    Add the following query to fetch the data from database:
    
    ```sql
    SELECT * FROM public.sample_data_orders
    LIMIT 100
    ```
    
    <img className="screenshot-full" src="/img/how-to/serverside-operations/fetch-data-query.png" alt="Fetch data from the data source" />
    
3. Set the value of the **Data** property of the table to `{{queries.<query_name>.data}}` to populate the table with relevant data.

Now let’s see how we can perform the server side operations:

### Search

Follow the following steps to perform server side search operation on table:

1. Enable Server Side Search under the table’s properties.
    
    <img className="screenshot-full" src="/img/how-to/serverside-operations/search-property.png" alt="Fetch data from the data source" />
    
2. Edit the query, as follow:
    
    ```sql
    SELECT * FROM public.sample_data_orders
    WHERE city ILIKE '%{{components.table1.searchText}}%' OR
          country ILIKE '%{{components.table1.searchText}}%' OR
          state ILIKE '%{{components.table1.searchText}}%'
    LIMIT 100
    ```
    
    <img className="screenshot-full" src="/img/how-to/serverside-operations/search-query.png" alt="Fetch data from the data source" />
    
    The above query searches for the searched text in city, state and country column on server side and return the data.<br/>
    **Note**: Make sure to replace *table1* with your table name.
    
3. Add Event Handler in table:<br/>
    Event: **Search**<br/>
    Action: **Run Query**   
    Query: **Select Your Query**<br/>
    
    <img className="screenshot-full" src="/img/how-to/serverside-operations/search-eh.png" alt="Fetch data from the data source" />
    
    This will run the query and fetch the data every time something is searched.
    
4. Add Loading State, navigate to the table's properties under Additional Actions. Click on the *fx* icon next to Loading State and enter `{{queries.getOrders.isLoading}}` in the field.<br/>
    **Note**: Make sure to replace *getOrders* with your query name.
    
    <img className="screenshot-full" src="/img/how-to/serverside-operations/search-loading.png" alt="Fetch data from the data source" />
    

### Sort

Follow the following steps to perform server side sort operation on table:

1. Enable Server Side Sort under the table’s properties.
    
    <img className="screenshot-full" src="/img/how-to/serverside-operations/sort-property.png" alt="Fetch data from the data source" />
    
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
    
    <img className="screenshot-full" src="/img/how-to/serverside-operations/sort-query.png" alt="Fetch data from the data source" />
    
    **Note**: Make sure to replace *table1* with your table name.
    
3. Add Event Handler in table:<br/>
    Event: **Sort applied**<br/>
    Action: **Run Query**<br/>
    Query: **Select Your Query**
    
    <img className="screenshot-full" src="/img/how-to/serverside-operations/sort-eh.png" alt="Fetch data from the data source" />
    
    This will run the query and fetch the data every time a sort is applied.
    
4. Add Loading State, navigate to the table's properties under Additional Actions. Click on the *fx* icon next to Loading State and enter `{{queries.getOrders.isLoading}}` in the field.
    
    Note: Make sure to replace *getOrders* with your query name.
    
    <img className="screenshot-full" src="/img/how-to/serverside-operations/sort-loading.png" alt="Fetch data from the data source" />
    

### Filter

Follow the following steps to perform server side filter operation on table:

1. Enable Server Side Sort under the table’s properties.
    
    <img className="screenshot-full" src="/img/how-to/serverside-operations/filter-property.png" alt="Fetch data from the data source" />
    
2. Create a new RunJS Query to dynamically create SQL queries for filters.
    
    ```jsx
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
    
    <img className="screenshot-full" src="/img/how-to/serverside-operations/filter-js-query.png" alt="Fetch data from the data source" />
    
3. Add Event Handler to RunJS Query<br/>
    Event: **Query Success**<br/>
    Action: **Run Query**<br/>
    Query: **Select Your Query**
    
    <img className="screenshot-full" src="/img/how-to/serverside-operations/filter-query-eh.png" alt="Fetch data from the data source" />
    
4. Edit Query as follow:
    
    ```sql
    {{queries.runjs1.data.mainQuery}}
    ```
    
    <img className="screenshot-full" src="/img/how-to/serverside-operations/filter-query.png" alt="Fetch data from the data source" />
    
5. Add Event Handler in table:<br/>
    Event: **Filter Changed**<br/>
    Action: **Run Query**<br/>
    Query: **Select Your RunJS Query**
    
    <img className="screenshot-full" src="/img/how-to/serverside-operations/filter-eh.png" alt="Fetch data from the data source" />
    
    This will run the query and fetch the data every time a filter is changed.
    
6. Add Loading State, navigate to the table's properties under Additional Actions. Click on the *fx* icon next to Loading State and enter `{{queries.getOrders.isLoading}}` in the field.
    
    Note: Make sure to replace *getOrders* with your query name.
    
    <img className="screenshot-full" src="/img/how-to/serverside-operations/filter-loading.png" alt="Fetch data from the data source" />
    

### Pagination

Follow the following steps to perform server side pagination on table:

1. Enable Server Side Pagination under the table’s properties.
    
    <img className="screenshot-full" src="/img/how-to/serverside-operations/pagiation-property.png" alt="Fetch data from the data source" />
    
2. Create a new query to find total number of records on server side
    
    ```sql
    SELECT COUNT(*) FROM public.sample_data_orders
    ```
    
    <img className="screenshot-full" src="/img/how-to/serverside-operations/pagiation-count.png" alt="Fetch data from the data source" />
    
3. Navigate to the table's properties under Pagination section, in Total record server side enter `{{queries.countOrders.data[0].count}}` 
    
    <img className="screenshot-full" src="/img/how-to/serverside-operations/pagiation-total-record.png" alt="Fetch data from the data source" />
    
    Make sure to change *countOrders* with your query name create in the last step.
    
4. Edit the query, as follow:
    
    ```sql
    SELECT * FROM public.sample_data_orders
    LIMIT 100 OFFSET {{(components.table1.pageIndex-1)*100}}
    ```
    
    <img className="screenshot-full" src="/img/how-to/serverside-operations/pagiation-query.png" alt="Fetch data from the data source" />
    
    **Note**: Make sure to replace *table1* with your table name.
    
5. Add Event Handler in table:<br/>
    Event: **Page changed**<br/>
    Action: **Run Query**<br/>
    Query: **Select Your Query**
    
    <img className="screenshot-full" src="/img/how-to/serverside-operations/pagiation-eh.png" alt="Fetch data from the data source" />
    
    This will run the query and fetch the data every time a sort is applied.
    
6. Disable the next page button on the last page, navigate to the table's properties under Pagination section. Click on the *fx* icon next to Ebable next page button and enter `{{components.table1.pageIndex<queries.countOrders.data[0].count/100}}` in the field.
    
    <img className="screenshot-full" src="/img/how-to/serverside-operations/pagiation-next-page.png" alt="Fetch data from the data source" />
    
7. Add Loading State, navigate to the table's properties under Additional Actions. Click on the *fx* icon next to Loading State and enter `{{queries.getOrders.isLoading}}` in the field.
    
    Note: Make sure to replace *getOrders* with your query name.
    
    <img className="screenshot-full" src="/img/how-to/serverside-operations/pagiation-loading.png" alt="Fetch data from the data source" />
    
</div>
