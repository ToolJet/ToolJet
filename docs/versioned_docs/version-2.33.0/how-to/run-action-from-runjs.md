---
id: run-actions-from-runjs
title: Run Actions from RunJS query
---

ToolJet allows you to execute various [actions](/docs/actions/show-alert) within RunJS queries. This guide outlines the syntax and examples for each action.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Run Query Action

**Syntax:**

```js
queries.getSalesData.run()
// replace getSalesData with your query name
```
or
```js
await actions.runQuery('getSalesData') 
// replace getSalesData with your query name
```

**Example:**

In the following screenshot, we demonstrate triggering two different queries, `getCustomers` and `updateCustomers`, using the two available syntax options for the `Run Query` action.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/run-actions-from-runjs/runqueryn.png" alt="Print data from multiple tabs" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Set Variable Action

**Syntax:**

```javascript
actions.setVariable(variableName, variableValue);
```

**Example:**

In this example, we set two variables, `test` and `test2`. Note that `test` contains a numerical value, so it is not wrapped in quotes, while `test2` is a string and is wrapped in quotes.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/run-actions-from-runjs/setvariablen.png" alt="Print data from multiple tabs" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Unset Variable Action

**Syntax:**

```javascript
actions.unSetVariable(variableName);
```

**Example:**

In the following screenshot, we unset the variable `test2` that was created in the previous step.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/run-actions-from-runjs/unsetvarn.png" alt="Print data from multiple tabs" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Logout Action

**Syntax:**

```javascript
actions.logout();
```

**Example:**

Executing `actions.logout()` will log out the current user from ToolJet and redirect to the sign-in page.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/run-actions-from-runjs/logoutn.png" alt="Print data from multiple tabs" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Show Modal Action

**Syntax:**

```javascript
actions.showModal('modalName');
```

**Example:**

In this example, a modal named `formModal` is present on the canvas, and we use a RunJS query to show the modal.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/run-actions-from-runjs/showmodaln.png" alt="Print data from multiple tabs" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Close Modal Action

**Syntax:**

```javascript
actions.closeModal('modalName');
```

**Example:**

Here, we use a RunJS query to close the modal that was shown in the previous step.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/run-actions-from-runjs/closemodaln.png" alt="Print data from multiple tabs" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Set Local Storage Action

**Syntax:**

```javascript
actions.setLocalStorage('key', 'value');
```

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/run-actions-from-runjs/setlocaln.png" alt="Print data from multiple tabs" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Copy to Clipboard Action

**Syntax:**

```javascript
actions.copyToClipboard('contentToCopy');
```

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/run-actions-from-runjs/copytoclip.png" alt="Print data from multiple tabs" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Generate File Action

**Syntax:**

```js
actions.generateFile('fileName', 'fileType', 'data');
```

Example for generating a CSV file:

```js
actions.generateFile('csvfile1', 'csv', '{{components.table1.currentPageData}}')
```

Example for generating a Text file:

```js
actions.generateFile('textfile1', 'plaintext', '{{JSON.stringify(components.table1.currentPageData)}}');
```

Example for generating a PDF file:

```js
actions.generateFile('Pdffile1', 'pdf', '{{components.table1.currentPageData}}');
```

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/run-actions-from-runjs/generatefilen.png" alt="Print data from multiple tabs" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Go to App Action

**Syntax:**

```javascript
actions.goToApp('slug', queryparams)
```

- `slug` can be found in the URL of the released app after the `application/`, or in the `Share` modal. You can also set a custom slug for the app in the `Share` modal or from the global settings in the app builder.
- `queryparams` can be provided like this `[{"key":"value"}, {"key2":"value2"}]`.
- Only the apps that are released can be accessed using this action.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/run-actions-from-runjs/gotoappn.png" alt="Print data from multiple tabs" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Show Alert Action

**Syntax:**

```js
actions.showAlert(alertType, message); // alert types are info, success, warning, and error
```

**Example:**

```js
actions.showAlert('error', 'This is an error')
```

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/run-actions-from-runjs/showalertn.png" alt="Print data from multiple tabs" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Run Multiple Actions from RunJS Query

To run multiple actions from a RunJS query, use **async-await** in the function. Here's an example code snippet for running queries and showing an alert at specific intervals:

```js
actions.setVariable('interval', setInterval(countdown, 5000));

async function countdown() {
  await queries.restapi1.run();
  await queries.restapi2.run();
  await actions.showAlert('info', 'This is an information');
}
```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Actions on pages

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Switch page

To switch to a page from the JavaScript query, use the following syntax:

```js
await actions.switchPage('<page-handle>')
```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Switch page with query parameters

Query parameters can be passed through action such as Switch Page. The parameters are appended to the end of the application URL and are preceded by a question mark (?). Multiple parameters are separated by an ampersand (&).

To switch to a page with query parameters from the JavaScript query, use the following syntax:

```js
actions.switchPage('<pageHandle>', [['param1', 'value1'], ['param2', 'value2']])
```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Set page variable

Page variables are restricted to the page where they are created and cannot be accessed throughout the entire application like regular variables.

To set a page variable from the JavaScript query, use the following syntax:

```js
await actions.setPageVariable('<variablekey>',<variablevalue>)
```

</div>

</div>

This enhanced guide provides a detailed walkthrough of executing various ToolJet actions from RunJS queries.