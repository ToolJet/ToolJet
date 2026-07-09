---
id: unset-variable
title: Unset variable
---

The **Unset variable** action removes an app-level variable that was created using the [Set variable](/docs/actions/set-variable) action.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Key | Name (string) of the variable to remove | — |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/actions/unsetvar/unsetvar2.png" alt="ToolJet - Action reference -Unset variable" width="700" />

</div>

## Triggering via RunJS

```js
actions.unSetVariable('<variableName>');
```

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
