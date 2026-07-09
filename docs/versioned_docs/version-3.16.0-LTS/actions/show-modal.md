---
id: show-modal
title: Show modal
---

The **Show modal** action opens a Modal component when an event occurs.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Modal | The Modal component to open | — |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/actions/showmodal/showmodal2.png" alt="ToolJet - Action reference - Show modal" width="700" />

</div>

## Triggering via RunJS

```js
actions.showModal('<modalName>');
```

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
