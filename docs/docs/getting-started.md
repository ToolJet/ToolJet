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

## Quickstart Guide

In this quickstart guide, we will build a **Time Tracking Application** that will allow end-users to record their daily working hours with additional details. The multi-page application will have:

- A basic summary of all pending and completed tasks for the month
- A table displaying all time-tracking data for the logged-in user, along with options to add new entries and delete existing ones.

## Create a Database Table 

We'll first create a table in ToolJet's built-in database. Navigate to the **Database** tab from the left sidebar.
Click on the **Create new table** button on the top-left. A dialog box will slide from the right to configure the database table properties. The `id` field will be present by default to create a unique identifier for each record in our database.

In the Table name field, enter *timeTracker*. Click on the **Add more columns** button and add **employee** in the name input field and select varchar as the type. The **Default** field allows you to enter a default value that will be used if no value is received from the frontend.

We will add four more columns to our table:

| Column Name     | Type     | Default Value |
|:----------------|:---------|:--------------|
| taskname        | varchar  | null          |
| duration        | integer  | null          |
| dateoftask      | varchar  | null          |
| taskdescription | varchar  | null          |

Add three rows of dummy data to the database. 

## Create UI for Home Page

We'll now go ahead and build our application using the **ToolJet App Builder**. Click on the **Dashboard** button on the sidebar and click on the **Create new app** button. We'll be taken to a new application with an empty canvas. We can see the **Component Library** on the right, we can drag and drop pre-built components from the **Component library** on the canvas to create the UI. The **Query Panel** at the bottom can be used to create and manage queries to interact with the database. Minimize the Query Panel by clicking on the **Hide Query Panel** button on its top-left. 

Click and drag a **Container** component to the canvas. Click on the borders of the **Container** and expand it till it covers the visible portion of the canvas. 

Each time you click and select the **Container** or any other component on the canvas, a list of configuration related to the component will appear on the right. Right at the top is the `name` field. We'll click on it and rename the container to *Home*. Below we have the **Properties** and **Styles** tab. **Properties** cover the functional behaviour of a component while the **Style** tab allows you to add custom styling to your components. 

We'll rename all the components in this application based on its function, we'll start seeing the benefits of it once the application grows and we need to refer to specific components in our application. 

Let's build the header of our application. Click and drag an **Image** component to the canvas from the library and rename it to *Logo*.

Select the Image component, you'll see its properties on the right. 
Enter the below value as `URL`:

```js
https://static-00.iconduck.com/assets.00/tooljet-icon-1024x908-0mi0u3op.png
```

Feel free to add any other URL that you might wish to use as the logo.

Place a **Text** component next to it and rename the component to *HeaderText*. Paste following text under **Text** property:

```js
Time Tracker Application⏳
```


We are now ready with our Header. 

Click and drag a **Statistics** component on the canvas. Rename it to *completedTasks*. Under **Properties**, change the `Primary Label` to *Completed Tasks*. Disable the `Hide Secondary Value` property using the toggle button. Now we only see one header and one numerical value in the component. We don't need a secondary value for our use-case. Copy and paste this component. Drag the pasted component and place it next to the *Completed Tasks* component. Rename it to *Pending Tasks*.

## Create Your First Query in ToolJet 

We'll now add some real data to our two **Statistic** components. Click on the **REST API** button in the **Query Panel** at the bottom and rename it to *getSummary*. Leave the **Method** as **GET** and add the below link in the URL input.

```
https://64e3292bbac46e480e7848b3.mockapi.io/api/vi/tasksSummary
```

Click on the **Preview** button and you'll be able to see the preview of the API reponse at the bottom. We are receiving an array with one object that has id, completedTasks and pendingsTasks as keys. Since we want this query to run every time the application is loaded, we'll enable the **Run this query on application load?** toggle. Now everytime we open our application, this query will automatically run and fetch the data. We'll generally use this setting for most of the **GET** requests. 

To use custom JavaScript code, we need to use double curly braces. All the data returned by queries is stored in the **queries** object. We need to use the **queries** keyword to access it. The general format to access queries is 

```js
{{queries.queryName.data}}
```

Select the *completedTasks* component. For the `Primary Value` input, paste the below code:

```js
{{queries.getTasksSummary.data[0].completedTasks}}
```

In the above code, we are accessing the first array in the data using the index 0 and selecting the value of the **completedTasks** key. Our data has only one array, to access other arrays we would've used different indexes.

<!-- ```js
{{queries.getTasksSummary.data[0].completedTasks}}
{{queries.getTasksSummary.data[1].completedTasks}}
{{queries.getTasksSummary.data[2].completedTasks}}
{{queries.getTasksSummary.data[3].completedTasks}}
``` -->

A quick way to look at available queries would be to click on the inspector button in the left side bar and expand the queries dropdown. 

Let's also change the `Primary Value` for the pendingTasks component with the below code:

```js
{{queries.getTasksSummary.data[0].pendingTasks}}
```

We have now replaced static values in the components with dynamic values. 

With this, we have successfully created a basic homepage for our application.

## Create Multiple Pages

<!-- Since our application will have two pages, let's copy paste all the common components from the **Home** page to a new page.  -->

Let's create one more page that displays the time tracking data along with the option to add and delete entries.

In the left side bar, click on the **Pages** button, a dialog box will slide out from the left with the **Pages** header. Click on the `+` button to add a new page and name it  *LogTime*. Click on the *homeContainer* on the *Home* page and press Command + C(Mac)/Cntrl + C(Windows) to copy the container along with all the components that are placed inside it. 

Click on the **Pages** button from the left sidebar again and switch to the *LogTime* page and press Command + V(Mac)/Cntrl + V(Windows). Click on the component handle of the *homeContainer* and move it to the top-left corner. Leave the logo and header text, and delete the two statistic components. 

