---
id: close-modal
title: Close modal
---

The **Close modal** action closes a Modal component that is currently open.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Modal | The Modal component to close | — |
| Run Only If | Optional condition. The action runs only when it resolves to a truthy value, for example `{{components.checkbox1.value}}`. Wrap the condition in `{{ }}`. See [Run Only If](/docs/app-builder/events/event-triggers#run-only-if). | Empty |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-s" src="/img/actions/closemodal/closemodal-v2.png" alt="ToolJet - Action reference - Close modal"/>

## Triggering via RunJS

```js
actions.closeModal('<modalName>');
```

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
