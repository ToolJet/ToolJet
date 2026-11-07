---
id: run-query
title: Run Query
---

The **Run Query** action fires a query when an event occurs. Use it to load or mutate data in response to user interaction — for example, running a query when a button is clicked or a form is submitted.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Query | The query to run | — |
| Parameters | Shown when the selected query has [parameters](/docs/app-builder/connecting-with-data-sources/use-custom-parameters). Enter a value for each parameter. Values can use `{{ }}`. | The parameter's default value |
| Run Only If | Optional condition. The action runs only when it resolves to a truthy value, for example `{{components.checkbox1.value}}`. Wrap the condition in `{{ }}`. See [Run Only If](/docs/app-builder/events/event-triggers#run-only-if). | Empty |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-s" src="/img/actions/run-query/run-query-v3.png" alt="ToolJet - Action reference -  Run Query" />

## Triggering via RunJS

```js
queries.<queryName>.run();
```
or
```js
await actions.runQuery('<queryName>');
```

To pass values for the query's parameters, add an object as the second argument:

```js
await actions.runQuery('getOrders', { status: 'shipped', limit: 10 });
// or
await queries.getOrders.run({ status: 'shipped', limit: 10 });
```

Only parameters defined on the query are passed. Other keys are ignored. If you call `actions.runQuery('<queryName>')` without parameters, the parameters' default values are used.

If the query doesn't exist, you'll see the error *Query not found*. A query can't run itself: you'll see *Cannot run query from itself*.

:::info
When triggering a query using `queries.<queryName>.run()`, you can optionally pass **callback function handlers** to handle success and failure states programmatically. See [Callback Functions](/docs/data-sources/run-js#callback-functions) for details.
:::

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
