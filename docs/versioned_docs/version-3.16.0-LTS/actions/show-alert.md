---
id: show-alert
title: Show alert
---

The **Show alert** action displays an alert message on the app's canvas. Use it to give users feedback after an event — for example, confirming a save, or warning about invalid input.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Alert type | The style of the alert: **Info**, **Success**, **Warning**, or **Error** | Info |
| Message | The text to display in the alert | Empty |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-s" src="/img/actions/show-alert/show-alert-v2.png" alt="ToolJet - Action reference -  Show Alert"/>

## Triggering via RunJS

```js
actions.showAlert('<alertType>', '<message>');
```

`alertType` is one of `info`, `success`, `warning`, or `danger` (`danger` maps to the **Error** type in the Events panel).

**Example:**

```js
actions.showAlert('error', 'This is an error');
```

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
