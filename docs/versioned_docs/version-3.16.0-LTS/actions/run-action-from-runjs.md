---
id: run-actions-from-runjs
title: Run Actions from RunJS query
---

Actions are normally configured through an event handler in the App Builder, but you can also trigger them programmatically from a RunJS query using the `actions.*` API. This is useful when the logic is conditional, needs to run inside a loop, or needs to combine several actions together — see [Custom Code: Control Components](/docs/app-builder/custom-code/control-components) for more on when to reach for RunJS.

This page is a quick-reference of every action's RunJS syntax, grouped the same way as the [Actions Reference](/docs/actions/overview). Each entry links to the action's own page for full parameter details, behavior notes, and examples.

<a id="abort-query"></a>

## Run Action

| Action | RunJS syntax |
| --- | --- |
| [Run Query](/docs/actions/run-query) | `queries.<queryName>.run(<params>)` or `await actions.runQuery('<queryName>', <params>)` |
| [Reset Query](/docs/actions/reset-query) | `queries.<queryName>.reset()` or `await actions.resetQuery('<queryName>')` |
| [Abort Query](/docs/actions/abort-query) | `queries.<queryName>.abort()` or `await actions.abortQuery('<queryName>')` |
| [Show Alert](/docs/actions/show-alert) | `actions.showAlert('<alertType>', '<message>')`, where `alertType` is `info`, `success`, `warning` or `error` |

<a id="show-modal"></a>

## Control Component

| Action | RunJS syntax |
| --- | --- |
| [Control Component](/docs/actions/control-component) | `await components.<componentName>.<csaMethod>(<params>)` — invoked directly on the component, not through `actions.*` |
| [Show Modal](/docs/actions/show-modal) | `actions.showModal('<modalName>')` |
| [Close Modal](/docs/actions/close-modal) | `actions.closeModal('<modalName>')` |
| [Set Table Page](/docs/actions/set-table-page) | Not available via `actions.*` — use `await components.<tableName>.setPage(<pageIndex>)` |
| [Scroll Component into View](/docs/actions/scroll-component-into-view) | `actions.scrollComponentInToView('<componentName>', { block: '<block>' })` |

## Navigation

| Action | RunJS syntax |
| --- | --- |
| [Switch Page](/docs/actions/switch-page) | `await actions.switchPage('<pageHandle>', [['key', 'value']])`. The handle isn't case-sensitive. While you preview a query, the page doesn't switch. |
| [Go to App](/docs/actions/go-to-app) | `actions.goToApp('<slug>', [['key', 'value']])`. Query params are an array of `[key, value]` pairs. |
| [Open Web Page](/docs/actions/open-webpage) | Not available via `actions.*` — use `window.open('<url>', '_blank')`, or `'_self'` for the current tab |

<a id="set-variables"></a>

## Variable

| Action | RunJS syntax |
| --- | --- |
| [Set Page Variable](/docs/actions/set-page-variable) | `await actions.setPageVariable('<key>', <value>)` |
| [Unset Page Variable](/docs/actions/unset-page-variable) | `await actions.unsetPageVariable('<key>')` |
| [Unset All Page Variable](/docs/actions/unset-all-page-var) | `actions.unsetAllPageVariables()` |
| [Set Variable](/docs/actions/set-variable) | `actions.setVariable('<key>', <value>)` |
| [Unset Variable](/docs/actions/unset-variable) | `actions.unSetVariable('<key>')` |
| [Unset All Variable](/docs/actions/unset-all-var) | `actions.unsetAllVariables()` |

## Other

| Action | RunJS syntax |
| --- | --- |
| [Logout](/docs/actions/logout) | `actions.logout()` |
| [Generate File](/docs/actions/generate-file) | `actions.generateFile('<fileName>', '<fileType>', <data>)`, where `fileType` is `csv`, `plaintext` or `pdf`. All three arguments are required. |
| [Set Local Storage](/docs/actions/set-localstorage) | `actions.setLocalStorage('<key>', '<value>')` |
| [Copy to Clipboard](/docs/actions/copy-to-clipboard) | `actions.copyToClipboard('<contentToCopy>')` |
| [Toggle App Mode](/docs/actions/toggle-app-mode) | `actions.toggleAppMode('<light\|dark>')`, or `actions.toggleAppMode()` to switch to the other theme |

## Logging

Write messages to the Debugger in the left sidebar from a RunJS query. See [Understanding Logs](/docs/app-builder/debugging/understanding-logs). Each entry is labelled **Custom Log** and shows the query name and line number.

| Function | Description |
| --- | --- |
| `actions.log('<message>')` | Adds an entry to the **All logs** tab. |
| `actions.logInfo('<message>')` | Same as `actions.log`. |
| `actions.logError('<message>')` | Adds an error entry, shown in red in **All logs** and also listed in the **Errors** tab. |

```js
actions.log('Fetched ' + data.length + ' orders');
if (data.length === 0) {
  actions.logError('No orders found');
}
```

## Reading query and variable data

These aren't actions — they're getters for immediately reading state right after triggering a query or setting a variable in the same RunJS query.

### Query data

```js
await queries.getSalesData.run();
let value = queries.getSalesData.getData();       // resolved data
let raw = queries.getSalesData.getRawData();       // raw response
let loading = queries.getSalesData.getloadingState();
```

The response returned by `actions.runQuery()` / `queries.queryName.run()` is an object containing both status and data, so you can also read it inline:

```js
const response = await actions.runQuery('getOrders', { limit: 10 });
return response;
// { status: "ok", data: [ { id: 1, customer_name: "John Doe", total: 250 } ] }
```

### Variables

```js
actions.setVariable('mode', 'dark');
return actions.getVariable('mode');
```

```js
actions.setPageVariable('number', 1);
return actions.getPageVariable('number');
```

## Running multiple actions from a RunJS query

Use `async`/`await` to sequence several actions together. The example below runs two queries and shows an alert at a fixed interval — see the full guide on [running queries at specified intervals](/docs/app-builder/connecting-with-data-sources/run-query-at-specified-intervals).

```js
actions.setVariable('interval', setInterval(countdown, 5000));
async function countdown() {
  await queries.restapi1.run();
  await queries.restapi2.run();
  await actions.showAlert('info', 'This is an information');
}
```
