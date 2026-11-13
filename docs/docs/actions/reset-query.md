---
id: reset-query
title: Reset Query
---

The **Reset Query** action resets a query's data and state back to its initial values when an event occurs.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Query | The query to reset | — |
| Run Only If | Optional condition. The action runs only when it resolves to a truthy value, for example `{{components.checkbox1.value}}`. Wrap the condition in `{{ }}`. See [Run Only If](/docs/app-builder/events/event-triggers#run-only-if). | Empty |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-s" src="/img/actions/reset-query/reset-query-v2.png" alt="ToolJet - Action reference -  Reset Query" />

## Triggering via RunJS

```js
queries.<queryName>.reset();
```
or
```js
await actions.resetQuery('<queryName>');
```

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
