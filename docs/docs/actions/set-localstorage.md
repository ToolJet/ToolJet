---
id: set-localstorage
title: Set localStorage
---

The **Set localStorage** action stores a `key`/`value` pair in the browser's local storage. This is useful for saving form values so users don't lose them on reload, or storing data that shouldn't be persisted to the database.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Key | Name (string) under which the value is stored | — |
| Value | The value to store | — |
| Run Only If | Optional condition. The action runs only when it resolves to a truthy value, for example `{{components.checkbox1.value}}`. Wrap the condition in `{{ }}`. See [Run Only If](/docs/app-builder/events/event-triggers#run-only-if). | Empty |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-s" src="/img/actions/localstorage/set-local-storage-v2.png" alt="ToolJet - Action reference - Set Local Storage" />

## Triggering via RunJS

```js
actions.setLocalStorage('<key>', '<value>');
```

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
