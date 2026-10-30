---
id: unset-page-variable
title: Unset page variable
---

Use this action to clear a variable that was created using the [Set Page Variable](/docs/actions/set-page-variable) action.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Key | Name (string) of the page variable to clear | — |
| Run Only If | Optional condition. The action runs only when it resolves to a truthy value, for example `{{components.checkbox1.value}}`. Wrap the condition in `{{ }}`. See [Run Only If](/docs/app-builder/events/event-triggers#run-only-if). | Empty |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-s" src="/img/actions/page/unset-page-var-v2.png" alt="ToolJet - Action reference - Unset Page Variable"/>

## Triggering via RunJS

```js
await actions.unsetPageVariable('<variableName>');
```

`variableName` is the key of the variable that was provided while creating the variable.

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
