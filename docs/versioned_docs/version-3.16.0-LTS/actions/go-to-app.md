---
id: go-to-app
title: Go to app
---

The **Go to app** action opens a different released ToolJet application when an event occurs. Only released apps can be opened this way.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| App | The released app to navigate to | — |
| Query params | Optional key-value pairs appended to the target app's URL | Empty |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/actions/gotoapp/gotoapp3.png" alt="ToolJet - Action reference - Open webpage" width="700" />

</div>

## Triggering via RunJS

```js
actions.goToApp('<slug>', queryParams);
```

- `slug` can be found in the URL of the released app after `application/`, or in the Share modal that opens when clicking the **Share** button at the top-right of the app builder.
- `queryParams` is an array of key-value pairs in the format `[['key1', 'value1'], ['key2', 'value2']]`.

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
