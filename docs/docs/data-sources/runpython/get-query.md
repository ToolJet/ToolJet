---
id: get-query
title: Get Query Data
---

To immediately access the data returned by a query in **Run Python code**, you can use the below functions: 

### Trigger a Query and Retrieve its Data

```py
await queries.getSalesData.run()
#replace getSalesData with your query name

value = queries.getSalesData.getData()
#replace getSalesData with your query name

value
```

### Trigger a Query and Retrieve its Raw Data

```py
await queries.getCustomerData.run()
#replace getCustomerData with your query name

value = queries.getCustomerData.getRawData()
#replace getCustomerData with your query name

value
```

### Trigger a Query and Retrieve its Loading State

```py
await queries.getTodos.run()
#replace getTodos with your query name

value = queries.getTodos.getLoadingState()
#replace getTodos with your query name

value
```