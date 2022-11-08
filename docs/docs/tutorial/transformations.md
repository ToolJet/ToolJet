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
- Actions and CSA(Component Specific Actions) cannot be called within the transformation, they can only be called within `RunJS`.
:::

## Transform using JavaScript

Let's write a simple transformation to compute `first_name` and `last_name` for all the customers that we fetch in the previous step.

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


<img className="screenshot-full" src="/img/tutorial/transformations/jstransform.png" alt="transform" />

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


Click the `create` button to create the query. Saved queries can be run using the `run` icon near the query name. Queries run using the run button will behave just as if it was triggered by an app event like button click and thus will alter the state of the app. You can view the query results using the state inspector on the left side-bar of the app builder.


<img className="screenshot-full" src="/img/tutorial/transformations/result.png"  alt="result"/>


We can see that `first_name` and `last_name` are added to all the rows in the `data` object of the query. If you need the original data of the query, it will be available in the `rawData` object of the query.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tutorial/transformations/rawdata.png" alt="raw data" />

</div>

In the next section, we will see how we can display this data using ToolJet's built-in widgets.


-----