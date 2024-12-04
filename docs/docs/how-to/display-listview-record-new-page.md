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
<img className="screenshot-full" src="/img/how-to/display-listview-record-on-new-page/build-app.png" alt="Build the app"  />
2. Now add an another page inside the app using the panel in the left.
<img className="screenshot-full" src="/img/how-to/display-listview-record-on-new-page/add-new-page.png" alt="Add a new page"  />
3. Setup the second page with required fields and components.
<img className="screenshot-full" src="/img/how-to/display-listview-record-on-new-page/setup-second-page.png" alt="Setup the second page"  />

</div>

<div style={{paddingTop:'24px'}}>

## Setting up Event Handlers

Now click on the **Listview** component and in the properties section under Events, click on **+ New event handler**.

Enter the following parameters:
- Event: **Record Clicked**
- Action: **Set variable**
- Key: **emp_name** *(Enter your desired variable name)*
- Value: `{{components.listview1.selectedRecord.text1.text}}`

This event will save the record value in the specified variable, which can be accessed on another page. Similarly, you can save all the required values in different separate variables to access on another page.

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

Now, you can access the values stored in the variables from the previous page. Set the default value of the text input component using `{{variables.<variable_name>}}`.

<img className="screenshot-full" src="/img/how-to/display-listview-record-on-new-page/display-data.png" alt="Display data on the new page"/>

</div>