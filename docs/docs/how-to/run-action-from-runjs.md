---
id: run-actions-from-runjs
title: Run Actions from RunJS query
---

# Run `Actions` from RunJS query

Now you can trigger all the `actions` available in ToolJet from within the `RunJS` query. This guide includes the syntax for each action along with the example.

### Run Query

**Syntax:**

```js
queries.queryName.run()
```
or
```js
await actions.runQuery('queryName') 
```

**Example:** In the screenshot below, we are triggering the two different queries `customers` and `getData` using the two different syntax available for `Run Query` action.

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Run Actions from RunJS query](/img/how-to/run-actions-from-runjs/runquery.png)

</div>

### Get Query Data

To obtain the latest data returned by a specific query, you can use the below functions. 

#### Retrieve the latest data of a query:
```js
let value = queries.<queryName>.getData();
return value;
```

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0' }} className="screenshot-full" src="/img/how-to/run-actions-from-runjs/get-query-data.png" alt="Get Latest Query Data" />
</div>

#### Retrieve the latest raw data of a query:
```js
let value = queries.<queryName>.getRawData();
return value;
```

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0'}} className="screenshot-full" src="/img/how-to/run-actions-from-runjs/get-raw-query-data.png" alt="Get Raw Query Data" />
</div>

#### Retreive the loading state of a query:
```js
let value = queries.<queryName>.getLoadingState();
return value;
```
<div style={{textAlign: 'center'}}>
    <img style={{ border:'0'}} className="screenshot-full" src="/img/how-to/run-actions-from-runjs/get-loading-state.png" alt="Get Loading State" />
</div>

### Set Variables

**Syntax:**

```javascript
actions.setVariable(variableName, variableValue)
```

**Example:** In the screenshot below, we are setting the two variables `test` and `test2`. `test` variable includes a numerical value so we haven't wrapped it inside the quotes but the variable `test2` is a string so we have wrapped it in quotes.

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Run Actions from RunJS query](/img/how-to/run-actions-from-runjs/setvariable.png)

</div>

### Unset Variable

**Syntax:**

```javascript
actions.unSetVariable(variableName)
```

**Example:** In the screenshot below, we are unsetting the variable `test2` that we created in the previous step.

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Run Actions from RunJS query](/img/how-to/run-actions-from-runjs/unsetvariable.png)

</div>

### Logout

**Syntax:**

```javascript
actions.logout()
```

**Example:** Triggering `actions.logout()` will log out the current logged in user from the ToolJet and will redirect to sign in page.

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Run Actions from RunJS query](/img/how-to/run-actions-from-runjs/logout.png)

</div>

### Show Modal

**Syntax:**

```javascript
actions.showModal('modalName')
```

**Example:** In the screenshot below, there is a modal on the canvas (renamed it to `formModal` from `modal1`) and we are using RunJS query to show the modal.

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Run Actions from RunJS query](/img/how-to/run-actions-from-runjs/showmodal.png)

</div>

### Close Modal

**Syntax:**

```javascript
actions.closeModal('modalName')
```

**Example:** In the screenshot below, we have used RunJS query to close the modal that we showed up in previous step.

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Run Actions from RunJS query](/img/how-to/run-actions-from-runjs/closemodal.png)

</div>

### Set Local Storage

**Syntax:**

```javascript
actions.setLocalStorage('key','value')
```

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Run Actions from RunJS query](/img/how-to/run-actions-from-runjs/setlocalstorage.png)

</div>

### Copy to Clipboard

**Syntax:**

```javascript
actions.copyToClipboard('contentToCopy')
```

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Run Actions from RunJS query](/img/how-to/run-actions-from-runjs/copytoclipboard.png)

</div>

### Generate File

**Syntax:**

```js
actions.generateFile('fileName', 'fileType', 'data')
```
`fileName` is the name that you want to give the file(string), `fileType` can be `csv`, `plaintext`, or `pdf` and the `data` is the data that you want to store in the file.

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

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Run Actions from RunJS query](/img/how-to/run-actions-from-runjs/generatefile.png)

</div>

### Go to App

**Syntax:**

```javascript
actions.goToApp('slug',queryparams) 
```

- `slug` can be found in URL of the released app after the `application/`, or in the `Share` modal
- `queryparams` can be provided like this `[{"key":"value"}, {"key2":"value2"}]`

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Run Actions from RunJS query](/img/how-to/run-actions-from-runjs/gotoapp1.png)

</div>

### Show Alert

**Syntax:**

```javascript
actions.showAlert(alert type , message ) // alert types are info, success, warning, and danger

ex:
actions.showAlert('error' , 'This is an error' )
```

<div style={{textAlign: 'center'}}>

![ToolJet - How To - Run Actions from RunJS query](/img/how-to/run-actions-from-runjs/showalert.png)

</div>

## Run multiple actions from runjs query

To run multiple actions from a runjs query, you'll have to use **async-await** in the function.

Here is a example code snippet for running the queries and showing alert after specific intervals. Check the complete guide on running queries at specified intervals **[here](/docs/how-to/run-query-at-specified-intervals)**.

```js
actions.setVariable('interval',setInterval(countdown, 5000));
async function countdown(){
  await queries.restapi1.run()
  await queries.restapi2.run()
  await actions.showAlert('info','This is an information')
}
```

## Get Variables

To access variables through actions, you can use the below functions.

#### Retrieve the current value of a variable: 
```js
let value = actions.getVariable('<variableName>');
return value;
```

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBotton:'15px' }} className="screenshot-full" src="/img/how-to/run-actions-from-runjs/get-variable.png" alt="Get Variable Action" />
</div>

#### Retrieve the current value of a page-specific variable:
```js
let value = actions.getPageVariable('<pageVariableName>');
return value;
```
<div style={{textAlign: 'center'}}>
    <img style={{ border:'0' }} className="screenshot-full" src="/img/how-to/run-actions-from-runjs/get-page-variable.png" alt="Get Page Variable Action" />
</div>






