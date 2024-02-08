---
id: query-panel
title: Query Panel
---

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

The Query Panel, located at the bottom of the app-builder, allows you to create and manage queries for interacting with connected **Data sources**. It provides the capability to perform API requests, query **[databases](/docs/data-sources/overview)**, and apply **[transformations](/docs/tutorial/transformations)** or data manipulation using **[JavaScript](/docs/data-sources/run-js)** and **[Python](/docs/data-sources/run-py)**.

The Query Panel consists of two sections:
- The **[Query Manager](#query-manager)** on the right side, which displays a list of all the created queries.
- The **[Query Editor](#query-editor)**, used to configure the selected query.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui3/qpanel.png" alt="Query Panel" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Query Manager

Query Manager will list all the queries that has been created in the application. Query Manager helps in managing the queries that have been created, you can **add**, **edit**, **delete**, **duplicate**, **search**, **sort** and **filter** through them.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/querymanager.png" alt="Query Panel" />
</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Add

Add button is used to add new query in the application. When Add button is clicked, a menu will open with a list of options for creating a query from **Default** data sources such as **Rest API**, **ToolJet Database**, **JavaScript Code**, **Python Code** or from connected **Data sources**.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/addquery.gif" alt="Query Panel" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Sort/Filter

On the top of Query Manager, there is button to Sort or Filter queries. The following options are there:

**Filter:**
- By Data source

**Sort:**
- Name: A-Z
- Name: Z-A
- Type: A-Z
- Type: Z-A
- Last modified: oldest first
- Last modified: newest First

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/sortfilter.gif" alt="Query Panel" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Search 

On the top of the query manager is search box that can be used to search for a specific query.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/search.gif" alt="Query Panel" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Delete

Delete button will delete the selected query, the button will only show up when you hover over the query name. When you click on the delete button, a confirmation dialog will open to confirm the deletion of the query.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/delete.png" alt="Query Panel" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Duplicate

Duplicate button will duplicate the selected query, the button will only show up when you hover over the query name. The duplicate query will be named as `<query name>_copy`.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/duplicate.png" alt="Query Panel" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Rename

Rename button is used to rename the selected query, the button will only show up when you hover over the query name. When you click on the rename button, the query name becomes editable and you can change the name of the query.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/rename.png" alt="Query Panel" />
</div>

</div>

</div>

## Query Editor

Query Editor provides the functionality to construct queries either through a low-code interface or by manually entering the query text.

:::info
The changes made in the query panel will be saved automatically.
:::

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui3/queryeditor.png" alt="Query Panel" />
</div>


<div style={{paddingTop: '24px', paddingBottom: '24px'}}>

### Query Name

The query name is prominently displayed at the top of the query panel. Click on it to make edits and customize the query name as needed.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui3/queryrename.gif" alt="Query Editor" />
</div>

</div>

<div style={{paddingTop: '24px', paddingBottom: '24px'}}>

### Custom Parameters

Custom query parameters provide a convenient method for introducing custom variables to a query without directly modifying the query parameters themselves. To add parameters, simply click the **+** button beside the Parameters in the top bar of the query editor.

For each parameter, you need to specify:
- **Name**: The identifier for the parameter.
- **Default value**: This value can be a constant string, number, or object.

**Syntax for utilizing the parameter:** Employ `parameters.<identifier>` in your query. It's important to note that parameters can only be utilized within the specific query where they are defined.

Learn more about **[Using Custom Parameters](/docs/how-to/use-custom-parameters)**.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui3/queryparams.png" alt="Custom Parameters" />
</div>

</div>

<div style={{paddingTop: '24px', paddingBottom: '24px'}}>

### Preview

The Preview button allows you to preview the data returned by the query. The data is displayed in the preview section at the bottom of the query panel, aiding in query debugging without triggering the query in the app.

Data preview is available in two formats: **Raw** and **JSON**. Click the clear button to reset the preview data.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/preview.gif" alt="Query Editor" />
</div>

</div>

<div style={{paddingTop: '24px', paddingBottom: '24px'}}>

### Run

The Run button triggers the query, causing it to interact with the application. This action differs from the `Preview` feature.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/run.gif" alt="Query Editor" />
</div>

</div>

<div style={{paddingTop: '24px', paddingBottom: '24px'}}>

### Query Parameters

Query Parameters are vital values necessary for the server to generate a response. These parameters may include **endpoints**, **methods**, or **operations**, with the specific set varying for each data source.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/params.png" alt="Query Editor" />
</div>

</div>

<div style={{paddingTop: '24px', paddingBottom: '24px'}}>

#### Data source

The primary and default parameter for all queries is **data source**. This option enables the selection of the appropriate data source for your query.

In cases where multiple data sources of the same type are connected, easily switch the query's data source using the dropdown menu.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/switch.png" alt="Query Editor" />
</div>

</div>

<div style={{paddingTop: '24px', paddingBottom: '24px'}}>

### Transformation

Queries can be enhanced with transformations to modify the query results. ToolJet supports transformations using two programming languages: JavaScript & Python. Refer to the detailed documentation on **[Transformations](/docs/tutorial/transformations)** for more information.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/transform.gif" alt="Query Editor" />
</div>

</div>

<div style={{paddingTop: '24px', paddingBottom: '24px'}}>

### Settings

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/settings.png" alt="Query Editor" />
</div>

#### Run this query on application load?

Enabling this option executes the query every time the app is loaded.

#### Request confirmation before running the query?

Enabling this option displays a confirmation modal, prompting for a `Yes` or `No` before firing the query.

#### Show notification on success?

Enabling this option shows a success toast notification when the query is successfully triggered. Customize the **success message** and **notification duration** in milliseconds.

</div>

<div style={{paddingTop: '24px', paddingBottom: '24px'}}>

### Events

Event handlers can be added to queries for the following events:

- **Query Success**
- **Query Failure**

:::info
Learn more about [Event Handlers and Actions](/docs/widgets/overview#component-event-handlers).
:::

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui2/events.png" alt="Query Editor" />
</div>

</div>
