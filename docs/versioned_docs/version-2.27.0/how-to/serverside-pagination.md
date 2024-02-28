---
id: use-server-side-pagination
title: Using server side pagination for efficient data handling in tables
---

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

In this guide we will learn how to use server side pagination in table component. This will be helpful if you have a large data set and you want to load data in chunks. This will also help you to improve the performance of your application. This guide will be helpful if you are using data sources like MySQL, PostgreSQL, MSSQL, MongoDB, etc. in which you can use `limit` and `offset` to fetch data in chunks. We have also included an example to load data from Google Sheets in chunks.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Loading data from PostgreSQL in chunks

- Let's say you have a table `users` in your PostgreSQL database and you want to load data from this table in chunks. You can use `limit` and `offset` to fetch data in chunks. Here is the SQL query to fetch data in chunks:
  ```sql title="PostgreSQL query"
  SELECT *
  FROM users
  ORDER BY id
  LIMIT 100 OFFSET {{(components.table1.pageIndex-1)*100}};
  ```
  
  The query will fetch 100 rows at a time from the postgresql users table, and the number of rows returned is determined by the current value of `pageIndex`(exposed variable) in the Table component.
  
  1. `ORDER BY id`: This part of the query specifies the ordering of the result set. It orders the rows based on the `id` column. You can replace `id` with the appropriate column name based on how you want the rows to be ordered.
  
  2. `LIMIT 100`: The `LIMIT` clause limits the number of rows returned to 100. This means that each time the query is executed, it will fetch 100 rows from the table.
  
  3. `OFFSET {{(components.table1.pageIndex-1)*100}}`: The `OFFSET` clause determines where to start fetching rows from the result set. In this case, the offset value is calculated based on the `pageIndex`(exposed variable) in the Table component. The formula `(components.table1.pageIndex-1)*100` calculates the starting row number for the current page. Since the index is 1-based, we subtract 1 from `pageIndex` to convert it to a 0-based index. Then we multiply it by 100 to get the offset for the current page. For example, if `pageIndex` is 1, the offset will be 0, which means it will fetch rows from the first 100 rows. If `pageIndex` is 2, the offset will be 100, which means it will fetch rows from rows 101 to 200, and so on.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

- Create a new query that will return the count of the records on the `users` table in postgresql db. This query will be used to calculate the total number of pages in the Table component. Here is the SQL query to fetch the count of records:
  
  ```sql
  SELECT COUNT(*)
  FROM users;
  ```
  
  - Enable the option to run the query on page load so that the query is executed when the app loads.
  - Add an event handler to run the query that fetches data from the PostgreSQL table and then save the changes.
  - Once the count query is created, execute it to get the total number of records. You can dynamically access the count of records using `{{queries.<countquery>.data[0].count}}`.

</div>

### Edit the Table component

**Now, let's edit the properties of the Table component:**

- Set the value of the **Table data** property to `{{queries.<postgresquery>.data}}`
  <div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/server-side/data.png" alt="Table data" />
  </div>
  
- Enable the **Server-side pagination** option
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
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/server-side/pagination.png" alt="Table data" />
  </div>

- Now, the last step is to set the **loading state** and add the **event handler**:
   - **Loading State**: This will show the loading indicator on the table component when the query is executing. Set the loading state property as:
     ```js
     {{queries.<postgresquery>.isLoading}}
     ```
   - **Event Handler**: Select the **Page changed** event and choose the **Run Query** action. Then, select the **Query** from the dropdown that fetches data from the PostgreSQL table
     <div style={{textAlign: 'center'}}>
      <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/server-side/event.png" alt="Table data" />
     </div>

Now, whenever the page is changed, the query will be executed, and the data will be fetched from the PostgreSQL table in chunks.

  <div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/server-side/change.gif" alt="Table data" />
  </div>
