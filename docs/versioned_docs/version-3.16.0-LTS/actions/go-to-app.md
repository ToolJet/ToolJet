---
id: go-to-app
title: Go to app
---

The **Go to app** action opens a different released ToolJet application when an event occurs. Only released apps can be opened this way.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| App | The released app to navigate to. The current app isn't listed. | — |
| Query params | Optional key-value pairs appended to the target app's URL | Empty |
| Run Only If | Optional condition. The action runs only when it resolves to a truthy value, for example `{{components.checkbox1.value}}`. Wrap the condition in `{{ }}`. See [Run Only If](/docs/app-builder/events/event-triggers#run-only-if). | Empty |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-s" src="/img/actions/gotoapp/gotoapp-v4.png" alt="ToolJet - Action reference - Go To App" />

## Behavior

- **In the app builder**, a confirmation asks *The app will be opened in a new tab as the action is triggered from the editor.* If you confirm, the app opens in a new tab.
- **In the released or previewed app**, the app opens in the same tab.

To add query params, click **Add param** and enter a key and value.

## Triggering via RunJS

```js
actions.goToApp('<slug>', queryParams);
```

- `slug` can be found in the URL of the released app after `application/`, or in the Share modal that opens when clicking the **Share** button at the top-right of the app builder.
- `queryParams` is an array of key-value pairs in the format `[['key1', 'value1'], ['key2', 'value2']]`.

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
