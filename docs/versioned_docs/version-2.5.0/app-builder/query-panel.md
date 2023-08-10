---
id: query-panel
title: Query Panel
---

The Query Panel is present at the bottom of the app-builder, this is where you create queries to interact with connected **local** and **global** datasources. You can perform API requests, query **[databases](/docs/data-sources/overview)**, or **[transform](/docs/tutorial/transformations)** or manipulate data with **[JavaScript](/docs/data-sources/run-js)** & **[Python](/docs/data-sources/run-py)**.

The Query Panel has two sections:
- **[Query Manager](#query-manager)** on the right that includes a list of all the created queries
- **[Query Editor](#query-editor)** is used to configure the selected query

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui/querypanel.png" alt="App Builder: Component library- right sidebar"/>

</div>

## Query Manager

Query Manager will list all the queries that has been created in the application. Query Manager is used to:

### Search 

On the top of the query manager is search box that can be used to search for a specific query.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/search.png" alt="App Builder: Component library- right sidebar"/>

</div>

### Add

Add button is used to add more queries in the application. When Add button is clicked, the Query Editor will show you a list of options for creating a query from: **Rest API**, connected **[datasources](/docs/data-sources/overview)**, **[ToolJet Database](/docs/tooljet-database)**, **[JavaScript Code](/docs/data-sources/run-js)**, **[Python Code](/docs/data-sources/run-py)** or Add a new datasource.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui/add.png" alt="App Builder: Component library- right sidebar"/>

</div>

### Delete

Delete button will delete the selected query, the button will only show up when you hover over the query name.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/delete.png" alt="App Builder: Component library- right sidebar"/>

</div>

### Edit

Edit button is used edit the name of the selected query, the button will only show up when you hover over the query name.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/edit.png" alt="App Builder: Component library- right sidebar"/>

</div>

## Query Editor

Query editor used to configure the query parameters, preview or transform the data return by the query.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/editor.png" alt="App Builder: Component library- right sidebar"/>

</div>

### Topbar

On the top of the query panel there are a few options:

#### Query Name editor

Edit the name of the query by clicking on the edit button next to the default query name.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/nameedit.png" alt="App Builder: Component library- right sidebar"/>

</div>

#### Preview

Preview gives you a quick look at the data returned by the query without triggering the query in the app.

The Preview of data is returned in two different formats:

**Raw**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/raw.png" alt="App Builder: Component library- right sidebar"/>

</div>

**JSON**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/json.png" alt="App Builder: Component library- right sidebar"/>

</div>

#### Save

Save is used to save the changes whenever a change is made in query.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/save.png" alt="App Builder: Component library- right sidebar"/>

</div>

#### Run

Run is used to trigger the query, running the query will interact with the application unlike `Preview`.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/run.png" alt="App Builder: Component library- right sidebar"/>

</div>

### Query Parameters

Query Parameters are the values required for the query to return a response from the server. Parameters include **endpoints**, **methods**, or **operations**. Query Parameters are different for each datasource.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/params.png" alt="App Builder: Component library- right sidebar"/>

</div>

### Transformation

Transformations can be enabled on queries to transform the query results. ToolJet allows you to transform the query results using two programming languages JavaScript & Python. Check the detailed documentation on **[Transformations](/docs/tutorial/transformations)**.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/transform.png" alt="App Builder: Component library- right sidebar"/>

</div>

### Advanced options

#### Run this query on application load?

Enabling this option will fire the query every time the app is loaded.

#### Request confirmation before running the query?

Enabling this option show a confirmation modal to confirm `Yes` or `No` if you want to fire that query.

#### Show notification on success?

Enabling this option show a success toast notification when the query is successfully triggered.

#### Event Handlers

Event Handler are used to add some action when a particular event happens. You can add event handlers to the query for the following events:

- **Query Success**
- **Query Failure**

:::info
Learn more about [Event Handlers and Actions](/docs/widgets/overview#component-event-handlers).
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/advanced.png" alt="App Builder: Component library- right sidebar"/>

</div>

### Change Datasource

If more than one datasources are connected of same type then you can change the datasource of the query from this dropdown.


<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui/switch.png" alt="App Builder: Component library- right sidebar"/>

</div>