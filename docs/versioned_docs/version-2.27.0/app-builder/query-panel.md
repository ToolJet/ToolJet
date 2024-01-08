---
id: query-panel
title: Query Panel
---

The Query Panel, located at the bottom of the app-builder, allows you to create and manage queries for interacting with connected **Default** and **Global** datasources. It provides the capability to perform API requests, query **[databases](/docs/data-sources/overview)**, and apply **[transformations](/docs/tutorial/transformations)** or data manipulation using **[JavaScript](/docs/data-sources/run-js)** and **[Python](/docs/data-sources/run-py)**.

The Query Panel consists of two sections:
- The **[Query Manager](#query-manager)** on the right side, which displays a list of all the created queries.
- The **[Query Editor](#query-editor)**, used to configure the selected query.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/querypanel.png" alt="App Builder: Query Panel"/>

</div>

## Query Manager

Query Manager will list all the queries that has been created in the application. Query Manager helps in managing the queries that have been created, you can **add**, **edit**, **delete**, **duplicate**, **search**, **sort** and **filter** through them.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/querymanager.png" alt="App Builder: Query Panel"/>

</div>

### Add

Add button is used to add new query in the application. When Add button is clicked, a menu will open with a list of options for creating a query from **Default** datasources such as **Rest API**, **ToolJet Database**, **JavaScript Code**, **Python Code** or from connected **Global Datasources**.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/addquery.gif" alt="App Builder: Query Panel"/>

</div>

### Sort/Filter

On the top of Query Manager, there is button to Sort or Filter queries. The following options are there:

**Filter:**
- By Datasource

**Sort:**
- Name: A-Z
- Name: Z-A
- Type: A-Z
- Type: Z-A
- Last modified: oldest first
- Last modified: newest First

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/sortfilter.gif" alt="App Builder: Query Panel"/>

</div>

### Search 

On the top of the query manager is search box that can be used to search for a specific query.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/search.gif" alt="App Builder: Query Panel"/>

</div>

### Delete

Delete button will delete the selected query, the button will only show up when you hover over the query name. When you click on the delete button, a confirmation dialog will open to confirm the deletion of the query.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/delete.png" alt="App Builder: Query Panel"/>

</div>

### Duplicate

Duplicate button will duplicate the selected query, the button will only show up when you hover over the query name. The duplicate query will be named as `<query name>_copy`.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/duplicate.png" alt="App Builder: Query Panel"/>

</div>

### Rename

Rename button is used to rename the selected query, the button will only show up when you hover over the query name. When you click on the rename button, the query name becomes editable and you can change the name of the query.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/rename.png" alt="App Builder: Query Panel"/>

</div>

## Query Editor

Query editor used to configure the query parameters, preview or transform the data return by the query.

:::info
The changes made in the query panel will be saved automatically.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/editor.png" alt="App Builder: Query Panel"/>

</div>

### Topbar

On the top of the query panel there are a few options:

#### Query Name

The name of query is displayed on the top of the query panel. You can click on it to make it editable and change the name of the query.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/renameeditor.gif" alt="App Builder: Query Panel"/>

</div>

#### Preview

Preview button is used to preview the data returned by the query. The data will be displayed on the preview section present at the bottom of the query panel. This helps in debugging the query and see the data returned by the query without triggering the query in the app.

The Preview of data is returned in two different formats: **Raw** & **JSON**. You can click on the clear button to clear the preview data.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/preview.gif" alt="App Builder: Query Panel"/>

</div>

#### Run

Run is used to trigger the query, running the query will interact with the application unlike `Preview`.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/run.gif" alt="App Builder: Query Panel"/>

</div>

### Query Parameters

Query Parameters are essential values that must be provided in a query for the server to generate a response. These parameters encompass **endpoints**, **methods**, or **operations**. It's important to note that the specific set of Query Parameters varies for each datasource.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/params.png" alt="App Builder: Query Panel"/>

</div>

#### Datasource

The primary and default parameter found in all queries is **Datasource**. This option allows you to choose the appropriate datasource for your query.

In cases where multiple datasources of the same type are connected, you can easily switch the query's datasource using the dropdown menu.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/switch.png" alt="App Builder: Query Panel"/>

</div>

### Transformation

Transformations can be enabled on queries to transform the query results. ToolJet allows you to transform the query results using two programming languages JavaScript & Python. Check the detailed documentation on **[Transformations](/docs/tutorial/transformations)**.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/transform.gif" alt="App Builder: Query Panel"/>

</div>

### Settings

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/settings.png" alt="App Builder: Query Panel"/>

</div>

#### Run this query on application load?

Enabling this option will execute the query every time the app is loaded.

#### Request confirmation before running the query?

Enabling this option show a confirmation modal to confirm `Yes` or `No` if you want to fire that query.

#### Show notification on success?

Enabling this option show a success toast notification when the query is successfully triggered.

You can provide a custom **success message** and **notification duration** in milliseconds.

### Events

Event handlers can be added to queries for the following events:

- **Query Success**
- **Query Failure**

:::info
Learn more about [Event Handlers and Actions](/docs/widgets/overview#component-event-handlers).
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/events.png" alt="App Builder: Query Panel"/>

</div>