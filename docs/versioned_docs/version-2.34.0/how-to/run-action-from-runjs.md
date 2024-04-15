---
id: run-actions-from-runjs
title: Run Actions from RunJS query
---

ToolJet allows you to execute various [actions](/docs/actions/show-alert) within RunJS queries. This guide outlines the syntax and examples for each action.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Run Query 

To trigger a query, you can use the below functions:

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

In the screenshot below, we are triggering two different queries using two different syntax available for `Run Query` action.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/run-actions-from-runjs/runquery-v3.png" alt="Print data from multiple tabs" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Get Query Data

In the previous section, we saw how we can trigger queries. Once the queries are triggered, if you want to immediately use the data returned by the query inside the RunJS query, you can use the `getData()`, `getRawData()` and `getLoadingState()` functions:

#### Trigger a query and retrieve its data:

```js
await queries.getSalesData.run(); 
// replace getSalesData with your query name

let value = queries.getSalesData.getData(); 
// replace getSalesData with your query name
```

#### Trigger a query and retrieve its raw data:

```js
await queries.getCustomerData.run(); 
//replace getCustomerData with your query name

let value = queries.getCustomerData.getRawData(); 
// replace getCustomerData your with query name
```

#### Trigger a query and retrieve its loading state:

```js
await queries.getTodos.run()
//replace getTodos with your query name

let value = queries.getTodos.getLoadingState();
//replace getTodos with your query name
```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Set Variables

To create a variable, you can use the below function:

```javascript
actions.setVariable('<variableName>', `<variableValue>`)
```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Unset Variable

To delete a created variable, you can use the below function:

**Syntax:**

```javascript
actions.unSetVariable('<variableName>')
```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Get Variables

To access variables immediately after setting them in a RunJS query, you can use the `getVariable` and `getPageVariable` functions:

#### Set and retrieve a variable: 

```js
actions.setVariable('mode','dark');
//replace mode with your desired variable name

return actions.getVariable('mode');
```

#### Set and retrieve a page-specific variable:
```js
actions.setPageVariable('number',1);
//replace number with your desired variable name

return actions.getPageVariable('number');
```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Logout

To log out the current logged-in user from the ToolJet, use the below function:

```javascript
actions.logout();
```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Show Modal

To open a modal using RunJS query, use the below function:

```javascript
actions.showModal('<modalName>')
```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Close Modal

To close a modal using RunJS query, use the below function:

```javascript
actions.closeModal('<modalName>')
```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Set Local Storage 

Set a value in local storage using the below code:

**Syntax:**

```javascript
actions.setLocalStorage('key', 'value');
```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Copy to Clipboard

Use the below code to copy content to the clipboard:

```javascript
actions.copyToClipboard('<contentToCopy>')
```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Generate File

The below action can be used to generate a file.

```js
actions.generateFile('<fileName>', '<fileType>', '<data>')
```

`fileName` is the name that you want to give the file(string), `fileType` can be **csv**, **plaintext**, or **pdf** and `data` is the data that you want to store in the file.

Example for generating CSV file:

```js
actions.generateFile('csvfile1', 'csv', '{{components.table1.currentPageData}}') // generate a csv file named csvfile1 with the data from the current page of table
```

Example for generating Text file:

```js
actions.generateFile('textfile1', 'plaintext', '{{JSON.stringify(components.table1.currentPageData)}}') // generate a text file named textfile1 with the data from the current page of table (stringified)
```

Example for generating PDF file:

```js
actions.generateFile('Pdffile1', 'pdf', '{{components.table1.currentPageData}}') // generate a text file named Pdffile1 with the data from the current page of table
```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Go to App

You can switch to a different application using the below action:

```javascript
actions.goToApp('slug',queryparams) 
```

- `slug` can be found in URL of the released app after `application/` or in the share modal that opens up when you click on the `Share` button on the top-right of the app-builder
- `queryparams` can be provided in this format - `[{"key":"value"}, {"key2":"value2"}]`

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Show Alert

To show an alert using RunJS query, use the below code:

```js
actions.showAlert('<alert type>' , '<message>' )
```

Available alert types are `info`, `success`, `warning`, and `danger`.

Example:
```js
actions.showAlert('error' , 'This is an error' )
```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Run Multiple Actions From RunJS Query

To run multiple actions from a RunJS query, you'll have to use **async-await** in the function.

Here is a example code snippet for running the queries and showing alert after specific intervals. Check the complete guide on running queries at specified intervals **[here](/docs/how-to/run-query-at-specified-intervals)**.

```js
actions.setVariable('interval',setInterval(countdown, 5000));
async function countdown(){
  await queries.restapi1.run()
  await queries.restapi2.run()
  await actions.showAlert('info','This is an information')
}
```

</div>
