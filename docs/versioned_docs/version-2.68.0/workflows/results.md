---
id: results
title: Configuring Results
---

Users have the flexibility to customize the results returned by workflows. The **Result** node enables configuration of your output through JavaScript code.

## Return Data from a Single Node
Consider a workflow that integrates product data (from the *products* node) with sales data (from the *sales* node) via a JavaScript operation (in the *collatedData* node).

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/workflows/results/collated-data-workflow-preview.png" alt="Collate Data Workflow" />
</div>

Within the **Result** node, specify the output by using a return statement that encapsulates an object within parentheses:

```js
return ({collatedData})
```

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/workflows/results/return-results.png" alt="Return Results Preview" />
</div>


## Returning Data From Multiple Nodes
You can also return data from other nodes. Either return the complete data set or specify only the required portions, as demonstrated below:

```js
return ({collatedData: collatedData.data,
		products: products.data,
		sales: sales.data})
```

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/workflows/results/return-results-from-other-nodes.png" alt="Return Results From All Nodes" />
</div>

## Fine Tuning Your Result Using JavaScript
Refine your result by manipulating the data using JavaScript functions. For example, the slice function can be used to select a subset of data:

```js
return ({collatedData: collatedData.data,
		products: products.data.products.slice(0,2),
		sales: sales.data.slice(0,2)})
```

## Workflow Execution

When executing workflows with triggers, the configured data in the **Result** node will be included in the API response.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/workflows/results/using-triggers.png" alt="Using Triggers to Return Data" />
</div>
