---
id: set-page-variable
title: Set Page Variable
---

Page variables are restricted to the page where they are created and cannot be accessed throughout the entire application like regular variables. Use this action to create a variable and assign a value to it within a [Multipage App](/docs/app-builder/building-ui/pages).

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Key | Name (string) of the page variable | — |
| Value | The value to assign to the variable | — |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-s" src="/img/actions/page/set-page-var-v2.png" alt="ToolJet - Action reference - Set Page Variable"/>

## Triggering via RunJS

```js
await actions.setPageVariable('<variableKey>', <variableValue>);
```

`variableKey` must be provided as a string (enclosed in quotes), while `variableValue` doesn't require quotation marks if it's a numerical value.

<img className="screenshot-full" src="/img/actions/page/setpagevar33.png" alt="ToolJet - Action reference - Set Page Variable" />

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
