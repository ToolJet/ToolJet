---
id: unset-variable
title: Unset variable
---

The **Unset variable** action removes an app-level variable that was created using the [Set variable](/docs/actions/set-variable) action.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Key | Name (string) of the variable to remove | — |
| Run Only If | Optional condition. The action runs only when it resolves to a truthy value, for example `{{components.checkbox1.value}}`. Wrap the condition in `{{ }}`. See [Run Only If](/docs/app-builder/events/event-triggers#run-only-if). | Empty |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-s" src="/img/actions/unsetvar/unsetvar-v2.png" alt="ToolJet - Action reference -Unset variable"/>

## Triggering via RunJS

```js
actions.unSetVariable('<variableName>');
```

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
