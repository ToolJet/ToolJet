---
id: set-table-page
title: Set Table Page
---

The **Set Table Page** action changes the current page index of a Table component.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Table | The Table component to page | — |
| Page Index | Numerical value for the page index, e.g. `{{2}}` | — |
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
