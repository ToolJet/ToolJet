---
id: response
title: Response Node
---

<br/>

The Response node defines the final output of your workflow. You can use it to specify what data should be returned once the workflow completes. Workflows can include a single Response node or multiple ones if you want to return different results based on conditions or branches.

<img className="screenshot-full img-full" style={{ marginBottom:'15px' }} src="/img/workflows/nodes/v2/response-node.png" alt="Response Node" />

Each node type in a workflow serves a specific function. By combining these nodes, you can create powerful automation flows tailored to your business logic. The Response node, in particular, lets you customize what the workflow returns through JavaScript expressions.

When a workflow is executed the data defined in the Response node is included in the response payload. If triggered inside a ToolJet app, the returned data will be available in the same format as a regular query response.

## Return Data From a Single Node

Consider a workflow that combines sales data (from the *getSalesData* node) with inventory data (from the *getInventory* node) via a JavaScript operation (in the *generateCSVData* node).

<img className="screenshot-full img-full" src="/img/workflows/results/v2/response-nodes-preview.png" alt="Response Node Preview" />

Within the **Response** node, specify the output by using a return statement that encapsulates an object within parentheses:

```js
return ({generateCSVData})
```

<img className="screenshot-full img-m" src="/img/workflows/nodes/response/single-node-code.png" alt="Single Node Response" />

## Return Data From Multiple Nodes

You can also return data from other nodes. Either return the complete data set or specify only the required portions, as demonstrated below:

```js
return 
    ({sales: getSalesData.data,
    inventory: getInventory.data,
    csv: generateCSVData.data})
```

<img className="screenshot-full img-m" src="/img/workflows/nodes/response/multi-node-code.png" alt="Single Node Response" />
