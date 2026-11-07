---
id: set-variable
title: Set variable
---

The **Set variable** action creates an app-level variable and assigns a value to it.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Key | Name (string) of the variable | — |
| Value | A string, number, boolean, expression, array, or object | — |
| Run Only If | Optional condition. The action runs only when it resolves to a truthy value, for example `{{components.checkbox1.value}}`. Wrap the condition in `{{ }}`. See [Run Only If](/docs/app-builder/events/event-triggers#run-only-if). | Empty |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-s" src="/img/actions/setvar/setvar-v2.png" alt="ToolJet - Action reference -Set variable" />

## Triggering via RunJS

```js
actions.setVariable('<variableName>', <variableValue>);
```

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
