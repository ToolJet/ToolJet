---
id: unset-all-page-var
title: Unset All Page Variables
---

Use this action to unset all page-level variables on the current page at once.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Run Only If | Optional condition that determines whether this action runs | Empty |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-full" src="/img/actions/unsetAllPageVar/unsetAllPageVar.png" alt="ToolJet - Action reference - Unset All Page Variables" />

## Triggering via RunJS

```js
actions.unsetAllPageVariables();
```

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
