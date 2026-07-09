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

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/actions/copytoclipboard/copy2.png" alt="ToolJet - Action reference - Copy to clipboard" width="700" />

</div>

## Triggering via RunJS

```js
actions.copyToClipboard('<contentToCopy>');
```

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
