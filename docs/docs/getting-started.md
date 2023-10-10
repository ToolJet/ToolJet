---
id: getting-started
title: Getting Started
description: ToolJet is an low-code framework to build and deploy custom internal tools. ToolJet can connect to your data sources such as databases ( PostgreSQL, MongoDB, MS SQL Server, Snowflake, , BigQuery, etc ), API/GraphQL endpoints, SaaS tools ( Airtable, Stripe, Google Sheets, etc ) and cloud object storage services ( AWS S3, Google Cloud Storage and Minio ). Once the data sources are connected, ToolJet can run queries on these data sources to fetch and update data. The data fetched from data sources can be visualised and modified using the UI widgets such as tables, charts, forms, etc.
slug: /
---

# Welcome to ToolJet Docs

---

<div style={{marginLeft: "40px", marginRight: "40px"}}>


## What is ToolJet

ToolJet is a **low-code framework** to build and deploy custom internal tools. Using ToolJet's low-code capabilities, a suite of over 45 pre-designed components, and straightforward integration options, developers can create applications in minutes.

Design rich UIs by simply dragging and dropping components on the visual app-builder. Craft and manage complex queries, and connect to a variety of data sources using the low-code query builder. Regulate the access levels for each user to ToolJet Apps and additional resources through a streamlined user and group management system.

## Quickstart Guide

This Quickstart Guide will walk you through the process of creating an **Employee Directory Application** in minutes using ToolJet. You'll learn how to set up your database table, create your first ToolJet app, integrate data, and bind it to the UI. We'll follow the below steps to create the application:

