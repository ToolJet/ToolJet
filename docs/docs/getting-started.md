---
id: getting-started
title: Getting Started
description: ToolJet is an low-code framework to build and deploy custom internal tools. ToolJet can connect to your data sources such as databases ( PostgreSQL, MongoDB, MS SQL Server, Snowflake, , BigQuery, etc ), API/GraphQL endpoints, SaaS tools ( Airtable, Stripe, Google Sheets, etc ) and cloud object storage services ( AWS S3, Google Cloud Storage and Minio ). Once the data sources are connected, ToolJet can run queries on these data sources to fetch and update data. The data fetched from data sources can be visualised and modified using the UI widgets such as tables, charts, forms, etc.
slug: /
---

# Welcome to ToolJet Docs

<div style={{marginLeft:"10%", marginRight:"10%"}}>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## What is ToolJet

ToolJet is a **low-code framework** designed for the rapid development and deployment of custom internal tools. Featuring a **drag-and-drop app-builder** with 45 pre-configured components, ToolJet allows developers to construct complex UIs within minutes.

ToolJet connects to a majority of data sources and APIs, streamlines query management with its low-code query builder, and enables developers to easily manage user access via a group-based permission system.



<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

</div>

## Quickstart Guide

This Quickstart Guide will walk you through the process of creating an **Employee Directory Application** in minutes using ToolJet. You'll set up a database table, create your first ToolJet app, fetch data, and bind the data to the UI. We'll follow the below steps to create the application:

