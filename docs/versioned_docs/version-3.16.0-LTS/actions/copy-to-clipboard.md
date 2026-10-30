---
id: copy-to-clipboard
title: Copy to clipboard
---

The **Copy to clipboard** action copies text to the user's clipboard. After copying, the user sees the message *Copied to clipboard!*.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Text | The text to copy to the clipboard | — |
| Run Only If | Optional condition. The action runs only when it resolves to a truthy value, for example `{{components.checkbox1.value}}`. Wrap the condition in `{{ }}`. See [Run Only If](/docs/app-builder/events/event-triggers#run-only-if). | Empty |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-s" src="/img/actions/copytoclipboard/copy-v3.png" alt="ToolJet - Action reference - Copy to clipboard" />

## Triggering via RunJS

```js
actions.copyToClipboard('<contentToCopy>');
```

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
