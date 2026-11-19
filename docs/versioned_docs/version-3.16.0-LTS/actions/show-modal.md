---
id: show-modal
title: Show modal
---

The **Show modal** action opens a Modal component when an event occurs.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Modal | The Modal component to open | — |
| Run Only If | Optional condition. The action runs only when it resolves to a truthy value, for example `{{components.checkbox1.value}}`. Wrap the condition in `{{ }}`. See [Run Only If](/docs/app-builder/events/event-triggers#run-only-if). | Empty |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-s" src="/img/actions/showmodal/showmodal-v3.png" alt="ToolJet - Action reference - Show modal" />

## Triggering via RunJS

```js
actions.showModal('<modalName>');
```

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
