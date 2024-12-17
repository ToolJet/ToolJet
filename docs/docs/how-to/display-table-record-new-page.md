---
id: display-table-record-on-new-page
title: Display Table Record Details on a New Page
---

This guide demonstrates how to display the details of a selected row from the **Table** component on a new page in ToolJet.

<div style={{paddingTop:'24px'}}>

## Build the App

Let’s get started by building the app first.

1. Drag and drop a **Table** component from the component library on the right to the canvas and set other required components.
<img className="screenshot-full" src="/img/how-to/display-table-record-on-new-page/build-app.png" alt="Build the app" />
2. Now add another page inside the app using the panel on the left.
<img className="screenshot-full" src="/img/how-to/display-table-record-on-new-page/add-new-page.png" alt="Add a new page" />
3. Set up the second page with the required fields and components.
<img className="screenshot-full" src="/img/how-to/display-table-record-on-new-page/setup-second-page.png" alt="Setup the second page" />

</div>

<div style={{paddingTop:'24px'}}>

## Setting up Event Handlers

Now click on your **Table** component and in the properties section under Events, click on **+ New event handler**.

Enter the following parameters:
- Event: **Row Clicked**
- Action: **Set variable**
- Key: **emp_name** *(Enter your desired variable name)*
- Value: `{{components.table1.selectedRow.name}}`

This event will save the student id value in the specified variable, which can be accessed on another page. Similarly, you can save all the required values in different separate variables to access on another page.

<img className="screenshot-full" src="/img/how-to/display-table-record-on-new-page/set-variable.png" alt="Add event handler to set variables"/>

Again click on **+ New event handler** and enter the following parameters:

- Event: **Row Clicked**
- Action: **Switch page**
- Page: **Employee Details** *(Select your desired page from the dropdown)*

This event will switch the page whenever a record is clicked.

<img className="screenshot-full" src="/img/how-to/display-table-record-on-new-page/switch-page.png" alt="Add event handler to switch page"/>

</div>

<div style={{paddingTop:'24px'}}>

## Displaying Details on Another Page

Now, you can access the values stored in the variables from the previous page. Set the default value of the text input component using `{{variables.<variable_name>}}`.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/how-to/display-table-record-on-new-page/passing-var.png" alt="Passing Data via Variables"/>

</div>
