---
id: run-query
title: Run Query
---

The **Run Query** action fires a query when an event occurs. Use it to load or mutate data in response to user interaction — for example, running a query when a button is clicked or a form is submitted.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Query | The query to run | — |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/actions/run-query/run-query2.png" alt="ToolJet - Action reference -  Run Query" width="700" />

</div>

## Triggering via RunJS

```js
queries.<queryName>.run();
```
or
```js
await actions.runQuery('<queryName>');
```

:::info
When triggering a query using `queries.<queryName>.run()`, you can optionally pass **callback function handlers** to handle success and failure states programmatically. See [Callback Functions](/docs/data-sources/run-js#callback-functions) for details.
:::

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
