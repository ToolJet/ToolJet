---
id: getting-started
title: Getting Started
description: ToolJet is an open-source low-code framework to build and deploy custom internal tools. ToolJet can connect to your data sources such as databases ( PostgreSQL, MongoDB, MS SQL Server, Snowflake, , BigQuery, etc ), API/GraphQL endpoints, SaaS tools ( Airtable, Stripe, Google Sheets, etc ) and cloud object storage services ( AWS S3, Google Cloud Storage and Minio ). Once the data sources are connected, ToolJet can run queries on these data sources to fetch and update data. The data fetched from data sources can be visualised and modified using the UI widgets such as tables, charts, forms, etc.
slug: /
---

# Welcome to ToolJet Docs

---

<div style={{marginLeft: "40px", marginRight: "40px"}}>


## What is ToolJet

ToolJet is an **open-source low-code framework** to build and deploy custom internal tools. With ToolJet's App-Builder, you can build applications in minutes using low-code, pre-built components and easy integration options. 

## How ToolJet works

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/getting_started/howtjworks.webp" width="100%" height="100%" alt="How ToolJet works flow" />

</div>

**With ToolJet, you can build apps in 3 simple steps:**

1. **Connect to datasources:** Connect to the ToolJet's built-in database **[ToolJet DB](/docs/tooljet-database)** (built on top of PostgreSQL) or your existing data sources such as PostgreSQL, MySQL, Firestore, Stripe, Google Sheets, API endpoints, etc.

2. **Build queries:** ToolJet comes with query builders for all supported data sources. You can also write **[Javascript](/docs/data-sources/run-js)** or **[Python](/docs/data-sources/run-py)** queries or use **[Transformations](/docs/tutorial/transformations)** to transform the query response.

3. **Build User Interface:** ToolJet's visual **[App Builder](/docs/app-builder/overview)** allows you to drag and drop components ( Eg: tables, charts, forms, etc ) to quickly build the user-interface of the apps. Components have events such as `on click`, `on row selected`, `on page changed`, etc. ToolJet apps can be used in light and dark mode.

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

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px', marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/app-builder-overview-v2.png" alt="App-Builder Overview" />
</div>

Rename the application to *Employee Directory*. On the right side, you'll find the **Component Library** with a list of ready-to-use components. Simply drag and drop these onto the canvas to build your app. For handling data, use the **Query Panel** located at the bottom of the screen.

Click and drag a **[Table](/docs/widgets/table)** component to the canvas. 

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px', marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/add-a-table-v2.png" alt="Drag and Drop Table" />
</div>

<i>On clicking on the Table component or any other component on the canvas, its configuration panel will appear on the right. You can customize the functionality and styling of the components in the configuration panel.</i>
<br/>
<br/>

### Integrate Data

To fetch data in the App-Builder:
- Select **ToolJet DB** in the Query Panel 
- Select *employees* as Table name and **List rows** as Operations
- Click on the **Run** button in the query panel to fetch the data
- Rename the query to *getEmployees*
- Enable the **Run this query on application load?** toggle to automatically run this query when the application starts

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px', marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/first-query-v2.png" alt="Fetch Data" />
</div>

Click on the **Preview** button to see a preview of the fetched data. 

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px', marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/query-preview-v2.png" alt="Query Preview" />
</div>

### Bind Data To UI

Click on the **Table** component to open its configuration panel on the right. Under the **Data** property, paste the below code:

```js
{{queries.getEmployees.data}}
```

<i>Use double curly braces in ToolJet App-Builder to write custom JavaScript or access query results, component-related values and other variables.</i>

<div style={{textAlign: 'center', marginTop:'15px', marginBottom:`15px`}}>
    <img style={{padding: '10px', }} className="screenshot-full" src="/img/quickstart-guide/table-with-data-v2.png" alt="Table With Data" />
</div>

Now the Table component is filled with the data returned by the *getEmployees* query. 

### Add Employee Details

Next step is to create a way to add employee details. Click on the **+ Add** button in the query panel and create another query.  

- Select **ToolJet DataBase** as the data source
- Select *employees* as Table name and **Create row** as Operations
- Rename the query to *addEmployees*
- Click on **+ Add Column** button and add all the required columns.  
- For the **email** column key, enter the below code:

```js
{{components.table1.newRows[0].email}}
```

Similarly, use the below code for the rest of the keys.

