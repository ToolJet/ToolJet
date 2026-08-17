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

<img className="screenshot-full img-s" src="/img/actions/closemodal/closemodal-v2.png" alt="ToolJet - Action reference - Close modal"/>

## Triggering via RunJS

```js
actions.closeModal('<modalName>');
```

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
