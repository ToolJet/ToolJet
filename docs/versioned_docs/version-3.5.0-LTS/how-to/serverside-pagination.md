---
id: use-server-side-pagination
title: Using Server Side Pagination in Tables
---

<div style={{paddingBottom:'24px'}}>

In this guide, we will implement server-side pagination for large datasets in a table component to enhance application performance. This guide is applicable for databases like MySQL, PostgreSQL, MSSQL, MongoDB, etc., supporting `limit` and `offset` for chunked data retrieval. 

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Loading Data from PostgreSQL in Chunks

To fetch data in chunks from a PostgreSQL table `users`, use `limit` and `offset` in the SQL query:

```sql title="PostgreSQL query"
SELECT *
FROM users
ORDER BY id
LIMIT 100 OFFSET {{(components.table1.pageIndex-1)*100}};
```
  
The query will fetch 100 rows at a time from the PostgreSQL users table, and the number of rows returned is determined by the current value of `pageIndex`(exposed variable) in the Table component.

The following is the breakdown of the above PostgreSQL query:

- `ORDER BY id`: Orders the result set by the id column.

- `LIMIT 100`: Limits rows returned to 100 per query.

- `OFFSET {{(components.table1.pageIndex-1)*100}}`: Determines the starting row number based on the current page index for pagination.


To obtain the count of records in the users table, execute the following query:
  
```sql
SELECT COUNT(*)
FROM users;
```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Edit the Table Component

**Follow the steps below to edit the properties of the Table component:**

- Drag the table component to the canvas from the components library and set the value of the **Data** property to `{{queries.<postgresquery>.data}}`  to populate the table with the relevant data.

- Enable the **Server-side pagination** option.
- Click on the `Fx` next to **Enable previous page button** and set the value as below. This condition disables the previous page button when the current page is page `1`.

  ```js
  {{components.table1.pageIndex >=2 ? true : false}}
  ```

- Click on the `Fx` next to **Enable next page button** and set it's value as below. This condition disables the next page button when the current page is the last page.
  ```js
  {{components.table1.pageIndex < queries.<countquery>.data[0].count/100 ? true : false}}
  ```

- Set the value of the **Total records server side** property as below. This will set the total number of records in the Table component. 
  ```js
  {{queries.<countquery>.data[0].count}}
  ```

<div style={{textAlign: 'center'}}>
  <img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/server-side/pagination-v2.png" alt="Table data" />
</div>


- To add the loading indicator on the table component while executing the query, set the `Loading state` property as:

  ```js
  {{queries.<postgresquery>.isLoading}}
  ```
- Select the **Page changed** event and choose the **Run Query** action, after clicking the `New event handler`. Then, select the **Query** from the dropdown that fetches data from the PostgreSQL table.

<div style={{textAlign: 'center'}}>
<img style={{ width: '100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/server-side/event-v2.png" alt="Table data" />
</div>

Now, whenever the page is changed, the query will be executed, and the data will be fetched from the PostgreSQL table in chunks.

  <div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/server-side/change-v2.gif" alt="Table data" />
  </div>

</div>
