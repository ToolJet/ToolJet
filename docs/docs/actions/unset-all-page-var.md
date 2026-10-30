---
id: unset-all-page-var
title: Unset All Page Variables
---

Use this action to unset all page-level variables on the current page at once.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Run Only If | Optional condition. The action runs only when it resolves to a truthy value, for example `{{components.checkbox1.value}}`. Wrap the condition in `{{ }}`. See [Run Only If](/docs/app-builder/events/event-triggers#run-only-if). | Empty |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-s" src="/img/actions/unsetAllPageVar/unsetAllPageVar-v2.png" alt="ToolJet - Action reference - Unset All Page Variables" />

## Triggering via RunJS

```js
actions.unsetAllPageVariables();
```

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
