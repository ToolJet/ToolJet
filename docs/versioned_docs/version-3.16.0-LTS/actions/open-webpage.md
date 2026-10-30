---
id: open-webpage
title: Open webpage
---

The **Open webpage** action opens a URL in a new browser tab, or in the current tab, when an event occurs.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| URL | The webpage URL to open | — |
| Open in | Where to open the URL: **New tab** or **Current tab** | New tab |
| Run Only If | Optional condition. The action runs only when it resolves to a truthy value, for example `{{components.checkbox1.value}}`. Wrap the condition in `{{ }}`. See [Run Only If](/docs/app-builder/events/event-triggers#run-only-if). | Empty |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-s" src="/img/actions/open-webpage/open-v3.png" alt="ToolJet - Action reference - Open webpage"/>

## Triggering via RunJS

This action isn't exposed through the `actions.*` RunJS API. Since a RunJS query can run arbitrary JavaScript, you can open a webpage directly with the browser's native API instead:

```js
window.open('<url>', '_blank'); // new tab
window.open('<url>', '_self');  // current tab
```

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
