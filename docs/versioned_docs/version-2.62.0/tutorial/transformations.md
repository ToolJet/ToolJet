---
id: transformations
title: Transformations
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Transformations

Transformations can be enabled on queries to transform the query results. ToolJet allows you to transform the query results using two programming languages: 

- **[JavaScript](#transform-using-javascript)** 
- **[Python](#transform-using-python)** 

:::caution
- Every transformation is scoped to the query it's written for. 
- Workspace Constants are resolved server side and will not work with transformations.
- Actions and CSA(Component Specific Actions) cannot be called within the transformation, they can only be called within **[RunJS](/docs/data-sources/run-js)** query or **[RunPy](/docs/data-sources/run-py)** query.
:::

## Transform using JavaScript

Let's assume a query is returning the customers data with a `name` row, so we will write a simple transformation to compute `first_name` and `last_name` for all the customers.

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

<img className="screenshot-full" src="/img/tutorial/transformations/jstransformv2.png" alt="Transformation" />

</div>

## Transform using Python

Let's use Python transformation to compute `first_name` and `last_name` for all the customers that we fetch in the previous step.

```python
return list(map(lambda row: {
  **row,
  'first_name': row['name'].split(' ')[0],
  'last_name': row['name'].split(' ')[1],
}, data))
```

#### Example

- Let's take a look at the data returned by a RESTAPI (using mock data here):
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/tutorial/transformations/ogdata.png" alt="raw data" />

  </div>

- Now we will transform the returned data using Python that will append a new key in the returned data called `user` and that user will have the value from the exposed global variables of ToolJet which is `globals.currentUser.email`
  ```python
  return list(map(lambda item: {**item, "user": f"{globals['currentUser']['email']}"}, data))
  ```

- Now, you can click on the preview button to check the transformed data.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/tutorial/transformations/tdata.png" alt="raw data" />

  </div>

---

Click the `Save` button to create the query. Saved queries can be run using the `Run` button on the top-right of query panel. Queries run using the run button will behave just as if it was triggered by an app event like button click and thus will alter the state of the app. You can view the query results using the state inspector on the left side-bar of the app builder.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tutorial/transformations/run.png"  alt="result"/>

</div>

We can see that `first_name` and `last_name` are added to all the rows in the `data` object of the query. If you need the original data of the query, it will be available in the `rawData` object of the query.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tutorial/transformations/rawdata.png" alt="raw data" />

</div>
