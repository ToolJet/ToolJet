---
id: print-multi-tabs-report
title: Print Data from Multiple Tabs
---
<div style={{paddingBottom:'24px'}}>

In this guide, we will implement printing data from multiple tabs in ToolJet. This will be useful when printing an invoice or a report from your ToolJet application. For example, a ToolJet app that has a set of tabs for each invoice, and you want to print all the tabs in one go.


</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## UI of the App

On the ToolJet homepage, click on the ellipses on the `Create new app` button. Choose an app with a set of tabs for each record. Each tab will have a set of fields to display. For this guide, we will be using the **Lead Management System** app.

In the example below, we have the **Tabs** component and each tab has a set of fields to display the record details.

- **Tabs**: Each tab represents different type of lead record. For this app, we have 4 tabs. Each tab has an id starting from 0 to 4.

- **Button**: The **Create Lead** button is the deafult button. For this guide, we will also add another button named **Download PDF**, that will print the data from all the tabs. The button will have two events, the details for which we will share later in this guide.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/print-multitabs/appui-v2.png" alt="Print data from multiple tabs" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Load Data from Database

- To load the data from the database, we will use the **lead_management_system** table.
- In the *fetchLeads* query, choose `lead_management_system` in `Table name` parameter.
- Choose `List rows` in the `Operations` parameter.
- Click on the **Run** button in the query panel to load the data.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/print-multitabs/data-v2.png" alt="Print data from multiple tabs" />
</div>

Once the data is successfully loaded on the tabs and the app is working as expected, we can move to the next step.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Printing Data from Multiple Tabs

To print data from multiple tabs, we will create few JavaScript queries. Using event handlers, we will run these JavaScript queries in a sequence to print data from all the tabs. 

Before we start creating the JavaScript queries, we need to add a few events to the **Download PDF** button:

| <div style={{ width:"100px"}}> Event </div> | <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"100px"}}> Description </div> |
|:--- |:--- |:--- |
| On click | Set variable | Set a variable with key `lastSelectedTab` and value to `{{components.tabs1.currentTab}}`. This will store the id of the currently selected tab in the variable. |
| On click | Run query | Select the query named *viewTabs* to run when the button is clicked. |

**Note**: We will create the *viewTabs* query later in this guide, so you will need to add the event to the button after you've created the query.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/print-multitabs/buttonevents-v2.png" alt="Print data from multiple tabs" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Creating Queries

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### viewTabs Query

The *viewTabs* query is a JavaScript query that will run a loop to print data from all the tabs. The query will set a variable `tabIndex` that will store the id of the tab to print data from. The query for this app will loop and increment the tabsIndex variable by 1, using the setVariable action, till the value is less than 4.

```js title="viewTabs"
if ((variables?.tabIndex ?? undefined) == undefined) { 
  await actions.setVariable("tabIndex", "0"); // set tabIndex to 0 if it is not set
} else if (parseInt(variables.tabIndex) < 4){
  await actions.setVariable("tabIndex", (parseInt(variables.tabIndex) + 1).toString()); // increment tabIndex by 1
}
```

**This query will have 3 events:**

#### Event 1:

- In the *viewTabs* query, click on the **New event handler** button, for the event type, choose `Query Success` from the dropdown.
- Choose `Control component` as the **Action** for the event.
- In the **Run only if** parameter of the event, copy the code: `{{parseInt(variables.tabIndex) < 4}}`. This will run only if the output of the given code is true, i.e. if the tabIndex is less than 4.
- Under the **ACTION OPTIONS** of the event, choose **Action** as `Set current tab`.
- Copy the code: `{{variables.tabIndex}}` in the Id parameter. This sets the current tab to the tab with id stored in the tabIndex variable, i.e. it sets the current tab to the tab whose id got recently stored in the `tabIndex` variable via the *viewTabs* query.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/print-multitabs/q1-v2.png" alt="Print data from multiple tabs" />
</div>

#### Event 2:

- The second event in this query will also be a `Query Success` event.
- Choose `Run Query` as the **Action** for the event.
- In the **Run Only If** parameter, copy the code: `{{parseInt(variables.tabIndex) < 4}}`. This event will run only if the condition given in the code is true.
- The query for this event handler will be `getTabsHTML`.
- Add a **Debounce** of `100` milliseconds to this event handler.

**Note:** We will create the *getTabsHTML* query later in this guide, so you will need to add the event to the button after you've created the query.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/print-multitabs/q2-v2.png" alt="Print data from multiple tabs" />
</div>

#### Event 3:

- The third event in this query will also be a `Query Success` event.
- Choose `Run Query` as the **Action** for the event.
- In the **Run Only If** parameter, copy the code: `{{parseInt(variables.tabIndex) === 4}}`. This action runs only when the `tabIndex` is equal to 4, i.e. the last iteration of the loop and we will print the data from all the tabs in this iteration.
- The query for this event handler will be `printPDF`.

