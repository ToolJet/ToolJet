---
id: getting-started
title: Getting Started
description: ToolJet is an open-source low-code framework to build and deploy custom internal tools. ToolJet can connect to your data sources such as databases ( PostgreSQL, MongoDB, MS SQL Server, Snowflake, , BigQuery, etc ), API/GraphQL endpoints, SaaS tools ( Airtable, Stripe, Google Sheets, etc ) and cloud object storage services ( AWS S3, Google Cloud Storage and Minio ). Once the data sources are connected, ToolJet can run queries on these data sources to fetch and update data. The data fetched from data sources can be visualised and modified using the UI widgets such as tables, charts, forms, etc.
slug: /
---

# Welcome to ToolJet Docs

---

## What is ToolJet

ToolJet is an **open-source low-code framework** to build and deploy custom internal tools. 

ToolJet ships with its built-in database called **[ToolJet DB](/docs/tooljet-database)** (built on top of PostgreSQL). You can also connect to the **external data sources** such as **databases** ( PostgreSQL, MongoDB, MS SQL Server, Snowflake, , BigQuery, etc ), **API/GraphQL endpoints**, **SaaS tools** ( Airtable, Stripe, Google Sheets, etc ) and **cloud object storage services** ( AWS S3, Google Cloud Storage and Minio ). 

Once the data sources are connected, ToolJet can run **queries** on these data sources to fetch and update data. The data fetched from data sources can be **visualised and modified** using the UI widgets such as tables, charts, forms, etc. You can also use **[Javascript](/docs/data-sources/run-js)** or **[Python](/docs/data-sources/run-py)** queries for writing business logic or interacting with the user interface of the application.

<img src="/img/v2-beta/getting_started/intro.webp" alt="Getting started Demo app" width="100%" height="100%" loading="eager" />

<!-- Why ToolJet section is commented out.

## Why ToolJet

When you're building an internal tool, there are a lot of tools and frameworks available. But with ToolJet, you can save developers' hours by allowing them to build full-stack business applications in minutes.

