---
id: getting-started
title: Getting Started
description: ToolJet is an low-code framework to build and deploy custom internal tools. ToolJet can connect to your data sources such as databases ( PostgreSQL, MongoDB, MS SQL Server, Snowflake, , BigQuery, etc ), API/GraphQL endpoints, SaaS tools ( Airtable, Stripe, Google Sheets, etc ) and cloud object storage services ( AWS S3, Google Cloud Storage and Minio ). Once the data sources are connected, ToolJet can run queries on these data sources to fetch and update data. The data fetched from data sources can be visualised and modified using the UI widgets such as tables, charts, forms, etc.
slug: /
---

# Welcome to ToolJet Docs

<div style={{marginLeft:"7%", marginRight:"7%"}}>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## What is ToolJet

ToolJet is a low-code platform that enables developers rapidly build and deploy custom internal tools. It has a drag-and-drop app builder with 45 pre-built components, so developers can create complex applications in minutes. ToolJet also connects to most popular data sources and APIs out of the box, and it has a group-based permission system for easy user access management. ToolJet also comes with lot of other features, but for now let’s build a basic ToolJet app.



<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

</div>

## Getting Started


This Getting Started Guide will show you how to create an employee directory application in minutes using ToolJet. This app will let you track and update employee information with a beautiful user interface. Here are the step by step instructions:

**[1. Create Your First Application](#1-create-your-first-application)**  <br/>
**[2. Create Employee Database](#2-create-employee-database)**  <br/>
**[3. Integrate Data](#3-integrate-data)** <br/>
**[4. List Employees](#4-list-employees)** <br/>
**[5. Add New Employee](#5-add-new-employee)** <br/>
**[6. Preview, Release And Share](#6-preview-release-and-share)** <br/>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

</div>

### 1. Create Your First Application

Once you have created an account with ToolJet, go to the dashboard and click on the create new app button. Name your application as "Employee Directory". You are ready to design your application now.

<div style={{marginBottom:'15px', height:'429px'}}>
    <iframe
        className="screenshot-full"
        src="https://www.floik.com/embed/e4f537b5-7b36-4760-9a52-caefc659a90b/b4059c71-812d-407b-9d4a-fc598eac6260-flo.html"
        style={{width: '100%', height: '100%'}}
        frameborder="0"
        allowfullscreen="allowfullscreen"
        webkitallowfullscreen
        mozallowfullscreen
        allowfullscreen>
    </iframe>
</div>

Click and drag a **[Table](/docs/widgets/table)** component to the canvas. 

<div style={{marginBottom:'15px', height:'429px'}}>
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

### 2. Create Employee Database

Now, create a new table in ToolJet’s Database to store employee records. Name the table employees and add the following columns: `firstname`, `lastname`, `email`, `phone`, `department`, `position`, `joining`, and `status`. Also, add few employee records in the table.

<div style={{textAlign: 'center'}}>
    <img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/create-database-v2.png" alt="Database Preview" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>


### 3. Integrate Data

To display employees in the application, we first need to fetch data from database using a query:
- Click on the Add button in the **[Query Panel](/docs/app-builder/query-panel.md)**, select ToolJet Database
- Rename the query to `getEmployees`
- Choose `employees` as Table name, List rows as Operations
- Toggle Run this query on application load? to automatically run the query when the app starts
- Click on Run to fetch data

<div style={{marginBottom:'15px', height:'429px'}}>
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

Click on the Preview button to see a preview of the fetched data. 

<div style={{marginBottom:'15px', height:'429px'}}>
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

### 4. List Employees

Now, we have to bind the data returned by `getEmployees` query above with the table created in Step 1. Click on the table component to open its configuration panel on the right. Under the `Data` property, paste the below code:

```js
{{queries.getEmployees.data}}
```
<div style={{marginBottom:'15px', height:'429px'}}>
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

### 5. Add New Employee

Next step is to create a way to add data for new employees. 

- Click on Add in the query panel, select ToolJet Database
- Select `employees` as Table name, Create row as Operations
- Rename the query to `addEmployee`
- Click Add Column to add required columns
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

Let's continue working on this query. The data needs to reload once this query runs since we want the Table component to be populated with the updated data. Follow the below steps to run the `getEmployees` query after the `addEmployee` query is completed. 

- Scroll down and click on New Event Handler
- Select Query Success as Event and Run Query as Action
- Select `getEmployees` as Query

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px', marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/reload-data-v2.png" alt="Reload Table Data" />
</div>

We are ready with a query that will allow us to add new employee data. Let's link this query to a button.

In the bottom-right corner of the Table component, there is a `+`/Add new row button. Follow the below steps to run the `addEmployee` query on click of the `+`/Add new row button: 
- Click on the Table component, go to Events in configuration panel, add a New event handler
- Choose Add new rows as Event, Run Query as Action
- Select `addEmployee` as the Query

<div style={{marginBottom:'15px', height:'429px'}}>
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

<div style={{marginBottom:'15px', height:'429px'}}>
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

### 6. Preview, Release And Share

The **Share**, **Preview** and **Promote** icons are on the top-right of the App-Builder. 

The preview, release and share buttons are on the top-right of the App-Builder.
- Click on the Preview on the top-right of app builder to review how your application is coming along while development.
- Once the development is done and you are ready to use the application, click on Release button to deploy the app.
- Finally, share your application with your end users using Share button


<div style={{textAlign: 'center'}}>
    <img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/preview-share-v2.png" alt="Preview And Share" />
</div>

Congratulations! You've successfully built a employee directory application and, in the process, covered the fundamentals of ToolJet. 

To learn more about how ToolJet works, explore the subjects covered in **[ToolJet Concepts](/docs/tooljet-concepts/what-are-components.md)**.

</div>


</div>