```js
{{components.table1.newRows[0].firstname}}
{{components.table1.newRows[0].lastname}}
{{components.table1.newRows[0].department}}
{{components.table1.newRows[0].position}}
{{components.table1.newRows[0].joining}}
{{components.table1.newRows[0].status}}
```

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px', marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/add-employee-query-v2.png" alt="Add Employee Query" />
</div>

The data needs to reload once this query runs since we want the Table component to be populated with the new data. 

- Scroll down and click on **+ New Event Handler**
- Select **Query Success** for the Event dropdown and **Run Query** for the Action dropdown
- For the Query dropdown, select the previously created query - *getEmployees*

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px', marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/reload-data-v2.png" alt="Reload Table Data" />
</div>

Now this query is ready, and needs to be linked to a button for execution. 

In the bottom-right corner of the Table component, there is a `+` button to add a new row. The query can be run on click of this button: 
- Click on the **Table** component, navigate to **Events** in its configuration panel and add a new event handler 
- Select **Add new rows** as the event, **Run Query** as the Action 
- Select *addEmployee* as the Query

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px', marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/add-action-button-v2.png" alt="Add Employee Query" />
</div>

Now if you click on the `+` button, enter the employee data and click on Save. The *addEmployee* query will run and the data will be written to the *employees* table in the ToolJet Database.

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px', marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/add-action-dialog-v2.png" alt="Add Employee Query" />
</div>

### Preview And Share

The **Share** and **Preview** icons are on the top-right of the App-Builder. 

- Click on the Preview on the top-right of app builder to preview the current version of the app.
- Click on the Release button to publish the currently opened version of the app and push the changes to production.
- Share option allows you to share the released version of the application with other users or you can also make the app public and anyone with the URL will be able to use the app.

Congratulations! You've successfully built a employee directory application and, in the process, covered the essential fundamentals of ToolJet. 

## What Can I Do With ToolJet

If you are building internal tool for your organization, here are few tutorials of sample use-cases for you to get started: 

- **[Build a Feature Request Management App](https://youtu.be/c2sbFTDUMzs)**
- **[Build a Ticket Triaging App with Baserow and ToolJet](https://blog.tooljet.com/build-a-ticket-triaging-app-with-baserow-and-tooljet/)**
- **[Building a MinIO file explorer app](https://blog.tooljet.com/building-a-minio-file-explorer-app-in-30-minutes/)**
- **[Building a Google Cloud Storage (GCS) file explorer app](https://blog.tooljet.com/build-internal-file-explorer-application-using-google-cloud-storage-gcs-and-tooljet/)**
- **[Build an AWS S3 file explorer app](https://blog.tooljet.com/building-an-app-to-view-and-upload-files-in-aws-s3-bucket/)**
- **[Build Stripe Refund App](https://blog.tooljet.com/build-a-stripe-refund-tool-using-low-code/)**
- **[Build a WhatsApp CRM](https://blog.tooljet.com/build-a-whatsapp-crm-using-tooljet-within-10-mins/)**
- **[Build a cryptocurrency dashboard](https://blog.tooljet.com/how-to-build-a-cryptocurrency-dashboard-in-10-minutes/)**
- **[Build a Redis GUI](https://blog.tooljet.com/building-a-redis-gui-using-tooljet-in-5-minutes/)**

Find more Tutorials on our **[Blog](https://blog.tooljet.com/)**.

## For ToolJet Contributors

To contribute to ToolJet code, plugins, and documentation, refer to our **[Contributing Guide](/docs/category/contributing-guide)**.

[![GitHub contributors](https://img.shields.io/github/contributors/tooljet/tooljet)](https://github.com/ToolJet/ToolJet/contributors)
[![GitHub issues](https://img.shields.io/github/issues/ToolJet/ToolJet)](https://github.com/ToolJet/ToolJet/issues)
[![GitHub stars](https://img.shields.io/github/stars/ToolJet/ToolJet)](https://github.com/ToolJet/ToolJet/stargazers)
[![GitHub license](https://img.shields.io/github/license/ToolJet/ToolJet)](https://github.com/ToolJet/ToolJet)

<a href="https://github.com/tooljet/tooljet/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=tooljet/tooljet&max=360&columns=20" width="100%" height="100%" alt="contributors" />
</a>

## Help and Support
- We have extensively documented the features of ToolJet, but in case you are stuck, please feel free to e-mail us at **hello@tooljet.com**
- If you are using ToolJet cloud, click on the chat icon at the bottom-left corner for instant help.
- If you have found a bug, please create a **[GitHub issue](https://github.com/ToolJet/ToolJet/issues)** for the same.
- Feel free to join our highly active **[Slack Community](https://www.tooljet.com/slack)**.

</div>