- **Open-Source**: ToolJet is Open-Source, you can go through the ToolJet codebase on **[GitHub](https://github.com/ToolJet/ToolJet)** or you can **deploy ToolJet on your infrastructure**.
- **Full-stack platform**: ToolJet has a **[built-in database](/docs/tooljet-database)**, **[External datasources](/docs/data-sources/airtable)**, and a frontend builder so you can build a full-stack app right inside it. ToolJet comes with Custom Component for importing your own **react components** and the ability to write custom **JavaScript** and **Python** code.
- **Extensible**: Didn't find the **component** or **datasource** that fit your application's requirements? You can always build your own **component** and **datasource** using our **plugin development kit**.
- **Powerful Apps**: With ToolJet, developers can quickly build powerful custom internal tools for their Support, Operations and Sales teams. Build CRUD apps, Dashboards, Admin Panels, CRMs and much more.

-->

## How ToolJet works

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/getting_started/howtjworks.webp" width="100%" height="100%" alt="How ToolJet works flow" />

</div>

**With ToolJet, you can build apps in 3 simple steps:**

1. **Connect to datasources:** Connect to the ToolJet's built-in database **[ToolJet DB](/docs/tooljet-database)** (built on top of PostgreSQL) or your existing data sources such as PostgreSQL, MySQL, Firestore, Stripe, Google Sheets, API endpoints, etc.

2. **Build queries:** ToolJet comes with query builders for all supported data sources. You can also write **[Javascript](/docs/data-sources/run-js)** or **[Python](/docs/data-sources/run-py)** queries or use **[Transformations](/docs/tutorial/transformations)** to transform the query response.

3. **Build User Interface:** ToolJet's visual **[App Builder](/docs/app-builder/overview)** allows you to drag and drop components ( Eg: tables, charts, forms, etc ) to quickly build the user-interface of the apps. Components have events such as `on click`, `on row selected`, `on page changed`, etc. ToolJet apps can be used in light and dark mode.

    :::tip
    ToolJet binds together the datasources, queries and components to convert business logic into custom applications. You can also secure your ToolJet apps with **[Group & Permissions](/docs/org-management/permissions)** and **[Audit Logging](/docs/Enterprise/audit_logs)**.
    :::
## Choose your ToolJet

There are a few different ways to set up ToolJet depending on how you intend to use it:

- **[ToolJet Cloud](https://www.tooljet.com)**: hosted solution, just sign-up for free and start building apps in seconds.
- **[Deploy on premise](/docs/setup/)**: recommended method for production or customized use cases. You'll find Server setup guides for popular platforms (AWS, GCP, Kubernetes etc) and one-click deployment guides (Heroku, DigitalOcean etc).
- **[Try ToolJet on local machine](/docs/setup/try-tooljet/)**: the fastest way to try out ToolJet on your computer using docker.

:::info
- Data security is top priority at ToolJet, read about our **[data security here](/docs/security)**.
:::

<!-- ## The very quick quickstart

Let's say you're an eCommerce company and your **Customer Support/Operations** team need a **Support Tool/Admin** panel for managing the orders, updating inventory, and track revenue and metrics. This quickstart will guide you through building your first custom internal tool in less than 5 minutes.

You will:
- **[Create a database](#create-a-tooljet-database)**
- **[Create a new application](#create-a-new-application)**
- **[Build the UI](#build-the-ui)**
- **[Build queries and bind data to UI](#build-queries-and-bind-data-to-ui)**
- **[Preview, Release and Share app](#preview-release-and-share-app)**

:::tip
Before getting into the quickstart, Sign up and create your account on **[ToolJet](https:///www.tooljet.com)**.
::: 

### Create a database

1. Navigate to **ToolJet DB Editor** from the left sidebar on the dashboard
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/v2-beta/getting_started/quickstart/compressed/tooljetdbeditor.webp" width="100%" height="100%" alt="Getting started: Quickstart" />

    </div>

2. Click on **Create New Table** button, enter **Table name** and **Add columns** from the drawer that slides from the right. Click on **Create** to add the table.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/v2-beta/getting_started/quickstart/compressed/createnewtable.webp" width="100%" height="100%" alt="Getting started: Quickstart" />

    </div>

3. Once the table is created, click on the **Add new row** button to add the data to the table and click **Create**.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/v2-beta/getting_started/quickstart/compressed/addnewrow.webp" width="100%" height="100%" alt="Getting started: Quickstart" />

    </div>

:::info
Learn more about the **[ToolJet Database here](/docs/tooljet-database)**
:::

### Create a new application

1. To create a new ToolJet application, go to the **Dashboard** -> **Create new application**. 

    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/v2-beta/getting_started/quickstart/compressed/createnewapplication.webp" width="100%" height="100%" alt="Getting started: Quickstart" />

    </div>

    :::info
    You can also use the existing UI **templates** for your application or **import** an application to your workspace.
    :::

2. When you click on create new app the **App-builder** will open up. You can rename your application from `untitled` to **Support Tool** from the top left of app-builder.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/v2-beta/getting_started/quickstart/compressed/appbuilder.webp" width="100%" height="100%" alt="Getting started: Quickstart" />

    </div>

### Build the UI

1. Let's build the UI of the application by dragging and dropping the components on the canvas.
2. To build the UI, we will use:
    1. **Table** for displaying the customers data 
    2. **Text** components for the Title and description of the app as the header
    3. **Text Input** component for getting product name input from the user
    4. **Number Input** component for getting product quantity and price input from the user
    5. **Button** component that will be used to trigger the query for inserting a row in the database using the button's **OnClick** event handler
    
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/v2-beta/getting_started/quickstart/compressed/buildingui.webp" width="100%" height="100%" alt="Getting started: Quickstart" />

    </div>

:::info
ToolJet application's User interface is constructed using Components like Tables, Forms, Charts, or Buttons etc. Check **[Components Catalog](/docs/widgets/overview)** to learn more.
:::

### Build queries and bind data to UI

1. We can add a new datasource from the **[Global datasources](/docs/data-sources/overview)** page from the dashboard but since we are using **ToolJet Database** we don't need to add any external datasource. Go to the **Query Panel and select ToolJet Database**
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/v2-beta/getting_started/quickstart/compressed/tooljetdb.webp" width="100%" height="100%" alt="Getting started: Quickstart" />

    </div>

    :::info
    ToolJet can connect to several databases, APIs and external services to fetch and modify data. Check **[Datasource Catalog](/docs/data-sources/overview)** to learn more.
    :::

2. Choose a **Table** from the dropdown, Select the **List rows** option from the **Operation** dropdown, You can leave other query parameters. Scroll down and enable **Run this query on application load** - this will trigger the query when the app is loaded. 

3. Click on **Create** to create the query and then click **Run** to trigger the query and get response. You can also check the query response by clicking **Preview** button without firing the query.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/v2-beta/getting_started/quickstart/compressed/createquery.webp" width="100%" height="100%" alt="Getting started: Quickstart" />

    </div>

4. Go to the **Table properties** by clicking on the component handle and bind the data returned by the query in the **Table data** property. When building apps in ToolJet anything inside `{{}}` is JavaScript and we javascript dot notation to get the data from query and populate the table using **{{queries.tooljetdb1.data}}**. The table will be auto-populated once the table data is entered.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/v2-beta/getting_started/quickstart/compressed/tabledata.webp" width="100%" height="100%" alt="Getting started: Quickstart" />

    </div>

5. Let's create another query that will get the data from the **input fields** and will add a new row in the tooljet database. **Create New Query** -> **Select Table (Customers)** -> **Select Operation (Create row)** -> add the following columns with the respective value:
    1. **id** - `{{components.textinput1.value}}`
    2. **quantity** - `{{components.numberinput1.value}}`
    3. **price** - `{{components.numberinput2.value}}`
    4. **created_at** - `{{moment().format("DD/MM/YYYY hh:mm A")}}` (We are using **momentjs library** to get the current date from the system rather than getting input by the user )

    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/v2-beta/getting_started/quickstart/compressed/selecttablecustomers.webp" width="100%" height="100%" alt="Getting started: Quickstart" />

    </div>

    :::tip
    You can also add event handler to this query for **On Success** event to run the `tooljetdb1` query that populates the table, so that whenever this is successful the table is refreshed.
    :::

6. Now, let's bind this query to the **Add Product** button. Click on the button handle to open its properties, **Add an handler** -> **Select Event (On Click)** -> **Select Action (Run Query)** -> **Select Query (tooljetdb2)**. 
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/v2-beta/getting_started/quickstart/compressed/addproductbutton.webp" width="100%" height="100%" alt="Getting started: Quickstart" />

    </div>

:::info
- You can manipulate the data returned by the queries using **[Transformations](/docs/tutorial/transformations)**
- You can also **[Run JavaScript code](/docs/data-sources/run-js)** or **[Run Python code](/docs/data-sources/run-py)** to perform custom behavior inside ToolJet
:::

### Preview, Release and Share app

1. Click on the **Preview** on the top-right of app builder to immediately check the currently opened version of the app in production. 
2. Click on the  **Release** button to publish the currently opened version of the app and push the changes to production.
3. **Share** option allows you to share the **released version** of the application with other users or you can also make the app **public** and anyone with the URL will be able to use the app.

:::tip
You can control how much access to users have to your ToolJet apps and resources using **[Org Management](/docs/tutorial/manage-users-groups)**.
::: -->

## Quickstart Guide

We will be building a **Time Tracking Application** that will allow end users to record their daily working hours. The multi-page application will have a home page that will give a basic overview of all the pending and completed tasks for the month. The second page will display all the time tracker data related to the logged in user, along with the option to add new data or delete existing entries.

## Create a Database Table 

We'll first create a table in ToolJet's built-in database. Navigate to the **database** tab from the left sidebar. 
Click on the **Create New Table** button on the top-left. A drawer will slide from the right to configure the database table propertries. An **id** field will appear by default and 

In the **Table name** input field, enter *timeTracker*. Click on the add more columns button and add **employee** as the name and select **varchar** as the type. The **Default** field allows you to enter a default value that will be used if there is no input provided by the end user. We will add 4 more columns to our table:
taskname(type:varchar, default:null),
duration(type:integer, default:null),
dateoftask(type:varchar, default:null) and
taskdescription(type:varchar, default:null). 


## Create UI for Home Page

We'll now go ahead and build our application using the **ToolJet App Builder**. Click on the **Dashboard** button on the sidebar and click on the **Create new app** button. You'll be taken to a new application. You'll now see a an empty canvas with a **Component Library** on the right and a **Query Panel** at the bottom. You can drag and drop pre-built components from the **Component library** on the canvas to create the UI of your applications. The **Query Panel** can be used to create and manage queries to interact with the data sources.

Minimize the Query Panel by clicking on the **Hide Query Panel** button. Click on the borders of the **Container** and expand it till it covers the visible portion of the canvas. 

Each time you click and select the **Container** or any other component on the canvas, a list of configuration related to the component will appear on the right. Right at the top is the name field. We'll click on it and rename the container to *Home* Below we have the **Properties** and **Styles** tab. **Properties** cover the functional behaviour of a component while the **Style** tab allows you to add custom styling. We'll name all the components in this application, we'll start seeing the benefits of it once the application grows and we need to refer to specific components in our application. 

We'll start building the header of our application now. Click and drag an **Image component** to the canvas from the library. We'll also place a **Text** component next to it. We'll rename the Image component to *Logo* and Text component to *HeaderText*.

Select the Image component, you'll see its properties on the right. Enter the below value as URL:
https://static-00.iconduck.com/assets.00/tooljet-icon-1024x908-0mi0u3op.png. 

Feel free to add any other URL that you might wish to use as the logo.

Select the **Text** component and following as the **Text** property:
"Time Tracker Application⏳"

We are now ready with our Header. And since our application will have two pages, let's copy paste all the components in the other page. In the left side bar, click on the Pages button, a drawer will slide out from the left with the "Pages" header. Click on the `+` button to add a new page and name it  *LogTime*. Click on the **Container** and press Command + C(Mac)/Cntrl + C(Windows). Click on the Pages button from the left sidebar again and switch to the *LogTime* page and press Command + V(Mac)/Cntrl + V(Windows). 

We'll work on the *LogTime* page later, we'll continue building the *Home* page for now. Click and drag a **Statistics** component on the canvas. Rename it to *completedTasks*. Under **Properties**, change the `Primary Label` to *Completed Tasks*. You can see the `Hide Secondary Value` property with a toggle button. Click on the toggle button to disable it. Now we only see one numerical value and one header in the component. We don't need a secondary value for our use-case. Copy and paste this component. Drag the pasted component and place it next to the *Completed Tasks* component. Rename it to *Pending Tasks*.

## Create Queries and Use The Queried Data

We'll now add some real data to our two *Statistic* components. Click on the **REST API** button in the **Query Panel** at the bottom and rename it to *getSummary*. Leave the **Method** as **GET** and Add the below link in the URL input.
https://64e3292bbac46e480e7848b3.mockapi.io/api/vi/tasksSummary. Click on the **Preview** button and you'll be able to see the preview of the reponse at the bottom. We are receiving an array with one object that has id, completedTasks and pendingsTasks as keys. Since we want this query to run every time the application is loaded, we'll eable the **Run this query on application load?** toggle. Now everytime we open our application, this query will automatically run and fetch the data. We'll generally use this setting for most of the **GET** requests. 

To use custom JavaScript code, we need to use double curly braces. All the data returned by queries is stored in the **queries** object. We need to use the **queries** keyword to access it. The general format to access queries is 

```js
{{queries.queryName.data}}
```
Select the *completedTasks* component. Under `Primary Value`, paste the below code:

```js
{{queries.getTasksSummary.data[0].completedTasks}}
```

In the above code, we are accessing the first array in the data using the index 0 and selecting the value of the **completedTasks** key. Our data has only one array, to access other arrays we would've used different indexes:

```js
{{queries.getTasksSummary.data[0].completedTasks}}
{{queries.getTasksSummary.data[1].completedTasks}}
{{queries.getTasksSummary.data[2].completedTasks}}
{{queries.getTasksSummary.data[3].completedTasks}}
```

A quick way to look at available queries would be to click on the inspector button in the left side bar and expand the queries dropdown. 

Let's also change the `Primary Value` for the pendingTasks component with the below code:

```js
{{queries.getTasksSummary.data[0].pendingTasks}}
```
We have replaced a static value in the `Primary Value` field with a dynamic value that is created based on the fetched data.   We have built a basic home page with the summary of completed and pending tasks.

Now let's create a button that'll help us navigate to the *logData* page. 

Drag and drop a **Button** component to the canvas. Rename it to *logTimeButton*. Change its `Button Text` property to Log Time. We will now use an **Event Handler** to add some action to the button. Under the `Events` property, click on the *+ Add Handler* button and leave the **Event** as **On click** and select **Switch Page** for the **Action** dropdown. Select *LogTime* page for the **Page** dropdown. Now everytime you click on this button, it'll switch to the *LogTime* page.

# Use Tables To Display Data and Take Action on it.

The **Table** component offers a simple and intuitive way to display and interact with data. Let's drag and drop a table component on the canvas. Adjust the width and make it slightly wider than the header. Rename it to *logTable*. We already have some dummy data in the **Table component**. Let's replace it with actual data. 

Create a new query by clicking on the **+Add** button and selecting **ToolJet Database**. Rename it to *getTrackerSummary*.
Next we'll have to select the **Table name** and **Operations**. Select *timeTracker*(the database table that we had created at the start) as the Table name and **List Rows** as Operations. Just like the previous query that we had created, we will enable **Run this query on load?** toggle. Click on the **Run** button. 

Click on the Table component and under `Table data` properties, paste the below code:

```js
{{{{queries.getTrackerSummary.data}}}}
```

We've now replaced the static dummy data with dynamic data that we are fetching from the database. 

Let's disable everything under **Options** except `Client-side pagination` and `Enable sorting`. `Client-side pagination` will allow us to restrict the number of rows that get displayed on the table at a time through the `Number of rows per page` property. `Enable sorting` allows us to sort the data in individual rows by clicking on the column headers. 

We will now create a way to add data to the table. Drag a **Modal** component from the components library. You will notice that only a button with the label **Launch Modal** shows up on the screen when you add a Modal component to the canvas. 


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
