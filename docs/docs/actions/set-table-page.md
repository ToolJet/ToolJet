---
id: set-table-page
title: Set Table Page
---

The **Set Table Page** action changes the current page index of a Table component.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Table | The Table component to page | — |
| Page index | The page to show. Pages are numbered from 1, so `{{2}}` shows the second page. | `{{1}}` |
| Run Only If | Optional condition. The action runs only when it resolves to a truthy value, for example `{{components.checkbox1.value}}`. Wrap the condition in `{{ }}`. See [Run Only If](/docs/app-builder/events/event-triggers#run-only-if). | Empty |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-s" src="/img/actions/settablepage/settablepage-v2.png" alt="ToolJet - Action reference - Open webpage" />

## Triggering via RunJS

This action isn't exposed through the `actions.*` RunJS API. Instead, call the Table component's own `setPage` component-specific action (CSA) directly:

```js
await components.<tableName>.setPage(<pageIndex>);
```

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
