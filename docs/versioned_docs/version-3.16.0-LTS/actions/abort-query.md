---
id: abort-query
title: Abort Query
---

This action stops an in-flight query, one that was triggered via **Run** or **Preview** and is still waiting for a response, when an event occurs.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Query | The query to abort | — |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-s" src="/img/actions/abort-query/abort-query.png" alt="ToolJet - Action reference -  Abort Query" />

## Behavior

- Abort only cancels the pending request on the client. If the data source (for example, a database) has already started processing the query, it may continue running on its end until it completes on its own.
- Abort is not available for **RunJS**, **RunPy**, and **Workflow** queries, since these don't execute as cancellable network requests.

## Triggering via RunJS

```js
queries.<queryName>.abort();
```
or
```js
await actions.abortQuery('<queryName>');
```

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
