---
id: toggle-app-mode
title: Toggle App Mode
---

The **Toggle App Mode** action switches the app's rendered theme between light and dark at runtime.

:::note
This action only has an effect when the app's global **App mode** setting (App Builder → Left Sidebar → Global Settings) is set to **Auto**. If App mode is fixed to **Light** or **Dark**, this action does nothing.
:::

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| App mode | The theme to switch to: **Light** or **Dark**. If left empty, the action switches to **Light**. | Empty |
| Run Only If | Optional condition. The action runs only when it resolves to a truthy value, for example `{{components.checkbox1.value}}`. Wrap the condition in `{{ }}`. See [Run Only If](/docs/app-builder/events/event-triggers#run-only-if). | Empty |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-s" src="/img/actions/toggle-app-mode/toggle-app-mode.png" alt="ToolJet - Action reference - Toggle App Mode" />

## Behavior

- Only takes effect when the app's **App mode** global setting is **Auto** — otherwise the action is a no-op.
- In the Events panel, an empty **App mode** switches to **Light**.
- In RunJS, calling `actions.toggleAppMode()` without a value toggles to the opposite of the current theme. A value other than `'light'` or `'dark'`, such as `'Dark'`, does nothing.
- Persists the selected theme to the browser's local storage, so it's remembered on reload.

## Triggering via RunJS

```js
actions.toggleAppMode();
// or
actions.toggleAppMode('dark');
actions.toggleAppMode('light');
```

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