**[Create Database Table](#create-database-table/)** <br/>
**[Create Your First ToolJet App](#create-your-first-tooljet-app)** <br/>
**[Integrate Data](#integrate-data)** <br/>
**[Bind Data To UI](#bind-data-to-ui)** <br/>
**[Add Employee Detail](#add-employee-details)** <br/>
**[Preview And Share](#preview-and-share)** <br/>

### Create Database Table

Start by setting up a table in ToolJet's built-in **[database](/docs/tooljet-database)**. Name this table *employees* and populate it with sample data. Your table should have the following columns: firstname, lastname, email, phone, department, position, joining and status. 

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px', marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/create-database-v2.png" alt="Database Preview" />
</div>

### Create Your First ToolJet App

Click on the **Dashboard** button on the sidebar and click on the **Create new app** button. A new application will be created with an empty canvas. 

<!-- <div style={{textAlign: 'center'}}>
    <img style={{padding: '10px', marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/app-builder-overview-v2.png" alt="App-Builder Overview" />
</div> -->

<div style={{padding: '10px', marginBottom: '15px'}}>
    <iframe
        className="screenshot-full"
        src="https://www.floik.com/embed/e4f537b5-7b36-4760-9a52-caefc659a90b/60f6080c-abb9-4520-b524-3c4bfb8f8a0a-flo.html"
        style={{width: '100%', height: '450px'}}
        width="100%"
        height="450px"
        frameborder="0"
        allowfullscreen="allowfullscreen"
        webkitallowfullscreen
        mozallowfullscreen
        allowfullscreen>
    </iframe>
</div>

Rename the application to `Employee Directory`. 

<!-- On the right side, you'll find the **Component Library** with a list of ready-to-use components. Simply drag and drop these onto the canvas to build your app. For handling data, use the **Query Panel** located at the bottom of the screen. -->

Click and drag a **[Table](/docs/widgets/table)** component to the canvas. 

<div style={{padding: '10px', marginBottom: '15px'}}>
    <iframe
        className="screenshot-full"
        src="https://www.floik.com/embed/e4f537b5-7b36-4760-9a52-caefc659a90b/cb4c26a4-95ac-4c19-877b-f17e9a602591-flo.html"
        style={{width: '100%', height: '450px'}}
        width="100%"
        height="450px"
        frameborder="0"
        allowfullscreen="allowfullscreen"
        webkitallowfullscreen
        mozallowfullscreen
        allowfullscreen>
    </iframe>
</div>


<!-- <div style={{textAlign: 'center'}}>
    <img style={{padding: '10px', marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/add-a-table-v2.png" alt="Drag and Drop Table" />
</div> -->

<!-- <i>On clicking on the Table component or any other component on the canvas, its configuration panel will appear on the right. You can customize the functionality and styling of the components in the configuration panel.</i> -->


### Integrate Data

To fetch data in the App-Builder:
- Select **ToolJet DB** in the Query Panel 
- Select **employees** as Table name and **List rows** as Operations
- Click on the **Run** button in the query panel to fetch the data
- Rename the query to `getEmployees`
- Enable the **Run this query on application load?** toggle to automatically run this query when the application starts

<div style={{padding: '10px', marginBottom: '15px'}}>
    <iframe
        className="screenshot-full"
        src="https://www.floik.com/embed/e4f537b5-7b36-4760-9a52-caefc659a90b/c3838733-4dc1-4a2b-b1ad-9786931f910b-flo.html"
        style={{width: '100%', height: '450px'}}
        width="100%"
        height="450px"
        frameborder="0"
        allowfullscreen="allowfullscreen"
        webkitallowfullscreen
        mozallowfullscreen
        allowfullscreen>
    </iframe>
</div>


Click on the **Preview** button to see a preview of the fetched data. 

<div style={{padding: '10px', marginBottom: '15px'}}>
    <iframe
        className="screenshot-full"
        src="https://www.floik.com/embed/e4f537b5-7b36-4760-9a52-caefc659a90b/a87fe800-2abc-444c-b369-3b3aad23bba0-flo.html"
        style={{width: '100%', height: '450px'}}
        width="100%"
        height="450px"
        frameborder="0"
        allowfullscreen="allowfullscreen"
        webkitallowfullscreen
        mozallowfullscreen
        allowfullscreen>
    </iframe>
</div>

<!-- 
<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px', marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/query-preview-v2.png" alt="Query Preview" />
</div> -->

### Bind Data To UI

Click on the **Table** component to open its configuration panel on the right. Under the **Data** property, paste the below code:

```js
{{queries.getEmployees.data}}
```

<div style={{padding: '10px', marginBottom: '15px'}}>
    <iframe
        className="screenshot-full"
        src="https://www.floik.com/embed/e4f537b5-7b36-4760-9a52-caefc659a90b/bd92e2cb-7bec-4e7e-ad97-0db5191e3bf9-flo.html"
        style={{width: '100%', height: '450px'}}
        width="100%"
        height="450px"
        frameborder="0"
        allowfullscreen="allowfullscreen"
        webkitallowfullscreen
        mozallowfullscreen
        allowfullscreen>
    </iframe>
</div>

<i>Use double curly braces in ToolJet App-Builder to write custom JavaScript or access query results, component-related values and other variables.</i>

<!-- <div style={{textAlign: 'center', marginTop:'15px', marginBottom:`15px`}}>
    <img style={{padding: '10px', }} className="screenshot-full" src="/img/quickstart-guide/table-with-data-v2.png" alt="Table With Data" />
</div> -->

Now the Table component is filled with the data returned by the `getEmployees` query. 

### Add Employee Details

Next step is to create a way to add employee details. Click on the **+ Add** button in the query panel and create another query.  

- Select **ToolJet DataBase** as the data source
- Select `employees` as Table name and **Create row** as Operations
- Rename the query to `addEmployees`
- Click on **+ Add Column** button and add all the required columns.  
- For the **email** column key, enter the below code:

```js
{{components.table1.newRows[0].email}}
```

Similarly, use the below code for the firstname, lastname and department keys and frame the remaining keys in the same format.

```js
{{components.table1.newRows[0].firstname}}
{{components.table1.newRows[0].lastname}}
{{components.table1.newRows[0].department}}
...
```

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px', marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/add-employee-query-v2.png" alt="Add Employee Query" />
</div>

The data needs to reload once this query runs since we want the Table component to be populated with the new data. 

- Scroll down and click on **+ New Event Handler**
- Select **Query Success** for the Event dropdown and **Run Query** for the Action dropdown
- For the Query dropdown, select the previously created query - `getEmployees`

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px', marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/reload-data-v2.png" alt="Reload Table Data" />
</div>

Now this query is ready, and needs to be linked to a button for execution. 

In the bottom-right corner of the Table component, there is a `+` button to add a new row. The query can be run on click of this button: 
- Click on the **Table** component, navigate to **Events** in its configuration panel and add a new event handler 
- Select **Add new rows** as the event, **Run Query** as the Action 
- Select `addEmployee` as the Query

<!-- <div style={{textAlign: 'center'}}>
    <img style={{padding: '10px', marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/add-action-button-v2.png" alt="Add Employee Query" />
</div> -->

<div style={{padding: '10px', marginBottom: '15px'}}>
    <iframe
        className="screenshot-full"
        src="https://www.floik.com/embed/e4f537b5-7b36-4760-9a52-caefc659a90b/ca0842cf-1c2c-43b9-95bb-bd68538f6797-flo.html"
        style={{width: '100%', height: '450px'}}
        width="100%"
        height="450px"
        frameborder="0"
        allowfullscreen="allowfullscreen"
        webkitallowfullscreen
        mozallowfullscreen
        allowfullscreen>
    </iframe>
</div>

Now if you click on the `+` button, enter the employee data and click on Save. The `addEmployee` query will run and the data will be written to the `employees` table in the ToolJet Database.

<div style={{padding: '10px', marginBottom: '15px'}}>
    <iframe
        className="screenshot-full"
        src="https://www.floik.com/embed/e4f537b5-7b36-4760-9a52-caefc659a90b/a6cd9cdc-592e-4dba-98b8-677a03c44b5c-flo.html"
        style={{width: '100%', height: '450px'}}
        width="100%"
        height="450px"
        frameborder="0"
        allowfullscreen="allowfullscreen"
        webkitallowfullscreen
        mozallowfullscreen
        allowfullscreen>
    </iframe>
</div>


<!-- <div style={{textAlign: 'center'}}>
    <img style={{padding: '10px', marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/add-action-dialog-v2.png" alt="Add Employee Query" />
</div> -->

### Preview And Share

The **Share** and **Preview** icons are on the top-right of the App-Builder. 

- Click on the Preview on the top-right of app builder to preview the current version of the app.
- Click on the Promote button to promote the application to a different environment.
- Share option allows you to share the the application with other users or you can also make the app public and anyone with the URL will be able to use the app.

<div style={{padding: '10px', marginBottom: '15px'}}>
    <iframe
        className="screenshot-full"
        src="https://www.floik.com/embed/e4f537b5-7b36-4760-9a52-caefc659a90b/f85b61b2-9800-4eb3-9f2a-39ac62fb7858-flo.html"
        style={{width: '100%', height: '450px'}}
        width="100%"
        height="450px"
        frameborder="0"
        allowfullscreen="allowfullscreen"
        webkitallowfullscreen
        mozallowfullscreen
        allowfullscreen>
    </iframe>
</div>


Congratulations! You've successfully built a employee directory application and, in the process, covered the essential fundamentals of ToolJet. 

To learn more, checkout the following ToolJet Concepts:

**[What Are Components](/docs/tooljet-concepts/what-are-components.md)** <br/>
**[Styling Components](/docs/tooljet-concepts/styling-components.md)** <br/>



</div>
