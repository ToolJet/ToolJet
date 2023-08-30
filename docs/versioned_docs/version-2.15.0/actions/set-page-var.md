---
id: set-page-variable
title: Set page variable
---

Page variables are restricted to the page where they are created and cannot be accessed throughout the entire application like regular variables.

Use this action to establish a variable and assign a value to it within the [Multipage Apps](/docs/tutorial/pages).

By default, the debounce field is left empty. However, you can input a numeric value to indicate the time in milliseconds before the action is executed. For example, `300`.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/actions/page/setpagevar2.png" alt="ToolJet - Action reference - Switch page" width="600"/>

</div>

## Using RunJS query to set page variable

Alternatively, the set page variable action can be triggered via a RunJS query using the following syntax:
```js
await actions.setPageVariable('<variablekey>',<variablevalue>)
```

`variablekey` must be provided as a string (enclosed in quotes), while the `variablevalue` does not require quotation marks if it is a numerical value.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/actions/page/setpagevar33.png" alt="ToolJet - Action reference - Switch page" />

</div>

:::info
For instructions on how to run actions from a RunJS query, refer to the how-to guide [Running Actions from RunJS Query](/docs/how-to/run-actions-from-runjs).
:::

