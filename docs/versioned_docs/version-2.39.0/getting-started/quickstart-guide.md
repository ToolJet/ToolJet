---
id: quickstart-guide
title: Quickstart Guide
---

<!-- <div style={{paddingTop:'24px', paddingBottom:'24px'}}> -->

This tutorial will show you how to create an employee directory application in minutes using ToolJet. This app will let you track and update employee information with a beautiful user interface. Here are the step-by-step instructions:

**[1. Create Your First Application](#1-create-your-first-application)**  <br/>
**[2. Create a Database Table](#2-create-a-database-table)**  <br/>
**[3. Fetch Data](#3-fetch-data)** <br/>
**[4. Bind Data to the Table](#4-bind-data-to-the-table)** <br/>
**[5. Add New Data](#5-add-new-data)** <br/>
**[6. Preview, Release and Share](#6-preview-release-and-share)** <br/>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

<!-- </div> -->

### 1. Create Your First Application

Once you have created your ToolJet account, follow the steps below.

<div class="video-container">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/LNvd7pZ72Yk?si=h0YzQeC6frmx6pcB&rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
<br/>

- Go to the dashboard and click on the **Create new app** button. Name your application as "Employee Directory". Once your application is created, you can see an empty canvas.
- Click and drag a **[Table](/docs/widgets/table)** component on the canvas. 

Optionally, you can also create a header by placing **[Text](/docs/widgets/text)** components over a **[Container](/docs/widgets/container)** component and styling them. 

<div style={{textAlign: 'center'}}>
    <img style={{marginBottom:'15px', borderRadius: '6px' }} className="screenshot-full" src="/img/quickstart-guide/header-design-v3.png" alt="Database Preview" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### 2. Create a Database Table
Now, create a new table in **[ToolJet’s Database](/docs/tooljet-db/tooljet-database/)** to store employee records. 

<div class="video-container">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/sxmXZesw2is?si=HARRc9ILmfLFGNZQ&rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
<br/>

- Name the table employees and add the following columns: `firstname`, `lastname`, `email`, `phone`, `department`, `position`, `joining`, and `status`. 
- Add a few employee records in the table as dummy data.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### 3. Fetch Data

To display employees in the application, we first need to fetch data from the database using a query.

<div class="video-container">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/mnLw7avQsEg?si=5oxSo36V-D12316R&rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
<br/>

- Click on the **Add** button in the **[Query Panel](/docs/app-builder/query-panel/)** to create a new query.
- Select **ToolJet Database** as the data source for the query.
- Rename the query to `getEmployees`.
- Choose `employees` as the Table name, and **List rows** as the Operation.
- Toggle `Run this query on application load?` setting to automatically run the query when the app starts.
- Click on **Run** to fetch data.
- Click on the **Run** button or **Preview** button to see a preview of the fetched data. 

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### 4. Bind Data to the Table

Now, we need to bind the data returned by the `getEmployees` query with the Table created in Step 1. 

<div class="video-container">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/m_7i_smzh2k?si=_w11gzqJaFjn5PNZ&rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
<br/>

- Click on the Table component to open its properties panel which is visible on the right.
- Under the `Data` property, enter the below code:

```js
{{queries.getEmployees.data}}
```

Now the Table component is filled with the data returned by the `getEmployees` query. 

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### 5. Add New Data

In the bottom-right corner of the Table component, there is a `+` (Add new row) button that opens a form to add new data to the Table. Follow the steps below to create an `addEmployee` query and execute it when you click the **Save** button on the add new rows form.

<div class="video-container">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/uIRKqda9AUQ?si=jwqoBAOGlgBF7nmf&rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
<br/>

- Click on the **Add** button in the query panel, and select **ToolJet Database** as the data source.
- Select `employees` as the Table name, and **Create row** as the Operation.
- Rename the query to `addEmployee`.
- Click on **Add Column** to add required columns.
- Enter code below for **email** and **firstname** column keys:

```js
{{components.table1.newRows[0].email}}
{{components.table1.newRows[0].firstname}}
...
```
Frame all the remaining keys in the same format.

The `addEmployees` query should run when you click on the **Save** button on the `+` (Add new row) form. And the Table component should reload and display updated data each time a new employee is added. Follow the below steps to use events to setup this functionality. 

<div class="video-container">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/NoPM-Y0fSCs?si=GQRXzJKnQTRQVOQI&rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
<br/>

- Under the `addEmployee` query settings, Scroll down and click on **New event handler**.
- Select **Query Success** as the Event, **Run Query** as the Action, and `getEmployees` as the Query.
- Click on the Table component, go to Events in properties panel and add a **New event handler**.
- Choose **Add new rows** as the Event, **Run Query** as the Action, and `addEmployee` as the Query.

Now when you click the `+` (Add new row) button, enter the employee data, and click **Save**, the `addEmployee` query will execute, adding the data to the `employees` table in the ToolJet Database. This will be followed by the Table component reloading with the new data.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### 6. Preview, Release And Share

The preview, release and share buttons are at the top-right of the App-Builder.

<div style={{textAlign: 'center'}}>
    <img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/preview-share-v2.png" alt="Preview And Share" />
</div>

- Click on the **Preview** button on the top-right of app builder to review how your application is coming along during development.
- Once the development is done and you are ready to use the application, click on the **Release** button to deploy the app.
- Finally, share your application with your end users using the **Share** button.

Congratulations on completing the tutorial! You've successfully built an employee directory application and, in the process, learnt the fundamentals of ToolJet. 

To learn more about how ToolJet works, explore the subjects covered in **[ToolJet Concepts](/docs/tooljet-concepts/what-are-components)**.

</div>


