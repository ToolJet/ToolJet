---
id: switch-page
title: Switch Page
---

Utilize this action with various event handler to transition to a different page within the [Multipage App](/docs/tutorial/pages).

By default, the debounce field is left empty. However, you can input a numeric value to indicate the time in milliseconds before the action is executed. For example, `300`.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/actions/page/switchpage2.png" alt="ToolJet - Action Reference - Page Switching" width="500"/>

</div>

## Query Params

Query parameters can be passed through action such as `Switch Page`. The parameters are appended to the end of the application URL and are preceded by a question mark (`?`). 

Query parameters are composed of key-value pairs, where the `key` and `value` are separated by an equals sign (`=`). Multiple query parameters can be included by clicking on the `+` button.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/actions/page/queryparam1.png" alt="ToolJet - Action Reference - Page Switching"/>

</div>

In the above screenshot, we have provided the `username` as the key and the value is `{{globals.currentUser.email}}` which gets the email of the signed in user dynamically. When the button is clicked to trigger the `Switch Page` event handler attached to it then the URL on the switched page will have the parameters.

They are commonly used to provide additional information to the server or to modify the behavior of a web page. They can be used for filtering search results, pagination, sorting, and various other purposes.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/actions/page/queryparam2.png" alt="ToolJet - Action Reference - Page Switching"/>

</div>

## Using RunJS query to switch page

Alternatively, the switch page action can be activated via a RunJS query using the following syntax:
```js
await actions.switchPage('<page-handle>')
```

:::info
For instructions on how to run actions from a RunJS query, refer to the how-to guide [Running Actions from RunJS Query](/docs/how-to/run-actions-from-runjs).
:::

### Switch page with query params

The switch page action can also be triggered along with query parameters using the following syntax:

```js
actions.switchPage('<pageHandle>', [['param1', 'value1'], ['param2', 'value2']])
```
