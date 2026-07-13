---
id: open-webpage
title: Open webpage
---

The **Open webpage** action opens a URL in a new browser tab when an event occurs.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| URL | The webpage URL to open | — |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-s" src="/img/actions/open-webpage/open-v3.png" alt="ToolJet - Action reference - Open webpage"/>

## Triggering via RunJS

This action isn't exposed through the `actions.*` RunJS API. Since a RunJS query can run arbitrary JavaScript, you can open a webpage directly with the browser's native API instead:

```js
window.open('<url>', '_blank');
```

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