**[1. Create Database Table](#1-create-database-table/)**  <br/>
**[2. Create Your First ToolJet App](#2-create-your-first-tooljet-app)**  <br/>
**[3. Integrate Data](#3-integrate-data)** <br/>
**[4. Bind Data To UI](#4-bind-data-to-ui)** <br/>
**[5. Add Data To The Database](#5-add-data-to-the-database)** <br/>
**[6. Preview And Share](#6-preview-and-share)** <br/>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

</div>

### 1. Create Database Table

Start by setting up a table in ToolJet's built-in **[database](/docs/tooljet-database)**. Name this table `employees` and populate it with sample data. Your table should have the following columns: firstname, lastname, email, phone, department, position, joining and status. 

<div style={{textAlign: 'center'}}>
    <img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/create-database-v2.png" alt="Database Preview" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### 2. Create Your First ToolJet App

Click on the **Dashboard** button on the sidebar and click on the **Create new app** button. A new application will be created with an empty canvas. 

Rename the application to `Employee Directory`. 

<div style={{marginBottom:'15px', height:'400px'}}>
    <iframe
        className="screenshot-full"
        src="https://www.floik.com/embed/e4f537b5-7b36-4760-9a52-caefc659a90b/0da4ba45-ffb7-4adb-84c3-fb6794abc98f-flo.html"
        style={{width: '100%', height: '100%'}}
        frameborder="0"
        allowfullscreen="allowfullscreen"
        webkitallowfullscreen
        mozallowfullscreen
        allowfullscreen>
    </iframe>
</div>

Click and drag a **[Table](/docs/widgets/table)** component to the canvas. 

<div style={{marginBottom:'15px', height:'400px'}}>
    <iframe
        className="screenshot-full"
        src="https://www.floik.com/embed/e4f537b5-7b36-4760-9a52-caefc659a90b/cb4c26a4-95ac-4c19-877b-f17e9a602591-flo.html"
        style={{width: '100%', height: '100%'}}
        frameborder="0"
        allowfullscreen="allowfullscreen"
        webkitallowfullscreen
        mozallowfullscreen
        allowfullscreen>
    </iframe>
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### 3. Integrate Data

To fetch data in the App-Builder:
- Click on **Add** in the **[query panel](/docs/app-builder/query-panel.md)**, select **ToolJet Database**
- Choose `employees` as Table name, **List rows** as Operations.
- Click **Run** to fetch data, rename query to `getEmployees`.
- Toggle **Run this query on application load?** to automatically run the query when the app starts.


<div style={{marginBottom:'15px', height:'400px'}}>
    <iframe
        className="screenshot-full"
        src="https://www.floik.com/embed/e4f537b5-7b36-4760-9a52-caefc659a90b/127cfcf4-f31d-408b-bba5-74b4c8c210ff-flo.html"
        style={{width: '100%', height: '100%'}}
        frameborder="0"
        allowfullscreen="allowfullscreen"
        webkitallowfullscreen
        mozallowfullscreen
        allowfullscreen>
    </iframe>
</div>

Click on the **Preview** button to see a preview of the fetched data. 

<div style={{marginBottom:'15px', height:'400px'}}>
    <iframe
        className="screenshot-full"
        src="https://www.floik.com/embed/e4f537b5-7b36-4760-9a52-caefc659a90b/a87fe800-2abc-444c-b369-3b3aad23bba0-flo.html"
        style={{width: '100%', height: '100%'}}
        frameborder="0"
        allowfullscreen="allowfullscreen"
        webkitallowfullscreen
        mozallowfullscreen
        allowfullscreen>
    </iframe>
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### 4. Bind Data To UI

Click on the Table component to open its configuration panel on the right. Under the **Data** property, paste the below code:

```js
{{queries.getEmployees.data}}
```
<div style={{marginBottom:'15px', height:'400px'}}>
    <iframe
        className="screenshot-full"
        src="https://www.floik.com/embed/e4f537b5-7b36-4760-9a52-caefc659a90b/bd92e2cb-7bec-4e7e-ad97-0db5191e3bf9-flo.html"
        style={{width: '100%', height: '100%'}}
        frameborder="0"
        allowfullscreen="allowfullscreen"
        webkitallowfullscreen
        mozallowfullscreen
        allowfullscreen>
    </iframe>
</div>

Now the Table component is filled with the data returned by the `getEmployees` query. 

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### 5. Add Data To The Database

Next step is to create a way to add data for new employees. 

- Click on **Add** in the query panel, select **ToolJet Database**
- Select `employees` for Table name, **Create row** for Operations.
- Rename query to `addEmployees`.
- Click **+ Add Column** to add required columns.
- Enter code below for **email** and **firstname** column keys:

```js
{{components.table1.newRows[0].email}}
{{components.table1.newRows[0].firstname}}
...
```

Frame all the remaining keys in the same format.

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px', marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/add-employee-query-v2.png" alt="Add Employee Query" />
</div>

Let's continue working on this query. The data needs to reload once this query runs since we want the Table component to be populated with the new data. Follow the below steps to run the `getEmployees` query after the `addEmployees` query is completed. 

- Scroll down and click on **New Event Handler**
- Select **Query Success** as the Event and **Run Query** as the Action
- For the Query dropdown, select the previously created query - `getEmployees`

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px', marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/reload-data-v2.png" alt="Reload Table Data" />
</div>

Let's link this query to a button for adding new employee data.

In the bottom-right corner of the Table component, there is a `+`/Add new row button. To run this query on click of this button: 
- Click on the Table component, go to **Events** in configuration panel, add a new event handler.
- Choose **Add new rows** for event, **Run Query** for Action.
- Select `addEmployee` for the Query.

<div style={{marginBottom:'15px', height:'400px'}}>
    <iframe
        className="screenshot-full"
        src="https://www.floik.com/embed/e4f537b5-7b36-4760-9a52-caefc659a90b/ca0842cf-1c2c-43b9-95bb-bd68538f6797-flo.html"
        style={{width: '100%', height: '100%'}}
        frameborder="0"
        allowfullscreen="allowfullscreen"
        webkitallowfullscreen
        mozallowfullscreen
        allowfullscreen>
    </iframe>
</div>

Now if you click on the `+`/Add new row button, enter the employee data and click on Save. The `addEmployee` query will run and the data will be written to the `employees` table in the ToolJet Database.

<div style={{marginBottom:'15px', height:'400px'}}>
    <iframe
        className="screenshot-full"
        src="https://www.floik.com/embed/e4f537b5-7b36-4760-9a52-caefc659a90b/a6cd9cdc-592e-4dba-98b8-677a03c44b5c-flo.html"
        style={{width: '100%', height: '100%'}}
        frameborder="0"
        allowfullscreen="allowfullscreen"
        webkitallowfullscreen
        mozallowfullscreen
        allowfullscreen>
    </iframe>
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### 6. Preview And Share

The **Share**, **Preview** and **Promote** icons are on the top-right of the App-Builder. 

- Click on the Preview on the top-right of app builder to preview the current version of the app.
- Click on the Promote button to promote the application to a different environment.
- Share option allows you to share the the application with other users or you can also make the app public and anyone with the URL will be able to use the app.

<div style={{textAlign: 'center'}}>
    <img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/preview-share-v2.png" alt="Preview And Share" />
</div>

Congratulations! You've successfully built a employee directory application and, in the process, covered the fundamentals of ToolJet. 

Continue exploring the docs to learn more.

</div>


</div>