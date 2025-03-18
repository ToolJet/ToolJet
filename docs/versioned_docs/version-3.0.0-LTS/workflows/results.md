---
id: results
title: Configuring Response
---

Users have the flexibility to customize the response returned by workflows. The **Response** node enables configuration of your output through JavaScript code. Each workflow can have multiple response nodes. 

## Return Data from a Single Node
Consider a workflow that combines sales data (from the *getSalesData* node) with inventory data (from the *getInventory* node) via a JavaScript operation (in the *generateCSVData* node).

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/workflows/results/v2/response-nodes-preview.png" alt="Response Node Preview" />
</div>

Within the **Response** node, specify the output by using a return statement that encapsulates an object within parentheses:

```js
return ({generateCSVData})
```

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/workflows/results/v2/single-node-response.png" alt="Single Node Response" />
</div>


## Returning Data From Multiple Nodes
You can also return data from other nodes. Either return the complete data set or specify only the required portions, as demonstrated below:

```js
return 
    ({sales: getSalesData.data,
    inventory: getInventory.data,
    csv: generateCSVData.data})
```

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/workflows/results/v2/multi-node-response.png" alt="Multi Node Response" />
</div>

## Fine Tuning Your Response Using JavaScript
Refine your response by manipulating the data using JavaScript functions. For example, the slice function can be used to select a subset of data:

```js
return 
    ({sales: getSalesData.data.slice(0,5),
    inventory: getInventory.data.slice(0,5),
    csv: generateCSVData.data})        
```

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/workflows/results/v2/transformed-response.png" alt="Transformed Response" />
</div>

## Workflow Execution

When executing workflows with triggers, the configured data in the **Response** node will be included in the API response. When triggered inside a ToolJet app, the data will be returned in the same format as a regular query.



