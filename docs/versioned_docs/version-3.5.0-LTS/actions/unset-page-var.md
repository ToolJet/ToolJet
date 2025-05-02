---
id: unset-page-variable
title: Unset page variable
---

Utilize this action to clear a variable that was established using the [set page variable action](/docs/actions/set-page-variable).

By default, the debounce field is left empty. However, you can input a numeric value to indicate the time in milliseconds before the action is executed. For example, `300`.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/actions/page/unsetpagevar2.png" alt="ToolJet - Action reference - Switch page" width="600"/>

</div>

## Using RunJS query to unset variable

Alternatively, the unset page variable action can be triggered via a RunJS query using the following syntax:
```js
await actions.unsetPageVariable('<variablename>')
```

`variablename` is the key of the variable that was provided while creating the variable.

:::info
For instructions on how to run actions from a RunJS query, refer to the how-to guide [Running Actions from RunJS Query](/docs/how-to/run-actions-from-runjs).
:::