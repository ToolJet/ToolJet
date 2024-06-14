---
id: quickstart-guide
title: Quickstart Guide
---

<!-- <div style={{paddingTop:'24px', paddingBottom:'24px'}}> -->


This tutorial will show you how to create an employee directory application in minutes using ToolJet. This app will let you track and update employee information with a beautiful user interface. Here are the step-by-step instructions:

**[1. Create Your First Application](#1-create-your-first-application)**  <br/>
**[2. Create Employee Database](#2-create-employee-database)**  <br/>
**[3. Integrate Data](#3-integrate-data)** <br/>
**[4. List Employees](#4-list-employees)** <br/>
**[5. Add New Employee](#5-add-new-employee)** <br/>
**[6. Preview, Release And Share](#6-preview-release-and-share)** <br/>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

<!-- </div> -->

### 1. Create Your First Application

Once you have created an account with ToolJet, go to the dashboard and click on the Create new app button. Name your application as "Employee Directory". You are ready to design your application now.

<div style={{marginBottom:'15px', height:'397px', }}>
    <iframe
        className="screenshot-full"
        src="https://www.floik.com/embed/e4f537b5-7b36-4760-9a52-caefc659a90b/b4059c71-812d-407b-9d4a-fc598eac6260-flo.html"
        style={{width: '100%', height: '100%', border: '0'}}
        frameborder='0'
        allowfullscreen="allowfullscreen"
        webkitallowfullscreen
        mozallowfullscreen
        allowfullscreen>
    </iframe>
</div>

Click and drag a **[Table](/docs/widgets/table)** component to the canvas. 

<div style={{marginBottom:'15px', height:'397px', }}>
    <iframe
        className="screenshot-full"
        src="https://www.floik.com/embed/e4f537b5-7b36-4760-9a52-caefc659a90b/ee10d678-63fb-4fd5-a217-835ddd0898e9-flo.html"
        style={{width: '100%', height: '100%', border: '0'}}
        frameborder="0"
        allowfullscreen="allowfullscreen"
        webkitallowfullscreen
        mozallowfullscreen
        allowfullscreen>
    </iframe>
</div>

Optionally, you can style the Table by **[adjusting its styling properties](/docs/tooljet-concepts/what-are-components#customizing-components)** and create a header by placing **[Text](/docs/widgets/text)** components over a **[Container](/docs/widgets/container)** component and styling them. 

<div style={{textAlign: 'center'}}>
    <img style={{marginBottom:'15px', borderRadius: '6px' }} className="screenshot-full" src="/img/quickstart-guide/header-design-v2.png" alt="Database Preview" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### 2. Create Employee Database

Now, create a new table in **[ToolJet’s Database](/docs/tooljet-database/)** to store employee records. Name the table employees and add the following columns: `firstname`, `lastname`, `email`, `phone`, `department`, `position`, `joining`, and `status`. Also, add a few employee records in the table.

<div style={{textAlign: 'center'}}>
    <img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/create-database-v2.png" alt="Database Preview" />
</div>

</div>



<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### 3. Integrate Data

To display employees in the application, we first need to fetch data from the database using a query:
- Click on the Add button in the **[Query Panel](/docs/app-builder/query-panel/)**, select ToolJet Database.
- Rename the query to `getEmployees`.
- Choose `employees` as Table name, List rows as Operations.
- Toggle Run this query on application load? to automatically run the query when the app starts.
- Click on Run to fetch data.

<div style={{marginBottom:'15px', height:'397px', }}>
    <iframe
        className="screenshot-full"
        src="https://www.floik.com/embed/e4f537b5-7b36-4760-9a52-caefc659a90b/de162474-7861-4275-bc8a-da275517908c-flo.html"
        style={{width: '100%', height: '100%', border: '0'}}
        frameborder="0"
        allowfullscreen="allowfullscreen"
        webkitallowfullscreen
        mozallowfullscreen
        allowfullscreen>
    </iframe>
</div>

Click on the Preview button to see a preview of the fetched data. 

<div style={{marginBottom:'15px', height:'397px', }}>
    <iframe
        className="screenshot-full"
        src="https://www.floik.com/embed/e4f537b5-7b36-4760-9a52-caefc659a90b/b01e837b-b1b0-468e-a4e3-4b8064ba2e56-flo.html"
        style={{width: '100%', height: '100%', border: '0'}}
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

Now, we need to bind the data returned by the `getEmployees` query above with the Table created in Step 1. Click on the Table component to open its properties panel on the right. Under the `Data` property, paste the below code:

```js
{{queries.getEmployees.data}}
```
<div style={{marginBottom:'15px', height:'397px', }}>
    <iframe
        className="screenshot-full"
        src="https://www.floik.com/embed/e4f537b5-7b36-4760-9a52-caefc659a90b/f780f25f-0832-4a06-86f2-46864b891db1-flo.html"
        style={{width: '100%', height: '100%', border: '0'}}
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

- Click on Add in the query panel, select ToolJet Database.
- Select `employees` as Table name, Create row as Operations.
- Rename the query to `addEmployee`.
- Click Add Column to add required columns.
- Enter code below for **email** and **firstname** column keys:

```js
{{components.table1.newRows[0].email}}
{{components.table1.newRows[0].firstname}}
...
```

Frame all the remaining keys in the same format.

<div style={{textAlign: 'center'}}>
    <img style={{ marginBottom:'15px', borderRadius: '6px' }} className="screenshot-full" src="/img/quickstart-guide/add-employee-query-v2.png" alt="Add Employee Query" />
</div>

Let's continue working on this query. The data needs to reload once this query runs since we want the Table component to be populated with the updated data. Follow the below steps to run the `getEmployees` query after the `addEmployee` query is completed. 

- Scroll down and click on New event handler.
- Select Query Success as Event and Run Query as Action.
- Select `getEmployees` as Query.

<div style={{textAlign: 'center'}}>
    <img style={{ marginBottom:'15px', borderRadius: '6px'}} className="screenshot-full" src="/img/quickstart-guide/reload-data-v2.png" alt="Reload Table Data" />
</div>

We are now ready with a query that will allow us to add new employee data. Let's link this query to a button.

In the bottom-right corner of the Table component, there is a `+`/Add new row button. Follow the below steps to run the `addEmployee` query on click of the `+`/Add new row button: 
- Click on the Table component, go to Events in properties panel and add a New event handler.
- Choose Add new rows as Event, Run Query as Action.
- Select `addEmployee` as the Query.

<div style={{marginBottom:'15px', height:'397px', }}>
    <iframe
        className="screenshot-full"
        src="https://www.floik.com/embed/e4f537b5-7b36-4760-9a52-caefc659a90b/e53c2517-41f1-4ee0-a5c0-59f5c3622c4a-flo.html"
        style={{width: '100%', height: '100%', border: '0'}}
        frameborder="0"
        allowfullscreen="allowfullscreen"
        webkitallowfullscreen
        mozallowfullscreen
        allowfullscreen>
    </iframe>
</div>

Now if you click on the `+`/Add new row button, enter the employee data and click on Save. The `addEmployee` query will run and the data will be written to the `employees` table in the ToolJet Database.

<div style={{marginBottom:'15px', height:'397px', }}>
    <iframe
        className="screenshot-full"
        src="https://www.floik.com/embed/e4f537b5-7b36-4760-9a52-caefc659a90b/a33b3f9d-a33d-49c3-a031-db09b0202cfd-flo.html"
        style={{width: '100%', height: '100%', border: '0'}}
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

The preview, release and share buttons are on the top-right of the App-Builder.

- Click on the Preview on the top-right of app builder to review how your application is coming along while development.
- Once the development is done and you are ready to use the application, click on Release button to deploy the app.
- Finally, share your application with your end users using Share button.


<div style={{textAlign: 'center'}}>
    <img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/quickstart-guide/preview-share-v2.png" alt="Preview And Share" />
</div>

Congratulations on completing the tutorial! You've successfully built an employee directory application and, in the process, covered the fundamentals of ToolJet. 

To learn more about how ToolJet works, explore the subjects covered in **[ToolJet Concepts](/docs/tooljet-concepts/what-are-components)**.

</div>


