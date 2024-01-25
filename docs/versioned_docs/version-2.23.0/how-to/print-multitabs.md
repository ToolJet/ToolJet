---
id: print-multi-tabs-report
title: Print data from multiple tabs
---


In the guide, we will learn how to print data from multiple tabs in ToolJet. This will be useful when you want to print an invoice or a report from your ToolJet application. For example, a tooljet app that has a set of tabs for each invoice and you want to print all the invoices in one go.


## UI of the app

Build an app with a set of tabs for each record. Each tab will have a set of fields to display the invoice details. In the example below, we have a tabs component and each tab has a set of fields to display the record details.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

**Dropdown**: For selecting the specific patient whose data user want to load in the tabs. 

**Tabs**: Each tab represents different type of medical record for the selected patient. For this app, we have 5 tabs for each patient. Each tab has a id starting from 0 to 4.

**Button**: Clicking on the button will print the data from all the tabs. The button will have an event added to run a javascript query that we will create later in the guide.

</div>

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/print-multitabs/appui.png" alt="Print data from multiple tabs" />
</div>

## Load data from database

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

For this app, we are using tooljet database with table name `patient_data`. We created a query called `getPatientList` to fetch data from the database.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/print-multitabs/data.png" alt="Print data from multiple tabs" />
</div>

</div>

Once the data is successfully loaded on the tabs and the app is working as expected, we can move to the next step.

## Printing data from multiple tabs

To print data from multiple tabs, we will create few javascript queries. Using event handlers, we will run these javascript queries in a sequence to print data from all the tabs. 

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

Before we start creating the javascript queries, we need to add a few events to the button component:

| Event | Action | Description |
|:--- |:--- |:--- |
| `onClick` | Set variable | Set a variable with key `lastSelectedTab` and value to `{{components.tabs1.currentTab}}`. This will store the id of the currently selected tab in the variable. |
| `onClick` | Run query | Select the query named `viewTabs` to run when the button is clicked. |

**Note**: We will create the `viewTabs` query later in guide so you will need to add the event to the button once you create the query.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/print-multitabs/buttonevents.png" alt="Print data from multiple tabs" />
</div>

</div>

### viewTabs query

The `viewTabs` is javascript query that will run a loop to print data from all the tabs. The query will have a variable `tabIndex` that will store the id of the tab to print data from. The query will run a loop until the `tabIndex` is less than 5. The query will have a `setVariable` action to increment the `tabIndex` by 1 after each iteration.

```js title="viewTabs"
if ((variables?.tabIndex ?? undefined) == undefined) { 
  await actions.setVariable("tabIndex", "0"); // set tabIndex to 0 if it is not set
} else if (parseInt(variables.tabIndex) < 5){
  await actions.setVariable("tabIndex", (parseInt(variables.tabIndex) + 1).toString()); // increment tabIndex by 1
}
```

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

**This query will have 3 events handlers:**

**1. Query Success:**

For the first Query Success event handler, we will add a `Control component` action which will `Run only if` `{{parseInt(variables.tabIndex) < 5}}` is true. This will run the action only if the `tabIndex` is less than 5. This action will control the `Tabs` component to `Set current tab` to `{{variables.tabIndex}}`. This will set the current tab to the tab with id stored in the `tabIndex` variable. The index of the tab will be incremented by 1 after each iteration.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/print-multitabs/q1.png" alt="Print data from multiple tabs" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

**2. Query Success:**

For the second Query Success event handler, we will select `Run Query` action which will `Run only if` `{{parseInt(variables.tabIndex) < 5}}` is true. The query for this event handler will be `getTabsHTML`. We will also add a `debounce` of `100` milliseconds to this event handler.

**Note:** we will create the `getTabsHTML` query later in the guide so you will need to add the event to the button once you create the query.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/print-multitabs/q2.png" alt="Print data from multiple tabs" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

**3. Query Success:**

For the third Query Success event handler, we will select `Run Query` action which will `Run only if` `{{parseInt(variables.tabIndex) === 5}}` is true. The query for this event handler will be `printPDF`. This action will only run when the `tabIndex` is equal to 5. This will be the last iteration of the loop and we will print the data from all the tabs in this iteration.

**Note:** we will create the `getTabsHTML` query later in the guide so you will need to add the event to the button once you create the query.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/print-multitabs/q3.png" alt="Print data from multiple tabs" />
</div>

</div>

### getTabsHTML query

The `getTabsHTML` is javascript query that will get the html of the current tab and store it in a variable. The query will have a variable `tabsHtml` that will store the html of all the tabs.

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

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

**This query will have 1 event handler:**

**1. Query Success:**

This event handler will have an action to `Run Query` named `viewTabs`. This will run the `viewTabs` query after the `getTabsHTML` query is successfully executed.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/print-multitabs/gettabshtml.png" alt="Print data from multiple tabs" />
</div>

</div>

### printPDF query

The `printPDF`` query is a JavaScript query that generates a printable document from the HTML content stored in the `tabsHtml` variable. This query will open a new window and write the HTML content of all the tabs. This will allow the user to download a PDF document that includes the formatted content of all the tabs.

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
    "</head><body>" +
  	`<img src="https://img.freepik.com/free-vector/hospital-logo-design-vector-medical-cross_53876-136743.jpg" class="zoom-image-wrap" style="object-fit: contain; width: 177.86px; height: 36px; position: absolute; top: 100px;">`
); // add styles and logo to the page

for (var j = 0; j < printContents.length; j++) {
  winPrint.document.write(printContents[j]);
} // add html of all the tabs to the page

winPrint.document.write("</body></html>"); // Document Finalization and Printing
winPrint.document.close();
winPrint.focus();
winPrint.print();
winPrint.close();
```

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

**This query will have 3 events handlers:**

**1. Query Success:**

This event will have an action to `Unset Variable` named `tabsIndex`. This will unset the `tabsIndex` variable after the `printPDF` query is successfully executed.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/print-multitabs/unsetvar1.png" alt="Print data from multiple tabs" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

**This query will have 3 events handlers:**

**2. Query Success:**

This event will have an action to `Unset Variable` named `tabsIndex`. This will unset the `tabsIndex` variable after the `printPDF` query is successfully executed.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/print-multitabs/unsetvar2.png" alt="Print data from multiple tabs" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

**This query will have 3 events handlers:**

**3. Query Success:**

This event will have an action to `Control component`. This will control the `Tabs` component to `Set current tab` to `{{variables.lastSelectedTab}}` after the `printPDF` query is successfully executed. This will set the current tab to the tab that was selected before the `Download` button was clicked.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/print-multitabs/controlcomp2.png" alt="Print data from multiple tabs" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

Now, we can test the app by selecting a patient and clicking on the `Download` button. This will download a PDF document with the data from all the tabs.

</div>