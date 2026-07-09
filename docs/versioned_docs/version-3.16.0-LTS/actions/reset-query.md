---
id: reset-query
title: Reset Query
---

The **Reset Query** action resets a query's data and state back to its initial values when an event occurs.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Query | The query to reset | — |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-s" src="/img/actions/reset-query/reset-query.png" alt="ToolJet - Action reference -  Reset Query" />

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