**Note:** We will create the *printPDF* query later in this guide, so you will need to add the event to the button after you've created the query.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/print-multitabs/q3-v2.png" alt="Print data from multiple tabs" />
</div>

Now that we have created the *viewTabs* query, we can go to the **[Download PDF](/docs/how-to/print-multi-tabs-report#printing-data-from-multiple-tabs)** button and add the *viewTabs* query to the `On click` event handler.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### getTabsHTML Query

The *getTabsHTML* is a JavaScript query that will get the HTML of the current tab and store it in a variable. The query will have a variable `tabsHtml` that will store the HTML of all the tabs in the form of an array.

```js title="getTabsHTML"
actions.setVariable( // set tabsHtml variable
  "tabsHtml", 
  [...(variables?.tabsHtml ?? [])].concat([  // add html of the current tab to the tabsHtml variable
    ((variables?.tabIndex ?? -1) > 0 
      ? `<div style="top: ${ // add a div with height of 100vh to the html of the current tab
          variables?.tabIndex ?? -1 
        }00vh; position: absolute;">` // this will help to print data from all the tabs in one go
      : "") + 
      document.getElementsByClassName("widget-" + components.tabs1.id)[0] // get the html of the current tab
        .innerHTML +
      "</div>", // add the html of the current tab to the tabsHtml variable
  ])
);
```

**This query will have 1 event:**

#### Event 1:

- The event in this query will be a `Query Success` event.
- This event will have an **Action** of `Run Query`.
- In the **Query** Parameter, choose *viewTabs* as the query. This will run the *viewTabs* query after the *getTabsHTML* query is successfully executed.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/print-multitabs/gettabshtml-v2.png" alt="Print data from multiple tabs" />
</div>

Now that we have created the *getTabsHTML* query, we can go to the *viewTabs* query and in the **Event 2** of that query, add the *getTabsHTML* query to the event handler.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### printPDF Query

The *printPDF* query is a JavaScript query that generates a printable document from the HTML content stored in the `tabsHtml` variable. This query will open a new window and write the HTML content of all the tabs. This will allow the user to download a PDF document that includes the formatted content of all the tabs.

```js title="printPDF"
var printContents = variables.tabsHtml; // get the html of all the tabs from the tabsHtml variable

var winPrint = window.open("", "", "width=900,height=650"); // Open a New Window for Printing

var styles = document.querySelectorAll('link, style');
var stylesHtml = "";
for (var i = 0; i < styles.length; i++) {
  stylesHtml += styles[i].outerHTML;
}                                       // gather styles from the current page

stylesHtml += '<style>@page { size: landscape; }</style>'; // add landscape orientation to the page

winPrint.document.write(
  "<html><head>" +
    stylesHtml +
    "</head><body>" 
); // add styles to the page

for (var j = 0; j < printContents.length; j++) {
  winPrint.document.write(printContents[j]);
} // add html of all the tabs to the page

winPrint.document.write("</body></html>"); // Document Finalization and Printing
winPrint.document.close();
winPrint.focus();
winPrint.print();
winPrint.close();
```

**This query will have 3 events:**

#### Event 1:

- In the *printPDF* query, click on the **New event handler** button, for the event type, choose `Query Success` from the dropdown.
- Choose `Unset variable` as the **Action** for the event.
- Under the **ACTION OPTIONS** of the event, set `tabsIndex` as the **Key**. This will unset the tabsIndex variable after the *printPDF* query is successfully executed.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/print-multitabs/unsetvar1-v2.png" alt="Print data from multiple tabs" />
</div>

#### Event 2:

- The second event in this query will also be a `Query Success` event.
- Choose `Unset variable` as the **Action** for the event.
- Under the **ACTION OPTIONS** of the event, set `tabsHtml` as the **Key**. This will unset the `tabsHtml` variable after the *printPDF* query is successfully executed.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/print-multitabs/unsetvar2-v2.png" alt="Print data from multiple tabs" />
</div>

#### Event 3:

- The third event in this query will also be a `Query Success` event.
- Choose `Control component` as the **Action** for the event.
- Choose `tabs1` for the **Component** parameter.
- Choose `Set current tab` as the **Action**.
- For the Id parameter, copy the code: `{{variables.lastSelectedTab}}`. This will set the current tab to the tab that was selected before the **Download PDF** button was clicked.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/print-multitabs/controlcomp2-v2.png" alt="Print data from multiple tabs" />
</div>

Now that we have created the *printPDF* query, we can go to the *viewTabs* query, and in the **Event 3** of that query, add the *printPDF* query to the **Query Success** event handler.

Finally, we can test the app by clicking on the **Download PDF** button. This will redirect us to the new tab of the browser, and  download a PDF document with the data from all the tabs.

</div>

</div>