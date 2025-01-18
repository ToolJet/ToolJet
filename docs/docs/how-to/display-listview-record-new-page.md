---
id: display-listview-record-on-new-page
title: Display Listview Record Details on a New Page
---

This guide explains how to display details of a selected record from a **Listview** component on a new page in ToolJet. This approach is ideal for applications requiring detailed views of records, such as customer profiles, order details, or product information.

<div style={{paddingTop:'24px'}}>

## Build the App

1. Drag a **Listview** component and setup other required components.
<img className="screenshot-full" src="/img/how-to/display-listview-record-on-new-page/build-app.png" alt="Build the app"  />
2. Add another page inside the app using the left panel.
<img className="screenshot-full" src="/img/how-to/display-listview-record-on-new-page/add-new-page.png" alt="Add a new page"  />
3. Setup the second page with required fields and components.
<img className="screenshot-full" src="/img/how-to/display-listview-record-on-new-page/setup-second-page.png" alt="Setup the second page"  />

</div>

<div style={{paddingTop:'24px'}}>

## Setting up Event Handlers

Add a new event handler with the following configurations:
- Event: **Record Clicked**
- Action: **Set variable**
- Key: **selectedEmp** *(Enter your desired variable name.)*
- Value: 
    ```json
    {{[{ 
        name: components.listview1.selectedRecord.text17.text,
        designation: components.listview1.selectedRecord.text15.text,
        department: components.listview1.selectedRecord.text14.text 
    }]}}
    ```

This event will save the record value in the specified variable, which can be accessed on another page. 

<img className="screenshot-full" src="/img/how-to/display-listview-record-on-new-page/set-variable.png" alt="Add event handler to set variables"/>

Again, click on **+ New event handler** and configure it with the following settings to switch the page when a record is clicked:

- Event: **Record Clicked**
- Action: **Switch page**
- Page: **Employee Details** *(Select your desired page from the dropdown.)*

This event will switch the page whenever a record is clicked.

<img className="screenshot-full" src="/img/how-to/display-listview-record-on-new-page/switch-page.png" alt="Add event handler to switch page"/>

</div>

<div style={{paddingTop:'24px'}}>

## Displaying Info on Another Page

Now, you can access the values stored in the variables from the previous page. Set the default value of the text input component using `{{variables.<variable_name>[0].<key>}}`, example, `{{variables.selectedEmp[0].name}}`.

<img className="screenshot-full" src="/img/how-to/display-listview-record-on-new-page/display-data.png" alt="Display data on the new page"/>

</div>