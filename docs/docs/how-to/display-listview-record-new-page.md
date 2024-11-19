---
id: display-listview-record-on-new-page
title: Display Listview Record Details on a New Page
---

This guide demonstrates how to display details of a selected record from a **Listview** component on a new page in ToolJet. This feature is helpful for applications requiring a detailed view of a record, such as a customer profile, order details, or product information.

In this guide we will try building a employee book, which will display employee details in the next page, when an employee is selected from the listview.

<div style={{paddingTop:'24px'}}>

## Build the App

Let’s get started by building the app first.

1. Drag and drop a **listview** component from the component library in the right to the canvas and setup other required component.
        <img style={{marginTop:'10px'}} className="screenshot-full" src="/img/how-to/display-listview-record-on-new-page/build-app.png" alt="Build the app"  />
2. Now add an another page inside the app using the panel in the left.
        <img style={{marginTop:'10px'}} className="screenshot-full" src="/img/how-to/display-listview-record-on-new-page/add-new-page.png" alt="Add a new page"  />
3. Setup the second page with required fields and components.
        <img style={{marginTop:'10px'}} className="screenshot-full" src="/img/how-to/display-listview-record-on-new-page/setup-second-page.png" alt="Setup the second page"  />

</div>

<div style={{paddingTop:'24px'}}>

## Setting up Event Handlers

Now click on your listview component and in the properties section under Events, click on **+ New event handler**.

Enter the following parameters:
- Event: **Record Clicked**
- Action: **Set variable**
- Key: **emp_name** *(Enter your desired variable name)*
- Value: `{{components.listview1.selectedRecord.text1.text}}`

This event will save the record value in the entered variable name, which can be used in the another page.

<img className="screenshot-full" src="/img/how-to/display-listview-record-on-new-page/set-variable.png" alt="Add event handler to set variables"/>

Again click on **+ New event handler** and enter the following parameters:

- Event: **Record Clicked**
- Action: **Switch page**
- Page: **Employee Details** *(Select your desired page from the dropdown)*

This event will switch the page whenever a record is clicked.

<img className="screenshot-full" src="/img/how-to/display-listview-record-on-new-page/switch-page.png" alt="Add event handler to switch page"/>

</div>

<div style={{paddingTop:'24px'}}>

## Displaying Info on Another Page

Now you can access the value of the variable you set in the previous page, create a new query from the bottom query panel.

Select your desired data source and select operation as **list rows**, in the filters section add a new filter, select the column name, select the operation as “equals”, and in the value section enter `{{variables.emp_name}}` to access the value we set in the previous page.

Now this query fill fetch all the details of the employee which was selected in the last page.

<img className="screenshot-full" src="/img/how-to/display-listview-record-on-new-page/query.png" alt="Add query to fetch data"/>

Now to display the data you can set the default value of a text input component to `{{queries.<queryname>.data[0].<key>}}`.

**Note**: Make sure to replace *queryname* with your query name and *key* with the desired key you wish to display.

<img className="screenshot-full" src="/img/how-to/display-listview-record-on-new-page/display-data.png" alt="Display data on the new page"/>

</div>