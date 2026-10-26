---
id: response
title: Response Node
---

<br/>

The Response node defines the final output of your workflow. You can use it to specify what data should be returned once the workflow completes. Workflows can include a single Response node or multiple ones if you want to return different results based on conditions or branches.

<img className="screenshot-full img-full" style={{ marginBottom:'15px' }} src="/img/workflows/nodes/v2/response-node.png" alt="Response Node" />

Each node type in a workflow serves a specific function. By combining these nodes, you can create powerful automation flows tailored to your business logic. The Response node, in particular, lets you customize what the workflow returns through JavaScript expressions.

When a workflow is executed the data defined in the Response node is included in the response payload. If triggered inside a ToolJet app, the returned data will be available in the same format as a regular query response.

The Response node has two settings:

- **Response object**: The code that returns the workflow's output.
- **Status code**: The HTTP status code of the response. See [Status Code](#status-code).

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

## Status Code

Select the status code from the **Status code** dropdown: `200`, `201`, `204`, `400`, `403`, `404` or `500`. The default is `200`.

To set the status code dynamically, click **fx** next to **Status code** and enter an expression, for example `{{getOrder.data.length > 0 ? 200 : 404}}`. If the value isn't a whole number, `200` is used.

How the status code affects the workflow:

- **Below 400**: The workflow succeeds. For `204`, and for `205` or `304` set with **fx**, the response body is empty.
- **400 or above**: The Response node fails with the message `Workflow failed due to HTTP status code: <code> <reason>`, for example `Workflow failed due to HTTP status code: 404 Not Found`, and the workflow execution is marked as failed. When the status code is set with **fx**, the message doesn't include the reason.

When the workflow is triggered by a [webhook](/docs/workflows/triggers/webhook), the status code is returned as the HTTP status of the webhook response. For `400` or above, the webhook returns that status with a JSON error body that includes the failure message. When the workflow runs from an app's **Run Workflow** query, a status code of `400` or above makes the query fail.
