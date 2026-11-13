---
id: show-alert
title: Show alert
---

The **Show alert** action displays an alert message on the app's canvas. Use it to give users feedback after an event — for example, confirming a save, or warning about invalid input.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Message | The text to display in the alert | `Hello world!` |
| Alert Type | The style of the alert: **Info**, **Success**, **Warning**, or **Error** | Info |
| Run Only If | Optional condition. The action runs only when it resolves to a truthy value, for example `{{components.checkbox1.value}}`. Wrap the condition in `{{ }}`. See [Run Only If](/docs/app-builder/events/event-triggers#run-only-if). | Empty |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-s" src="/img/actions/show-alert/show-alert-v2.png" alt="ToolJet - Action reference -  Show Alert"/>

## Triggering via RunJS

```js
actions.showAlert('<alertType>', '<message>');
```

`alertType` is one of `info`, `success`, `warning`, or `error`, in lowercase. Any other value, such as `danger` or `Info`, shows no alert.

**Example:**

```js
actions.showAlert('error', 'This is an error');
```

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
