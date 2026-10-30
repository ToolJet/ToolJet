---
id: switch-page
title: Switch Page
---

The **Switch Page** action navigates to a different page within a [Multipage App](/docs/app-builder/events/use-case/page-nav). Use it with any event handler to build in-app navigation.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Page | The page to navigate to. Disabled pages and page groups aren't listed. | — |
| Query params | Optional key-value pairs appended to the switched page's URL | Empty |
| Run Only If | Optional condition. The action runs only when it resolves to a truthy value, for example `{{components.checkbox1.value}}`. Wrap the condition in `{{ }}`. See [Run Only If](/docs/app-builder/events/event-triggers#run-only-if). | Empty |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

<img className="screenshot-full img-s" src="/img/actions/switch-page/switch-page.png" alt="ToolJet - Action Reference - Page Switching"/>

## Query params

Query parameters are composed of key-value pairs, where the `key` and `value` are separated by an equals sign (`=`), and are appended to the end of the switched page's URL preceded by a question mark (`?`). Multiple query parameters can be included by clicking the `+` button.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/actions/page/queryparam1.png" alt="ToolJet - Action Reference - Page Switching"/>

</div>

In the above screenshot, `username` is the key and its value is `{{globals.currentUser.email}}`, which resolves to the signed-in user's email dynamically. When the button triggers the `Switch Page` action, the switched page's URL carries this parameter. Query params are commonly used for filtering, pagination, sorting, or passing context to the target page.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/actions/page/queryparam2.png" alt="ToolJet - Action Reference - Page Switching"/>

</div>

If the current URL has `version` or `env` query params, they're carried over to the new page unless you set them yourself.

## Behavior

| Situation | What users see |
|-----------|----------------|
| The page is disabled | The error *Page is disabled*. The page doesn't change. |
| The user can't access the page (released app) | The error *Access to this page is restricted. Contact admin to know more.* |
| `switchPage` runs while you preview a query in the app builder | The warning *Page will not be switched for query preview* |
| The page handle passed to `switchPage` doesn't exist (app builder) | The warning *Valid page handle is required* |

## Triggering via RunJS

```js
await actions.switchPage('<page-handle>');
```

The page handle isn't case-sensitive.

### Switch page with query params

```js
actions.switchPage('<pageHandle>', [
  ['param1', 'value1'],
  ['param2', 'value2'],
]);
```

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
