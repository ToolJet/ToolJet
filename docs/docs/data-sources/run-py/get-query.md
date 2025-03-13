---
id: get-query
title: Get Query Data
---

To retrieve and work with query results in **Run Python Code** within ToolJet, specific functions are available that allow immediate access to the returned data. These functions help in processing, transforming, or utilizing the fetched data within a Python script.

## Trigger a Query and Retrieve its Data

**Data:** This is a modified version of Raw Data. If you change the query results using JavaScript or Python, data will show those changes.

```py
await queries.getSalesData.run()
#replace getSalesData with your query name

value = queries.getSalesData.getData()
#replace getSalesData with your query name

value
```

<img className="screenshot-full" src="/img/datasource-reference/custom-python/get-data.png" alt="Get Data" />

## Trigger a Query and Retrieve its Raw Data

**Raw Data:** This represents the original, unaltered data returned directly from a query. It contains the exact response from the data source without any modifications.

```py
await queries.getCustomerData.run()
#replace getCustomerData with your query name

value = queries.getCustomerData.getRawData()
#replace getCustomerData with your query name

value
```

<img className="screenshot-full" src="/img/datasource-reference/custom-python/get-raw-data.png" alt="Get Raw Data" />

## Trigger a Query and Retrieve its Loading State

**Loading State:** When executing queries in ToolJet, especially within Python code, it's often useful to know whether a query is still running or has completed. The loading state indicates this status.

```py
await queries.getTodos.run()
#replace getTodos with your query name

value = queries.getTodos.isLoading
#replace getTodos with your query name

value
```

<img className="screenshot-full" src="/img/datasource-reference/custom-python/get-loading-state.png" alt="Get Loading State" />