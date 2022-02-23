---
sidebar_position: 4
---

# Transformations

Transformations can be enabled on queries to transform the query results. Let's write a simple transformation to compute `first_name` and `last_name` for all the customers that we fetch in the previous step.

```javascript
// write your code here
// return value will be set as data and the original data will be available as rawData
return data.map((row) => {
  return {
    ...row,
    first_name: row.name.split(' ')[0],
    last_name: row.name.split(' ')[1],
  };
});
```

The query will now look like this:

<div style={{textAlign: 'center'}}>

![ToolJet - Tutorial - Query result transformations](/img/tutorial/transformations/transform.png)

</div>

Click the `create` button to create the query. Saved queries can be run using the `run` icon near the query name. Queries run using the run button wil behave just as if it was triggered by an app event like button click and thus will alter the state of the app. You can view the query results using the state inspector on the left side-bar of the app builder.

<div style={{textAlign: 'center'}}>

![ToolJet - Tutorial - Query result transformations](/img/tutorial/transformations/result.png)

</div>

We can see that `first_name` and `last_name` is added to all the rows in the `data` object of the query. If you need the original data of the query, it will be available in the `rawData` object of the query.

<div style={{textAlign: 'center'}}>

![ToolJet - Tutorial - Query result transformations](/img/tutorial/transformations/rawdata.png)

</div>

In the next section, we will see how we can this data using ToolJet's built-in widgets.
