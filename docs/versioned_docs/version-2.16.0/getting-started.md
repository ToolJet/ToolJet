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

## The very quick quickstart

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
:::

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
