---
id: js
title: JavaScript Node
---

<br/>

The **JavaScript** node allows you to run custom server-side JavaScript within your workflow. It can be used to:
- Transform Data
- Run Complex Calculations
- Fine Tune Response
- Implement Business Logic 

This node executes securely on the server, so it can handle data manipulation at scale, prepare or enrich data for downstream nodes, or create custom responses for external services.

**Note:** The code must include a return statement to pass results to subsequent nodes.

## Example: Fine-Tuning Your Response Using JavaScript

Refine your response by manipulating the data using JavaScript functions. For example, the slice function can be used to select a subset of data:

```js
return 
    ({sales: getSalesData.data.slice(0,5),
    inventory: getInventory.data.slice(0,5),
    csv: generateCSVData.data})        
```

<img className="screenshot-full img-full" src="/img/workflows/nodes/logic/js/fineTune.png" alt="JS Node Fine Tune" />
