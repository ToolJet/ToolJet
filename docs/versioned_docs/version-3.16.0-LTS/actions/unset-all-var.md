---
id: unset-all-var
title: Unset All Variables
---

Use this action to unset all app-level variables at once.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Run Only If | Optional condition that determines whether this action runs | Empty |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-full" src="/img/actions/unsetAllVar/unsetAllVar.png" alt="ToolJet - Action reference - Unset All Variables" />

## Triggering via RunJS

```js
actions.unsetAllVariables();
```

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
