---
sidebar_position: 4
---

# Tranformations

Transformations can be enabled on queries to transform the query results. Let's write a simple transformation to compute `first_name` and `last_name` for all the customers that we fetch in the previous step. 

```javascript
// write your code here
// return value will be set as data and the original data will be available as rawData
return data.map(row => { 
  return { 
    ...row,
    first_name: row.name.split(' ')[0],
    last_name: row.name.split(' ')[1]
	}
});
```

The query will now look like this: 

<img src="/img/tutorial/transformations/transform.png" alt="ToolJet - Query result transformations" height="420"/>


Save the query and click on the 'Run' button to run the query.
We can now use the state inspector on the left sidebar to view the query result.

<img src="/img/tutorial/transformations/result.png" alt="ToolJet - Query result transformations" height="620"/>

We can see that `first_name` and `last_name` is added to all the rows in the `data` object of the query. If we need the original query data, it will be available in the `rawData` object of the query.

<img src="/img/tutorial/transformations/rawdata.png" alt="ToolJet - Query result transformations" height="420"/>
