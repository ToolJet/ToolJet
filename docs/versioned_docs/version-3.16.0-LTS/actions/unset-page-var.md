---
id: unset-page-variable
title: Unset page variable
---

Use this action to clear a variable that was created using the [Set Page Variable](/docs/3.16.0-LTS/actions/set-page-variable) action.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Key | Name (string) of the page variable to clear | — |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-s" src="/img/actions/page/unset-page-var-v2.png" alt="ToolJet - Action reference - Unset Page Variable"/>

## Triggering via RunJS

```js
await actions.unsetPageVariable('<variableName>');
```

`variableName` is the key of the variable that was provided while creating the variable.

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/3.16.0-LTS/actions/run-actions-from-runjs/).
:::
