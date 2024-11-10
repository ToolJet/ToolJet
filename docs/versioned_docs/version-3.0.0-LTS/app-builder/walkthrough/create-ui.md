---
id: create-ui
title: Create User Interfaces
---

ToolJet offers a variety of pre-built components that streamline the development process and allow for rapid prototyping and deployment of internal tools. This guide is focused on building a basic UI for a Support Desk Dashboard application.

## Creating the Header
- Drag and drop a **Text** component on the top left of the canvas. 
- Click on the component to open its Properties Panel on the right and add **Support Desk Dashboard** under its `Data` property.  

<div style={{textAlign: 'center', marginBottom:'15px'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/walkthrough/create-ui/add-header-text.png" alt="Add header text" />
</div>

You can see all the available properties of a component in the Properties Panel. You can manage the functionality and styling properties of the component in the Properties Panel.

- Change its font size to 24, font weight to bold and color to blue(hex code - `#408FCC`). 
- Add another Text component below it and enter `Track and manage all your tickets in one place` under its `Data` property.
- Change its font size to 14 and color to grey (hex code - `#9B9B9B`).

<div style={{textAlign: 'center', marginBottom:'15px'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/walkthrough/create-ui/add-sub-header-text.png" alt="Add sub header text" />
</div>

## Support Tickets Counter
- Drag and drop **Statistics** component next to it. 
- Under its `Primary value label`, enter `Created` and enter a number under `Primary value`. 
- Change its Primary label color and Primary text color to blue(`#4A90E2`).
- Disable `Hide secondary value` 
- Add 2 more Statistics components for Pending and Closed tickets. 

<div style={{textAlign: 'center', marginBottom:'15px'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/walkthrough/create-ui/add-statistics.png" alt="Add statistics" />
</div>

## Tickets Table
- Add a **Table** component on the canvas. 
- Navigate to its Properties Panel on the right and change its `Border Radius` to 10.  
- Under its `Data` property, add the below dummy data:

```js
{{ [{
    ticketId: "TCK1001",
    customerName: "Jane Doe",
    issueType: "Login Issue",
    priority: "High",
    status: "Open",
    lastUpdated: "2024-04-12"
  },
  {
    ticketId: "TCK1002",
    customerName: "John Smith",
    issueType: "Payment Failure",
    priority: "Medium",
    status: "Pending",
    lastUpdated: "2024-04-11"
  },
  {
    ticketId: "TCK1003",
    customerName: "Alice Johnson",
    issueType: "Feature Request",
    priority: "Low",
    status: "Closed",
    lastUpdated: "2024-04-10"
  },  {
    ticketId: "TCK1004",
    customerName: "Sarah Dunsworth",
    issueType: "Feature Request",
    priority: "High",
    status: "Closed",
    lastUpdated: "2024-04-10"
  },
] }}
```

- Add a **Text** component above it and enter **Tickets** under its `Data` property.
- Change its font size to 14 and color to grey (hex code - `#9B9B9B`).
- Under the `Columns` section, click on the columns and change their `Column name` properties to update the column name. For instance, change "ticketId" to "ticket ID", "customerName" to "customer name", etc. 


<div style={{textAlign: 'center', marginBottom:'15px'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/walkthrough/create-ui/add-table.png" alt="Add table component" />
</div>



## Adding a New Page
- Click on **Pages** on the left sidebar - there will be a *Home* page by default. Rename the home page to <i>Dashboard</i>.
- Click on the `+` icon to create a new page and rename the new page to <i>Customers</i>.

<div style={{textAlign: 'center', marginBottom:'15px'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/walkthrough/create-ui/create-new-page.png" alt="Add new page" />
</div>

- Click and drag to select all components on the *Dashboard* page, copy them (CMD+C for Mac and Cntrl+C for Windows) and paste (CMD+V for Mac and Cntrl+V on Windows) them in the <i>Customers</i> page.


- For the **Text** component for **Tickets**, change the `Data` property to **Customers**.
- Add the below data under the Table's `Data` property.
```js
{{[
    {
        id: 1,
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
        status: "Active",
        issuesResolved: 0
    },
    {
        id: 2,
        name: "John Smith",
        email: "jane.smith@example.com",
        phone: "+1234567891",
        status: "Inactive",
        issuesResolved: 0
    },
    {
        id: 3,
        name: "Alice Johnson",
        email: "emily.johnson@example.com",
        phone: "+1234567892",
        status: "Active",
        issuesResolved: 1
    },
    {
        id: 4,
        name: "Michael Brown",
        email: "michael.brown@example.com",
        phone: "+1234567893",
        status: "Inactive",
        issuesResolved: 4
    },
    {
        id: 5,
        name: "Sarah Dunsworth",
        email: "michael.brown@example.com",
        phone: "+1234567893",
        status: "Active",
        issuesResolved: 1
    }
]}}
```
<div style={{textAlign: 'center', marginBottom:'15px'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/walkthrough/create-ui/update-new-page.png" alt="Update new page" />
</div>

## Changing the Theme

Click on the **Settings** button on the left sidebar. The `App mode` property will be set as `Auto` by default. Switch the `App mode` property to dark. Now when you preview the app, you can see that the app has a dark color scheme. 

<div style={{textAlign: 'center', marginBottom:'15px'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/walkthrough/create-ui/dark-color-scheme.png" alt="Dark mode" />
</div>


When you keep the `App mode` as auto, it will follow the color scheme of the browser.


This guide has outlined the steps to create a Support Desk Dashboard UI using ToolJet's components. You now have a visually appealing interface that will help manage and track support tickets efficiently. Continue to explore ToolJet to learn about adding functionality to the UI. 