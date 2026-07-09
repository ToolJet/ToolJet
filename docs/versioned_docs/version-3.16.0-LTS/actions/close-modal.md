---
id: close-modal
title: Close modal
---

The **Close modal** action closes a Modal component that is currently open.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Modal | The Modal component to close | — |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/actions/closemodal/closemodal2.png" alt="ToolJet - Action reference - Close modal" width="700" />

</div>

## Triggering via RunJS

```js
actions.closeModal('<modalName>');
```

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
