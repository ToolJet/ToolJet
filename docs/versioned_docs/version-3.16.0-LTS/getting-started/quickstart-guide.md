---
id: quickstart-guide
title: Quickstart Guide
---

Build your first ToolJet application in under 10 minutes. This guide walks you through creating an employee directory app that demonstrates core platform features: connecting to databases, querying data, building UI, and deploying applications.

## What You'll Build

An employee directory application that:
- Displays employee records in a table
- Allows adding new employees through a form
- Automatically updates when data changes
- Can be shared with your team

## Prerequisites

- A free **[ToolJet account](https://www.tooljet.com/signup)** (sign up takes less than a minute)
- No coding experience required

## Steps

**[1. Create Your First Application](#1-create-your-first-application)** <br/>
**[2. Create a Database Table](#2-create-a-database-table)** <br/>
**[3. Create a Query to Fetch Data](#3-create-a-query-to-fetch-data)** <br/>
**[4. Bind Queried Data to the UI](#4-bind-queried-data-to-the-ui)** <br/>
**[5. Create a Query to Add Data](#5-create-a-query-to-add-data)** <br/>
**[6. Use Events to Trigger Queries](#6-use-events-to-trigger-queries)** <br/>
**[7. Preview, Release, and Share](#7-preview-release-and-share)** <br/>

### 1. Create Your First Application

<div class="video-container">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/3opM-aL_ct4?si=ubFBF7SpneufFb0s&rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
<br/>

- From your dashboard, click the **Create new app** button
- Name your application "Employee Directory"
- Drag a **[Table](/docs/widgets/table/)** component onto the canvas
- *Optional*: Add a header component to design your app layout

### 2. Create a Database Table

Create a table in **[ToolJet Database](/docs/tooljet-db/tooljet-database/)** to store employee records.

<div class="video-container">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/a7qWJajVQ2o?si=KtppkSMB7JK4ANd1&rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
<br/>

- Navigate to the **ToolJet Database** from the left sidebar
- Create a new table named `employees`
- Add the following columns: `first_name`, `last_name`, `email`, `phone`, `department`, `position`, `joining`, `status`
- Add 2-3 sample employee records to test with

### 3. Create a Query to Fetch Data

Fetch employee data from your database using a query.

<div class="video-container">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/IGuka14FHbs?si=3CNbMwP4w-D9t9kW&rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
<br/>

- In the **[Query Panel](/docs/app-builder/connecting-with-data-sources/creating-managing-queries)** at the bottom, click **Add**
- Select **ToolJet Database** as the datasource
- Rename the query to `getEmployees`
- Configure the query:
  - **Table name**: `employees`
  - **Operation**: `List rows`
- Click **Run** to test the query
- Enable **Run this query on application load** in the query settings

### 4. Bind Queried Data to the UI

Connect the query data to your Table component.

<div class="video-container">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/fmLeeheFHsM?si=YzO-V_NHTyKHYkC5&rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
<br/>

- Click the Table component to open its properties panel
- In the **Data** property field, enter:

```js
{{queries.getEmployees.data}}
```

The Table now displays all employee records from your database.

### 5. Create a Query to Add Data

Create a query to insert new employee records when users submit the form.

<div class="video-container">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/mbvygFJYY9c?si=sEpqNlR36P8wlHBN&rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
<br/>

- In the Query Panel, click **Add** and select **ToolJet Database**
- Configure the query:
  - **Table name**: `employees`
  - **Operation**: `Create row`
  - **Query name**: `addEmployees`
- Click **Add Column** for each database field
- Map form data to columns using this pattern:

```js
{{components.table1.newRows[0].first_name}}
{{components.table1.newRows[0].email}}
{{components.table1.newRows[0].phone}}
{{components.table1.newRows[0].department}}
{{components.table1.newRows[0].position}}
{{components.table1.newRows[0].joining}}
{{components.table1.newRows[0].status}}
```

### 6. Use Events to Trigger Queries

Connect your queries using events to create an interactive workflow.

<div class="video-container">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/UJ3FyUqhhjE?si=pPun7LM7Rbs0g35C&rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
<br/>

**Add event to Table component:**
- Click the Table component and open its properties panel
- Click **New event handler**
- Configure the event:
  - **Event**: `Add new rows`
  - **Action**: `Run Query`
  - **Query**: `addEmployees`

**Add event to addEmployees query:**
- Open the `addEmployees` query settings
- Click **New event handler**
- Configure the event:
  - **Event**: `Query Success`
  - **Action**: `Run Query`
  - **Query**: `getEmployees`

Now when you add a new employee, the form submits the data, saves it to the database, and automatically refreshes the Table to show the new record.

### 7. Preview, Release, and Share

The preview, release and share buttons are at the top-right of the App-Builder.

<div class="video-container">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/yY8UAC4FK44?si=fTdYYvUI3TK_NIWq&rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
<br/>

- **Preview**: Click the **Preview** button (top-right) to test your application in real-time
- **Release**: When ready, click **Release** to deploy your application
- **Share**: Click **Share** to generate a link and invite users to your application

**Congratulations!** You've built your first ToolJet application and learned the core concepts:
- Creating applications and adding components
- Working with ToolJet Database
- Writing queries to fetch and modify data
- Binding data to UI components
- Using events to create interactive workflows
- Deploying and sharing applications

---

## Next Steps

Now that you understand the basics, explore more ToolJet features:

- **[Connect to external datasources](/docs/data-sources/overview)** - Integrate with PostgreSQL, MySQL, REST APIs, and 40+ other services
- **[Explore components](/docs/widgets/overview)** - Build richer UIs with charts, forms, buttons, and more
- **[Learn about workflows](/docs/workflows/overview)** - Automate backend processes and scheduled tasks
- **[Set up workspaces](/docs/tutorial/manage-users-groups)** - Invite team members and manage permissions
- **[Browse marketplace plugins](/docs/marketplace/marketplace-overview)** - Extend ToolJet with AI, payment processors, and specialized integrations

---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)