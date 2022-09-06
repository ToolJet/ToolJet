---
id: building-queries
title: Building Queries
---

# Building Queries

Query Editor lives at the bottom of the page. We will now build a query for the PostgreSQL datasource that we connected in the previous step.

:::tip 
You can click on the 'enlarge' icon to enlarge query editor pane. 
:::

- Click on the `+` icon of the query editor to create a new query.
- Select the PostgreSQL datasource created in previous step.
- Copy the query given below and paste on the query area.
- Select SQL mode

```sql
SELECT * FROM customers;
```


<img className="screenshot-full" src="/img/tutorial/building-queries/query.png" alt="query" />


Query results can be previewed by clicking the `preview` button. Previewing queries will not alter the state of the app.


<img className="screenshot-full" src="/img/tutorial/building-queries/preview.png" alt="preview" />



## Advanced options


<img className="screenshot-full" src="/img/tutorial/building-queries/advanced-options.gif" alt="advanced options"/>


#### Run query on page load 
If this option is enabled, the query will be run when the app is loaded for the first time. The queries can have more than one trigger, ie the same query can later be triggered again using a button's click event or table's row selected event or any other events.

#### Request confirmation before running query
Enable this option to show a prompt to confirm the action before a query is run. The confirmation prompt will look like this:

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tutorial/building-queries/confirm.png" alt="confirm" />

</div>

#### Show notification on success
Enable this option to show a custom message on query completion. Duration of the notification can also be set.
