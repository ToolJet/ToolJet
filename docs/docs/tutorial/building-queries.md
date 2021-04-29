---
sidebar_position: 3
---

# Building Queries

Query Editor lives at the bottom of the page. We will now build a query for the PostgreSQL datasource that we connected in the previous step.

:::tip 
You can click on the 'enlarge' icon to enlarge query editor pane. 
:::

- Click on the `+` icon of the query editor to create a new query.
- Select the PostgreSQL datasource created in previous step.
- Copy the query given below and paste on the query area.
- Click `create` button.

```SQL
SELECT * FROM customers;
```

The query builder will look like this before clicking the `create` button.
<img src="/img/tutorial/building-queries/query.png" alt="ToolJet - Redis connection" height="220"/>

## Advanced options
<img src="/img/tutorial/building-queries/advanced-query.png" alt="ToolJet - Redis connection" height="420"/>

#### Run query on page load 
If this option is enabled, the query will be run when the app is loaded for the first time. The queries can have more than one trigger, means, the same query can later be triggered again using a button's click event or table's row selected event or any other events.

#### Request confirmation before running query
Enable this option to show a prompt to confirm the action before a query is run. The confirmation prompt will look like this:

<img src="/img/tutorial/building-queries/confirm.png" alt="ToolJet - Redis connection" height="120"/>

#### Show notification on success
Enable this option to show a custom message on query completion. Durationof the notification can also be set.
