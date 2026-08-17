---
id: copy-to-clipboard
title: Copy to clipboard
---

The **Copy to clipboard** action copies text to the user's clipboard.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Content to copy | The text to copy to the clipboard | — |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-s" src="/img/actions/copytoclipboard/copy-v3.png" alt="ToolJet - Action reference - Copy to clipboard" />

## Triggering via RunJS

```js
actions.copyToClipboard('<contentToCopy>');
```

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