Now let's create a button that'll help us navigate to the *logTime* page from the *Home* page. 

Drag and drop a **Button** component to the canvas. Rename it to *logTimeButton*. Change its `Button Text` property to **Log Time**. We will now use an **Event Handler** to add some action to the button. Under the `Events` property, click on the *+ Add Handler* button and leave the **Event** as **On click** and select **Switch Page** for the **Action** dropdown. Select *LogTime* page for the **Page** dropdown. Now everytime you click on this button, it'll switch to the *LogTime* page.

Next we'll create fetch the data from the database and display it using a **Table** component.

## Use Table Component To Display And Manipulate Data

The **Table** component offers a simple and intuitive way to display and interact with data. Let's drag and drop a table component on the canvas. Adjust the width and make it slightly wider than the header. Rename it to *trackerTable*. We already have some dummy data in the **Table** component. Let's replace it with actual data. 

Click on the **+Add** button in the Query Panel at the bottom and select **ToolJet Database**. Rename it to *getTrackerSummary*. Next we'll have to select the **Table name** and **Operations**. Select *timeTracker*(the database table that we had created at the start) as the Table name and **List Rows** as Operations. Just like the previous query that we had created, we will enable **Run this query on load?** toggle. Click on the **Run** button. 

Click on the Table component and under `Table data` properties, paste the below code:

```js
{{{{queries.getTrackerSummary.data}}}}
```

We've now replaced the static data with dynamic data that we are fetching from the database. 

Let's disable everything under **Options** except `Client-side pagination` and `Enable sorting`. `Client-side pagination` will allow us to restrict the number of rows that get displayed on the table at a time through the `Number of rows per page` property. `Enable sorting` allows us to sort the data in individual rows by clicking on the column headers. 

## Using A Modal Component

We will now create a way to add data to the table. Drag a **Modal** component from the components library. You will notice that only a button with the label **Launch Modal** shows up on the screen when you add a Modal component to the canvas. We'll first change the name of the button to *logTimeModal* and **Trigger Button** label to **Log Time**. 

To edit the modal click on the **Log Time** button(named *Launch Model* earlier) and you'll see a modal on your canvas. It'll stay open till you click on the `X` button/close button on the top-right. You can edit the modal while it is open. We will place components on our modal to create a form layout to submit the time tracker details.

Let's change the `Title` property of the model to *Log Details* and click on the `X` on the top-right to close the properties of the Modal component and go back to the components library. Drag four **Text** components and align them vertically. We'll rename the first Text component to **taskName** and change its label to **Task Name:**.

Similarly, we'll rename the other three Text components to *duration*, *dateOfTask* and *taskDescription* and change their labels to **Duration(In Hours)**, **Date Of Task** and **Task Description**. 

Drag a **Text Input** component next to the *Task Name* label, and **Number Input** component next to *Duration* and **Date Picker** next to *Date of Task*. Below the **Task Description** label, add a **Textarea** component. The **Textarea** component can be useful if we are expecting an input of more than one line. 

We will rename the input components to *taskNameInput*, *taskDurationInput*, *taskDateInput* and *taskDescriptionInput*.

Let's also add a **Button** component at the bottom-right and rename it to *submit*, and change its `Button Text` property to **Submit**. We'll close the modal by clicking on the `X` on the top-right. Now every time we click on the *logTimeButton*, the **Modal** component will open up. 

## Creating A Query To Write Data 

We are ready with the form, but we also need to create a query that will write the data to our *timeTracker* database. Click on the **+ Add** button in the Query Panel. Select **ToolJet Database** from the list of available sources. 

Rename the query to *addLog*, select *Create row* as Operations and use the below configuration for the columns. We will see how we can use custom code and use different keys to access the data available in the app-builder in the below table. 

<!-- Column Name: Key: Description:
1. employee {{globals.currentUser.email}} Click on the **Inspector** on the left-sidebar to look at the available options for global variables, we can pick the currentUser.email value to get the email of the logged-in user. 
2. taskname {{components.taskNameInput.value}} We can access the data passed in the components using the components key, now whenever we run this query, the values present in the listed components will be written to the database table.
duration {{components.durationInput.value}}
dateoftask {{components.dateOfTaskInput.value}}
taskdescription {{components.taskDescriptionInput.value}} -->

| Column Name    | Key                               | Description |
| :-------------- | :------------------------ |: ---------- |
| 1. employee       | {{globals.currentUser.email}}     | Click on the **Inspector** on the left-sidebar to look at the available options for global variables.              |
| 2. taskname <br/> 3. duration <br/> 4. dateoftask <br/> 5. taskdescription | {{components.taskNameInput.value}} <br/> {{components.durationInput.value}} <br/> {{components.dateOfTaskInput.value}} <br/> {{components.taskDescriptionInput.value}} | We can access the data passed in the components using the **components** key.  |

We'll plug this query to the **Submit** button on *logTimeModal*.

## Using Events

Open the modal, click on the component handle of the *submit* button. Under `Events`, click on **+ Add Handler**, leave the Event as **On Click**, select the Action as **Run Query** and select *addLog* as the query. 

Now whenever we click on the submit button, the *addLog* query will run and the values present in the listed components will be written to the related columns of the database table.

We also need to show a prompt to indicate that the data has been added. Click on **+ Add Handler**, leave the Event as **On Click**, select the Action as **Show Alert** and enter "Log Added" as the Message and leave Alert Type as Info.

Finally, we would want our modal to close once we click on **Submit** and the required query and alert is triggered. Add one more **Event**, select **Close Modal** as the action type and *logTimeModal* as **Modal**. 

Now every time we click on the **Submit** button on the modal, the *addLog* query will run, followed by an alert and the modal being closed.

## Adding Actions To Tables


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
